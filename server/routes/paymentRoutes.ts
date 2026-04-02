import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

const PACKAGES = [
  { id: 'pack_25', boomerangs: 25, price: 199, label: '25 Boomerangs', priceLabel: '€1.99' },
  { id: 'pack_50', boomerangs: 50, price: 349, label: '50 Boomerangs', priceLabel: '€3.49' },
  { id: 'pack_100', boomerangs: 100, price: 599, label: '100 Boomerangs', priceLabel: '€5.99' },
  { id: 'pack_250', boomerangs: 250, price: 1299, label: '250 Boomerangs', priceLabel: '€12.99' },
];

// Get available packages + Stripe publishable key
router.get('/packages', (_req, res: Response) => {
  const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY || null;
  res.json({ packages: PACKAGES, stripeKey, enabled: !!stripeKey });
});

// Create Stripe Checkout session
router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(503).json({ error: 'Payments not configured yet' });

  const { packageId } = req.body;
  const pkg = PACKAGES.find(p => p.id === packageId);
  if (!pkg) return res.status(400).json({ error: 'Invalid package' });

  try {
    const stripe = require('stripe')(secretKey);
    const origin = req.headers.origin || 'https://boomerang.fyi';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: pkg.label, description: `Top up your Boomerang account with ${pkg.boomerangs} boomerangs` },
          unit_amount: pkg.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/dashboard?topup=success&amount=${pkg.boomerangs}`,
      cancel_url: `${origin}/dashboard?topup=cancelled`,
      metadata: { userId: String(req.userId), packageId: pkg.id, boomerangs: String(pkg.boomerangs) },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Payment failed. Please try again.' });
  }
});

// Stripe webhook to confirm payment and add boomerangs
router.post('/webhook', async (req: AuthRequest, res: Response) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey) return res.status(503).json({ error: 'Not configured' });

  try {
    const stripe = require('stripe')(secretKey);
    let event;

    if (webhookSecret) {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Webhook secret not configured' });
    } else {
      event = req.body;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = parseInt(session.metadata?.userId);
      const boomerangs = parseInt(session.metadata?.boomerangs);

      if (userId && boomerangs) {
        await db.run('UPDATE users SET points = points + ? WHERE id = ?', boomerangs, userId);
        console.log(`Top-up: +${boomerangs} boomerangs for user ${userId}`);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(400).json({ error: 'Webhook failed' });
  }
});

// Manual top-up confirmation (fallback when webhook isn't set up)
router.post('/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  // This is called from the success redirect — add the boomerangs
  await db.run('UPDATE users SET points = points + ? WHERE id = ?', amount, req.userId);
  res.json({ message: `${amount} boomerangs added!` });
});

// Gift boomerangs to another user
router.post('/gift', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { to_user_id, amount, message } = req.body;
  const toId = Number(to_user_id);
  const giftAmount = Number(amount);
  if (!toId || !giftAmount || giftAmount < 1) return res.status(400).json({ error: 'Recipient and amount required' });
  if (toId === req.userId) return res.status(400).json({ error: 'Cannot gift to yourself' });
  const sender = await db.get('SELECT points, username FROM users WHERE id = ?', req.userId);
  if (!sender || sender.points < giftAmount) return res.status(400).json({ error: 'Not enough boomerangs' });
  const receiver = await db.get('SELECT id, username FROM users WHERE id = ?', toId);
  if (!receiver) return res.status(404).json({ error: 'User not found' });
  try {
    await db.transaction(async (tx) => {
      await tx.run('UPDATE users SET points = points - ? WHERE id = ?', giftAmount, req.userId);
      await tx.run('UPDATE users SET points = points + ? WHERE id = ?', giftAmount, toId);
      await tx.run('INSERT INTO gifts (sender_id, receiver_id, amount, message) VALUES (?, ?, ?, ?)', req.userId, toId, giftAmount, message || '');
    });
    res.json({ message: `Sent ${giftAmount} boomerangs to ${receiver.username}!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Gift failed. Please try again.' });
  }
});

// Boost a service (featured listing)
router.post('/boost', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { service_id } = req.body;
  if (!service_id) return res.status(400).json({ error: 'Service ID required' });
  const service = await db.get('SELECT * FROM services WHERE id = ? AND provider_id = ?', service_id, req.userId);
  if (!service) return res.status(404).json({ error: 'Service not found or not yours' });
  const user = await db.get('SELECT points FROM users WHERE id = ?', req.userId);
  const boostCost = 15;
  if (user.points < boostCost) return res.status(400).json({ error: `Need ${boostCost} boomerangs to boost (you have ${user.points})` });
  await db.run('UPDATE users SET points = points - ? WHERE id = ?', boostCost, req.userId);
  const boostUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.run('UPDATE services SET boosted_until = ? WHERE id = ?', boostUntil, service_id);
  res.json({ message: 'Service boosted for 7 days!' });
});

// Transaction history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  const earned = await db.all(`SELECT sr.completed_at as date, s.points_cost as amount, 'earned' as type, s.title, u.username as other_user
    FROM service_requests sr JOIN services s ON sr.service_id = s.id JOIN users u ON sr.requester_id = u.id
    WHERE s.provider_id = ? AND sr.status = 'completed' ORDER BY sr.completed_at DESC LIMIT 50`, req.userId);
  const spent = await db.all(`SELECT sr.completed_at as date, s.points_cost as amount, 'spent' as type, s.title, u.username as other_user
    FROM service_requests sr JOIN services s ON sr.service_id = s.id JOIN users u ON s.provider_id = u.id
    WHERE sr.requester_id = ? AND sr.status = 'completed' ORDER BY sr.completed_at DESC LIMIT 50`, req.userId);
  const giftsSent = await db.all(`SELECT g.created_at as date, g.amount, 'gift_sent' as type, 'Gift' as title, u.username as other_user
    FROM gifts g JOIN users u ON g.receiver_id = u.id WHERE g.sender_id = ? ORDER BY g.created_at DESC LIMIT 20`, req.userId);
  const giftsReceived = await db.all(`SELECT g.created_at as date, g.amount, 'gift_received' as type, 'Gift' as title, u.username as other_user
    FROM gifts g JOIN users u ON g.sender_id = u.id WHERE g.receiver_id = ? ORDER BY g.created_at DESC LIMIT 20`, req.userId);
  const history = [...earned, ...spent, ...giftsSent, ...giftsReceived]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 40);
  res.json(history);
});

export default router;
