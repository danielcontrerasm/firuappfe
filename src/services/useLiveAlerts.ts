import { useCallback, useEffect, useMemo, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { jwtDecode } from "jwt-decode";
import { buildWsUrl } from "../config/runtime";

export interface LiveAlert {
  id: string;
  message: string;
  receivedAt: string;
  occurredAt: string;
  ownerId?: string;
  petId?: string;
  type?: string;
}

type AlertPayload = Record<string, any>;

const getTokenClaims = (token: string | null): AlertPayload => {
  if (!token) return {};
  try {
    return jwtDecode<AlertPayload>(token);
  } catch {
    return {};
  }
};

export const getAlertOwnerId = (claims: AlertPayload) => {
  const value = claims.ownerId ?? claims.owner_id ?? claims.owner?.id ?? claims.userId ?? claims.user_id ?? claims.user?.id ?? claims.id ?? claims.sub;
  if (value == null || String(value).trim() === "") return undefined;
  return String(value);
};

const getPayloadOwnerId = (payload: AlertPayload) =>
  payload.ownerId ??
  payload.owner_id ??
  payload.owner?.id ??
  payload.userId ??
  payload.user_id ??
  payload.user?.id;

const getPayloadPetId = (payload: AlertPayload) => payload.petId ?? payload.pet_id ?? payload.pet?.id;

const parsePayload = (body: unknown): { payload: AlertPayload; rawMessage: string } => {
  if (body && typeof body === "object") {
    const payload = body as AlertPayload;
    return {
      payload,
      rawMessage: String(payload.message ?? payload.alertMessage ?? payload.description ?? payload.title ?? "Alert"),
    };
  }

  const raw = String(body ?? "Alert");
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        payload: parsed,
        rawMessage: String(parsed.message ?? parsed.alertMessage ?? parsed.description ?? parsed.title ?? raw),
      };
    }
  } catch {
    // Plain-text STOMP bodies are valid alert messages.
  }
  return { payload: {}, rawMessage: raw };
};

const parseAlertDate = (payload: AlertPayload, fallback: Date) => {
  const candidate = payload.occurredAt ?? payload.occurred_at ?? payload.timestamp ?? payload.createdAt ?? payload.created_at ?? payload.date ?? payload.time;
  if (candidate == null) return fallback;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const isGeofenceAlert = (message: string, payload: AlertPayload) => {
  const type = String(payload.type ?? payload.alertType ?? payload.eventType ?? payload.kind ?? "").toLowerCase();
  return /geofence|geo.?fence|safe.?zone|zona.?segura|per[ií]metro/.test(`${type} ${message}`.toLowerCase());
};

const containsDateOrTime = (message: string) =>
  /\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b|\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(message);

export const formatAlertDateTime = (date: Date) =>
  date.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });

export const normalizeLiveAlert = (body: unknown, receivedAt = new Date()): LiveAlert => {
  const { payload, rawMessage } = parsePayload(body);
  const occurredAt = parseAlertDate(payload, receivedAt);
  const dateLabel = formatAlertDateTime(occurredAt);
  const geofence = isGeofenceAlert(rawMessage, payload);
  const message = geofence && !containsDateOrTime(rawMessage)
    ? `${rawMessage} · ${dateLabel}`
    : rawMessage;
  const payloadId = payload.id ?? payload.alertId ?? payload.alert_id;
  const payloadOwnerId = getPayloadOwnerId(payload);
  const payloadPetId = getPayloadPetId(payload);

  return {
    id: payloadId != null
      ? String(payloadId)
      : `${geofence ? "geofence" : "alert"}:${payloadOwnerId ?? ""}:${rawMessage}:${occurredAt.toISOString()}`,
    message,
    receivedAt: dateLabel,
    occurredAt: occurredAt.toISOString(),
    ownerId: payloadOwnerId == null ? undefined : String(payloadOwnerId),
    petId: payloadPetId == null ? undefined : String(payloadPetId),
    type: geofence ? "geofence" : payload.type ?? payload.alertType,
  };
};

const readCachedAlerts = (cacheKey: string) => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "[]");
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
};

const writeCachedAlerts = (cacheKey: string, alerts: LiveAlert[]) => {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(alerts));
  } catch {
    // Alerts remain usable when session storage is unavailable.
  }
};

export const alertBelongsToOwner = (alert: LiveAlert, ownerId?: string) =>
  !alert.ownerId || !ownerId || String(alert.ownerId) === String(ownerId);

export function useLiveAlerts() {
  const token = typeof window === "undefined" ? null : localStorage.getItem("token");
  const claims = useMemo(() => getTokenClaims(token), [token]);
  const ownerId = getAlertOwnerId(claims);
  const canLoadAlerts = Boolean(token && ownerId);
  const cacheKey = ownerId ? `firuapp-alerts:${ownerId}` : "firuapp-alerts:anonymous";
  const [alerts, setAlerts] = useState<LiveAlert[]>(() => (canLoadAlerts ? readCachedAlerts(cacheKey) : []));
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setAlerts(canLoadAlerts ? readCachedAlerts(cacheKey).filter((alert) => alertBelongsToOwner(alert, ownerId)) : []);
    setConnected(false);
  }, [cacheKey, canLoadAlerts, ownerId]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((current) => {
      const next = current.filter((alert) => alert.id !== alertId);
      if (canLoadAlerts) writeCachedAlerts(cacheKey, next);
      return next;
    });
  }, [cacheKey, canLoadAlerts]);

  useEffect(() => {
    if (!canLoadAlerts || !ownerId) return undefined;

    const client = new Client({
      connectHeaders: { Authorization: token?.startsWith("Bearer ") ? token : `Bearer ${token}` },
      webSocketFactory: () => new SockJS(buildWsUrl("/ws")),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/alerts/${ownerId}`, (event) => {
          const alert = normalizeLiveAlert(event.body);
          if (!alertBelongsToOwner(alert, ownerId)) return;

          setAlerts((current) => {
            const next = [alert, ...current.filter((existing) => existing.id !== alert.id)].slice(0, 50);
            writeCachedAlerts(cacheKey, next);
            return next;
          });
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [cacheKey, canLoadAlerts, ownerId, token]);

  return { alerts, connected, dismissAlert, ownerId };
}
