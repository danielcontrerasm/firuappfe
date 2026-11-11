// pages/FiruappDashboard.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";
import FiruappMapView from "./ui/FiruappMapView.tsx";
import FiruappPetsList from "./ui/FiruappPetList.tsx";
import FiruappReferenceDashboard from "./FiruappReferenceDashboard.tsx";
import DashboardControls from "./ui/DashboardControls.tsx";
import FiruappMainHeader from "./ui/FiruappMainHeader.tsx";
import { demoPets } from "./ui/dashboardDemoData.ts";
import { MapStyle, Pet, PetDataMode, firuColors } from "./ui/FiruappStyles.ts";
import { isGpsOnline, useGpsStatusTime } from "./ui/petConnectivity.ts";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import WifiIcon from "@mui/icons-material/Wifi";
import SpeedIcon from "@mui/icons-material/Speed";
import PlaceIcon from "@mui/icons-material/Place";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import NavigationIcon from "@mui/icons-material/Navigation";
import PetsIcon from "@mui/icons-material/Pets";
import SecurityIcon from "@mui/icons-material/Security";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { usePetImage } from "../../services/usePetImage.ts";
import { buildApiUrl } from "../../config/runtime";
import {
  decodeAuthToken,
  getAuthRoles,
  getCurrentUserEmail,
  getCurrentUserId,
  isOwnedByCurrentUser,
} from "../../services/auth.ts";


import { useLiveAlerts } from "../../services/useLiveAlerts.ts";
import "./firuapp-dashboard-theme.css";
import { DashboardLanguage, getDashboardCopy } from "./ui/dashboardI18n.ts";
const MobileTrackingDashboard = React.lazy(() => import("./MobileTrackingDashboard.tsx"));

const GUIDE_PENDING_KEY = "firuapp-guide-pending";

const colombiaCities = [
  "Arauca",
  "Armenia",
  "Barranquilla",
  "Bogotá",
  "Bucaramanga",
  "Cali",
  "Cartagena",
  "Cúcuta",
  "Florencia",
  "Ibagué",
  "Leticia",
  "Manizales",
  "Medellín",
  "Mitú",
  "Mocoa",
  "Montería",
  "Neiva",
  "Pasto",
  "Pereira",
  "Popayán",
  "Puerto Carreño",
  "Quibdó",
  "Riohacha",
  "San Andrés",
  "Santa Marta",
  "Sincelejo",
  "Tunja",
  "Valledupar",
  "Villavicencio",
  "Yopal",
];

type GuideTargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type DashboardPetFilters = {
  city: string;
  neighborhood: string;
  ownerName: string;
  petName: string;
};

type DashboardPetLocation = {
  id: string | number;
  petId?: string | number;
  latitude: number;
  longitude: number;
  petName?: string;
  ownerName?: string;
  timestamp?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  batteryPercent?: number;
  imageUrl?: string;
  status?: string;
};

const formatLocationTimestamp = (timestamp?: string) => {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
};

const formatCoordinates = (location?: DashboardPetLocation) => {
  if (!location) return "Unknown";
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
};

const formatBatteryPercent = (battery?: number) => (battery == null ? "Unknown" : `${battery}%`);

const normalizeCityName = (city?: string) =>
  (city || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const locationCacheKey = (location: DashboardPetLocation) =>
  `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;

const extractReverseGeocodeCity = (data: any) => {
  const address = data?.address || {};
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    data?.name ||
    ""
  );
};

const normalizePetCity = (dto: any) => {
  const city = dto.city || dto.owner?.city || dto.address?.city || "";
  return city;
};

const mapPetDtoToDashboardPet = (dto: any): Pet => ({
  id: `db-${dto.id}`,
  apiId: String(dto.id),
  name: dto.name || "Unnamed pet",
  status: String(dto.status || "active").toLowerCase() === "lost" ? "lost" : "active",
  ownerName: dto.ownerName || dto.owner?.name || "",
  city: normalizePetCity(dto),
  neighborhood: dto.neighborhood || dto.owner?.neighborhood || dto.address?.neighborhood || dto.zone || "",
  breed: dto.race || dto.type || "Tracked pet",
  race: dto.race,
  age: dto.age != null ? `${dto.age} years` : undefined,
  weight: dto.weight != null ? `${dto.weight} kg` : undefined,
  battery: dto.batteryPercent ?? dto.batteryPercentage ?? dto.battery,
  imageUrl: dto.imageUrl || dto.avatarUrl || dto.photoUrl,
  signal: "Good",
  speed: "0.0 km/h",
});

const extractPetDtos = (data: any) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const collectionKeys = ["content", "items", "pets", "results", "rows", "payload", "records", "data"];
  for (const key of collectionKeys) {
    const value = data[key];
    if (Array.isArray(value) && value.length) return value;
    if (value && typeof value === "object") {
      const nested = extractPetDtos(value);
      if (nested.length) return nested;
    }
  }
  return [];
};

const matchesPetFilters = (pet: Pet, filters: DashboardPetFilters) => {
  const cityTerm = filters.city.trim().toLowerCase();
  const neighborhoodTerm = filters.neighborhood.trim().toLowerCase();
  const ownerTerm = filters.ownerName.trim().toLowerCase();
  const petTerm = filters.petName.trim().toLowerCase();

  const matchesCity = !cityTerm || (pet.city || "").toLowerCase().includes(cityTerm);
  const matchesNeighborhood = !neighborhoodTerm || (pet.neighborhood || "").toLowerCase().includes(neighborhoodTerm);
  const matchesOwner = !ownerTerm || (pet.ownerName || "").toLowerCase().includes(ownerTerm);
  const matchesPet = !petTerm || (pet.name || "").toLowerCase().includes(petTerm);
  return matchesCity && matchesNeighborhood && matchesOwner && matchesPet;
};

const SummaryCard = ({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string | number; color: string; bg: string }) => (
  <Paper
    role="group"
    aria-label={label}
    elevation={0}
    sx={{
      minHeight: 76,
      px: 1.6,
      py: 1.15,
      borderRadius: 2.2,
      bgcolor: "#ffffff",
      border: "1px solid rgba(226,232,240,0.95)",
      boxShadow: "0 16px 38px rgba(15,23,42,0.06)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1.25,
    }}
  >
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          bgcolor: bg,
          color,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 0.75 }}>
        <Typography variant="h5" sx={{ fontWeight: 950, color: "#071735", lineHeight: 1, fontSize: 22 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 800, whiteSpace: "nowrap" }}>
          {label}
        </Typography>
      </Box>
    </Stack>
    <KeyboardArrowRightIcon sx={{ color: "#7990ad", fontSize: 22 }} />
  </Paper>
);

const MetricCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => {
  const progressWidth = label === "Battery" && /^\d+%$/.test(value) ? value : "42%";
  return (
  <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#ffffff", border: "1px solid #dbe7f3" }}>
    <Stack direction="row" spacing={1.15} alignItems="center">
      <Box sx={{ color, display: "grid", placeItems: "center", width: 28 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: firuColors.muted, fontWeight: 800, lineHeight: 1.1 }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 950, color: firuColors.dark, lineHeight: 1.15 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
    <Box sx={{ mt: 1, height: 6, borderRadius: 999, bgcolor: "#e8eef6", overflow: "hidden" }}>
      <Box sx={{ width: progressWidth, height: "100%", bgcolor: color, borderRadius: 999 }} />
    </Box>
  </Box>
  );
};

const SelectedPetAvatar: React.FC<{ pet: Pet }> = ({ pet }) => {
  const resolvedSrc = usePetImage(pet.apiId || pet.id, pet.imageUrl || pet.avatarUrl);

  return (
    <Avatar
      src={resolvedSrc}
      sx={{
        width: 72,
        height: 72,
        border: "4px solid white",
        boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
      }}
    >
      {pet.name?.charAt(0)}
    </Avatar>
  );
};

const measureGuideTarget = (element: HTMLElement | null): GuideTargetRect | null => {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const padding = 10;
  const top = Math.max(rect.top - padding, 8);
  const left = Math.max(rect.left - padding, 8);
  const right = Math.min(rect.right + padding, window.innerWidth - 8);
  const bottom = Math.min(rect.bottom + padding, window.innerHeight - 8);

  return {
    top,
    left,
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0),
  };
};

const DashboardGuideOverlay = ({
  open,
  title,
  description,
  stepIndex,
  totalSteps,
  spotlightRect,
  onBack,
  onNext,
  onClose,
  copy,
}: {
  open: boolean;
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  spotlightRect: GuideTargetRect | null;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  copy: ReturnType<typeof getDashboardCopy>;
}) => {
  if (!open) return null;

  const isIntro = !spotlightRect;
  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <Box sx={{ position: "fixed", inset: 0, zIndex: 1600 }}>
      {spotlightRect ? (
        <>
          <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, height: spotlightRect.top, bgcolor: "rgba(15,23,42,0.62)" }} />
          <Box sx={{ position: "fixed", top: spotlightRect.top, left: 0, width: spotlightRect.left, height: spotlightRect.height, bgcolor: "rgba(15,23,42,0.62)" }} />
          <Box
            sx={{
              position: "fixed",
              top: spotlightRect.top,
              left: spotlightRect.left + spotlightRect.width,
              right: 0,
              height: spotlightRect.height,
              bgcolor: "rgba(15,23,42,0.62)",
            }}
          />
          <Box
            sx={{
              position: "fixed",
              top: spotlightRect.top + spotlightRect.height,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(15,23,42,0.62)",
            }}
          />
          <Box
            sx={{
              position: "fixed",
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
              borderRadius: 4,
              border: "2px solid rgba(103,232,249,0.95)",
              boxShadow: "0 0 0 9999px rgba(15,23,42,0.02), 0 0 0 6px rgba(103,232,249,0.18)",
              pointerEvents: "none",
            }}
          />
        </>
      ) : (
        <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(15,23,42,0.68)" }} />
      )}

      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          left: "50%",
          bottom: isIntro ? "50%" : 24,
          transform: isIntro ? "translate(-50%, 50%)" : "translateX(-50%)",
          width: "min(380px, calc(100vw - 32px))",
          p: 2.25,
          borderRadius: 4,
          bgcolor: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(226,232,240,0.95)",
          boxShadow: "0 22px 56px rgba(15,23,42,0.28)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.25 }}>
          <Chip
            size="small"
            label={`${copy.guideNext === "Siguiente" ? "Guía" : "Guide"} ${stepIndex + 1}/${totalSteps}`}
            sx={{ bgcolor: "#ecfeff", color: "#0e7490", fontWeight: 900 }}
          />
          <Button onClick={onClose} size="small" sx={{ minWidth: "auto", color: "#64748b", fontWeight: 800, textTransform: "none" }}>
            {copy.guideClose}
          </Button>
        </Stack>

        <Typography variant="h6" sx={{ color: firuColors.dark, fontWeight: 950 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: firuColors.muted, lineHeight: 1.7 }}>
          {description}
        </Typography>

        <Stack direction="row" justifyContent="space-between" spacing={1.25} sx={{ mt: 2.25 }}>
          <Button
            onClick={onBack}
            variant="outlined"
            disabled={stepIndex === 0}
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}
          >
            {copy.guideBack}
          </Button>
          <Button
            onClick={onNext}
            variant="contained"
            sx={{ bgcolor: firuColors.dark, borderRadius: 3, textTransform: "none", fontWeight: 900, "&:hover": { bgcolor: "#111827" } }}
          >
            {isLastStep ? copy.guideFinish : copy.guideNext}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

const FiruappDashboard: React.FC = () => {
  const navigate = useNavigate();
  const now = useGpsStatusTime();
  const isMobile = useMediaQuery("(max-width:899.95px)");
  const [serverIsAdmin, setServerIsAdmin] = useState(false);
  const canUseDemoData = true;
  const [dashboardPets, setDashboardPets] = useState<Pet[]>([]);
  const [databasePets, setDatabasePets] = useState<Pet[]>([]);
  const [petLocations, setPetLocations] = useState<DashboardPetLocation[]>([]);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>("clean");
  const [referenceMapStyle, setReferenceMapStyle] = useState<MapStyle>("natural");
  const [language, setLanguage] = useState<DashboardLanguage>(() => (
    typeof window !== "undefined" && window.localStorage.getItem("firuapp-language") === "es" ? "es" : "en"
  ));
  const copy = getDashboardCopy(language);
  const [dashboardTheme, setDashboardTheme] = useState<"current" | "reference">(() => {
    if (typeof window === "undefined") return "reference";
    return window.localStorage.getItem("firuapp-dashboard-theme") === "reference" ? "reference" : "current";
  });
  const petDataMode: PetDataMode = demoEnabled ? "mixed" : "database";
  const dashboardControls = {
    demoEnabled,
    onDemoToggle: () => setDemoEnabled((current) => !current),
    showGeofences,
    onShowGeofencesChange: setShowGeofences,
    mapStyle,
    onMapStyleChange: setMapStyle,
    canUseDemoData,
    copy,
    language,
  };
  const toggleLanguage = () => {
    setLanguage((current) => {
      const next = current === "es" ? "en" : "es";
      window.localStorage.setItem("firuapp-language", next);
      return next;
    });
  };
  const toggleDashboardTheme = () => {
    setDashboardTheme((current) => {
      const next = current === "reference" ? "current" : "reference";
      window.localStorage.setItem("firuapp-dashboard-theme", next);
      return next;
    });
  };
  const [petFilters, setPetFilters] = useState<DashboardPetFilters>({
    city: "",
    neighborhood: "",
    ownerName: "",
    petName: "",
  });
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [mapFocusKey, setMapFocusKey] = useState(0);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(true);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<HTMLElement | null>(null);
  const initialAccountDetails = useMemo(() => {
    const claims = decodeAuthToken();
    const nestedAccounts = [claims.user, claims.profile, claims.account, claims.data, claims.payload]
      .filter((value) => value && typeof value === "object") as Array<Record<string, unknown>>;
    const sources = [claims, ...nestedAccounts];
    const read = (keys: string[]) => {
      for (const source of sources) {
        const value = keys
          .map((key) => source[key])
          .find((candidate) => candidate != null && String(candidate).trim() !== "");
        if (value != null) return String(value).trim();
      }
      return "";
    };

    return {
      name: read(["name", "fullName", "displayName", "username"]) || "Daniel Contreras",
      email: getCurrentUserEmail(claims) || read(["email", "mail"]) || "demo@example.com",
      id: getCurrentUserId(claims) || read(["id", "userId", "user_id"]) || "—",
      role: getAuthRoles(claims)[0] || read(["role", "userRole"]) || "USER",
    };
  }, []);
  const [accountDetails, setAccountDetails] = useState(initialAccountDetails);
  const [section, setSection] = useState<"all" | "geofence" | "route">("all");
  const { alerts: alertMessages, connected: alertsConnected, dismissAlert } = useLiveAlerts();
  const [dismissedPetAlertIds, setDismissedPetAlertIds] = useState<Set<string>>(() => new Set());
  const dismissPetAlert = useCallback((alertId: string) => {
    setDismissedPetAlertIds((current) => {
      const next = new Set(current);
      next.add(alertId);
      return next;
    });
  }, []);
  const [cityByLocationKey, setCityByLocationKey] = useState<Record<string, string>>({});
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const [guideSpotlightRect, setGuideSpotlightRect] = useState<GuideTargetRect | null>(null);
  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const mapPanelRef = useRef<HTMLDivElement | null>(null);
  const petListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    let cancelled = false;
    axios.get(buildApiUrl("/api/me"), { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        const profile = response.data?.user || response.data;
        const role = profile?.role || profile?.authority || response.data?.authority;
        const normalizedRole = String(role || "").replace(/^ROLE[_:\s-]?/i, "").toUpperCase();
        if (!cancelled) {
          setServerIsAdmin(["ADMIN", "ADMINISTRATOR", "SUPERADMIN", "SUPER_ADMIN"].includes(normalizedRole));
          setAccountDetails((current) => ({
            ...current,
            name: profile?.name || profile?.fullName || profile?.displayName || profile?.username || current.name,
            email: profile?.email || profile?.mail || current.email,
            id: profile?.id || profile?.userId || current.id,
            role: normalizedRole || current.role,
          }));
        }
      })
      .catch(() => {
        if (!cancelled) setServerIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchDatabasePets = useCallback(async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(buildApiUrl("/api/pets"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const petDtos = extractPetDtos(response.data);
    console.log("Dashboard DB pets response:", {
      hasToken: Boolean(token),
      count: Array.isArray(petDtos) ? petDtos.length : 0,
      responseKeys: response?.data && typeof response.data === "object" ? Object.keys(response.data) : [],
    });
    return (Array.isArray(petDtos) ? petDtos : [])
      .filter((petDto: any) => serverIsAdmin || isOwnedByCurrentUser(petDto))
      .map(mapPetDtoToDashboardPet);
  }, [serverIsAdmin]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const loadedPets = await fetchDatabasePets();
        if (!cancelled) {
          setDatabasePets((currentPets) => loadedPets.length ? loadedPets : currentPets);
        }
      } catch (error) {
        console.error("Error loading dashboard pets from database:", error);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchDatabasePets]);

  useEffect(() => {
    const nextPets = demoEnabled ? [...databasePets, ...demoPets] : databasePets;
    setDashboardPets(nextPets);
    setSelectedPetId((currentSelectedId) =>
      nextPets.some((pet) => pet.id === currentSelectedId)
        ? currentSelectedId
        : undefined
    );
  }, [databasePets, demoEnabled]);

  const livePetDetailsByPetId = useMemo(() => {
    return Object.fromEntries(
      petLocations
        .filter((location) => location.petId != null)
        .map((location) => [
          String(location.petId),
          {
            name: location.petName,
            ownerName: location.ownerName,
            city: location.city,
            neighborhood: location.neighborhood,
            battery: location.batteryPercent,
            timestamp: location.timestamp,
          },
        ] as const)
    );
  }, [petLocations]);

  const filteredDashboardPets = useMemo(() => {
    return dashboardPets
      .map((pet) => {
        const liveDetails = livePetDetailsByPetId[String(pet.apiId || pet.id)] ?? livePetDetailsByPetId[String(pet.id)];
        if (!liveDetails) return { ...pet, gpsOnline: false };
        return {
          ...pet,
          name: liveDetails.name || pet.name,
          ownerName: liveDetails.ownerName || pet.ownerName,
          city: liveDetails.city || pet.city,
          neighborhood: liveDetails.neighborhood || pet.neighborhood,
          battery: liveDetails.battery ?? pet.battery,
          lastSeen: liveDetails.timestamp ? formatLocationTimestamp(liveDetails.timestamp) : pet.lastSeen,
          gpsOnline: isGpsOnline(liveDetails.timestamp, now),
        };
      })
      .filter((pet) => matchesPetFilters(pet, petFilters))
  }, [dashboardPets, livePetDetailsByPetId, petFilters, now]);

  useEffect(() => {
    setSelectedPetId((currentSelectedId) =>
      filteredDashboardPets.some((pet) => pet.id === currentSelectedId) ? currentSelectedId : undefined
    );
  }, [filteredDashboardPets]);

  const selectedPet = useMemo(
    () =>
      filteredDashboardPets.find((pet) => pet.id === selectedPetId) ||
      filteredDashboardPets.find((pet) => pet.status === "lost") ||
      filteredDashboardPets[0],
    [filteredDashboardPets, selectedPetId]
  );
  const focusSelectedPet = useCallback(() => {
    if (!selectedPet) return;
    setSelectedPetId(selectedPet.id);
    setDetailsPanelOpen(true);
    setMapFocusKey((current) => current + 1);
  }, [selectedPet]);
  const selectedPetLocation = useMemo(() => {
    if (!selectedPet) return undefined;
    const selectedIds = new Set([selectedPet.apiId, selectedPet.id].filter(Boolean).map(String));
    return petLocations.find((location) => location.petId != null && selectedIds.has(String(location.petId)));
  }, [petLocations, selectedPet]);
  const selectedPetLastSeen = selectedPetLocation?.timestamp
    ? formatLocationTimestamp(selectedPetLocation.timestamp)
    : selectedPet?.lastSeen || copy.unknown;
  const selectedPetLocationKey = selectedPetLocation ? locationCacheKey(selectedPetLocation) : undefined;
  const selectedPetGpsCity =
    selectedPetLocation?.city ||
    (selectedPetLocationKey ? cityByLocationKey[selectedPetLocationKey] : undefined);
  const selectedPetCity =
    selectedPetGpsCity ||
    selectedPet?.city;
  const cityOptions = useMemo(() => {
    const cities = new Map<string, string>();
    [
      ...colombiaCities,
      ...dashboardPets.map((pet) => pet.city),
      ...petLocations.map((location) => location.city),
      selectedPetGpsCity,
      petFilters.city,
    ].forEach((city) => {
      if (city && !cities.has(normalizeCityName(city))) {
        cities.set(normalizeCityName(city), city);
      }
    });
    return Array.from(cities.values());
  }, [dashboardPets, petLocations, selectedPetGpsCity, petFilters.city]);
  const selectedPetLocationLabel =
    selectedPetLocation
      ? [selectedPetCity, selectedPetLocation.address || copy.gpsCoordinates].filter(Boolean).join(" · ")
      : copy.noLiveLocation;
  const selectedPetCoordinates = formatCoordinates(selectedPetLocation);
  const selectedPetBattery = selectedPetLocation?.batteryPercent ?? selectedPet?.battery;
  const selectedPetBatteryColor = selectedPetBattery != null && selectedPetBattery <= 20 ? "#ef4444" : firuColors.green;
  const selectedPetIsLost = selectedPet?.status === "lost";
  const selectedPetGpsOnline = selectedPet?.gpsOnline === true;
  const selectedPetLocationColor = selectedPetIsLost ? "#cf1421" : selectedPetGpsOnline ? "#15803d" : firuColors.muted;
  const selectedPetLocationBg = selectedPetIsLost ? "#fff7f7" : selectedPetGpsOnline ? "#f0fdf4" : "#f8fafc";
  const selectedPetLocationBorder = selectedPetIsLost ? "#ffb9bd" : selectedPetGpsOnline ? "#bbf7d0" : "#dbe7f3";
  const lostPets = useMemo(() => filteredDashboardPets.filter((pet) => pet.status === "lost"), [filteredDashboardPets]);
  const onlinePets = useMemo(() => filteredDashboardPets.filter((pet) => pet.gpsOnline), [filteredDashboardPets]);
  const handleLocationsChange = useCallback((locations: DashboardPetLocation[]) => {
    setPetLocations(locations);
    setDatabasePets((currentPets) => {
      const knownIds = new Set(currentPets.flatMap((pet) => [pet.id, pet.apiId].filter(Boolean).map(String)));
      const petsFromLocations = locations
        .filter((location) => location.petId != null && !String(location.petId).startsWith("mock-") && !knownIds.has(String(location.petId)))
        .map((location) => ({
          id: `db-${location.petId}`,
          apiId: String(location.petId),
          name: location.petName || `Pet ${location.petId}`,
          status: String(location.status || "active").toLowerCase() === "lost" ? "lost" : "active",
          ownerName: location.ownerName || "",
          city: location.city || "",
          neighborhood: location.neighborhood || "",
          imageUrl: location.imageUrl,
          battery: location.batteryPercent,
          signal: "Good" as const,
          speed: "0.0 km/h",
        }));

      return petsFromLocations.length ? [...currentPets, ...petsFromLocations] : currentPets;
    });
  }, []);

  useEffect(() => {
    if (!selectedPetLocation || selectedPetLocation.city) return undefined;

    const cacheKey = locationCacheKey(selectedPetLocation);
    if (cityByLocationKey[cacheKey]) return undefined;

    let cancelled = false;
    const controller = new AbortController();

    const fetchCityName = async () => {
      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          lat: String(selectedPetLocation.latitude),
          lon: String(selectedPetLocation.longitude),
          zoom: "10",
          addressdetails: "1",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        const city = extractReverseGeocodeCity(data);
        if (!cancelled && city) {
          setCityByLocationKey((current) => ({ ...current, [cacheKey]: city }));
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Error reverse geocoding pet city:", error);
        }
      }
    };

    fetchCityName();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cityByLocationKey, selectedPetLocation]);
  const recentAlertItems = useMemo(() => {
    const liveAlerts = alertMessages.map((alert) => ({
      id: alert.id,
      title: alert.message,
      time: alert.receivedAt,
      severity: "critical" as const,
      onDismiss: () => dismissAlert(alert.id),
    }));
    const petAlerts = lostPets
      .map((pet, index) => {
        const id = `lost-${pet.id}`;
        return {
          id,
          title: `${pet.name} has been marked as LOST`,
          time: index === 0 ? "Just now" : "12 min ago",
          severity: "critical" as const,
          onDismiss: () => dismissPetAlert(id),
        };
      })
      .filter((alert) => !dismissedPetAlertIds.has(alert.id));
    return [...liveAlerts, ...petAlerts].slice(0, 2);
  }, [alertMessages, dismissAlert, dismissedPetAlertIds, dismissPetAlert, lostPets]);
  const guideSteps = [
    {
      title: language === "es" ? "Bienvenido al panel" : "Welcome to the dashboard",
      description:
        language === "es" ? "Esta guía muestra los controles que usarás con más frecuencia. La navegación izquierda permite cambiar entre el panel, rutas, zonas seguras, mascotas, usuarios y alertas." : "This guide points out the controls you will use most often. The left navigation moves between dashboard views, routes, safe zones, pets, users, and alerts.",
    },
    {
      title: language === "es" ? "Barra de búsqueda" : "Search bar",
      description:
        language === "es" ? "Usa esta barra para buscar rápidamente mascotas, lugares o geocercas antes de limitar la vista con los filtros detallados." : "Use this search bar to quickly look for pets, places, or geofences before you narrow the view with the detailed filters below.",
      targetRef: searchBarRef,
    },
    {
      title: language === "es" ? "Filtros rápidos" : "Quick filters",
      description:
        language === "es" ? "Estos filtros te permiten enfocar el panel por ciudad, barrio, dueño o nombre de mascota para mostrar solo los registros que necesitas." : "These filters let you focus the dashboard by city, neighborhood, owner, or pet name so the map and list only show the records you need.",
      targetRef: filterBarRef,
    },
    {
      title: language === "es" ? "Mapa en vivo" : "Live map",
      description:
        language === "es" ? "El mapa muestra las ubicaciones en vivo de las mascotas y las zonas seguras. Selecciona un marcador para enfocar una mascota y abrir sus detalles." : "The map shows live pet locations and safe zones. Select a marker to focus a pet and open the detail panel on the right.",
      targetRef: mapPanelRef,
    },
    {
      title: language === "es" ? "Lista de mascotas" : "Pet list",
      description:
        language === "es" ? "Esta lista flotante muestra las mascotas visibles actualmente. Haz clic en una para centrarte en ella y revisar su estado." : "This floating list shows the pets currently visible on the dashboard. Click one to center your attention on that pet and review its status.",
      targetRef: petListRef,
    },
  ];

  const currentGuideStep = guideSteps[guideStepIndex];

  const refreshGuideSpotlight = useCallback(() => {
    const target = currentGuideStep?.targetRef?.current ?? null;
    setGuideSpotlightRect(measureGuideTarget(target));
  }, [currentGuideStep]);

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
    setGuideStepIndex(0);
    setGuideSpotlightRect(null);
  }, []);

  const goToNextGuideStep = useCallback(() => {
    setGuideStepIndex((current) => {
      if (current >= guideSteps.length - 1) {
        setGuideOpen(false);
        setGuideSpotlightRect(null);
        return 0;
      }
      return current + 1;
    });
  }, [guideSteps.length]);

  useEffect(() => {
    if (sessionStorage.getItem(GUIDE_PENDING_KEY) === "true") {
      sessionStorage.removeItem(GUIDE_PENDING_KEY);
      setGuideOpen(true);
      setGuideStepIndex(0);
    }
  }, []);

  useEffect(() => {
    if (!guideOpen) return undefined;

    const target = currentGuideStep?.targetRef?.current ?? null;
    if (target) {
      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }

    const frame = window.requestAnimationFrame(refreshGuideSpotlight);
    const handleLayout = () => refreshGuideSpotlight();
    window.addEventListener("resize", handleLayout);
    window.addEventListener("scroll", handleLayout, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleLayout);
      window.removeEventListener("scroll", handleLayout, true);
    };
  }, [currentGuideStep, guideOpen, refreshGuideSpotlight]);

  if (isMobile) return <React.Suspense fallback={<Box sx={{ minHeight: "100dvh", bgcolor: "white" }} />}><MobileTrackingDashboard
    pets={filteredDashboardPets}
    selectedPet={selectedPet}
    onSelect={setSelectedPetId}
    onLocationsChange={handleLocationsChange}
    alertCount={alertMessages.length}
    city={selectedPetGpsCity}
    filters={petFilters}
    onFiltersChange={setPetFilters}
    controls={dashboardControls}
    petDataMode={petDataMode}
  /></React.Suspense>;

  if (dashboardTheme === "reference") {
    return (
      <FiruappReferenceDashboard
        language={language}
        copy={copy}
        dashboardTheme={dashboardTheme}
        accountDetails={accountDetails}
        accountMenuAnchor={accountMenuAnchor}
        onAccountMenuOpen={(event) => setAccountMenuAnchor(event.currentTarget)}
        onAccountMenuClose={() => setAccountMenuAnchor(null)}
        onToggleTheme={() => {
          setAccountMenuAnchor(null);
          toggleDashboardTheme();
        }}
        onToggleLanguage={() => {
          setAccountMenuAnchor(null);
          toggleLanguage();
        }}
        onLogout={() => {
          setAccountMenuAnchor(null);
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        filteredDashboardPets={filteredDashboardPets}
        selectedPet={selectedPet}
        selectedPetId={selectedPetId}
        onSelectPet={setSelectedPetId}
        mapFocusKey={mapFocusKey}
        onFocusPet={focusSelectedPet}
        onStatusChange={(petId, status) => {
          setDatabasePets((currentPets) => currentPets.map((pet) => ((pet.apiId || pet.id) === petId ? { ...pet, status } : pet)));
          setDashboardPets((currentPets) => currentPets.map((pet) => ((pet.apiId || pet.id) === petId ? { ...pet, status } : pet)));
        }}
        petDataMode={petDataMode}
        showGeofences={showGeofences}
        onShowGeofencesChange={setShowGeofences}
        mapStyle={referenceMapStyle}
        onMapStyleChange={setReferenceMapStyle}
        selectedPetGpsCity={selectedPetGpsCity}
        selectedPetLocation={selectedPetLocation}
        selectedPetLastSeen={selectedPetLastSeen}
        selectedPetLocationLabel={selectedPetLocationLabel}
        selectedPetCoordinates={selectedPetCoordinates}
        selectedPetBattery={selectedPetBattery}
        selectedPetBatteryColor={selectedPetBatteryColor}
        selectedPetIsLost={selectedPetIsLost}
        selectedPetGpsOnline={selectedPetGpsOnline}
        selectedPetLocationColor={selectedPetLocationColor}
        selectedPetLocationBg={selectedPetLocationBg}
        selectedPetLocationBorder={selectedPetLocationBorder}
        onlinePets={onlinePets}
        lostPets={lostPets}
        recentAlertItems={recentAlertItems}
        alertsConnected={alertsConnected}
        onLocationsChange={handleLocationsChange}
        petFilters={petFilters}
        onPetFiltersChange={setPetFilters}
        cityOptions={cityOptions}
        detailsPanelOpen={detailsPanelOpen}
        onDetailsPanelChange={setDetailsPanelOpen}
        searchBarRef={searchBarRef}
        filterBarRef={filterBarRef}
        mapPanelRef={mapPanelRef}
        petListRef={petListRef}
      />
    );
  }

  return (
    <Box className={`firu-dashboard-shell ${dashboardTheme === "reference" ? "firu-reference-theme" : ""}`} sx={{ minHeight: "100vh", display: "flex", bgcolor: "#f7fbff", color: firuColors.text }}>
      <FiruappSidebar current={section} onChange={setSection} copy={copy} language={language} showBrand={false} />

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <FiruappMainHeader
          language={language}
          copy={copy}
          dashboardTheme={dashboardTheme}
          accountDetails={accountDetails}
          accountMenuAnchor={accountMenuAnchor}
          searchValue={petFilters.petName}
          onSearchChange={(value) => setPetFilters((current) => ({ ...current, petName: value }))}
          controls={<DashboardControls {...dashboardControls} compact />}
          searchBarRef={searchBarRef}
          onAccountMenuOpen={(event) => setAccountMenuAnchor(event.currentTarget)}
          onAccountMenuClose={() => setAccountMenuAnchor(null)}
          onToggleTheme={() => {
            setAccountMenuAnchor(null);
            toggleDashboardTheme();
          }}
          onToggleLanguage={() => {
            setAccountMenuAnchor(null);
            toggleLanguage();
          }}
          onLogout={() => {
            setAccountMenuAnchor(null);
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        />

        <Box sx={{ px: { xs: 2, md: 2.75 }, py: { xs: 2, md: 2.25 }, display: "grid", gap: 2.05 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: { xs: "wrap", lg: "nowrap" } }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 950, color: "#071735", letterSpacing: -1.1, fontSize: { xs: 27, md: 31 }, lineHeight: 1.08, whiteSpace: { lg: "nowrap" } }}>
                {copy.greeting}
              </Typography>
              <Typography variant="body1" sx={{ color: "#6c7c95", mt: 0.4, fontSize: 15, fontWeight: 700 }}>
                {copy.subtitle}
              </Typography>
            </Box>
            <Stack ref={filterBarRef} direction="row" spacing={1.2} flexWrap="wrap" useFlexGap sx={{ justifyContent: "flex-end", alignItems: "center", flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: { xs: "100%", sm: 220, lg: 244 },
                  height: 46,
                  px: 1.35,
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                  border: "1px solid #dbe7f3",
                  color: "#0f1b34",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <PlaceIcon sx={{ color: "#607491", fontSize: 21 }} />
                <Select
                  value={petFilters.city}
                  onChange={(event) => {
                    const city = event.target.value;
                    setPetFilters((current) => ({ ...current, city }));
                  }}
                  displayEmpty
                  variant="standard"
                  disableUnderline
                  IconComponent={KeyboardArrowDownIcon}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    color: "#0f1b34",
                    fontSize: 14,
                    fontWeight: 850,
                    "& .MuiSelect-select": { py: 0 },
                    "& .MuiSelect-icon": { color: "#3d516e" },
                  }}
                  renderValue={(value) => value || copy.allCities}
                >
                  <MenuItem value="">{copy.allCities}</MenuItem>
                  {cityOptions.map((city) => {
                    const isGpsCity = selectedPetGpsCity && normalizeCityName(city) === normalizeCityName(selectedPetGpsCity);
                    return (
                      <MenuItem key={city} value={city}>
                        {city}{isGpsCity ? " (GPS)" : ""}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Box>
              <TextField
                placeholder={copy.neighborhood}
                value={petFilters.neighborhood}
                onChange={(event) => setPetFilters((current) => ({ ...current, neighborhood: event.target.value }))}
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#607491", fontSize: 21 }} /></InputAdornment> }}
                sx={{
                  width: { xs: "100%", sm: 220, lg: 288 },
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                    borderRadius: 2,
                    bgcolor: "#ffffff",
                    color: "#0f1b34",
                    fontWeight: 800,
                    "& fieldset": { borderColor: "#dbe7f3" },
                  },
                }}
              />
              <TextField
                placeholder={copy.owner}
                value={petFilters.ownerName}
                onChange={(event) => setPetFilters((current) => ({ ...current, ownerName: event.target.value }))}
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#607491", fontSize: 21 }} /></InputAdornment> }}
                sx={{
                  width: { xs: "100%", sm: 220, lg: 288 },
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                    borderRadius: 2,
                    bgcolor: "#ffffff",
                    color: "#0f1b34",
                    fontWeight: 800,
                    "& fieldset": { borderColor: "#dbe7f3" },
                  },
                }}
              />
            </Stack>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
              gap: 1.6,
            }}
          >
            <SummaryCard icon={<PetsIcon />} label={copy.petsCount} value={filteredDashboardPets.length} color="#0284c7" bg="#e0f2fe" />
            <SummaryCard icon={<WifiIcon />} label={copy.online} value={onlinePets.length} color="#16a34a" bg="#d9fbe8" />
            <SummaryCard icon={<SecurityIcon />} label={copy.safeZones} value={3} color="#0284c7" bg="#e0f2fe" />
            <SummaryCard icon={<WarningAmberIcon />} label={copy.alertsCount} value={recentAlertItems.length} color="#f97316" bg="#fff2dc" />
            <SummaryCard icon={<WarningAmberIcon />} label={copy.lostCount} value={lostPets.length} color="#ef4444" bg="#ffe4e8" />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: detailsPanelOpen ? { xs: "1fr", lg: "minmax(0, 1fr) 412px" } : "1fr",
              gap: 1.8,
              alignItems: "start",
            }}
          >
            <Paper elevation={0} sx={{ bgcolor: "#ffffff", border: "1px solid #dbe7f3", borderRadius: 2.4, p: 0, position: "relative", overflow: "hidden", boxShadow: "0 18px 48px rgba(15,23,42,0.075)" }}>
              <FiruappMapView
                containerRef={mapPanelRef}
                pets={filteredDashboardPets}
                petDataMode={petDataMode}
                showGeofences={showGeofences}
                onShowGeofencesChange={setShowGeofences}
                mapStyle={mapStyle}
                onMapStyleChange={setMapStyle}
                locationCity={selectedPetGpsCity}
                selectedPetId={selectedPet?.id}
                mapFocusKey={mapFocusKey}
                mapResizeKey={detailsPanelOpen ? "details" : "full-map"}
                onSelectPet={(petId) => {
                  setSelectedPetId(petId);
                  setDetailsPanelOpen(true);
                }}
                onLocationsChange={handleLocationsChange}
              />
              <FiruappPetsList
                containerRef={petListRef}
                pets={filteredDashboardPets}
                selectedId={selectedPet?.id}
                onSelect={(petId) => {
                  setSelectedPetId(petId);
                  setDetailsPanelOpen(true);
                }}
                onStatusChange={(petId, status) => {
                  setDatabasePets((currentPets) => currentPets.map((pet) => ((pet.apiId || pet.id) === petId ? { ...pet, status } : pet)));
                  setDashboardPets((currentPets) => currentPets.map((pet) => ((pet.apiId || pet.id) === petId ? { ...pet, status } : pet)));
                }}
                copy={copy}
              />
            </Paper>

            {detailsPanelOpen && <Stack spacing={1.8}>
              <Paper elevation={0} sx={{ bgcolor: "#ffffff", border: "1px solid #dbe7f3", borderRadius: 2.2, overflow: "hidden", boxShadow: "0 16px 42px rgba(15,23,42,0.07)" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.15, minHeight: 52 }}>
                  <Typography variant="subtitle2" sx={{ color: "#071735", fontWeight: 950 }}>
                    {copy.recentAlerts}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: alertsConnected ? "#17c964" : "#ff970f" }} />
                    {!recentAlertItems.length && (
                      <Typography variant="caption" sx={{ color: "#17a957", fontWeight: 850, whiteSpace: "nowrap" }}>
                        {copy.noRecentAlerts}
                      </Typography>
                    )}
                    <Button size="small" sx={{ color: "#1685ff", fontWeight: 850, textTransform: "none", minWidth: 0, px: 0.5 }}>
                      {copy.viewAll}
                    </Button>
                  </Stack>
                </Stack>
                {recentAlertItems.map((alert) => (
                  <Box
                    key={alert.id}
                    sx={{
                      px: 2,
                      py: 1.05,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      bgcolor: alert.severity === "critical" ? "#fff2f2" : "#fff8ea",
                      borderTop: "1px solid rgba(255,255,255,0.84)",
                    }}
                  >
                    <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: alert.severity === "critical" ? "#ff2534" : "#ff970f", color: "white", display: "grid", placeItems: "center", fontWeight: 950 }}>
                      !
                    </Box>
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 0, color: "#071735", fontWeight: 800 }}>
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6c7c95", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {alert.time}
                    </Typography>
                    {alert.onDismiss && (
                      <IconButton
                        size="small"
                        aria-label={`${copy.dismiss} ${alert.title}`}
                        onClick={alert.onDismiss}
                        sx={{ color: "#64748b", ml: 0.25, "&:hover": { bgcolor: "#fee2e2", color: "#dc2626" } }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Paper>

              {selectedPet && (
                <Paper elevation={0} sx={{ bgcolor: "#ffffff", border: "1px solid #dbe7f3", borderRadius: 2.2, p: 1.8, boxShadow: "0 16px 42px rgba(15,23,42,0.07)" }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Stack direction="row" spacing={1.6} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box sx={{ transform: "scale(0.9)", transformOrigin: "left center", mr: -0.8 }}><SelectedPetAvatar pet={selectedPet} /></Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Typography variant="h5" sx={{ color: "#071735", fontWeight: 950 }}>
                            {selectedPet.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={selectedPetGpsOnline ? copy.onlineLabel : copy.offlineLabel}
                            sx={{
                              height: 28,
                              borderRadius: 999,
                              bgcolor: selectedPetGpsOnline ? "#17c964" : firuColors.muted,
                              color: "#ffffff",
                              fontWeight: 950,
                            }}
                          />
                          {selectedPetIsLost && (
                            <Chip size="small" label={copy.lostLabel} sx={{ bgcolor: "#ff3444", color: "#ffffff", fontWeight: 950 }} />
                          )}
                        </Stack>
                        <Typography variant="body2" sx={{ color: "#61728f", mt: 0.55, fontWeight: 700 }}>
                          {[selectedPet.breed || selectedPet.race || copy.mixedBreed, selectedPet.age || (language === "es" ? "6 años" : "6 years"), selectedPet.weight || "22 kg"].join("  ·  ")}
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton
                      size="small"
                      aria-label="Close pet details"
                      onClick={() => setDetailsPanelOpen(false)}
                      sx={{ bgcolor: "#f8fbff", border: "1px solid #dbe7f3", color: "#6c7c95", "&:hover": { bgcolor: "#eef6ff" } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Box
                    sx={{
                      mt: 1.6,
                      p: 1.45,
                      borderRadius: 1.8,
                      bgcolor: selectedPetLocationBg,
                      border: `1px solid ${selectedPetLocationBorder}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.4,
                    }}
                  >
                    {selectedPetIsLost ? (
                      <WarningAmberIcon sx={{ color: "#ff3444", fontSize: 34 }} />
                    ) : (
                      <MyLocationIcon sx={{ color: selectedPetLocationColor, fontSize: 34 }} />
                    )}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: selectedPetLocationColor, fontWeight: 950 }}>
                        {copy.lastSeen}
                      </Typography>
                      <Typography variant="body2" sx={{ color: selectedPetLocationColor, fontWeight: 900 }}>
                        {selectedPetLastSeen}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#61728f", fontWeight: 700 }}>
                        {selectedPetLocationLabel}
                      </Typography>
                    </Box>
                    <KeyboardArrowRightIcon sx={{ color: selectedPetLocationColor }} />
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.1, mt: 1.25 }}>
                    <MetricCard icon={<BatteryChargingFullIcon fontSize="small" />} label={copy.battery} value={formatBatteryPercent(selectedPetBattery)} color={selectedPetBatteryColor} />
                    <MetricCard icon={<WifiIcon fontSize="small" />} label={copy.signal} value={selectedPetGpsOnline ? selectedPet.signal || copy.unknown : copy.offlineLabel} color={selectedPetGpsOnline ? "#1685ff" : firuColors.muted} />
                    <MetricCard icon={<SpeedIcon fontSize="small" />} label={copy.speed} value={selectedPet.speed || "0.6 km/h"} color="#8b5cf6" />
                    <MetricCard icon={<MyLocationIcon fontSize="small" />} label={copy.gpsAccuracy} value={language === "es" ? "6 metros" : "6 meters"} color="#1685ff" />
                    <MetricCard icon={<AccessTimeIcon fontSize="small" />} label={copy.lastUpdate} value={selectedPetLastSeen} color="#64748b" />
                    <MetricCard icon={<PlaceIcon fontSize="small" />} label={copy.coordinates} value={selectedPetCoordinates} color="#1685ff" />
                  </Box>

                  <Button
                    fullWidth
                    startIcon={<NavigationIcon />}
                    variant="contained"
                    onClick={focusSelectedPet}
                    sx={{ mt: 1.35, height: 48, bgcolor: "#062346", borderRadius: 2, textTransform: "none", fontWeight: 950, fontSize: 15, boxShadow: "none", "&:hover": { bgcolor: "#0d3762", boxShadow: "none" } }}
                  >
                    {copy.find} {selectedPet.name}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => selectedPet && navigate(`/routes/recent?petId=${selectedPet.apiId || selectedPet.id}`)}
                    sx={{ mt: 1.1, height: 48, borderRadius: 2, borderColor: "#1685ff", color: "#071735", textTransform: "none", fontWeight: 950, fontSize: 15 }}
                  >
                    {copy.openRoute}
                  </Button>
                </Paper>
              )}
            </Stack>}
          </Box>
        </Box>
      </Box>

      <DashboardGuideOverlay
        open={guideOpen}
        title={currentGuideStep.title}
        description={currentGuideStep.decription}
        stepIndex={guideStepIndex}
        totalSteps={guideSteps.length}
        spotlightRect={guideSpotlightRect}
        onBack={() => setGuideStepIndex((current) => Math.max(current - 1, 0))}
        onNext={goToNextGuideStep}
        onClose={closeGuide}
        copy={copy}
      />
    </Box>
  );
};

export default FiruappDashboard;
