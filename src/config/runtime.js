const DEFAULT_LOCAL_API_ORIGIN = "http://localhost:8080";

const normalizeBaseUrl = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
};

const getApiOrigin = () => {
  const configuredOrigin = normalizeBaseUrl(process.env.REACT_APP_API_URL);
  if (configuredOrigin) return configuredOrigin;

  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return window.location.origin;
  }

  return DEFAULT_LOCAL_API_ORIGIN;
};

export const API_ORIGIN = getApiOrigin();

export const buildApiUrl = (path = "/") =>
  new URL(path.startsWith("/") ? path : `/${path}`, `${API_ORIGIN}/`).toString();

export const buildAssetUrl = (path) => {
  if (!path) return undefined;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  const normalizedPath = path.replaceAll("\\", "/");
  return new URL(
    normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`,
    `${API_ORIGIN}/`
  ).toString();
};

export const buildWsUrl = (path = "/ws") => {
  const configuredWsOrigin = normalizeBaseUrl(process.env.REACT_APP_WS_URL);
  const baseUrl = configuredWsOrigin || API_ORIGIN;
  return new URL(path.startsWith("/") ? path : `/${path}`, `${baseUrl}/`).toString();
};

export const searchGroupEndpoints = Object.freeze({
  list: "/api/search-groups",
  create: "/api/search-groups",
  byId: (searchGroupId) => `/api/search-groups/${searchGroupId}`,
  byPet: (petId) => `/api/search-groups/pet/${petId}`,
  mine: "/api/search-groups/my",
  volunteers: (searchGroupId) => `/api/search-groups/${searchGroupId}/volunteers`,
  join: (searchGroupId) => `/api/search-groups/${searchGroupId}/join`,
  leave: (searchGroupId) => `/api/search-groups/${searchGroupId}/leave`,
  update: (searchGroupId) => `/api/search-groups/${searchGroupId}`,
  addVolunteer: (searchGroupId, userId) => `/api/search-groups/${searchGroupId}/volunteers/${userId}`,
  removeVolunteer: (searchGroupId, userId) => `/api/search-groups/${searchGroupId}/volunteers/${userId}`,
  memberCandidates: (searchGroupId) => `/api/search-groups/${searchGroupId}/member-candidates`,
  messages: (searchGroupId) => `/api/search-groups/${searchGroupId}/messages`,
});
