import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify } from '../notify';

const router = Router();

const PLATFORM_FEE_RATE = 0.10; // 10% — Boomerang's take
const AUTO_RELEASE_DAYS = 5;    // Like Vinted: auto-release if buyer doesn't act within 5 days

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe not configured');
  return require('stripe')(key);
}

// ─── STRIPE CONNECT ONBOARDING ───────────────────────────────────────────────

/**
 * POST /payments/connect/onboard
 * Creates a Stripe Express account for the provider (if not already created),
 * then returns an AccountLink URL so they can complete KYC/bank setup.
 * After completing, Stripe redirects to /settings?connect=success
 */
router.post('/connect/onboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const stripe = getStripe();
    const user = await db.get('SELECT id, email, username, stripe_account_id, stripe_account_status FROM users WHERE id = ?', req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let accountId = user.stripe_account_id;

    // Create an Express account if they don't have one yet
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: 'individual',
        metadata: { boomerang_user_id: String(req.userId), username: user.username },
      });
      accountId = account.id;
      await db.run(
        "UPDATE users SET stripe_account_id = ?, stripe_account_status = 'pending' WHERE id = ?",
        accountId, req.userId,
      );
    }

    const origin = req.headers.origin || 'https://www.boomerang.fyi';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings?connect=refresh`,
      return_url:  `${origin}/settings?connect=success`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err: any) {
    console.error('[CONNECT] Onboard error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to start onboarding' });
  }
});

/**
 * GET /payments/connect/status
 * Returns the current Connect account status for the authenticated user.
 * Updates stripe_account_status in the DB based on Stripe's live state.
 */
router.get('/connect/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.get('SELECT stripe_account_id, stripe_account_status FROM users WHERE id = ?', req.userId);
    if (!user?.stripe_account_id) {
      return res.json({ status: 'none', account_id: null });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(user.stripe_account_id);

    // Determine status from Stripe's account object
    let status: string;
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active';
    } else if (account.details_submitted) {
      status = 'pending'; // submitted, awaiting Stripe verification
    } else {
      status = 'incomplete'; // onboarding not finished
    }

    if (status !== user.stripe_account_status) {
      await db.run('UPDATE users SET stripe_account_status = ? WHERE id = ?', status, req.userId);
    }

    res.json({
      status,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      account_id: user.stripe_account_id,
    });
  } catch (err: any) {
    console.error('[CONNECT] Status error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve account status' });
  }
});

/**
 * POST /payments/connect/dashboard-link
 * Returns a Stripe Express Dashboard login link so providers can
 * view their payouts, balance, and payout history.
 */
router.post('/connect/dashboard-link', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.get('SELECT stripe_account_id, stripe_account_status FROM users WHERE id = ?', req.userId);
    if (!user?.stripe_account_id) return res.status(400).json({ error: 'No payout account set up' });
    if (user.stripe_account_status !== 'active') return res.status(400).json({ error: 'Account not yet active' });

    const stripe = getStripe();
    const loginLink = await stripe.accounts.createLoginLink(user.stripe_account_id);
    res.json({ url: loginLink.url });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate dashboard link' });
  }
});

// ─── PER-SERVICE PAYMENTINTENT (ESCROW / MANUAL CAPTURE) ─────────────────────

/**
 * POST /payments/create-service-intent
 * Called immediately after POST /requests succeeds.
 * Creates a PaymentIntent with capture_method:'manual' (card is authorised but
 * money is NOT moved yet — just held like Vinted).
 * Uses transfer_data so when we later capture, Stripe automatically splits:
 *   - 90% → provider's Connect account
 *   - 10% → platform (application_fee_amount)
 * Returns client_secret for the client to complete card entry via Stripe.js.
 */
router.post('/create-service-intent', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { request_id } = req.body;
  if (!request_id) return res.status(400).json({ error: 'request_id is required' });

  const r = await db.get(`
    SELECT sr.*, s.title, s.price_eur, s.currency, s.provider_id, u.email as requester_email
    FROM service_requests sr
    JOIN services s ON sr.service_id = s.id
    JOIN users u ON sr.requester_id = u.id
    WHERE sr.id = ? AND sr.requester_id = ?`, request_id, req.userId);
  if (!r) return res.status(404).json({ error: 'Request not found or not yours' });

  const price = r.price_eur ? parseFloat(r.price_eur) : null;
  if (!price || price <= 0) return res.status(400).json({ error: 'This service has no price' });

  // Check provider has an active Connect account
  const provider = await db.get('SELECT stripe_account_id, stripe_account_status FROM users WHERE id = ?', r.provider_id);
  if (!provider?.stripe_account_id) {
    return res.status(422).json({
      error: 'provider_not_connected',
      message: 'The provider has not set up their payout account yet. You can still send the request and pay once they do.',
    });
  }
  if (provider.stripe_account_status !== 'active') {
    return res.status(422).json({
      error: 'provider_not_active',
      message: 'The provider\'s payout account is not yet fully verified. Payment cannot be taken until it is active.',
    });
  }

  try {
    const stripe = getStripe();
    const currency = r.currency || 'eur';          // 'gel' for Georgia, 'eur' elsewhere
    const amountCents = Math.round(price * 100);
    const feeCents    = Math.round(amountCents * PLATFORM_FEE_RATE); // 10%

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency,
      capture_method: 'manual',                  // ← ESCROW: authorise only, don't charge yet
      payment_method_types: ['card'],
      receipt_email: r.requester_email || undefined,
      description: `Boomerang: ${r.title}`,
      // transfer_data: at capture time, Stripe automatically sends 90% to provider
      transfer_data: { destination: provider.stripe_account_id },
      application_fee_amount: feeCents,          // 10% stays on platform
      metadata: {
        request_id:   String(request_id),
        service_id:   String(r.service_id),
        requester_id: String(req.userId),
        provider_id:  String(r.provider_id),
      },
    });

    // Save intent ID and amount on the request row
    await db.run(
      `UPDATE service_requests SET
        stripe_payment_intent_id = ?,
        amount_eur = ?,
        platform_fee_eur = ?,
        provider_payout_eur = ?,
        payment_status = 'pending'
       WHERE id = ?`,
      intent.id,
      price,
      Math.round(price * PLATFORM_FEE_RATE * 100) / 100,
      Math.round(price * (1 - PLATFORM_FEE_RATE) * 100) / 100,
      request_id,
    );

    res.json({
      client_secret: intent.client_secret,
      payment_intent_id: intent.id,
      amount_eur: price,
      platform_fee_eur: Math.round(price * PLATFORM_FEE_RATE * 100) / 100,
      provider_receives_eur: Math.round(price * (1 - PLATFORM_FEE_RATE) * 100) / 100,
    });
  } catch (err: any) {
    console.error('[PAYMENT] Intent creation error:', err.message);
    res.status(500).json({ error: 'Payment setup failed. Please try again.' });
  }
});

/**
 * POST /payments/capture/:requestId
 * Called when the requester confirms delivery (or triggered automatically
 * by the auto-release cron after AUTO_RELEASE_DAYS days).
 * Captures the held PaymentIntent → money moves to provider automatically.
 */
router.post('/capture/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get(`
    SELECT sr.*, s.provider_id, s.title, s.price_eur
    FROM service_requests sr
    JOIN services s ON sr.service_id = s.id
    WHERE sr.id = ?`, req.params.requestId);
  if (!r) return res.status(404).json({ error: 'Request not found' });

  // Only requester or platform (auto-release via cron) can capture
  if (r.requester_id !== req.userId) return res.status(403).json({ error: 'Only the requester can confirm' });
  if (r.status !== 'delivered') return res.status(400).json({ error: 'Service must be delivered first' });
  if (!r.stripe_payment_intent_id) return res.status(400).json({ error: 'No payment attached to this request' });

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(r.stripe_payment_intent_id);

    if (intent.status === 'requires_capture') {
      await stripe.paymentIntents.capture(r.stripe_payment_intent_id);
    } else if (!['succeeded', 'processing'].includes(intent.status)) {
      return res.status(400).json({ error: `Payment cannot be captured (status: ${intent.status})` });
    }

    const price    = parseFloat(r.price_eur || r.amount_eur || '0');
    const fee      = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
    const payout   = Math.round((price - fee) * 100) / 100;

    await db.run(`UPDATE service_requests SET
      status = 'completed', completed_at = NOW(),
      payment_status = 'paid',
      platform_fee_eur = ?, provider_payout_eur = ?
      WHERE id = ?`, fee, payout, req.params.requestId);

    const provider = await db.get('SELECT id FROM users WHERE id = ?', r.provider_id);
    if (provider) {
      await notify({
        userId: provider.id, type: 'delivery_confirmed',
        title: 'Payment released! 💰',
        body: `Payment for "${r.title}" has been released to your account. It will appear in your Stripe dashboard within 2–7 days.`,
        link: '/settings',
      });
    }

    res.json({ message: 'Payment captured and service completed.' });
  } catch (err: any) {
    console.error('[PAYMENT] Capture error:', err.message);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
});

/**
 * POST /payments/refund/:requestId
 * Cancels (refunds) the held PaymentIntent — used on dispute resolution
 * or when either party cancels before capture.
 */
router.post('/refund/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const r = await db.get(`SELECT sr.*, s.provider_id FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE sr.id = ?`, req.params.requestId);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId && r.provider_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });

  if (!r.stripe_payment_intent_id || r.payment_status === 'free') {
    // No Stripe payment — just cancel the request record
    await db.run("UPDATE service_requests SET status = 'cancelled' WHERE id = ?", req.params.requestId);
    return res.json({ message: 'Request cancelled' });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(r.stripe_payment_intent_id);

    if (intent.status === 'requires_capture') {
      // Not yet captured → cancel the authorisation (no charge at all)
      await stripe.paymentIntents.cancel(r.stripe_payment_intent_id);
    } else if (intent.status === 'succeeded') {
      // Already captured → issue a full refund
      await stripe.refunds.create({ payment_intent: r.stripe_payment_intent_id });
    }
    // If status is already canceled/refunded, nothing to do

    await db.run(
      "UPDATE service_requests SET status = 'cancelled', payment_status = 'refunded' WHERE id = ?",
      req.params.requestId,
    );
    res.json({ message: 'Payment refunded and request cancelled.' });
  } catch (err: any) {
    console.error('[PAYMENT] Refund error:', err.message);
    res.status(500).json({ error: 'Refund failed. Please contact support.' });
  }
});

// ─── STRIPE WEBHOOK ───────────────────────────────────────────────────────────

router.post('/webhook', async (req: AuthRequest, res: Response) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const stripe = getStripe();
    let event;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
    } else if (process.env.NODE_ENV !== 'production') {
      event = req.body;
    } else {
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    // ── Boomerang top-up checkout completed ─────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId     = parseInt(session.metadata?.userId);
      const boomerangs = parseInt(session.metadata?.boomerangs);
      if (userId && boomerangs) {
        await db.run('UPDATE users SET points = points + ? WHERE id = ?', boomerangs, userId);
        console.log(`[WEBHOOK] Top-up: +${boomerangs} 🪃 for user ${userId}`);
      }
    }

    // ── PaymentIntent authorized (card held, awaiting capture) ───────────────
    if (event.type === 'payment_intent.amount_capturable_updated') {
      const intent = event.data.object;
      const requestId = intent.metadata?.request_id;
      if (requestId) {
        await db.run(
          "UPDATE service_requests SET payment_status = 'authorized' WHERE id = ? AND payment_status = 'pending'",
          requestId,
        );
        console.log(`[WEBHOOK] PaymentIntent authorized for request ${requestId}`);
      }
    }

    // ── PaymentIntent succeeded (capture completed) ──────────────────────────
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const requestId = intent.metadata?.request_id;
      if (requestId) {
        await db.run(
          "UPDATE service_requests SET payment_status = 'paid' WHERE id = ? AND payment_status != 'paid'",
          requestId,
        );
        console.log(`[WEBHOOK] Payment captured for request ${requestId}`);
      }
    }

    // ── Connect account updated (provider finished onboarding) ───────────────
    if (event.type === 'account.updated') {
      const account = event.data.object;
      if (account.charges_enabled && account.payouts_enabled) {
        await db.run(
          "UPDATE users SET stripe_account_status = 'active' WHERE stripe_account_id = ?",
          account.id,
        );
        console.log(`[WEBHOOK] Connect account ${account.id} is now active`);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('[WEBHOOK] Error:', err.message);
    res.status(400).json({ error: 'Webhook failed' });
  }
});

// ─── LEGACY BOOMERANG TOP-UP CHECKOUT ────────────────────────────────────────

const PACKAGES = [
  { id: 'pack_25',  boomerangs: 25,  price: 199,  label: '25 Boomerangs',  priceLabel: '€1.99' },
  { id: 'pack_50',  boomerangs: 50,  price: 349,  label: '50 Boomerangs',  priceLabel: '€3.49' },
  { id: 'pack_100', boomerangs: 100, price: 599,  label: '100 Boomerangs', priceLabel: '€5.99' },
  { id: 'pack_250', boomerangs: 250, price: 1299, label: '250 Boomerangs', priceLabel: '€12.99' },
];

router.get('/packages', (_req, res: Response) => {
  res.json({ packages: PACKAGES, stripeKey: process.env.STRIPE_PUBLISHABLE_KEY || null, enabled: !!process.env.STRIPE_SECRET_KEY });
});

router.get('/publishable-key', (_req, res: Response) => {
  res.json({ key: process.env.STRIPE_PUBLISHABLE_KEY || null });
});

router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { packageId } = req.body;
  const pkg = PACKAGES.find(p => p.id === packageId);
  if (!pkg) return res.status(400).json({ error: 'Invalid package' });
  try {
    const stripe = getStripe();
    const origin = req.headers.origin || 'https://www.boomerang.fyi';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'eur', product_data: { name: pkg.label }, unit_amount: pkg.price }, quantity: 1 }],
      mode: 'payment',
      success_url: `${origin}/dashboard?topup=success&amount=${pkg.boomerangs}`,
      cancel_url:  `${origin}/dashboard?topup=cancelled`,
      metadata: { userId: String(req.userId), packageId: pkg.id, boomerangs: String(pkg.boomerangs) },
    });
    res.json({ url: session.url });
  } catch (err: any) { res.status(500).json({ error: 'Payment failed. Please try again.' }); }
});

router.post('/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  await db.run('UPDATE users SET points = points + ? WHERE id = ?', amount, req.userId);
  res.json({ message: `${amount} boomerangs added!` });
});

router.post('/gift', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { to_user_id, amount, message } = req.body;
  const toId = Number(to_user_id); const giftAmount = Number(amount);
  if (!toId || !giftAmount || giftAmount < 1) return res.status(400).json({ error: 'Recipient and amount required' });
  if (toId === req.userId) return res.status(400).json({ error: 'Cannot gift to yourself' });
  const sender = await db.get('SELECT points, username FROM users WHERE id = ?', req.userId);
  if (!sender || sender.points < giftAmount) return res.status(400).json({ error: 'Not enough boomerangs' });
  const receiver = await db.get('SELECT id, username FROM users WHERE id = ?', toId);
  if (!receiver) return res.status(404).json({ error: 'User not found' });
  await db.transaction(async (tx) => {
    await tx.run('UPDATE users SET points = points - ? WHERE id = ?', giftAmount, req.userId);
    await tx.run('UPDATE users SET points = points + ? WHERE id = ?', giftAmount, toId);
    await tx.run('INSERT INTO gifts (sender_id, receiver_id, amount, message) VALUES (?, ?, ?, ?)', req.userId, toId, giftAmount, message || '');
  });
  res.json({ message: `Sent ${giftAmount} boomerangs to ${receiver.username}!` });
});

router.post('/boost', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { service_id } = req.body;
  if (!service_id) return res.status(400).json({ error: 'Service ID required' });
  const service = await db.get('SELECT * FROM services WHERE id = ? AND provider_id = ?', service_id, req.userId);
  if (!service) return res.status(404).json({ error: 'Service not found or not yours' });
  const user = await db.get('SELECT points FROM users WHERE id = ?', req.userId);
  if (user.points < 15) return res.status(400).json({ error: 'Need 15 boomerangs to boost' });
  await db.run('UPDATE users SET points = points - 15 WHERE id = ?', req.userId);
  await db.run('UPDATE services SET boosted_until = ? WHERE id = ?', new Date(Date.now() + 7 * 86400_000).toISOString(), service_id);
  res.json({ message: 'Service boosted for 7 days!' });
});

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  const earned = await db.all(`
    SELECT sr.completed_at as date, COALESCE(sr.provider_payout_eur, NULL) as amount_eur,
      s.points_cost as amount, 'earned' as type, s.title, u.username as other_user
    FROM service_requests sr JOIN services s ON sr.service_id = s.id JOIN users u ON sr.requester_id = u.id
    WHERE s.provider_id = ? AND sr.status = 'completed' ORDER BY sr.completed_at DESC LIMIT 50`, req.userId);
  const spent = await db.all(`
    SELECT sr.completed_at as date, COALESCE(sr.amount_eur, NULL) as amount_eur,
      s.points_cost as amount, 'spent' as type, s.title, u.username as other_user
    FROM service_requests sr JOIN services s ON sr.service_id = s.id JOIN users u ON s.provider_id = u.id
    WHERE sr.requester_id = ? AND sr.status = 'completed' ORDER BY sr.completed_at DESC LIMIT 50`, req.userId);
  const giftsSent = await db.all(`SELECT g.created_at as date, NULL as amount_eur, g.amount, 'gift_sent' as type, 'Gift' as title, u.username as other_user FROM gifts g JOIN users u ON g.receiver_id = u.id WHERE g.sender_id = ? ORDER BY g.created_at DESC LIMIT 20`, req.userId);
  const giftsRcvd = await db.all(`SELECT g.created_at as date, NULL as amount_eur, g.amount, 'gift_received' as type, 'Gift' as title, u.username as other_user FROM gifts g JOIN users u ON g.sender_id = u.id WHERE g.receiver_id = ? ORDER BY g.created_at DESC LIMIT 20`, req.userId);
  const history = [...earned, ...spent, ...giftsSent, ...giftsRcvd]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);
  res.json(history);
});

export default router;
