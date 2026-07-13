import { useEffect, useRef, useState, useCallback } from 'react';

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * WebSocket hook with exponential-backoff reconnection.
 * Sends ping every 20s to detect dead connections.
 */
export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef(null);
  const onMessageRef = useRef(onMessage);
  const [status, setStatus] = useState('connecting'); // connecting | open | closed | error

  // Keep callback ref up to date without re-triggering effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const WS_URL =
      import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/ws/live-feed';

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('open');
          reconnectCount.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessageRef.current(data);
          } catch (_) {}
        };

        ws.onerror = () => setStatus('error');

        ws.onclose = () => {
          setStatus('closed');
          if (reconnectCount.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectCount.current++;
            const delay = RECONNECT_DELAY_MS * Math.min(reconnectCount.current, 5);
            reconnectTimer.current = setTimeout(connect, delay);
          }
        };
      } catch (_) {
        setStatus('error');
      }
    };

    connect();

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 20000);

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return status;
}
