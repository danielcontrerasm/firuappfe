import axios from "axios";
import { buildApiUrl } from "../config/runtime";
import { normalizePlan, Plan } from "../config/plans.ts";

export type CurrentUserDto = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "USER" | "WALKER" | "ADMIN" | string;
  plan: Plan;
  walkerProfileId?: number;
};

export const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const normalizeCurrentUser = (value: any): CurrentUserDto => {
  const dto = value?.user ?? value?.data ?? value ?? {};
  return {
    id: Number(dto.id ?? dto.userId ?? 0),
    name: dto.name ?? dto.fullName ?? dto.displayName ?? dto.username ?? "",
    email: dto.email ?? dto.mail ?? "",
    phone: dto.phone ?? dto.phoneNumber,
    role: String(dto.role ?? dto.authority ?? "USER").replace(/^ROLE[_:\s-]?/i, "").toUpperCase(),
    plan: normalizePlan(dto.plan),
    walkerProfileId: dto.walkerProfileId == null ? undefined : Number(dto.walkerProfileId),
  };
};

export const fetchCurrentUser = async (): Promise<CurrentUserDto> => {
  const response = await axios.get(buildApiUrl("/api/me"), {
    headers: getAuthHeaders(),
  });
  return normalizeCurrentUser(response.data);
};

export const updateUserPlan = async (userId: number | string, plan: Plan) => {
  const response = await axios.put(
    buildApiUrl(`/api/admin/users/${userId}/plan`),
    { plan },
    { headers: getAuthHeaders() }
  );
  return {
    userId: Number(response.data?.userId ?? userId),
    plan: normalizePlan(response.data?.plan ?? plan),
  };
};

export const downloadPetReport = async (
  petId: number | string,
  format: "pdf" | "csv"
) => {
  let response;
  try {
    response = await axios.get(
      buildApiUrl(`/api/pets/${petId}/history/export`),
      {
        params: { format },
        headers: getAuthHeaders(),
        responseType: "blob",
      }
    );
  } catch (error: any) {
    const responseData = error?.response?.data;
    if (responseData instanceof Blob) {
      let parsed;
      try {
        parsed = JSON.parse(await responseData.text());
      } catch {
        throw error;
      }
      const enrichedError = new Error(error?.message ?? "No se pudo descargar el reporte.");
      Object.assign(enrichedError, error, { response: { ...error.response, data: parsed } });
      throw enrichedError;
    }
    throw error;
  }

  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data], { type: format === "pdf" ? "application/pdf" : "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pettracker-route-report.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
