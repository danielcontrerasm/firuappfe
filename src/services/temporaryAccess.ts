import axios from "axios";
import { buildApiUrl } from "../config/runtime";

export type TemporaryAccessRole = "CAREGIVER" | "WALKER";
export type TemporaryAccessPermission = "LIVE_LOCATION" | "ALERTS" | "HISTORY" | "GEOFENCES";

export type TemporaryAccessRecurrence = {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
};

export type TemporaryAccessRequest = {
  email: string;
  name: string;
  role: TemporaryAccessRole;
  startsAt: string;
  endsAt: string;
  permissions: TemporaryAccessPermission[];
  recurrence?: TemporaryAccessRecurrence | null;
  createAccountIfMissing: boolean;
  sendCredentials: boolean;
};

export type TemporaryAccessDto = {
  id: number | string;
  email?: string;
  name?: string;
  role?: TemporaryAccessRole | string;
  status?: string;
  startsAt?: string;
  endsAt?: string;
  permissions?: TemporaryAccessPermission[] | string[];
  recurrence?: TemporaryAccessRecurrence | null;
};

const authConfig = () => {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
};

const endpoint = (petId: string | number) => `/api/pets/${petId}/temporary-access`;

const extractAccesses = (data: any): TemporaryAccessDto[] => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const collection = data.items ?? data.content ?? data.accesses ?? data.results ?? data.data;
  return Array.isArray(collection) ? collection : [];
};

export async function listTemporaryAccess(petId: string | number): Promise<TemporaryAccessDto[]> {
  const response = await axios.get(buildApiUrl(endpoint(petId)), authConfig());
  return extractAccesses(response.data);
}

export async function inviteTemporaryAccess(
  petId: string | number,
  request: TemporaryAccessRequest
): Promise<TemporaryAccessDto> {
  const response = await axios.post(buildApiUrl(endpoint(petId)), request, authConfig());
  return response.data;
}

export async function revokeTemporaryAccess(
  petId: string | number,
  accessId: string | number
): Promise<void> {
  await axios.delete(buildApiUrl(`${endpoint(petId)}/${accessId}`), authConfig());
}
