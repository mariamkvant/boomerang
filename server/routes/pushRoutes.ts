import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../auth';
import { getVapidPublicKey, saveSubscription, removeSubscription } from '../push';

const router = Router();

// Get VAPID public key (needed by client to subscribe)
router.get('/vapid-key', (_req, res: Response) => {
  const key = getVapidPublicKey();
  if (!key) return res.status(404).json({ error: 'Push notifications not configured' });
  res.json({ publicKey: key });
});

// Save push subscription
router.post('/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  await saveSubscription(req.userId!, subscription);
  res.json({ message: 'Subscribed to push notifications' });
});

// Remove push subscription
router.post('/unsubscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Endpoint required' });
  await removeSubscription(endpoint);
  res.json({ message: 'Unsubscribed from push notifications' });
});

export default router;
