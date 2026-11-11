export type Plan = "BASIC" | "FAMILY" | "PREMIUM";

export type PlanLimits = {
  historyDays: number;
  authorizedPeoplePerPet: number;
  searchGroups: number;
  geofencesPerPet: number;
  canExportReports: boolean;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  BASIC: {
    historyDays: 30,
    authorizedPeoplePerPet: 5,
    searchGroups: 1,
    geofencesPerPet: 3,
    canExportReports: false,
  },
  FAMILY: {
    historyDays: 90,
    authorizedPeoplePerPet: 10,
    searchGroups: 3,
    geofencesPerPet: 5,
    canExportReports: false,
  },
  PREMIUM: {
    historyDays: 365,
    authorizedPeoplePerPet: 20,
    searchGroups: 5,
    geofencesPerPet: 10,
    canExportReports: true,
  },
};

export const PLAN_DETAILS: Record<Plan, {
  name: string;
  shortName: string;
  price: string;
  billing: string;
  accent: string;
  benefits: string[];
}> = {
  BASIC: {
    name: "Basic · Inicio",
    shortName: "Basic",
    price: "$319.000 COP",
    billing: "3 meses gratis",
    accent: "#64748b",
    benefits: [
      "Precio inicial: collar + servicio $319.000 COP",
      "Ubicación en vivo, alertas y batería",
      "5 personas autorizadas por mascota",
      "Historial de los últimos 30 días",
      "3 zonas seguras y 1 grupo de búsqueda",
      "Resumen de recorridos del día",
      "Soporte por WhatsApp y garantía del equipo de 1 año",
      "Sin acceso temporal para cuidador o paseador",
      "Sin descarga de recorridos e informes",
    ],
  },
  FAMILY: {
    name: "Family · Familia",
    shortName: "Family",
    price: "$379.000 COP",
    billing: "3 meses gratis + 3 pagos",
    accent: "#0e7490",
    benefits: [
      "Precio inicial: collar + servicio $379.000 COP",
      "Todo lo incluido en Basic",
      "10 personas autorizadas por mascota",
      "Historial de los últimos 90 días",
      "5 zonas seguras y 3 grupos de búsqueda",
      "Acceso temporal para cuidador o paseador",
      "Resumen semanal de recorridos",
      "Soporte por WhatsApp y garantía del equipo de 1 año",
      "Sin descarga de recorridos e informes",
    ],
  },
  PREMIUM: {
    name: "Premium · Plus",
    shortName: "Premium",
    price: "$469.000 COP",
    billing: "3 meses gratis + 9 pagos",
    accent: "#7c3aed",
    benefits: [
      "Precio inicial: collar + servicio $469.000 COP",
      "Todo lo incluido en Family",
      "20 personas autorizadas por mascota",
      "Historial de hasta 365 días",
      "10 zonas seguras y 5 grupos de búsqueda",
      "Horarios recurrentes para cuidador o paseador",
      "Exportación de recorridos en PDF y CSV",
      "Soporte por WhatsApp, garantía de 1 año y sesión de configuración de 15 minutos",
    ],
  },
};

export const PLAN_ORDER: Plan[] = ["BASIC", "FAMILY", "PREMIUM"];

export const normalizePlan = (value: unknown): Plan => {
  const normalized = String(value ?? "BASIC").trim().toUpperCase();
  return normalized === "FAMILY" || normalized === "PREMIUM" ? normalized : "BASIC";
};

export const getPlanLabel = (plan: Plan, language: "es" | "en" = "es") => {
  if (language === "en") {
    return {
      BASIC: "Basic",
      FAMILY: "Family",
      PREMIUM: "Premium",
    }[plan];
  }

  return {
    BASIC: "Basic · Inicio",
    FAMILY: "Family · Familia",
    PREMIUM: "Premium · Plus",
  }[plan];
};

export const getApiErrorMessage = (error: any, fallback = "No se pudo completar la operación.") => {
  const value = error?.response?.data?.error
    ?? error?.response?.data?.message
    ?? (typeof error?.response?.data === "string" ? error.response.data : undefined)
    ?? error?.message;
  return value ? String(value) : fallback;
};

export const formatPlanLimit = (value: number) => Number.isFinite(value) ? String(value) : "sin límite";
