import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;

const listeners = new Map<string, Set<MessageHandler>>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentToken: string | null = null;

function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${proto}//${host}/ws`;
}

function connect(token: string) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  currentToken = token;
  socket = new WebSocket(`${getWsUrl()}?token=${token}`);

  socket.onopen = () => {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const type = data.type as string;
      listeners.get(type)?.forEach((fn) => fn(data));
      listeners.get('*')?.forEach((fn) => fn(data));
    } catch {}
  };

  socket.onclose = (e) => {
    socket = null;
    // Don't reconnect if closed intentionally (4001 = auth error)
    if (e.code === 4001) return;
    if (currentToken) {
      reconnectTimer = setTimeout(() => connect(currentToken!), 3000);
    }
  };

  socket.onerror = () => { socket?.close(); };
}

function disconnect() {
  currentToken = null;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) { socket.close(); socket = null; }
}

/** Send a message through the WebSocket */
export function sendWsMessage(data: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

/** Subscribe to a WebSocket message type. Use '*' for all messages. */
export function useSocket(type: string, handler: MessageHandler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((data: any) => handlerRef.current(data), []);

  useEffect(() => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(stableHandler);
    return () => {
      listeners.get(type)?.delete(stableHandler);
      if (listeners.get(type)?.size === 0) listeners.delete(type);
    };
  }, [type, stableHandler]);
}

/** Connect/disconnect the global socket based on auth state */
export function useSocketConnection() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connect(token);
    }
    return () => disconnect();
  }, []);
}
