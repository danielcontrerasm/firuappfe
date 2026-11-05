import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PauseIcon from "@mui/icons-material/Pause";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StarIcon from "@mui/icons-material/Star";
import StopIcon from "@mui/icons-material/Stop";
import VerifiedIcon from "@mui/icons-material/Verified";
import WalletOutlinedIcon from "@mui/icons-material/WalletOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { buildApiUrl } from "../../config/runtime";
import "./walkerDashboard.css";

type RequestStatus = "PENDING" | "NEGOTIATING" | "ACCEPTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";

type WalkerRequest = {
  id: string | number;
  ownerName: string;
  petName: string;
  zone: string;
  time: string;
  kind: string;
  status: RequestStatus;
  ownerBudget?: number;
  walkerQuotedPrice?: number;
  durationMinutes?: number;
  requestedStart?: string;
  serviceAddress?: string;
  notes?: string;
};

type WalkerWalk = {
  id: string | number;
  petName?: string;
  ownerName?: string;
  status?: string;
  agreedPrice?: number;
  startedAt?: string;
  lastPosition?: { latitude: number; longitude: number };
};

type WalkerPet = {
  id: string | number;
  name: string;
  zone?: string;
  status?: string;
};

type RoutePoint = {
  latitude: number;
  longitude: number;
  label: string;
  kind: "start" | "stop" | "walker" | "finish";
};

type AvailabilitySlot = {
  time: string;
  status: "Disponible" | "Ocupado" | "Reservado";
};

type CurrentUser = {
  name?: string;
  role?: string;
};

const demoRequests: WalkerRequest[] = [
  {
    id: "demo-bruno",
    ownerName: "Daniel Contreras",
    petName: "Bruno",
    zone: "El Poblado",
    time: "Hoy\n5:30 p. m.",
    kind: "Paseo\n60 min",
    status: "PENDING",
    ownerBudget: 34000,
    durationMinutes: 60,
    requestedStart: new Date().toISOString(),
    serviceAddress: "El Poblado",
  },
  {
    id: "demo-mora",
    ownerName: "Ana María Mora",
    petName: "Mora",
    zone: "La Frontera",
    time: "Hoy\n6:00 p. m.",
    kind: "Premium GPS\n45 min",
    status: "PENDING",
    ownerBudget: 45000,
    durationMinutes: 45,
    requestedStart: new Date().toISOString(),
    serviceAddress: "La Frontera",
  },
  {
    id: "demo-rocky",
    ownerName: "Juan López",
    petName: "Rocky",
    zone: "Castropol",
    time: "Mañana\n8:00 a. m.",
    kind: "Paseo\n30 min",
    status: "CONFIRMED",
    ownerBudget: 22000,
    walkerQuotedPrice: 22000,
    durationMinutes: 30,
    requestedStart: new Date(Date.now() + 86400000).toISOString(),
    serviceAddress: "Castropol",
  },
];

const demoWalks: WalkerWalk[] = [
  {
    id: "demo-active-walk",
    petName: "Bruno",
    ownerName: "Daniel Contreras",
    status: "IN_PROGRESS",
    agreedPrice: 34000,
  },
];

const demoPets: WalkerPet[] = [
  { id: "demo-bruno-pet", name: "Bruno", zone: "El Poblado", status: "active" },
  { id: "demo-rocky-pet", name: "Rocky", zone: "Castropol", status: "active" },
  { id: "demo-mora-pet", name: "Mora", zone: "La Frontera", status: "active" },
];

const demoAvailability: AvailabilitySlot[] = [
  { time: "10:00 a. m.", status: "Disponible" },
  { time: "12:00 p. m.", status: "Ocupado" },
  { time: "2:00 p. m.", status: "Disponible" },
  { time: "5:30 p. m.", status: "Reservado" },
  { time: "7:00 p. m.", status: "Disponible" },
];

const demoRoute: RoutePoint[] = [
  { latitude: 6.2096, longitude: -75.5684, label: "Inicio", kind: "start" },
  { latitude: 6.2129, longitude: -75.5638, label: "Bruno", kind: "walker" },
  { latitude: 6.2161, longitude: -75.5591, label: "Parada 1", kind: "stop" },
  { latitude: 6.2189, longitude: -75.5542, label: "Parada 2", kind: "stop" },
  { latitude: 6.2226, longitude: -75.5502, label: "Fin", kind: "finish" },
];

const demoPayments = [
  { date: "24/06", client: "Daniel Contreras", pet: "Bruno", service: "Paseo 60 min", value: 34000, status: "Pagado" },
  { date: "24/06", client: "Ana María", pet: "Mora", service: "Premium GPS", value: 45000, status: "Pendiente" },
  { date: "23/06", client: "Juan López", pet: "Rocky", service: "Paseo 30 min", value: 22000, status: "Pagado" },
];

const petImage = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("bruno")) return "/labrador.png";
  if (normalized.includes("rocky")) return "/beagle.png";
  if (normalized.includes("mora")) return "/german.png";
  return "/beagle.png";
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const extractCollection = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const collectionKeys = ["content", "items", "results", "rows", "payload", "pets", "records", "data"];
  for (const key of collectionKeys) {
    const value = data[key];
    if (Array.isArray(value) && value.length) return value;
    if (value && typeof value === "object") {
      const nested = extractCollection(value);
      if (nested.length) return nested;
    }
  }
  return [];
};

const authHeaders = () => {
  if (typeof window === "undefined") return undefined;
  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const api = async <T = any>(method: string, path: string, data?: unknown): Promise<T> => {
  const response = await axios({ method, url: buildApiUrl(path), data, headers: authHeaders() });
  return response.data as T;
};

const money = (value?: number) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : `$${Number(value).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const formatTime = (value?: string) => {
  if (!value) return "Sin hora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const day = date.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" });
  const time = date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === today.toDateString()) return `Hoy\n${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Mañana\n${time}`;
  return `${day}\n${time}`;
};

const normalizeStatus = (status: unknown): RequestStatus => {
  const value = String(status || "PENDING").toUpperCase();
  if (["ACCEPTED", "CONFIRMED"].includes(value)) return "CONFIRMED";
  if (["REJECTED", "CANCELLED"].includes(value)) return value as RequestStatus;
  if (value === "NEGOTIATING") return value;
  return "PENDING";
};

const mapRequest = (item: any, index: number): WalkerRequest => {
  const owner = item.ownerName || item.owner?.name || item.userName || item.user?.name || [item.owner?.firstName, item.owner?.lastName].filter(Boolean).join(" ");
  const pet = item.petName || item.pet?.name || item.pet?.petName || "Sin mascota";
  const duration = item.durationMinutes ?? item.duration ?? 60;
  const quote = item.walkerQuotedPrice ?? item.agreedPrice;
  return {
    id: item.id ?? `remote-${index}`,
    ownerName: owner || "Cliente",
    petName: pet,
    zone: item.serviceAddress || item.neighborhood || item.zone || "Zona por confirmar",
    time: formatTime(item.requestedStart || item.scheduledAt || item.startAt),
    kind: `${item.serviceType || "Paseo"}\n${duration} min`,
    status: normalizeStatus(item.status),
    ownerBudget: item.ownerBudget,
    walkerQuotedPrice: quote,
    durationMinutes: duration,
    requestedStart: item.requestedStart || item.scheduledAt,
    serviceAddress: item.serviceAddress,
    notes: item.notes,
  };
};

const mapWalkerPet = (item: any, index: number): WalkerPet => ({
  id: item.id ?? `remote-pet-${index}`,
  name: item.name || item.petName || item.pet?.name || `Mascota ${index + 1}`,
  zone: item.neighborhood || item.zone || item.address?.neighborhood || item.city || "Zona por confirmar",
  status: String(item.status || item.pet?.status || "active").toLowerCase(),
});

const isPersistableId = (id: string | number) => /^\d+$/.test(String(id));

const scrollToSection = (id: string) => {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const MapBounds: React.FC<{ points: RoutePoint[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(points.map((point) => [point.latitude, point.longitude] as [number, number]), { padding: [24, 24], maxZoom: 15 });
  }, [map, points]);

  return null;
};

const RouteMap: React.FC<{ points: RoutePoint[]; active: boolean }> = ({ points, active }) => {
  const firstPoint = points[0] || demoRoute[0];
  const coordinates = points.map((point) => [point.latitude, point.longitude] as [number, number]);
  const markerColor = (kind: RoutePoint["kind"]) => {
    if (kind === "start") return "#168b3c";
    if (kind === "finish") return "#ef4038";
    if (kind === "walker") return "#1673ed";
    return "#f4a600";
  };

  return (
    <Box className="walker-route-map">
      <MapContainer center={[firstPoint.latitude, firstPoint.longitude]} zoom={14} zoomControl={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapBounds points={points} />
        {coordinates.length > 1 && <Polyline positions={coordinates} pathOptions={{ color: "#1269ee", weight: 5, opacity: 0.95 }} />}
        {points.map((point, index) => (
          <CircleMarker
            key={`${point.label}-${point.latitude}-${point.longitude}-${index}`}
            center={[point.latitude, point.longitude]}
            radius={point.kind === "walker" ? 11 : 8}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: markerColor(point.kind), fillOpacity: 1 }}
          >
            <Popup>{point.label}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <Box className="walker-map-legend">
        <Box><span className="walker-legend-dot walker-legend-start" /> Inicio</Box>
        <Box><span className="walker-legend-dot walker-legend-stop" /> Parada</Box>
        <Box><span className="walker-legend-dot walker-legend-finish" /> Fin</Box>
      </Box>
      {!active && <Box className="walker-map-paused">Ruta lista para iniciar</Box>}
    </Box>
  );
};

const WalkerBrand = () => (
  <Box className="walker-brand">
    <Box className="walker-brand-mark"><img src="/logo-head.png" alt="" /></Box>
    <Box component="span"><strong>Firu</strong><em>Paseos</em></Box>
  </Box>
);

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  count?: number;
  onClick: () => void;
}> = ({ icon, label, active, count, onClick }) => (
  <button type="button" className={`walker-nav-item${active ? " is-active" : ""}`} onClick={onClick}>
    <span className="walker-nav-icon">{icon}</span>
    <span>{label}</span>
    {count != null && <span className="walker-nav-count">{count}</span>}
  </button>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: string;
  onClick?: () => void;
}> = ({ icon, label, value, tone, onClick }) => (
  <Paper className={`walker-stat-card ${tone}`} elevation={0} onClick={onClick} role={onClick ? "button" : undefined}>
    <Box className="walker-stat-icon">{icon}</Box>
    <Typography className="walker-stat-label">{label}</Typography>
    <Typography className="walker-stat-value">{value}</Typography>
  </Paper>
);

const PetThumb: React.FC<{ name: string; size?: "small" | "medium" }> = ({ name, size = "small" }) => (
  <Avatar className={`walker-pet-thumb is-${size}`} src={petImage(name)} alt={name} />
);

const OwnerAvatar: React.FC<{ name: string }> = ({ name }) => (
  <Avatar className="walker-owner-avatar">{initials(name)}</Avatar>
);

const statusLabel = (status: RequestStatus) => {
  if (status === "CONFIRMED") return "Confirmado";
  if (status === "REJECTED") return "Rechazado";
  if (status === "CANCELLED") return "Cancelado";
  return "Pendiente";
};

const statusClass = (status: RequestStatus) => {
  if (status === "CONFIRMED") return "is-confirmed";
  if (status === "REJECTED" || status === "CANCELLED") return "is-rejected";
  return "is-pending";
};

const availabilityClass = (status: AvailabilitySlot["status"]) => {
  if (status === "Disponible") return "is-available";
  if (status === "Ocupado") return "is-busy";
  return "is-booked";
};

const WalkerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<WalkerRequest[]>(demoRequests);
  const [walks, setWalks] = useState<WalkerWalk[]>(demoWalks);
  const [pets, setPets] = useState<WalkerPet[]>(demoPets);
  const [profileName, setProfileName] = useState("Andrés Mejía");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(() => {
    if (typeof window === "undefined") return demoAvailability;
    try {
      const stored = JSON.parse(window.localStorage.getItem("firuapp:walker-availability") || "null");
      return Array.isArray(stored) && stored.length ? stored : demoAvailability;
    } catch {
      return demoAvailability;
    }
  });
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>(demoRoute);
  const [routeActive, setRouteActive] = useState(true);
  const [routePaused, setRoutePaused] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WalkerRequest | null>(null);
  const [quote, setQuote] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("inicio");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeWalk = useMemo(
    () => walks.find((walk) => ["IN_PROGRESS", "PAUSED"].includes(String(walk.status).toUpperCase())),
    [walks],
  );
  const usingDemoView = typeof window === "undefined" || !window.localStorage.getItem("token");
  const pendingRequests = useMemo(() => requests.filter((request) => ["PENDING", "NEGOTIATING"].includes(request.status)), [requests]);
  const todayRequests = useMemo(() => {
    if (!requests.length) return 0;
    const today = new Date().toDateString();
    return requests.filter((request) => {
      if (!request.requestedStart) return request.status !== "REJECTED";
      const date = new Date(request.requestedStart);
      return !Number.isNaN(date.getTime()) && date.toDateString() === today;
    }).length;
  }, [requests]);
  const routePets = useMemo(() => {
    const seen = new Set<string>();
    const rows = requests
      .map((request, index) => {
        const name = request.petName || `Mascota ${index + 1}`;
        if (name === "Sin mascota") return null;
        if (seen.has(name)) return null;
        seen.add(name);
        return { name, zone: request.zone, status: index === 2 ? "En camino" : index === 1 ? "Pendiente" : "Paseó" };
      })
      .filter(Boolean) as { name: string; zone: string; status: string }[];
    const petRows = pets
      .filter((pet) => !seen.has(pet.name))
      .map((pet) => ({ name: pet.name, zone: pet.zone || "Zona por confirmar", status: "Pendiente" }));
    const combinedRows = [...rows, ...petRows];
    return combinedRows.length ? combinedRows.slice(0, 3) : demoPets.map((pet) => ({ name: pet.name, zone: pet.zone || "Zona por confirmar", status: "Pendiente" }));
  }, [pets, requests]);

  const loadRemoteData = useCallback(async () => {
    if (typeof window === "undefined" || !window.localStorage.getItem("token")) return;
    setLoading(true);
    const [meResult, requestResult, walkResult, profileResult, petResult] = await Promise.allSettled([
      api<CurrentUser>("GET", "/api/me"),
      api<any>("GET", "/api/walk-requests?page=0&size=100"),
      api<any>("GET", "/api/dog-walks?page=0&size=100"),
      api<any>("GET", "/api/walkers/me"),
      api<any>("GET", "/api/pets"),
    ]);

    if (meResult.status === "fulfilled") {
      const current = meResult.value;
      if (current?.name) setProfileName(current.name);
    }
    if (profileResult.status === "fulfilled" && profileResult.value?.name) setProfileName(profileResult.value.name);

    if (requestResult.status === "fulfilled") {
      setRequests(extractCollection(requestResult.value).map(mapRequest));
    }
    if (petResult.status === "fulfilled") {
      setPets(extractCollection(petResult.value).map(mapWalkerPet));
    }
    if (walkResult.status === "fulfilled") {
      const remoteWalks = extractCollection(walkResult.value).map((walk: any, index) => ({
        id: walk.id ?? `remote-walk-${index}`,
        petName: walk.petName || walk.pet?.name,
        ownerName: walk.ownerName || walk.owner?.name,
        status: walk.status,
        agreedPrice: walk.agreedPrice,
        startedAt: walk.startedAt,
        lastPosition: walk.lastPosition,
      }));
      setWalks(remoteWalks);
      const remoteActive = remoteWalks.find((walk) => ["IN_PROGRESS", "PAUSED"].includes(String(walk.status).toUpperCase()));
      setRouteActive(Boolean(remoteActive));
      setRoutePaused(String(remoteActive?.status).toUpperCase() === "PAUSED");

      if (remoteActive && isPersistableId(remoteActive.id)) {
        try {
          const positionResponse = await api<any>("GET", `/api/dog-walks/${remoteActive.id}/positions?page=0&size=2000`);
          const positions = extractCollection(positionResponse);
          if (positions.length) {
            setRoutePoints([
              demoRoute[0],
              ...positions.map((position: any, index: number) => ({
                latitude: Number(position.latitude),
                longitude: Number(position.longitude),
                label: index === positions.length - 1 ? "Paseador" : `Parada ${index + 1}`,
                kind: index === positions.length - 1 ? "walker" : "stop",
              })),
            ]);
          }
        } catch {
          // The route preview keeps the local fallback when positions are unavailable.
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadRemoteData();
  }, [loadRemoteData]);

  const updateAvailability = (index: number) => {
    const nextStatus: Record<AvailabilitySlot["status"], AvailabilitySlot["status"]> = {
      Disponible: "Reservado",
      Reservado: "Ocupado",
      Ocupado: "Disponible",
    };
    setAvailability((current) => {
      const next = current.map((slot, slotIndex) => slotIndex === index ? { ...slot, status: nextStatus[slot.status] } : slot);
      window.localStorage.setItem("firuapp:walker-availability", JSON.stringify(next));
      return next;
    });
    setNotice("Disponibilidad actualizada.");
  };

  const addAvailability = () => {
    setAvailability((current) => {
      const next = [...current, { time: "8:00 p. m.", status: "Disponible" as const }];
      window.localStorage.setItem("firuapp:walker-availability", JSON.stringify(next));
      return next;
    });
    setNotice("Horario agregado.");
  };

  const blockAfternoon = () => {
    setAvailability((current) => {
      const next = current.map((slot, index) => index >= 2 ? { ...slot, status: "Ocupado" as const } : slot);
      window.localStorage.setItem("firuapp:walker-availability", JSON.stringify(next));
      return next;
    });
    setNotice("La tarde quedó bloqueada.");
  };

  const handleRequestDetails = (request: WalkerRequest) => {
    setSelectedRequest(request);
    setQuote(request.walkerQuotedPrice ? String(request.walkerQuotedPrice) : String(request.ownerBudget || ""));
  };

  const updateRequest = async (request: WalkerRequest, status: RequestStatus) => {
    setLoading(true);
    try {
      if (isPersistableId(request.id)) {
        await api("PUT", `/api/walk-requests/${request.id}/decision`, { status });
      }
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status } : item));
      setSelectedRequest((current) => current?.id === request.id ? { ...current, status } : current);
      setNotice(status === "CONFIRMED" ? "Solicitud aceptada." : "Solicitud rechazada.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "No fue posible actualizar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const saveQuote = async () => {
    if (!selectedRequest || !quote.trim()) return;
    setLoading(true);
    try {
      if (isPersistableId(selectedRequest.id)) {
        await api("PUT", `/api/walk-requests/${selectedRequest.id}/quote`, {
          walkerQuotedPrice: Number(quote),
          status: "NEGOTIATING",
        });
      }
      setRequests((current) => current.map((item) => item.id === selectedRequest.id ? { ...item, walkerQuotedPrice: Number(quote), status: "PENDING" } : item));
      setNotice("Tu propuesta fue enviada.");
      setSelectedRequest(null);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "No fue posible enviar la propuesta.");
    } finally {
      setLoading(false);
    }
  };

  const startRoute = async () => {
    if (activeWalk && isPersistableId(activeWalk.id)) {
      setNotice("La ruta ya está activa.");
      scrollToSection("route");
      return;
    }
    const confirmedRequest = requests.find((request) => request.status === "CONFIRMED" && isPersistableId(request.id));
    setLoading(true);
    try {
      if (confirmedRequest) {
        const walk = await api<WalkerWalk>("POST", `/api/walk-requests/${confirmedRequest.id}/start`);
        setWalks((current) => [...current, { ...walk, status: "IN_PROGRESS" }]);
      }
      setRouteActive(true);
      setRoutePaused(false);
      setNotice("Ruta iniciada. Comparte tu ubicación GPS desde el panel de paseos.");
      scrollToSection("route");
    } catch (routeError: any) {
      setError(routeError?.response?.data?.message || "No fue posible iniciar la ruta.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRoutePause = async () => {
    if (activeWalk && isPersistableId(activeWalk.id)) {
      try {
        await api("POST", `/api/dog-walks/${activeWalk.id}/${routePaused ? "resume" : "pause"}`);
      } catch {
        // Keep the control useful even when the backend does not expose pause yet.
      }
    }
    setRoutePaused((current) => !current);
    setNotice(routePaused ? "Ruta reanudada." : "Ruta pausada.");
  };

  const closeRoute = async () => {
    if (activeWalk && isPersistableId(activeWalk.id)) {
      try {
        await api("POST", `/api/dog-walks/${activeWalk.id}/complete`);
      } catch {
        // The dashboard still reflects the local state if completion is unavailable.
      }
    }
    setRouteActive(false);
    setRoutePaused(false);
    setWalks((current) => current.map((walk) => walk.id === activeWalk?.id ? { ...walk, status: "COMPLETED" } : walk));
    setNotice("Ruta cerrada. ¡Buen trabajo!");
  };

  const navigateFromSidebar = (key: string, destination?: string) => {
    setActiveNav(key);
    setMenuOpen(false);
    if (destination) {
      navigate(destination);
      return;
    }
    scrollToSection(key);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const showHelp = () => setNotice("Te escribiremos por WhatsApp para ayudarte.");

  return (
    <Box className="walker-dashboard">
      <Box className={`walker-app${menuOpen ? " is-menu-open" : ""}`}>
        <aside className="walker-sidebar" aria-label="Panel del paseador">
          <Box className="walker-sidebar-top">
            <WalkerBrand />
            <IconButton className="walker-menu-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><CloseIcon /></IconButton>
          </Box>

          <Paper className="walker-profile-card" elevation={0}>
            <Avatar className="walker-profile-avatar">{initials(profileName)}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography className="walker-profile-name">{profileName}</Typography>
              <Typography className="walker-profile-status">Paseador verificado <VerifiedIcon /></Typography>
            </Box>
          </Paper>

          <nav className="walker-nav" aria-label="Navegación del paseador">
            <NavItem icon={<HomeOutlinedIcon />} label="Inicio" active={activeNav === "inicio"} onClick={() => navigateFromSidebar("inicio", "/walker-dashboard")} />
            <NavItem icon={<AssignmentTurnedInOutlinedIcon />} label="Solicitudes" count={usingDemoView ? 3 : pendingRequests.length} active={activeNav === "requests"} onClick={() => navigateFromSidebar("requests")} />
            <NavItem icon={<ChatBubbleOutlineIcon />} label="Mensajes" count={5} active={activeNav === "requests"} onClick={() => navigateFromSidebar("requests")} />
            <NavItem icon={<RouteOutlinedIcon />} label="Rutas" active={activeNav === "route"} onClick={() => navigateFromSidebar("route")} />
            <NavItem icon={<CalendarMonthOutlinedIcon />} label="Mi agenda" active={activeNav === "availability"} onClick={() => navigateFromSidebar("availability")} />
            <NavItem icon={<WalletOutlinedIcon />} label="Ganancias" active={activeNav === "payments"} onClick={() => navigateFromSidebar("payments")} />
            <NavItem icon={<PersonOutlineIcon />} label="Perfil" onClick={() => navigateFromSidebar("profile", "/profile")} />
            <NavItem icon={<PetsOutlinedIcon />} label="Mascotas" onClick={() => navigateFromSidebar("pets", "/pets")} />
            <NavItem icon={<ContentPasteSearchIcon />} label="Reportes" onClick={() => navigateFromSidebar("reports", "/routes/recent")} />
            <NavItem icon={<SettingsOutlinedIcon />} label="Configuración" onClick={() => navigateFromSidebar("settings", "/profile")} />
          </nav>

          <Box className="walker-sidebar-spacer" />

          <Paper className="walker-plan-card" elevation={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography className="walker-plan-title">Plan Paseador Pro</Typography>
              <StarIcon />
            </Stack>
            <Typography className="walker-plan-caption">Activo hasta 24/06/2025</Typography>
            <Typography className="walker-plan-label">Ganancias del mes</Typography>
            <Typography className="walker-plan-value">$1.285.000</Typography>
            <Box className="walker-plan-progress"><span /></Box>
          </Paper>

          <Paper className="walker-help-card" elevation={0}>
            <Typography className="walker-help-title">¿Necesitas ayuda?</Typography>
            <Typography className="walker-help-copy">Escríbenos por WhatsApp</Typography>
            <Box className="walker-help-dog">🐶</Box>
            <Button startIcon={<WhatsAppIcon />} onClick={showHelp} className="walker-whatsapp-button">Ir a WhatsApp</Button>
          </Paper>

          <Button startIcon={<LogoutIcon />} className="walker-logout" onClick={handleLogout}>Cerrar sesión</Button>
        </aside>

        <main className="walker-main">
          <Box className="walker-mobile-header">
            <IconButton onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><MenuIcon /></IconButton>
            <WalkerBrand />
            <IconButton aria-label="Notificaciones"><Badge color="error" variant="dot"><NotificationsNoneIcon /></Badge></IconButton>
          </Box>

          <Box className="walker-header">
            <Box>
              <Typography component="h1">Panel del paseador</Typography>
              <Typography className="walker-subtitle">Solicitudes, mensajes, ruta diaria y pagos recibidos.</Typography>
            </Box>
            <Stack className="walker-header-actions" direction="row" spacing={1.25} alignItems="center">
              <Button className="walker-availability-button" startIcon={<span className="walker-online-dot" />}>Disponible hoy</Button>
              <Button className="walker-primary-button" startIcon={<LocationOnOutlinedIcon />} onClick={startRoute} disabled={loading}>
                {loading ? <CircularProgress size={18} color="inherit" /> : "Iniciar paseo GPS"}
              </Button>
            </Stack>
          </Box>

          {error && <Alert severity="error" className="walker-inline-alert" onClose={() => setError("")}>{error}</Alert>}

          <Box className="walker-stat-grid">
            <StatCard icon={<AssignmentTurnedInOutlinedIcon />} label="Solicitudes nuevas" value={usingDemoView ? 3 : pendingRequests.length} tone="is-orange" onClick={() => navigateFromSidebar("requests")} />
            <StatCard icon={<ChatBubbleOutlineIcon />} label="Mensajes sin responder" value={5} tone="is-purple" onClick={() => navigateFromSidebar("requests")} />
            <StatCard icon={<CalendarMonthOutlinedIcon />} label="Paseos programados hoy" value={usingDemoView ? 4 : todayRequests} tone="is-blue" onClick={() => navigateFromSidebar("availability")} />
            <StatCard icon={<LocationOnOutlinedIcon />} label="Ruta activa" value={routeActive ? "Sí" : "No"} tone="is-green" onClick={() => navigateFromSidebar("route")} />
            <StatCard icon={<WalletOutlinedIcon />} label="Pagos semana" value="$612.000" tone="is-emerald" onClick={() => navigateFromSidebar("payments")} />
            <StatCard icon={<StarIcon />} label="Calificación" value="4.9" tone="is-yellow" />
          </Box>

          <Paper className="walker-section-card walker-requests-card" elevation={0} id="requests">
            <Box className="walker-section-heading">
              <Box>
                <Typography component="h2">Mensajes y solicitudes</Typography>
                <Typography className="walker-section-caption">Revisa las solicitudes y responde a tus clientes.</Typography>
              </Box>
              <Button className="walker-link-button" endIcon={<ChevronRightIcon />} onClick={() => navigate("/walks")}>Ver todas</Button>
            </Box>
            <Box className="walker-table-wrap">
              <table className="walker-table">
                <thead>
                  <tr>
                    <th>Cliente / Mascota</th>
                    <th>Zona</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 4).map((request) => (
                    <tr key={request.id}>
                      <td>
                        <Box className="walker-client-cell">
                          <OwnerAvatar name={request.ownerName} />
                          <PetThumb name={request.petName} />
                          <Box>
                            <strong>{request.ownerName}</strong>
                            <span>{request.petName}</span>
                          </Box>
                        </Box>
                      </td>
                      <td>{request.zone}</td>
                      <td className="walker-multiline-cell">{request.time.split("\n").map((line) => <span key={line}>{line}</span>)}</td>
                      <td className="walker-multiline-cell">{request.kind.split("\n").map((line) => <span key={line}>{line}</span>)}</td>
                      <td><span className={`walker-status-pill ${statusClass(request.status)}`}>{statusLabel(request.status)}</span></td>
                      <td>
                        <Stack className="walker-row-actions" direction="row" spacing={0.65}>
                          <Button size="small" className="walker-outline-button is-blue" onClick={() => handleRequestDetails(request)}>Ver detalle</Button>
                          {request.status !== "CONFIRMED" && <Button size="small" className="walker-outline-button is-blue" onClick={() => handleRequestDetails(request)}>Proponer precio</Button>}
                          {request.status !== "CONFIRMED" && <Button size="small" className="walker-outline-button is-green" onClick={() => void updateRequest(request, "CONFIRMED")}>Aceptar</Button>}
                          {request.status !== "CONFIRMED" && <Button size="small" className="walker-outline-button is-red" onClick={() => void updateRequest(request, "REJECTED")}>Rechazar</Button>}
                          {request.status === "CONFIRMED" && <Button size="small" className="walker-outline-button is-blue" startIcon={<MessageOutlinedIcon />} onClick={() => navigate("/walks")}>Enviar mensaje</Button>}
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>

          <Paper className="walker-section-card walker-route-card" elevation={0} id="route">
            <Box className="walker-section-heading walker-route-heading">
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography component="h2">Ruta diaria</Typography>
                  <span className={`walker-progress-pill${routeActive ? " is-progress" : ""}`}>{routeActive ? "En progreso" : "Sin iniciar"}</span>
                </Stack>
                <Typography className="walker-section-caption">Sigue el recorrido y mantén informados a los dueños.</Typography>
              </Box>
              <Stack className="walker-route-actions" direction="row" spacing={0.85} flexWrap="wrap" useFlexGap>
                <Button className="walker-route-start" startIcon={<PlayArrowIcon />} onClick={startRoute} disabled={routeActive}>Iniciar ruta</Button>
                <Button className="walker-route-pause" startIcon={<PauseIcon />} onClick={() => void toggleRoutePause()} disabled={!routeActive}>{routePaused ? "Reanudar ruta" : "Pausar ruta"}</Button>
                <Button className="walker-outline-button is-blue" startIcon={<AddIcon />} onClick={() => setNotice("Selecciona una mascota desde el panel de paseos.")}>Agregar mascota</Button>
                <Button className="walker-outline-button is-red" startIcon={<StopIcon />} onClick={() => void closeRoute()} disabled={!routeActive}>Cerrar ruta</Button>
              </Stack>
            </Box>
            <Box className="walker-route-grid">
              <RouteMap points={routePoints} active={routeActive && !routePaused} />
              <Box className="walker-route-pets">
                {routePets.map((pet, index) => (
                  <Box className="walker-route-pet" key={`${pet.name}-${index}`}>
                    <PetThumb name={pet.name} size="medium" />
                    <Box className="walker-route-pet-copy">
                      <strong>{index + 1}. {pet.name}</strong>
                      <span>{pet.zone}</span>
                    </Box>
                    <span className={`walker-mini-status ${pet.status === "Paseó" ? "is-green" : pet.status === "Pendiente" ? "is-yellow" : "is-blue"}`}>{pet.status}</span>
                    <Stack className="walker-pet-actions" direction="row" spacing={0.45}>
                      <Button size="small" className="walker-mini-button is-green">Paseó</Button>
                      <Button size="small" className="walker-mini-button is-red">No paseó</Button>
                      <Button size="small" className="walker-mini-button is-blue" onClick={() => navigate("/routes/recent")}>Ver reporte</Button>
                    </Stack>
                  </Box>
                ))}
                <Box className="walker-route-summary"><span>Distancia estimada: 8.6 km</span><span>Tiempo estimado: 1 h 45 min</span></Box>
              </Box>
            </Box>
          </Paper>

          <Box className="walker-two-column-grid">
            <Paper className="walker-section-card walker-availability-card" elevation={0} id="availability">
              <Box className="walker-section-heading">
                <Box><Typography component="h2">Disponibilidad del día</Typography><Typography className="walker-section-caption">Administra tus horarios para recibir solicitudes.</Typography></Box>
                <Button className="walker-link-button" startIcon={<AddIcon />} onClick={addAvailability}>Agregar horario</Button>
              </Box>
              <Box className="walker-availability-list">
                {availability.map((slot, index) => (
                  <Box className="walker-availability-row" key={`${slot.time}-${index}`}>
                    <span className={`walker-clock-icon ${availabilityClass(slot.status)}`}><ScheduleOutlinedIcon /></span>
                    <Typography>{slot.time}</Typography>
                    <button type="button" className={`walker-availability-status ${availabilityClass(slot.status)}`} onClick={() => updateAvailability(index)}>{slot.status}</button>
                    <Tooltip title="Cambiar estado"><IconButton size="small" onClick={() => updateAvailability(index)}><EditOutlinedIcon /></IconButton></Tooltip>
                  </Box>
                ))}
              </Box>
              <Button className="walker-block-button" startIcon={<LockOutlinedIcon />} onClick={blockAfternoon}>Bloquear tarde</Button>
            </Paper>

            <Paper className="walker-section-card walker-payments-card" elevation={0} id="payments">
              <Box className="walker-section-heading">
                <Box><Typography component="h2">Pagos recibidos</Typography><Typography className="walker-section-caption">Consulta el resumen de tus servicios.</Typography></Box>
                <Button className="walker-link-button" endIcon={<ChevronRightIcon />} onClick={() => setNotice("Mostrando todos los pagos disponibles.")}>Ver todos</Button>
              </Box>
              <Box className="walker-payment-summary">
                <Box><span>Pagos hoy</span><strong>$79.000</strong></Box>
                <Box><span>Pagos semana</span><strong>$612.000</strong></Box>
                <Box><span>Pendiente por pagar</span><strong className="is-red-text">$88.000</strong></Box>
              </Box>
              <Box className="walker-table-wrap walker-payments-table-wrap">
                <table className="walker-table walker-payments-table">
                  <thead><tr><th>Fecha</th><th>Cliente</th><th>Mascota</th><th>Servicio</th><th>Valor</th><th>Estado</th></tr></thead>
                  <tbody>{demoPayments.map((payment) => <tr key={`${payment.date}-${payment.client}`}><td>{payment.date}</td><td>{payment.client}</td><td>{payment.pet}</td><td>{payment.service}</td><td><strong>{money(payment.value)}</strong></td><td><span className={`walker-status-pill ${payment.status === "Pagado" ? "is-confirmed" : "is-pending"}`}>{payment.status}</span></td></tr>)}</tbody>
                </table>
              </Box>
            </Paper>
          </Box>

          <Paper className="walker-section-card walker-report-card" elevation={0} id="reports">
            <Box className="walker-section-heading">
              <Box><Typography component="h2">Reportar problema</Typography><Typography className="walker-section-caption">Cuéntanos qué pasó para ayudarte y mantener tu historial actualizado.</Typography></Box>
            </Box>
            <Box className="walker-report-grid">
              {[
                { label: "Mascota no estaba", icon: <HomeOutlinedIcon />, tone: "is-blue" },
                { label: "Cambio de dirección", icon: <RouteOutlinedIcon />, tone: "is-blue" },
                { label: "Mascota agresiva", icon: <ReportProblemOutlinedIcon />, tone: "is-red" },
                { label: "GPS sin señal", icon: <NotificationsNoneIcon />, tone: "is-purple" },
                { label: "Paseo cancelado", icon: <CloseIcon />, tone: "is-orange" },
                { label: "Otro", icon: <HelpOutlineIcon />, tone: "is-gray" },
              ].map((report) => <button type="button" className={`walker-report-option ${report.tone}`} key={report.label} onClick={() => setNotice(`Reporte seleccionado: ${report.label}.`)}><span>{report.icon}</span><strong>{report.label}</strong></button>)}
            </Box>
          </Paper>

          <Typography className="walker-footer-note">FiruPaseos · Tu tiempo, su felicidad.</Typography>
        </main>
      </Box>

      <Dialog open={Boolean(selectedRequest)} onClose={() => setSelectedRequest(null)} fullWidth maxWidth="sm" className="walker-dialog">
        <DialogTitle>
          Solicitud de {selectedRequest?.petName}
          <IconButton onClick={() => setSelectedRequest(null)} aria-label="Cerrar" sx={{ position: "absolute", right: 10, top: 10 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.25} alignItems="center"><OwnerAvatar name={selectedRequest.ownerName} /><Box><Typography fontWeight={850}>{selectedRequest.ownerName}</Typography><Typography variant="body2" color="text.secondary">{selectedRequest.zone} · {selectedRequest.time.replace("\n", " · ")}</Typography></Box></Stack>
            <Typography variant="body2"><strong>Servicio:</strong> {selectedRequest.kind.replace("\n", " · ")}</Typography>
            <Typography variant="body2"><strong>Presupuesto del cliente:</strong> {money(selectedRequest.ownerBudget)}</Typography>
            {selectedRequest.notes && <Typography variant="body2"><strong>Notas:</strong> {selectedRequest.notes}</Typography>}
            <TextField label="Tu propuesta" type="number" value={quote} onChange={(event) => setQuote(event.target.value)} InputProps={{ startAdornment: <span className="walker-currency-prefix">$</span> }} helperText="Envía una tarifa para iniciar la negociación." />
          </Stack>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/walks")} startIcon={<MessageOutlinedIcon />}>Abrir chat</Button>
          <Button color="error" onClick={() => selectedRequest && void updateRequest(selectedRequest, "REJECTED")}>Rechazar</Button>
          <Button variant="outlined" onClick={() => void saveQuote()} disabled={!quote.trim()}>Proponer precio</Button>
          <Button variant="contained" onClick={() => selectedRequest && void updateRequest(selectedRequest, "CONFIRMED")}>Aceptar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} message={notice} />
    </Box>
  );
};

export default WalkerDashboard;
