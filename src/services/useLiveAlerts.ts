import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { jwtDecode } from "jwt-decode";
import { buildWsUrl } from "../config/runtime";

export interface LiveAlert { id: string; message: string; receivedAt: string; }

export function useLiveAlerts() {
  const token = localStorage.getItem("token");
  let user: Record<string, any> = {};
  try { if (token) user = jwtDecode(token); } catch { /* Use the default identity when no readable token is available. */ }
  const userId = user.id ?? user.userId ?? 1;
  const cacheKey = `firuapp-alerts:${user.sub || userId}`;
  const [alerts, setAlerts] = useState<LiveAlert[]>(() => {
    try { const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "[]"); return Array.isArray(cached) ? cached : []; } catch { return []; }
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(buildWsUrl("/ws")),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/alerts/${userId}`, event => {
          const alert = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message: event.body, receivedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) };
          setAlerts(current => {
            const next = [alert, ...current].slice(0, 50);
            try { sessionStorage.setItem(cacheKey, JSON.stringify(next)); } catch { /* Alerts still work when storage is unavailable. */ }
            return next;
          });
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });
    client.activate();
    return () => { client.deactivate(); };
  }, [cacheKey, userId]);

  return { alerts, connected };
}
