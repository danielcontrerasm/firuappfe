import { useEffect, useState } from "react";

export const GPS_ONLINE_TIMEOUT_MS = 5 * 60 * 1000;
const GPS_STATUS_REFRESH_MS = 30 * 1000;

export const isGpsOnline = (timestamp?: string | null, now = Date.now()) => {
  if (!timestamp?.trim()) return false;

  // Use the same timestamp interpretation as the Last seen display.
  const reportedAt = new Date(timestamp).getTime();
  const age = now - reportedAt;
  return Number.isFinite(reportedAt) && age >= 0 && age <= GPS_ONLINE_TIMEOUT_MS;
};

// Re-evaluate freshness even when the API stops returning new reports.
export const useGpsStatusTime = () => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), GPS_STATUS_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, []);

  return now;
};
