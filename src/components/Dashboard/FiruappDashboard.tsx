// pages/FiruappDashboard.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";
import FiruappMapView from "./ui/FiruappMapView.tsx";
import FiruappPetsList from "./ui/FiruappPetList.tsx";
import { Pet, firuColors } from "./ui/FiruappStyles.ts";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
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
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { usePetImage } from "../../services/usePetImage.ts";
import { buildApiUrl, buildWsUrl } from "../../config/runtime";

const ALERT_USER_ID = 1;
const GUIDE_PENDING_KEY = "firuapp-guide-pending";

type GuideTargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

interface DashboardAlert {
  id: string;
  message: string;
  receivedAt: string;
}

type PetDataMode = "mock" | "database" | "mixed";
type DashboardPetFilters = {
  city: string;
  neighborhood: string;
  ownerName: string;
  petName: string;
};

const normalizeMedellinCity = (dto: any) => {
  const city = dto.city || dto.owner?.city || dto.address?.city || "";
  const neighborhood = dto.neighborhood || dto.owner?.neighborhood || dto.address?.neighborhood || dto.zone || "";
  if (city) return city;
  return neighborhood ? "Medellin" : "";
};

const mapPetDtoToDashboardPet = (dto: any): Pet => ({
  id: `db-${dto.id}`,
  apiId: String(dto.id),
  name: dto.name || "Unnamed pet",
  status: String(dto.status || "active").toLowerCase() === "lost" ? "lost" : "active",
  ownerName: dto.ownerName || dto.owner?.name || "",
  city: normalizeMedellinCity(dto),
  neighborhood: dto.neighborhood || dto.owner?.neighborhood || dto.address?.neighborhood || dto.zone || "",
  breed: dto.race || dto.type || "Tracked pet",
  race: dto.race,
  age: dto.age != null ? `${dto.age} years` : undefined,
  weight: dto.weight != null ? `${dto.weight} kg` : undefined,
  battery: 82,
  signal: "Good",
  speed: "0.0 km/h",
  lastSeen: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString() : "Database pet",
});

const extractPetDtos = (data: any) => {
  if (Array.isArray(data)) return data;
  return (
    data?.content ||
    data?.items ||
    data?.pets ||
    data?.data ||
    data?.results ||
    data?.rows ||
    data?.payload ||
    []
  );
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
    elevation={0}
    sx={{
      minHeight: 88,
      px: 1.7,
      py: 1.4,
      borderRadius: 2,
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
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 950, color: "#071735", lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ display: "block", mt: 0.45, color: "#64748b", fontWeight: 800 }}>
          {label}
        </Typography>
      </Box>
    </Stack>
    <KeyboardArrowRightIcon sx={{ color: "#7990ad", fontSize: 22 }} />
  </Paper>
);

const MetricCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
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
      <Box sx={{ width: label === "Battery" ? value : "42%", height: "100%", bgcolor: color, borderRadius: 999 }} />
    </Box>
  </Box>
);

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
            label={`Guide ${stepIndex + 1}/${totalSteps}`}
            sx={{ bgcolor: "#ecfeff", color: "#0e7490", fontWeight: 900 }}
          />
          <Button onClick={onClose} size="small" sx={{ minWidth: "auto", color: "#64748b", fontWeight: 800, textTransform: "none" }}>
            Skip
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
            Back
          </Button>
          <Button
            onClick={onNext}
            variant="contained"
            sx={{ bgcolor: firuColors.dark, borderRadius: 3, textTransform: "none", fontWeight: 900, "&:hover": { bgcolor: "#111827" } }}
          >
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

const FiruappDashboard: React.FC = () => {
  const [dashboardPets, setDashboardPets] = useState<Pet[]>([]);
  const [databasePets, setDatabasePets] = useState<Pet[]>([]);
  const petDataMode: PetDataMode = "database";
  const [petFilters, setPetFilters] = useState<DashboardPetFilters>({
    city: "",
    neighborhood: "",
    ownerName: "",
    petName: "",
  });
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [section, setSection] = useState<"all" | "geofence" | "route">("all");
  const [alertMessages, setAlertMessages] = useState<DashboardAlert[]>([]);
  const [alertsConnected, setAlertsConnected] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const [guideSpotlightRect, setGuideSpotlightRect] = useState<GuideTargetRect | null>(null);
  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const mapPanelRef = useRef<HTMLDivElement | null>(null);
  const petListRef = useRef<HTMLDivElement | null>(null);

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
    return (Array.isArray(petDtos) ? petDtos : []).map(mapPetDtoToDashboardPet);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const loadedPets = await fetchDatabasePets();
        if (!cancelled) {
          setDatabasePets(loadedPets);
        }
      } catch (error) {
        console.error("Error loading dashboard pets from database:", error);
        if (!cancelled) {
          setDatabasePets([]);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchDatabasePets]);

  useEffect(() => {
    const nextPets = databasePets;
    setDashboardPets(nextPets);
    setSelectedPetId((currentSelectedId) =>
      nextPets.some((pet) => pet.id === currentSelectedId)
        ? currentSelectedId
        : undefined
    );
  }, [databasePets]);

  const filteredDashboardPets = useMemo(() => {
    return dashboardPets.filter((pet) => matchesPetFilters(pet, petFilters));
  }, [dashboardPets, petFilters]);
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(buildWsUrl("/ws")),
      reconnectDelay: 5000,
      onConnect: () => {
        setAlertsConnected(true);
        client.subscribe(`/topic/alerts/${ALERT_USER_ID}`, (message) => {
          const alertText = message.body;
          console.log("Alert received:", alertText);
          setAlertMessages((currentAlerts) => [
            {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              message: alertText,
              receivedAt: new Date().toLocaleTimeString(),
            },
            ...currentAlerts,
          ].slice(0, 5));
        });
      },
      onDisconnect: () => {
        setAlertsConnected(false);
      },
      onStompError: (frame) => {
        console.error("Alert websocket STOMP error:", frame.headers.message, frame.body);
        setAlertsConnected(false);
      },
      onWebSocketClose: () => {
        setAlertsConnected(false);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

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
  const lostPets = useMemo(() => filteredDashboardPets.filter((pet) => pet.status === "lost"), [filteredDashboardPets]);
  const activePets = useMemo(() => filteredDashboardPets.filter((pet) => pet.status === "active"), [filteredDashboardPets]);
  const recentAlertItems = useMemo(() => {
    const liveAlerts = alertMessages.map((alert) => ({
      id: alert.id,
      title: alert.message,
      time: alert.receivedAt,
      severity: "critical" as const,
    }));
    const petAlerts = lostPets.map((pet, index) => ({
      id: `lost-${pet.id}`,
      title: `${pet.name} has been marked as LOST`,
      time: index === 0 ? "Just now" : "12 min ago",
      severity: "critical" as const,
    }));
    return [...liveAlerts, ...petAlerts].slice(0, 2);
  }, [alertMessages, lostPets]);
  const guideSteps = [
    {
      title: "Welcome to the dashboard",
      description:
        "This guide points out the controls you will use most often. The left navigation moves between dashboard views, routes, safe zones, pets, users, and alerts.",
    },
    {
      title: "Search bar",
      description:
        "Use this search bar to quickly look for pets, places, or geofences before you narrow the view with the detailed filters below.",
      targetRef: searchBarRef,
    },
    {
      title: "Quick filters",
      description:
        "These filters let you focus the dashboard by city, neighborhood, owner, or pet name so the map and list only show the records you need.",
      targetRef: filterBarRef,
    },
    {
      title: "Live map",
      description:
        "The map shows live pet locations and safe zones. Select a marker to focus a pet and open the detail panel on the right.",
      targetRef: mapPanelRef,
    },
    {
      title: "Pet list",
      description:
        "This floating list shows the pets currently visible on the dashboard. Click one to center your attention on that pet and review its status.",
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

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: firuColors.bg, color: firuColors.text }}>
      <FiruappSidebar current={section} onChange={setSection} />

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Paper
          ref={searchBarRef}
          elevation={0}
          sx={{
            height: { xs: "auto", md: 80 },
            px: { xs: 2, md: 3 },
            py: { xs: 1.5, md: 0 },
            borderRadius: 0,
            bgcolor: "rgba(255,255,255,0.82)",
            borderBottom: "1px solid rgba(226,232,240,0.86)",
            boxShadow: "0 12px 34px rgba(15,23,42,0.045)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: 620 },
              display: "flex",
              alignItems: "center",
              gap: 1.35,
              bgcolor: "#f8fbff",
              border: "1px solid #d8e5f1",
              px: 1.7,
              py: 1.25,
              borderRadius: 2,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92), 0 10px 22px rgba(15,23,42,0.035)",
            }}
          >
            <SearchIcon sx={{ color: "#607491", fontSize: 25 }} />
            <InputBase
              placeholder="Search pets, places, geofences..."
              value={petFilters.petName}
              onChange={(event) => setPetFilters((current) => ({ ...current, petName: event.target.value }))}
              sx={{ flex: 1, fontSize: 16, color: "#1f3350", fontWeight: 600 }}
            />
          </Box>

          <Stack direction="row" spacing={1.35} alignItems="center" sx={{ ml: "auto" }}>
            <IconButton sx={{ width: 52, height: 52, bgcolor: "#f8fbff", border: "1px solid #d8e5f1", borderRadius: 2 }}>
              <Badge color="error" variant="dot"><NotificationsNoneIcon /></Badge>
            </IconButton>
            <IconButton sx={{ width: 52, height: 52, bgcolor: "#f8fbff", border: "1px solid #d8e5f1", borderRadius: 2 }}>
              <Badge color="primary" badgeContent={3}><MessageOutlinedIcon /></Badge>
            </IconButton>
            <Avatar sx={{ width: 50, height: 50, bgcolor: "#062346", color: "white", fontWeight: 950, fontSize: 18 }}>DC</Avatar>
            <KeyboardArrowDownIcon sx={{ color: "#3d516e", display: { xs: "none", sm: "block" } }} />
          </Stack>
        </Paper>

        <Box sx={{ px: { xs: 2, md: 3.2 }, py: { xs: 2, md: 2.4 }, display: "grid", gap: 2.1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 950, color: "#071735", letterSpacing: 0, fontSize: { xs: 32, md: 40 }, lineHeight: 1.04 }}>
                Good afternoon, Daniel ☀
              </Typography>
              <Typography variant="body1" sx={{ color: "#6c7c95", mt: 0.4, fontSize: 18, fontWeight: 700 }}>
                Keep an eye on your pets in real time.
              </Typography>
            </Box>

            <Stack ref={filterBarRef} direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
              <Button
                startIcon={<PlaceIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                variant="outlined"
                sx={{ minWidth: 190, height: 46, borderRadius: 2, bgcolor: "#ffffff", borderColor: "#dbe7f3", color: "#0f1b34", textTransform: "none", fontWeight: 850 }}
              >
                Medellín
              </Button>
              <Button
                startIcon={<PersonIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                variant="outlined"
                sx={{ minWidth: 220, height: 46, borderRadius: 2, bgcolor: "#ffffff", borderColor: "#dbe7f3", color: "#0f1b34", textTransform: "none", fontWeight: 850 }}
              >
                Owner mode
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
              gap: 1.6,
            }}
          >
            <SummaryCard icon={<PetsIcon />} label="Pets" value={filteredDashboardPets.length} color="#0284c7" bg="#e0f2fe" />
            <SummaryCard icon={<WifiIcon />} label="GPS Online" value={activePets.length} color="#16a34a" bg="#d9fbe8" />
            <SummaryCard icon={<SecurityIcon />} label="Safe Zones" value={3} color="#0284c7" bg="#e0f2fe" />
            <SummaryCard icon={<WarningAmberIcon />} label="Alerts" value={recentAlertItems.length} color="#f97316" bg="#fff2dc" />
            <SummaryCard icon={<WarningAmberIcon />} label="Lost Pets" value={lostPets.length} color="#ef4444" bg="#ffe4e8" />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 420px" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Paper elevation={0} sx={{ bgcolor: "#ffffff", border: "1px solid #dbe7f3", borderRadius: 2, p: 1.4, position: "relative", overflow: "hidden", boxShadow: "0 18px 48px rgba(15,23,42,0.075)" }}>
              <FiruappMapView
                containerRef={mapPanelRef}
                pets={filteredDashboardPets}
                petDataMode={petDataMode}
                onSelectPet={setSelectedPetId}
              />
              <FiruappPetsList
                containerRef={petListRef}
                pets={filteredDashboardPets}
                selectedId={selectedPet?.id}
                onSelect={setSelectedPetId}
                onStatusChange={(petId, status) => {
                  setDatabasePets((currentPets) => currentPets.map((pet) => ((pet.apiId || pet.id) === petId ? { ...pet, status } : pet)));
                  setDashboardPets((currentPets) => currentPets.map((pet) => ((pet.apiId || pet.id) === petId ? { ...pet, status } : pet)));
                }}
              />
            </Paper>

            <Stack spacing={1.6}>
              <Paper elevation={0} sx={{ bgcolor: "#ffffff", border: "1px solid #dbe7f3", borderRadius: 2, overflow: "hidden", boxShadow: "0 16px 42px rgba(15,23,42,0.07)" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.35 }}>
                  <Typography variant="subtitle2" sx={{ color: "#071735", fontWeight: 950 }}>
                    Recent Alerts
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: alertsConnected ? "#17c964" : "#ff970f" }} />
                    <Button size="small" sx={{ color: "#1685ff", fontWeight: 850, textTransform: "none" }}>
                      View all
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
                  </Box>
                ))}
              </Paper>

              {selectedPet && (
                <Paper elevation={0} sx={{ bgcolor: "#ffffff", border: "1px solid #dbe7f3", borderRadius: 2, p: 2, boxShadow: "0 16px 42px rgba(15,23,42,0.07)" }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Stack direction="row" spacing={1.6} alignItems="center" sx={{ minWidth: 0 }}>
                      <SelectedPetAvatar pet={selectedPet} />
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Typography variant="h5" sx={{ color: "#071735", fontWeight: 950 }}>
                            {selectedPet.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={selectedPet.status === "active" ? "LIVE" : "LOST"}
                            sx={{
                              height: 28,
                              borderRadius: 999,
                              bgcolor: selectedPet.status === "active" ? "#17c964" : "#ff3444",
                              color: "#ffffff",
                              fontWeight: 950,
                            }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ color: "#61728f", mt: 0.55, fontWeight: 700 }}>
                          {[selectedPet.breed || selectedPet.race || "Mixed Breed", selectedPet.age || "6 years", selectedPet.weight || "22 kg"].join("  ·  ")}
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton
                      size="small"
                      aria-label="Close pet details"
                      onClick={() => setSelectedPetId(undefined)}
                      sx={{ bgcolor: "#f8fbff", border: "1px solid #dbe7f3", color: "#6c7c95", "&:hover": { bgcolor: "#eef6ff" } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Box sx={{ mt: 2, p: 1.65, borderRadius: 2, bgcolor: "#fff7f7", border: "1px solid #ffb9bd", display: "flex", alignItems: "center", gap: 1.4 }}>
                    <WarningAmberIcon sx={{ color: "#ff3444", fontSize: 34 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: "#cf1421", fontWeight: 950 }}>
                        Last seen
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#cf1421", fontWeight: 900 }}>
                        Jun 26, 2024 at 4:32 PM
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#61728f", fontWeight: 700 }}>
                        Near Calle 51, Laureles, Medellín
                      </Typography>
                    </Box>
                    <KeyboardArrowRightIcon sx={{ color: "#ff3444" }} />
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2, mt: 1.4 }}>
                    <MetricCard icon={<BatteryChargingFullIcon fontSize="small" />} label="Battery" value={`${selectedPet.battery ?? 28}%`} color={selectedPet.status === "lost" ? "#ef4444" : firuColors.green} />
                    <MetricCard icon={<WifiIcon fontSize="small" />} label="Signal" value={selectedPet.signal || "Weak"} color="#1685ff" />
                    <MetricCard icon={<SpeedIcon fontSize="small" />} label="Speed" value={selectedPet.speed || "0.6 km/h"} color="#8b5cf6" />
                    <MetricCard icon={<MyLocationIcon fontSize="small" />} label="GPS accuracy" value="6 meters" color="#1685ff" />
                    <MetricCard icon={<AccessTimeIcon fontSize="small" />} label="Last update" value={selectedPet.lastSeen || "Just now"} color="#64748b" />
                    <MetricCard icon={<PlaceIcon fontSize="small" />} label="Coordinates" value="6.217903, -75.572110" color="#1685ff" />
                  </Box>

                  <Button
                    fullWidth
                    startIcon={<NavigationIcon />}
                    variant="contained"
                    sx={{ mt: 1.4, height: 50, bgcolor: "#ff3444", borderRadius: 2, textTransform: "none", fontWeight: 950, fontSize: 16, boxShadow: "none", "&:hover": { bgcolor: "#e82735", boxShadow: "none" } }}
                  >
                    Find {selectedPet.name}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1.2, height: 50, borderRadius: 2, borderColor: "#1685ff", color: "#071735", textTransform: "none", fontWeight: 950, fontSize: 16 }}
                  >
                    Open route
                  </Button>
                </Paper>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>

      <DashboardGuideOverlay
        open={guideOpen}
        title={currentGuideStep.title}
        description={currentGuideStep.description}
        stepIndex={guideStepIndex}
        totalSteps={guideSteps.length}
        spotlightRect={guideSpotlightRect}
        onBack={() => setGuideStepIndex((current) => Math.max(current - 1, 0))}
        onNext={goToNextGuideStep}
        onClose={closeGuide}
      />
    </Box>
  );
};

export default FiruappDashboard;
