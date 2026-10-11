/**
 * BOG Pay Routes — Bank of Georgia payment gateway
 *
 * Used for Georgian (GEL) services where Stripe is not available.
 *
 * Flow:
 *   Buyer clicks "Pay with BOG" → POST /bog/create-payment
 *     → BOG API creates a payment order
 *     → buyer is redirected to BOG checkout page
 *     → BOG calls our webhook on success
 *     → payment held in our BOG merchant account (escrow)
 *   Buyer confirms delivery → POST /bog/payout/:requestId
 *     → BOG B2B Transfer API sends 80% to provider's IBAN
 *     → platform keeps 20%
 *
 * Credentials needed (set as environment variables):
 *   BOG_CLIENT_ID       — from ecommerce.bog.ge dashboard
 *   BOG_CLIENT_SECRET   — from ecommerce.bog.ge dashboard
 *   BOG_MERCHANT_ID     — your BOG merchant ID
 *   BOG_API_URL         — https://api.bog.ge/payments/v1  (or sandbox URL)
 *   BOG_CALLBACK_SECRET — secret for verifying webhook signatures
 *
 * BOG API reference: https://api.bog.ge/docs/payments
 */

import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';
import { notify } from '../notify';

const router = Router();

const PLATFORM_FEE_RATE = 0.20; // 20% — same as Stripe flow
const BOG_API_URL = process.env.BOG_API_URL || 'https://api.bog.ge/payments/v1';

// ── Helper: get BOG access token (OAuth2 client_credentials) ──────────────
async function getBogAccessToken(): Promise<string> {
  const clientId     = process.env.BOG_CLIENT_ID;
  const clientSecret = process.env.BOG_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('BOG Pay not configured. Set BOG_CLIENT_ID and BOG_CLIENT_SECRET.');
  }

  const res = await fetch('https://account.bog.ge/auth/realms/bog/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`BOG auth failed: ${res.status}`);
  const data: any = await res.json();
  return data.access_token;
}

// ── Helper: check if BOG is configured ───────────────────────────────────
function isBogConfigured(): boolean {
  return !!(process.env.BOG_CLIENT_ID && process.env.BOG_CLIENT_SECRET);
}

// ─── GET /bog/status ──────────────────────────────────────────────────────
// Returns whether BOG Pay is configured (for frontend to know if GEL payments work)
router.get('/status', (_req, res: Response) => {
  res.json({
    enabled: isBogConfigured(),
    message: isBogConfigured()
      ? 'BOG Pay is configured and ready'
      : 'BOG Pay is not yet configured. Add BOG_CLIENT_ID and BOG_CLIENT_SECRET to enable Georgian payments.',
  });
});

// ─── POST /bog/create-payment ─────────────────────────────────────────────
// Creates a BOG payment order for a service request.
// Called after POST /requests creates the request record.
// Returns { checkout_url } — redirect buyer there to pay.
router.post('/create-payment', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!isBogConfigured()) {
    return res.status(503).json({
      error: 'bog_not_configured',
      message: 'BOG Pay is not yet configured. Georgian payments will be enabled shortly.',
    });
  }

  const { request_id } = req.body;
  if (!request_id) return res.status(400).json({ error: 'request_id is required' });

  const r = await db.get(`
    SELECT sr.*, s.title, s.price_eur, s.currency, s.provider_id,
      u.email as requester_email, u.username as requester_name
    FROM service_requests sr
    JOIN services s ON sr.service_id = s.id
    JOIN users u ON sr.requester_id = u.id
    WHERE sr.id = ? AND sr.requester_id = ?`, request_id, req.userId);

  if (!r) return res.status(404).json({ error: 'Request not found or not yours' });
  if (r.currency !== 'gel') return res.status(400).json({ error: 'BOG Pay is only for GEL services' });

  const price = r.price_eur ? parseFloat(r.price_eur) : null;
  if (!price || price <= 0) return res.status(400).json({ error: 'This service has no price' });

  // Check provider has entered their IBAN (required for payouts)
  const provider = await db.get('SELECT id, provider_iban FROM users WHERE id = ?', r.provider_id);
  if (!provider?.provider_iban) {
    return res.status(422).json({
      error: 'provider_no_iban',
      message: 'The provider has not added their bank account (IBAN) yet. They need to add it in Settings before payments can be processed.',
    });
  }

  try {
    const token = await getBogAccessToken();
    const amountGel = Math.round(price * 100); // BOG uses smallest unit (tetri)
    const origin = req.headers.origin || 'https://www.boomerang.fyi';

    // Create payment order via BOG API
    const bogRes = await fetch(`${BOG_API_URL}/ecommerce/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_url: `${process.env.SERVER_URL || 'https://boomerang.up.railway.app'}/api/bog/webhook`,
        purchase_units: [{
          currency: 'GEL',
          total_amount: amountGel,
          basket: [{
            product_id: String(r.service_id),
            description: r.title,
            quantity: 1,
            unit_price: amountGel,
          }],
        }],
        redirect_urls: {
          success: `${origin}/dashboard?bog=success&request=${request_id}`,
          fail:    `${origin}/services/${r.service_id}?bog=failed`,
        },
        external_order_id: `boomerang_${request_id}_${Date.now()}`,
        buyer: {
          full_name: r.requester_name,
          email: r.requester_email,
        },
        capture_method: 'MANUAL', // escrow hold — we capture after delivery confirmation
      }),
    });

    if (!bogRes.ok) {
      const errBody = await bogRes.text();
      console.error('[BOG] Order creation failed:', errBody);
      return res.status(500).json({ error: 'BOG payment creation failed. Please try again.' });
    }

    const bogData: any = await bogRes.json();

    // Save BOG order ID on the request
    await db.run(
      `UPDATE service_requests SET
        bog_payment_order_id = ?,
        bog_payment_status = 'pending',
        amount_eur = ?
       WHERE id = ?`,
      bogData.id, price, request_id,
    );

    res.json({
      checkout_url: bogData.redirect_url || bogData._links?.redirect?.href,
      order_id: bogData.id,
    });

  } catch (err: any) {
    console.error('[BOG] Payment error:', err.message);
    res.status(500).json({ error: 'BOG payment setup failed. Please try again.' });
  }
});

// ─── POST /bog/webhook ────────────────────────────────────────────────────
// Called by BOG when a payment is authorized or completed.
// BOG sends a POST with the payment status update.
router.post('/webhook', async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    console.log('[BOG WEBHOOK]', JSON.stringify(body));

    // TODO: verify BOG webhook signature using BOG_CALLBACK_SECRET
    // const signature = req.headers['callback-signature'];
    // if (!verifyBogSignature(body, signature)) return res.status(400).json({ error: 'Invalid signature' });

    const orderId = body.order_id || body.id;
    const status  = body.status?.toLowerCase?.() || '';

    if (!orderId) return res.json({ received: true });

    const request = await db.get(
      `SELECT sr.*, s.provider_id FROM service_requests sr
       JOIN services s ON sr.service_id = s.id
       WHERE sr.bog_payment_order_id = ?`, orderId,
    );

    if (!request) {
      console.warn('[BOG WEBHOOK] No request found for order:', orderId);
      return res.json({ received: true });
    }

    if (status === 'completed' || status === 'payment_completed' || status === 'captured') {
      await db.run(
        "UPDATE service_requests SET bog_payment_status = 'authorized', payment_status = 'authorized' WHERE bog_payment_order_id = ?",
        orderId,
      );
      // Notify provider that payment is held and they should deliver
      const provider = await db.get('SELECT id FROM users WHERE id = ?', request.provider_id);
      if (provider) {
        await notify({
          userId: provider.id,
          type: 'payment_authorized',
          title: 'Payment received! 💰',
          body: `Payment for "${body.description || 'your service'}" is held securely. Please deliver the service.`,
          link: '/dashboard',
        });
      }
    } else if (status === 'rejected' || status === 'failed' || status === 'expired') {
      await db.run(
        "UPDATE service_requests SET bog_payment_status = 'failed', payment_status = 'failed', status = 'cancelled' WHERE bog_payment_order_id = ?",
        orderId,
      );
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('[BOG WEBHOOK] Error:', err.message);
    res.status(400).json({ error: 'Webhook failed' });
  }
});

// ─── POST /bog/payout/:requestId ─────────────────────────────────────────
// Called when delivery is confirmed (by buyer or auto-release cron).
// Sends 80% of the payment to the provider's IBAN via BOG B2B transfer.
router.post('/payout/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!isBogConfigured()) {
    return res.status(503).json({ error: 'BOG Pay not configured' });
  }

  const r = await db.get(`
    SELECT sr.*, s.provider_id, s.title, s.price_eur
    FROM service_requests sr
    JOIN services s ON sr.service_id = s.id
    WHERE sr.id = ?`, req.params.requestId);

  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.requester_id !== req.userId) return res.status(403).json({ error: 'Only the requester can confirm' });
  if (r.status !== 'delivered') return res.status(400).json({ error: 'Service must be delivered first' });
  if (r.currency !== 'gel') return res.status(400).json({ error: 'Not a GEL service' });

  const provider = await db.get('SELECT id, provider_iban, provider_bank_name FROM users WHERE id = ?', r.provider_id);
  if (!provider?.provider_iban) {
    return res.status(422).json({ error: 'Provider has no IBAN on file. Cannot process payout.' });
  }

  const price = parseFloat(r.price_eur || r.amount_eur || '0');
  const fee   = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
  const payout = Math.round((price - fee) * 100) / 100;
  const payoutTetri = Math.round(payout * 100); // BOG uses tetri (1 GEL = 100 tetri)

  try {
    const token = await getBogAccessToken();

    // BOG B2B transfer — sends money from our merchant account to provider's IBAN
    const transferRes = await fetch(`${BOG_API_URL}/b2b/transfers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: payoutTetri,
        currency: 'GEL',
        recipient_iban: provider.provider_iban,
        recipient_name: provider.provider_bank_name || 'Service Provider',
        purpose: `Boomerang payout — ${r.title}`,
        external_id: `payout_${req.params.requestId}_${Date.now()}`,
      }),
    });

    if (!transferRes.ok) {
      const errBody = await transferRes.text();
      console.error('[BOG PAYOUT] Transfer failed:', errBody);
      return res.status(500).json({ error: 'Payout failed. Our team will process it manually within 24 hours.' });
    }

    const transferData: any = await transferRes.json();

    await db.run(`
      UPDATE service_requests SET
        status = 'completed',
        completed_at = NOW(),
        payment_status = 'paid',
        platform_fee_eur = ?,
        provider_payout_eur = ?,
        bog_payment_status = 'paid'
      WHERE id = ?`,
      fee, payout, req.params.requestId,
    );

    // Notify provider
    await notify({
      userId: provider.id,
      type: 'delivery_confirmed',
      title: 'Payment sent! 💰',
      body: `₾${payout.toFixed(2)} has been sent to your bank account for "${r.title}". It should arrive within 1–2 business days.`,
      link: '/settings',
    });

    res.json({
      message: 'Payout initiated. Funds will arrive in the provider\'s account within 1–2 business days.',
      payout_amount_gel: payout,
      transfer_id: transferData.id || transferData.transfer_id,
    });

  } catch (err: any) {
    console.error('[BOG PAYOUT] Error:', err.message);
    res.status(500).json({ error: 'Payout failed. Please contact support.' });
  }
});

// ─── GET /bog/provider-iban ───────────────────────────────────────────────
// Returns the logged-in provider's IBAN details
router.get('/provider-iban', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT provider_iban, provider_bank_name FROM users WHERE id = ?', req.userId);
  res.json({ iban: user?.provider_iban || null, bank_name: user?.provider_bank_name || null });
});

// ─── PUT /bog/provider-iban ───────────────────────────────────────────────
// Saves the provider's IBAN and bank name for BOG payouts
router.put('/provider-iban', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { iban, bank_name } = req.body;
  if (!iban) return res.status(400).json({ error: 'IBAN is required' });

  // Basic IBAN format validation (Georgian IBANs: GE + 2 digits + 16 alphanumeric = 20 chars)
  const ibanClean = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(ibanClean)) {
    return res.status(400).json({ error: 'Invalid IBAN format' });
  }

  await db.run(
    'UPDATE users SET provider_iban = ?, provider_bank_name = ? WHERE id = ?',
    ibanClean, bank_name || null, req.userId,
  );
  res.json({ message: 'Bank details saved' });
});

export default router;
