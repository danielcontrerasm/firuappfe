import { jwtDecode } from "jwt-decode";

export type AuthClaims = Record<string, unknown>;

const ROLE_CLAIM_KEYS = [
  "role",
  "roles",
  "authorities",
  "authority",
  "userRole",
  "userRoles",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
];

const asStringList = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap(asStringList);
  }

  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return asStringList(item.authority ?? item.role ?? item.name ?? item.value);
  }

  return [];
};

export const getStoredAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
};

export const decodeAuthToken = (token = getStoredAuthToken()): AuthClaims => {
  if (!token) return {};

  try {
    const normalizedToken = token.replace(/^Bearer\s+/i, "");
    return jwtDecode<AuthClaims>(normalizedToken);
  } catch {
    return {};
  }
};

export const getAuthRoles = (claims: AuthClaims = decodeAuthToken()): string[] => {
  const values = ROLE_CLAIM_KEYS.flatMap((key) => asStringList(claims[key]));
  const nestedClaims = ["user", "data", "account", "profile", "principal", "payload"];
  nestedClaims.forEach((key) => {
    const nested = claims[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      values.push(...getAuthRoles(nested as AuthClaims));
    }
  });
  return Array.from(
    new Set(
      values
        .map((role) => role.replace(/^ROLE[_:\s-]?/i, "").trim().toUpperCase())
        .filter(Boolean)
    )
  );
};

export const isAdminClaims = (claims: AuthClaims = decodeAuthToken()): boolean => {
  const roles = getAuthRoles(claims);
  return roles.some((role) => ["ADMIN", "ADMINISTRATOR", "SUPERADMIN", "SUPER_ADMIN"].includes(role));
};

export const isCurrentUserAdmin = (): boolean => isAdminClaims(decodeAuthToken());

export const getCurrentUserId = (claims: AuthClaims = decodeAuthToken()): string | undefined => {
  const user = claims.user && typeof claims.user === "object" ? claims.user as Record<string, unknown> : undefined;
  const value = claims.userId ?? claims.user_id ?? claims.id ?? claims.sub ?? claims.uid ?? user?.id ?? user?.userId;
  return value == null || String(value).trim() === "" ? undefined : String(value);
};

export const getCurrentUserRole = (): string | undefined => getAuthRoles()[0];

export const getCurrentUserEmail = (claims: AuthClaims = decodeAuthToken()): string | undefined => {
  const user = claims.user && typeof claims.user === "object" ? claims.user as Record<string, unknown> : undefined;
  const value = claims.email ?? claims.mail ?? user?.email ?? user?.mail;
  return value == null || String(value).trim() === "" ? undefined : String(value).trim().toLowerCase();
};

export const isOwnedByCurrentUser = (record: Record<string, any>, claims: AuthClaims = decodeAuthToken()): boolean => {
  if (!record || typeof record !== "object") return false;
  if (isAdminClaims(claims)) return true;

  const currentUserId = getCurrentUserId(claims);
  const currentUserEmail = getCurrentUserEmail(claims);
  const nestedPet = record.pet && typeof record.pet === "object" ? record.pet : undefined;
  const owner = record.owner ?? record.user ?? record.createdBy ?? record.createdByUser ?? nestedPet?.owner;
  const ownerId =
    record.ownerId ??
    record.owner_id ??
    record.userId ??
    record.user_id ??
    record.createdById ??
    record.created_by_id ??
    owner?.id ??
    owner?.userId ??
    nestedPet?.ownerId ??
    nestedPet?.userId;
  const ownerEmail = record.ownerEmail ?? record.createdByEmail ?? owner?.email ?? owner?.mail ?? nestedPet?.ownerEmail;

  if (ownerId != null && currentUserId) return String(ownerId) === currentUserId;
  if (ownerEmail && currentUserEmail) return String(ownerEmail).trim().toLowerCase() === currentUserEmail;

  // The API is normally already scoped by the bearer token. If an older response
  // omits ownership metadata, keep it rather than hiding a valid owner record.
  return true;
};

