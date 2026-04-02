import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : 'skillswap-dev-secret-change-in-production');

// Map userId -> Set of connected sockets
const clients = new Map<number, Set<WebSocket>>();

let wss: WebSocketServer;

export function initWebSocket(server: HttpServer) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via query param: /ws?token=xxx
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      ws.close(4001, 'No token');
      return;
    }

    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    // Register client
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId)!.add(ws);

    // Handle incoming messages from client
    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'typing' && data.to) {
          // Forward typing indicator to the target user
          sendToUser(data.to, 'typing', { sender_id: userId });
        }
      } catch {}
    });

    ws.on('close', () => {
      const set = clients.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) clients.delete(userId);
      }
    });

    // Keepalive ping
    ws.on('pong', () => { (ws as any).isAlive = true; });
    (ws as any).isAlive = true;
  });

  // Ping all clients every 30s to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) return ws.terminate();
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));
}

/** Send a typed message to a specific user (all their connected tabs/devices) */
export function sendToUser(userId: number, type: string, payload: any) {
  const sockets = clients.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify({ type, ...payload });
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

/** Check if a user is currently online */
export function isUserOnline(userId: number): boolean {
  return clients.has(userId) && clients.get(userId)!.size > 0;
}
