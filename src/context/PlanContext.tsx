import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  decodeAuthToken,
  getAuthRoles,
  getCurrentUserEmail,
  getCurrentUserId,
  getStoredAuthToken,
  isAdminClaims,
} from "../services/auth.ts";
import { PLAN_LIMITS, Plan, PlanLimits, normalizePlan } from "../config/plans.ts";
import { CurrentUserDto, fetchCurrentUser } from "../services/currentUser.ts";

type PlanContextValue = {
  user: CurrentUserDto | null;
  plan: Plan;
  limits: PlanLimits;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<CurrentUserDto | null>;
  canExportReports: boolean;
  canUseCaregiverAccess: boolean;
  hasRecurringCaregiverSchedule: boolean;
};

const adminLimits: PlanLimits = {
  historyDays: Number.POSITIVE_INFINITY,
  authorizedPeoplePerPet: Number.POSITIVE_INFINITY,
  searchGroups: Number.POSITIVE_INFINITY,
  geofencesPerPet: Number.POSITIVE_INFINITY,
  canExportReports: true,
};

const PlanContext = createContext<PlanContextValue | null>(null);

const fallbackPlanContext: PlanContextValue = {
  user: null,
  plan: "BASIC",
  limits: PLAN_LIMITS.BASIC,
  isAdmin: false,
  loading: false,
  refresh: async () => null,
  canExportReports: false,
  canUseCaregiverAccess: false,
  hasRecurringCaregiverSchedule: false,
};

const getTokenFallbackUser = (): CurrentUserDto | null => {
  const token = getStoredAuthToken();
  if (!token) return null;

  const claims = decodeAuthToken(token);
  const nested = [claims.user, claims.profile, claims.account, claims.data, claims.payload]
    .filter((value) => value && typeof value === "object") as Array<Record<string, unknown>>;
  const sources = [claims, ...nested];
  const read = (keys: string[]) => {
    for (const source of sources) {
      const value = keys.map((key) => source[key]).find((candidate) => candidate != null && String(candidate).trim());
      if (value != null) return String(value).trim();
    }
    return "";
  };

  const roles = getAuthRoles(claims);
  return {
    id: Number(getCurrentUserId(claims) ?? 0),
    name: read(["name", "fullName", "displayName", "username"]),
    email: getCurrentUserEmail(claims) ?? read(["email", "mail"]),
    phone: read(["phone", "phoneNumber"]) || undefined,
    role: roles[0] ?? "USER",
    plan: normalizePlan(read(["plan", "userPlan"])),
  };
};

export const PlanProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const token = getStoredAuthToken();
  const [user, setUser] = useState<CurrentUserDto | null>(() => getTokenFallbackUser());
  const [loading, setLoading] = useState(Boolean(token));

  const refresh = useCallback(async () => {
    if (!getStoredAuthToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.warn("Could not load /api/me; using the authenticated token claims.", error);
      const fallback = getTokenFallbackUser();
      setUser(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) refresh();
    else {
      setUser(null);
      setLoading(false);
    }
  }, [refresh, token]);

  const isAdmin = Boolean(
    user?.role && ["ADMIN", "ADMINISTRATOR", "SUPERADMIN", "SUPER_ADMIN"].includes(String(user.role).toUpperCase())
  ) || isAdminClaims();
  const plan = normalizePlan(user?.plan);
  const limits = isAdmin ? adminLimits : PLAN_LIMITS[plan];

  const value = useMemo<PlanContextValue>(() => ({
    user,
    plan,
    limits,
    isAdmin,
    loading,
    refresh,
    canExportReports: isAdmin || limits.canExportReports,
    canUseCaregiverAccess: isAdmin || plan !== "BASIC",
    hasRecurringCaregiverSchedule: isAdmin || plan === "PREMIUM",
  }), [isAdmin, limits, loading, plan, refresh, user]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = (): PlanContextValue => {
  const context = useContext(PlanContext);
  return context ?? fallbackPlanContext;
};
