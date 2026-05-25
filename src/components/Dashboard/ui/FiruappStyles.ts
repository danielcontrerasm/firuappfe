// ui/FiruappStyles.ts
export type PetStatus = "active" | "lost";

export interface Pet {
  id: string;
  name: string;
  status: PetStatus;
  imageUrl?: string;
  avatarUrl?: string;
  race?: string;
  breed?: string;
  age?: string;
  weight?: string;
  battery?: number;
  signal?: "Strong" | "Good" | "Weak";
  speed?: string;
  lastSeen?: string;
}

export const firuColors = {
  bg: "#f4f8fb",
  dark: "#0f172a",
  text: "#102033",
  muted: "#64748b",
  border: "#e2e8f0",
  surface: "rgba(255,255,255,0.92)",
  cyan: "#06b6d4",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  violet: "#8b5cf6",
};

export const glassPanel = {
  borderRadius: 4,
  background: "rgba(255,255,255,0.86)",
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  backdropFilter: "blur(18px)",
};

export const compactPanel = {
  borderRadius: 3,
  background: "rgba(255,255,255,0.94)",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 14px 36px rgba(15,23,42,0.10)",
};
