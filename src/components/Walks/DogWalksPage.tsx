import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import StartIcon from "@mui/icons-material/PlayArrow";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { buildApiUrl } from "../../config/runtime";
import { isCurrentUserAdmin } from "../../services/auth.ts";
import PageHeader from "../Dashboard/ui/PageHeader.tsx";

type UserRole = "USER" | "ADMIN" | "WALKER" | string;

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  walkerProfileId?: number | null;
};

type Walker = {
  id: number;
  userId?: number;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  neighborhood?: string;
  experienceYears?: number;
  basePrice?: number;
  priceNotes?: string;
  services?: string;
  availability?: string;
  active?: boolean;
  approvalStatus?: string;
};

type PetOption = {
  id: number;
  name: string;
};

type WalkRequest = {
  id: number;
  walkerProfileId?: number;
  walkerName?: string;
  ownerId?: number;
  ownerName?: string;
  petId?: number;
  petName?: string;
  requestedStart?: string;
  durationMinutes?: number;
  ownerBudget?: number;
  walkerQuotedPrice?: number;
  serviceAddress?: string;
  notes?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  activeDogWalkId?: number | null;
};

type WalkMessage = {
  id: number;
  senderId?: number;
  senderName?: string;
  body: string;
  createdAt?: string;
};

type Position = {
  id?: number;
  latitude: number;
  longitude: number;
  recordedAt?: string;
};

type WalkStop = {
  id?: number | string;
  note?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  recordedAt?: string;
};

type DogWalk = {
  id: number;
  walkRequestId?: number;
  walkerProfileId?: number;
  walkerName?: string;
  ownerId?: number;
  ownerName?: string;
  petId?: number;
  petName?: string;
  agreedPrice?: number;
  startedAt?: string;
  completedAt?: string;
  status: string;
  lastPosition?: Position | null;
  stops?: WalkStop[];
};

type RequestForm = {
  walkerProfileId: string;
  petId: string;
  requestedStart: string;
  durationMinutes: string;
  ownerBudget: string;
  serviceAddress: string;
  notes: string;
};

type ApplicationForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  neighborhood: string;
  experienceYears: string;
  basePrice: string;
  bio: string;
  services: string;
  availability: string;
  priceNotes: string;
};

type AdminForm = ApplicationForm & {
  active: boolean;
  approvalStatus: string;
};

const defaultRequestForm: RequestForm = {
  walkerProfileId: "",
  petId: "",
  requestedStart: "",
  durationMinutes: "60",
  ownerBudget: "",
  serviceAddress: "",
  notes: "",
};

const defaultApplicationForm: ApplicationForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  neighborhood: "",
  experienceYears: "",
  basePrice: "",
  bio: "",
  services: "",
  availability: "",
  priceNotes: "",
};

const defaultAdminForm: AdminForm = {
  ...defaultApplicationForm,
  active: true,
  approvalStatus: "APPROVED",
};

const extractCollection = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  return data?.content || data?.items || data?.results || data?.data || [];
};

const authHeaders = () => {
  if (typeof window === "undefined") return undefined;
  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const api = async <T = any>(method: string, path: string, data?: unknown): Promise<T> => {
  const response = await axios({
    method,
    url: buildApiUrl(path),
    data,
    headers: authHeaders(),
  });
  return response.data as T;
};

const errorMessage = (error: any) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || "No fue posible completar la operación.";

const money = (value?: number) =>
  value == null || Number.isNaN(Number(value)) ? "—" : `$${Number(value).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const dateTime = (value?: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CO");
};

const localWalkStopsKey = (walkId: number | string) => `firuapp:walk-stops:${walkId}`;

const readLocalWalkStops = (walkId: number | string): WalkStop[] => {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(localWalkStopsKey(walkId)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const saveLocalWalkStops = (walkId: number | string, stops: WalkStop[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localWalkStopsKey(walkId), JSON.stringify(stops));
  } catch {
    // Keep the stop in memory when browser storage is unavailable.
  }
};

const statusColor = (status?: string): "success" | "warning" | "error" | "default" | "info" => {
  if (status === "COMPLETED" || status === "ACCEPTED" || status === "IN_PROGRESS" || status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "error";
  if (status === "PENDING" || status === "NEGOTIATING") return "warning";
  return "info";
};

const mapPet = (pet: any): PetOption => ({
  id: Number(pet.id),
  name: pet.name || `Mascota ${pet.id}`,
});

const MapFit: React.FC<{ positions: Position[] }> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions.map((position) => [position.latitude, position.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
  }, [map, positions]);

  return null;
};

const WalkMap: React.FC<{ positions: Position[] }> = ({ positions }) => {
  const first = positions[0];
  const center: [number, number] = first ? [first.latitude, first.longitude] : [4.711, -74.0721];
  const coordinates = positions.map((position) => [position.latitude, position.longitude] as [number, number]);

  return (
    <Box sx={{ height: { xs: 320, md: 440 }, borderRadius: 3, overflow: "hidden", border: "1px solid #dbe7f3" }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapFit positions={positions} />
        {coordinates.length > 1 && <Polyline positions={coordinates} pathOptions={{ color: "#079b80", weight: 5, opacity: 0.8 }} />}
        {positions.map((position, index) => (
          <CircleMarker
            key={`${position.id || index}-${position.latitude}-${position.longitude}`}
            center={[position.latitude, position.longitude]}
            radius={index === positions.length - 1 ? 8 : 5}
            pathOptions={{ color: index === positions.length - 1 ? "#dc2626" : "#079b80", fillOpacity: 0.9 }}
          >
            <Popup>
              {index === positions.length - 1 ? "Última posición" : `Posición ${index + 1}`}
              <br />
              {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
              {position.recordedAt && <><br />{dateTime(position.recordedAt)}</>}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Box>
  );
};

const WalkerCard: React.FC<{ walker: Walker; canRequest: boolean; onRequest: (walker: Walker) => void }> = ({ walker, canRequest, onRequest }) => (
  <Paper elevation={0} sx={{ p: 2, border: "1px solid #dbe7f3", borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", gap: 1.15 }}>
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Avatar sx={{ bgcolor: "#dff7f1", color: "#047a68", fontWeight: 900 }}>{walker.name?.charAt(0)?.toUpperCase() || "P"}</Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={900} noWrap>{walker.name}</Typography>
        <Typography variant="body2" color="text.secondary">{walker.neighborhood || "Zona por definir"}</Typography>
      </Box>
      <Chip size="small" color="success" label={`${money(walker.basePrice)} base`} />
    </Stack>
    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 42 }}>{walker.bio || "Paseos personalizados para tu mascota."}</Typography>
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      <Chip size="small" label={`${walker.experienceYears ?? 0} años`} />
      <Chip size="small" label={walker.services || "Paseos"} />
      <Chip size="small" label={walker.availability || "Disponibilidad por acordar"} />
    </Stack>
    <Typography variant="caption" color="text.secondary" sx={{ minHeight: 32 }}>{walker.priceNotes || "La tarifa final se acuerda por chat."}</Typography>
    <Button
      variant="contained"
      startIcon={<DirectionsWalkIcon />}
      onClick={() => onRequest(walker)}
      disabled={!canRequest}
      sx={{ mt: "auto", alignSelf: "flex-start" }}
    >
      {canRequest ? "Solicitar paseo" : "Inicia sesión para solicitar"}
    </Button>
  </Paper>
);

const RequestCard: React.FC<{ request: WalkRequest; isWalker: boolean; onOpen: (id: number) => void }> = ({ request, isWalker, onOpen }) => (
  <Paper elevation={0} sx={{ p: 1.75, border: "1px solid #dbe7f3", borderRadius: 2.5 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
      <Box>
        <Typography fontWeight={900}>{request.petName || "Paseo sin mascota asignada"}</Typography>
        <Typography variant="body2" color="text.secondary">{isWalker ? request.ownerName : request.walkerName}</Typography>
      </Box>
      <Chip size="small" color={statusColor(request.status)} label={request.status} />
    </Stack>
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 1, color: "text.secondary" }}>
      <Typography variant="caption">{dateTime(request.requestedStart)}</Typography>
      <Typography variant="caption">{request.durationMinutes ? `${request.durationMinutes} min` : "Duración por definir"}</Typography>
      <Typography variant="caption">Dueño {money(request.ownerBudget)}</Typography>
      <Typography variant="caption">Paseador {money(request.walkerQuotedPrice)}</Typography>
    </Stack>
    <Button size="small" startIcon={<MessageOutlinedIcon />} onClick={() => onOpen(request.id)} sx={{ mt: 1 }}>Abrir detalle y chat</Button>
  </Paper>
);

const DogWalkCard: React.FC<{ walk: DogWalk; onOpen: (id: number) => void }> = ({ walk, onOpen }) => (
  <Paper elevation={0} sx={{ p: 1.75, border: "1px solid #dbe7f3", borderRadius: 2.5 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
      <Box>
        <Typography fontWeight={900}>{walk.petName || "Paseo sin mascota"}</Typography>
        <Typography variant="body2" color="text.secondary">{walk.walkerName || walk.ownerName || "Paseo"}</Typography>
      </Box>
      <Chip size="small" color={statusColor(walk.status)} label={walk.status} />
    </Stack>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
      Inicio: {dateTime(walk.startedAt)} · Tarifa: {money(walk.agreedPrice)}
    </Typography>
    <Button size="small" startIcon={<LocationOnOutlinedIcon />} onClick={() => onOpen(walk.id)} sx={{ mt: 1 }}>Ver mapa</Button>
  </Paper>
);

const DogWalksPage: React.FC = () => {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [pets, setPets] = useState<PetOption[]>([]);
  const [requests, setRequests] = useState<WalkRequest[]>([]);
  const [dogWalks, setDogWalks] = useState<DogWalk[]>([]);
  const [myWalkerProfile, setMyWalkerProfile] = useState<Walker | null>(null);
  const [adminWalkers, setAdminWalkers] = useState<Walker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestForm, setRequestForm] = useState<RequestForm>(defaultRequestForm);
  const [applicationForm, setApplicationForm] = useState<ApplicationForm>(defaultApplicationForm);
  const [adminForm, setAdminForm] = useState<AdminForm>(defaultAdminForm);
  const [requestWalker, setRequestWalker] = useState<Walker | null>(null);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WalkRequest | null>(null);
  const [messages, setMessages] = useState<WalkMessage[]>([]);
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("NEGOTIATING");
  const [selectedWalk, setSelectedWalk] = useState<DogWalk | null>(null);
  const [walkPositions, setWalkPositions] = useState<Position[]>([]);
  const [walkStops, setWalkStops] = useState<WalkStop[]>([]);
  const [stopNote, setStopNote] = useState("");
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [locallyPausedWalkIds, setLocallyPausedWalkIds] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const isWalker = me?.role === "WALKER";
  const isAdmin = me?.role === "ADMIN" || isCurrentUserAdmin();
  const hasToken = typeof window !== "undefined" && Boolean(window.localStorage.getItem("token"));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const publicWalkers = await api<any>("GET", "/api/public/walkers?page=0&size=50");
      setWalkers(extractCollection(publicWalkers));

      if (!hasToken) {
        setMe(null);
        setPets([]);
        setRequests([]);
        setDogWalks([]);
        return;
      }

      const current = await api<CurrentUser>("GET", "/api/me");
      setMe(current);
      const [requestData, dogWalkData] = await Promise.all([
        api<any>("GET", "/api/walk-requests?page=0&size=100"),
        api<any>("GET", "/api/dog-walks?page=0&size=100"),
      ]);
      setRequests(extractCollection(requestData));
      setDogWalks(extractCollection(dogWalkData));

      if (current.role !== "WALKER") {
        try {
          const petData = await api<any>("GET", "/api/pets");
          setPets(extractCollection(petData).map(mapPet));
        } catch {
          setPets([]);
        }
        setMyWalkerProfile(null);
      } else {
        try {
          setMyWalkerProfile(await api<Walker>("GET", "/api/walkers/me"));
        } catch {
          setMyWalkerProfile(null);
        }
      }

      if (current.role === "ADMIN" || isCurrentUserAdmin()) {
        try {
          setAdminWalkers(extractCollection(await api<any>("GET", "/api/admin/walkers?page=0&size=100")));
        } catch {
          setAdminWalkers([]);
        }
      } else {
        setAdminWalkers([]);
      }
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [hasToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openRequest = useCallback(async (id: number) => {
    setBusy(true);
    try {
      const [request, requestMessages] = await Promise.all([
        api<WalkRequest>("GET", `/api/walk-requests/${id}`),
        api<any>("GET", `/api/walk-requests/${id}/messages?page=0&size=100`),
      ]);
      setSelectedRequest(request);
      setMessages(extractCollection(requestMessages));
      setQuote(request.walkerQuotedPrice == null ? "" : String(request.walkerQuotedPrice));
      setQuoteStatus(request.status || "NEGOTIATING");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }, []);

  const openWalk = useCallback(async (id: number) => {
    setBusy(true);
    try {
      const [walk, positionData] = await Promise.all([
        api<DogWalk>("GET", `/api/dog-walks/${id}`),
        api<any>("GET", `/api/dog-walks/${id}/positions?page=0&size=2000`),
      ]);
      setSelectedWalk(walk);
      setWalkPositions(extractCollection(positionData));
      setWalkStops([
        ...extractCollection(walk.stops || (walk as any).stopEvents || []),
        ...readLocalWalkStops(walk.id),
      ]);
      if (walk.status === "PAUSED") {
        setLocallyPausedWalkIds((current) => ({ ...current, [String(walk.id)]: true }));
      }
    } catch (walkError) {
      setError(errorMessage(walkError));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedWalk || selectedWalk.status !== "IN_PROGRESS") return undefined;
    const timer = window.setInterval(() => {
      void openWalk(selectedWalk.id);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [openWalk, selectedWalk]);

  const updateRequestField = (field: keyof RequestForm, value: string) => {
    setRequestForm((current) => ({ ...current, [field]: value }));
  };

  const updateApplicationField = (field: keyof ApplicationForm, value: string) => {
    setApplicationForm((current) => ({ ...current, [field]: value }));
  };

  const updateAdminField = (field: keyof AdminForm, value: string | boolean) => {
    setAdminForm((current) => ({ ...current, [field]: value }));
  };

  const startRequest = (walker: Walker) => {
    if (!me) {
      window.location.assign("/login");
      return;
    }
    if (isWalker) return;
    setRequestWalker(walker);
    setRequestForm({ ...defaultRequestForm, walkerProfileId: String(walker.id) });
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestWalker) return;
    setBusy(true);
    try {
      await api("POST", "/api/walk-requests", {
        walkerProfileId: Number(requestForm.walkerProfileId),
        petId: requestForm.petId ? Number(requestForm.petId) : null,
        requestedStart: requestForm.requestedStart || null,
        durationMinutes: requestForm.durationMinutes ? Number(requestForm.durationMinutes) : null,
        ownerBudget: requestForm.ownerBudget ? Number(requestForm.ownerBudget) : null,
        serviceAddress: requestForm.serviceAddress || null,
        notes: requestForm.notes || null,
      });
      setRequestWalker(null);
      setNotice("Solicitud de paseo enviada.");
      await loadData();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const submitApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api("POST", "/api/walker-applications", {
        ...applicationForm,
        experienceYears: applicationForm.experienceYears ? Number(applicationForm.experienceYears) : null,
        basePrice: applicationForm.basePrice ? Number(applicationForm.basePrice) : null,
      });
      setApplicationForm(defaultApplicationForm);
      setApplicationOpen(false);
      setNotice("Postulación enviada. Un administrador debe aprobar tu perfil.");
      await loadData();
    } catch (applicationError) {
      setError(errorMessage(applicationError));
    } finally {
      setBusy(false);
    }
  };

  const refreshRequest = async () => {
    if (selectedRequest) await openRequest(selectedRequest.id);
    await loadData();
  };

  const saveQuote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequest) return;
    setBusy(true);
    try {
      await api("PUT", `/api/walk-requests/${selectedRequest.id}/quote`, {
        walkerQuotedPrice: quote ? Number(quote) : null,
        status: quoteStatus,
      });
      setNotice("Tarifa y estado actualizados.");
      await refreshRequest();
    } catch (quoteError) {
      setError(errorMessage(quoteError));
    } finally {
      setBusy(false);
    }
  };

  const decideRequest = async (status: string) => {
    if (!selectedRequest) return;
    setBusy(true);
    try {
      await api("PUT", `/api/walk-requests/${selectedRequest.id}/decision`, { status });
      setNotice("Estado de la solicitud actualizado.");
      await refreshRequest();
    } catch (decisionError) {
      setError(errorMessage(decisionError));
    } finally {
      setBusy(false);
    }
  };

  const startWalk = async () => {
    if (!selectedRequest) return;
    setBusy(true);
    try {
      const walk = await api<DogWalk>("POST", `/api/walk-requests/${selectedRequest.id}/start`);
      setNotice("Paseo iniciado.");
      setSelectedRequest(null);
      await loadData();
      await openWalk(walk.id);
    } catch (startError) {
      setError(errorMessage(startError));
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequest || !message.trim()) return;
    setBusy(true);
    try {
      await api("POST", `/api/walk-requests/${selectedRequest.id}/messages`, { body: message.trim() });
      setMessage("");
      await openRequest(selectedRequest.id);
    } catch (messageError) {
      setError(errorMessage(messageError));
    } finally {
      setBusy(false);
    }
  };

  const sendPosition = () => {
    if (!selectedWalk) return;
    if (!navigator.geolocation) {
      setError("Este navegador no soporta geolocalización.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api("POST", `/api/dog-walks/${selectedWalk.id}/positions`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setNotice("Posición enviada.");
          await openWalk(selectedWalk.id);
        } catch (positionError) {
          setError(errorMessage(positionError));
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        setError("No fue posible obtener tu posición.");
      },
      { enableHighAccuracy: true },
    );
  };

  const toggleWalkPause = async () => {
    if (!selectedWalk) return;
    const walkId = String(selectedWalk.id);
    const isPaused = selectedWalk.status === "PAUSED" || locallyPausedWalkIds[walkId] === true;
    setBusy(true);
    try {
      await api("POST", `/api/dog-walks/${selectedWalk.id}/${isPaused ? "resume" : "pause"}`);
      setLocallyPausedWalkIds((current) => ({ ...current, [walkId]: !isPaused }));
      setNotice(isPaused ? "Paseo reanudado." : "Paseo pausado.");
      await openWalk(selectedWalk.id);
    } catch (pauseError: any) {
      if (pauseError?.response?.status === 404 || pauseError?.response?.status === 405) {
        setLocallyPausedWalkIds((current) => ({ ...current, [walkId]: !isPaused }));
        setNotice(isPaused ? "Paseo reanudado en esta sesión." : "Paseo pausado en esta sesión.");
      } else {
        setError(errorMessage(pauseError));
      }
    } finally {
      setBusy(false);
    }
  };

  const saveWalkStop = async () => {
    if (!selectedWalk) return;
    const note = stopNote.trim() || "Parada del paseo";
    const walkId = selectedWalk.id;

    const persistStop = async (position: { latitude?: number; longitude?: number } = {}) => {
      const payload = {
        note,
        ...(position.latitude != null && position.longitude != null
          ? { latitude: position.latitude, longitude: position.longitude }
          : {}),
      };

      try {
        await api("POST", `/api/dog-walks/${walkId}/stops`, payload);
      } catch (stopError: any) {
        if (stopError?.response?.status !== 404 && stopError?.response?.status !== 405) throw stopError;
        if (position.latitude == null || position.longitude == null) return false;
        await api("POST", `/api/dog-walks/${walkId}/positions`, {
          latitude: position.latitude,
          longitude: position.longitude,
          eventType: "STOP",
          note,
        });
      }
      return true;
    };

    setBusy(true);
    try {
      let persistedRemotely = false;
      if (!navigator.geolocation) {
        persistedRemotely = await persistStop();
      } else {
        persistedRemotely = await new Promise<boolean>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                resolve(await persistStop({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
              } catch (error) {
                reject(error);
              }
            },
            async () => {
              try {
                resolve(await persistStop());
              } catch (error) {
                reject(error);
              }
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 15000 },
          );
        });
      }
      setStopDialogOpen(false);
      setStopNote("");
      setNotice("Parada guardada.");
      if (persistedRemotely) {
        await openWalk(walkId);
      } else {
        const localStop = { id: `local-${Date.now()}`, note, recordedAt: new Date().toISOString() };
        const localStops = [...readLocalWalkStops(walkId), localStop];
        saveLocalWalkStops(walkId, localStops);
        setWalkStops((current) => [...current, localStop]);
      }
    } catch (stopError) {
      setError(errorMessage(stopError));
    } finally {
      setBusy(false);
    }
  };

  const completeWalk = async () => {
    if (!selectedWalk) return;
    setBusy(true);
    try {
      await api("POST", `/api/dog-walks/${selectedWalk.id}/complete`);
      setNotice("Paseo marcado como finalizado.");
      await loadData();
      await openWalk(selectedWalk.id);
    } catch (completeError) {
      setError(errorMessage(completeError));
    } finally {
      setBusy(false);
    }
  };

  const createWalkerByAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api("POST", "/api/admin/walkers", {
        ...adminForm,
        experienceYears: adminForm.experienceYears ? Number(adminForm.experienceYears) : null,
        basePrice: adminForm.basePrice ? Number(adminForm.basePrice) : null,
      });
      setAdminForm(defaultAdminForm);
      setNotice("Paseador registrado.");
      await loadData();
    } catch (adminError) {
      setError(errorMessage(adminError));
    } finally {
      setBusy(false);
    }
  };

  const adminWalkerAction = async (walker: Walker, action: "approve" | "reject" | "toggle" | "delete") => {
    if (action === "delete" && !window.confirm(`¿Eliminar el perfil de ${walker.name}?`)) return;
    setBusy(true);
    try {
      if (action === "delete") {
        await api("DELETE", `/api/admin/walkers/${walker.id}`);
      } else {
        await api("PUT", `/api/admin/walkers/${walker.id}`, {
          name: walker.name,
          email: walker.email,
          phone: walker.phone,
          bio: walker.bio,
          neighborhood: walker.neighborhood,
          experienceYears: walker.experienceYears,
          basePrice: walker.basePrice,
          priceNotes: walker.priceNotes,
          services: walker.services,
          availability: walker.availability,
          active: action === "toggle" ? !walker.active : walker.active,
          approvalStatus: action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : walker.approvalStatus,
        });
      }
      setNotice(action === "delete" ? "Paseador eliminado." : "Perfil de paseador actualizado.");
      await loadData();
    } catch (adminError) {
      setError(errorMessage(adminError));
    } finally {
      setBusy(false);
    }
  };

  const requestPanelTitle = isWalker ? "Solicitudes recibidas" : "Mis solicitudes de paseo";
  const visibleWalks = useMemo(() => dogWalks, [dogWalks]);
  const selectedWalkIsPaused = Boolean(selectedWalk && (selectedWalk.status === "PAUSED" || locallyPausedWalkIds[String(selectedWalk.id)]));

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title="Dog walks"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            {!me && <Chip size="small" label="Marketplace público" color="info" />}
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void loadData()} disabled={loading}>Actualizar</Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 3, background: "linear-gradient(135deg, #062346 0%, #087e72 100%)", color: "white" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.75, fontWeight: 900, letterSpacing: 1.5 }}>Marketplace de paseadores</Typography>
            <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.4 }}>Acuerda el paseo y síguelo en el mapa.</Typography>
            <Typography sx={{ mt: 0.75, maxWidth: 700, opacity: 0.82 }}>Encuentra un paseador aprobado, negocia la tarifa por chat, inicia el paseo y recibe las posiciones en tiempo real.</Typography>
          </Box>
          <Button variant="contained" color="inherit" startIcon={<AddIcon />} onClick={() => setApplicationOpen(true)} sx={{ color: "#062346", bgcolor: "white", flexShrink: 0 }}>
            Quiero ser paseador
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.45fr 0.7fr" }, gap: 2, mb: 2 }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #dbe7f3" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={950}>Paseadores disponibles</Typography>
              <Typography variant="body2" color="text.secondary">Perfiles aprobados y activos.</Typography>
            </Box>
            {loading && <CircularProgress size={22} />}
          </Stack>
          {walkers.length === 0 && !loading ? (
            <Typography color="text.secondary">No hay paseadores aprobados todavía.</Typography>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 1.5 }}>
              {walkers.map((walker) => <WalkerCard key={walker.id} walker={walker} canRequest={Boolean(me && !isWalker)} onRequest={startRequest} />)}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #dbe7f3", alignSelf: "start" }}>
          <Typography variant="h6" fontWeight={950}>¿Quieres ofrecer paseos?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>Crea tu perfil, indica tu zona y disponibilidad. Un administrador revisará la postulación.</Typography>
          <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={() => setApplicationOpen(true)} sx={{ mt: 2 }}>Enviar postulación</Button>
          {!hasToken && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.25 }}>También puedes explorar los perfiles sin iniciar sesión.</Typography>}
        </Paper>
      </Box>

      {me && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mb: 2 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #dbe7f3" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Box><Typography variant="h6" fontWeight={950}>{requestPanelTitle}</Typography><Typography variant="body2" color="text.secondary">Abre una solicitud para negociar, aceptar y conversar.</Typography></Box>
                <Chip size="small" label={me.role} color={isWalker ? "secondary" : "primary"} />
              </Stack>
              {requests.length === 0 ? <Typography color="text.secondary">No hay solicitudes todavía.</Typography> : <Stack spacing={1}>{requests.map((request) => <RequestCard key={request.id} request={request} isWalker={Boolean(isWalker)} onOpen={openRequest} />)}</Stack>}
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #dbe7f3" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Box><Typography variant="h6" fontWeight={950}>{isWalker ? "Paseos activos e históricos" : "Mis paseos"}</Typography><Typography variant="body2" color="text.secondary">Consulta la ruta y la última posición reportada.</Typography></Box>
                <DirectionsWalkIcon color="primary" />
              </Stack>
              {visibleWalks.length === 0 ? <Typography color="text.secondary">Todavía no hay paseos iniciados.</Typography> : <Stack spacing={1}>{visibleWalks.map((walk) => <DogWalkCard key={walk.id} walk={walk} onOpen={openWalk} />)}</Stack>}
            </Paper>
          </Box>

          {isWalker && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mb: 2, borderRadius: 3, border: "1px solid #dbe7f3" }}>
              <Typography variant="h6" fontWeight={950}>Mi perfil de paseador</Typography>
              {myWalkerProfile ? <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1.25 }}>
                <Chip color={statusColor(myWalkerProfile.approvalStatus)} label={myWalkerProfile.approvalStatus || "PENDING"} />
                <Typography variant="body2">{myWalkerProfile.bio || "Sin biografía"}</Typography>
                <Typography variant="body2" color="text.secondary">{myWalkerProfile.neighborhood || "Zona por definir"} · {money(myWalkerProfile.basePrice)}</Typography>
              </Stack> : <Typography color="text.secondary" sx={{ mt: 1 }}>No existe un perfil vinculado a tu usuario.</Typography>}
            </Paper>
          )}

          {isAdmin && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #dbe7f3" }}>
              <Typography variant="h6" fontWeight={950}>Administrar paseadores</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Aprueba postulaciones, activa perfiles o registra paseadores manualmente.</Typography>
              <Box component="form" onSubmit={createWalkerByAdmin} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.25, mb: 2 }}>
                <TextField size="small" label="Nombre" required value={adminForm.name} onChange={(event) => updateAdminField("name", event.target.value)} />
                <TextField size="small" label="Correo" type="email" required value={adminForm.email} onChange={(event) => updateAdminField("email", event.target.value)} />
                <TextField size="small" label="Contraseña" type="password" required value={adminForm.password} onChange={(event) => updateAdminField("password", event.target.value)} />
                <TextField size="small" label="Teléfono" value={adminForm.phone} onChange={(event) => updateAdminField("phone", event.target.value)} />
                <TextField size="small" label="Zona" value={adminForm.neighborhood} onChange={(event) => updateAdminField("neighborhood", event.target.value)} />
                <TextField size="small" label="Tarifa base" type="number" value={adminForm.basePrice} onChange={(event) => updateAdminField("basePrice", event.target.value)} />
                <TextField size="small" label="Experiencia (años)" type="number" value={adminForm.experienceYears} onChange={(event) => updateAdminField("experienceYears", event.target.value)} />
                <TextField size="small" select label="Estado" value={adminForm.approvalStatus} onChange={(event) => updateAdminField("approvalStatus", event.target.value)}><MenuItem value="APPROVED">Aprobado</MenuItem><MenuItem value="PENDING">Pendiente</MenuItem><MenuItem value="REJECTED">Rechazado</MenuItem></TextField>
                <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={busy}>Registrar paseador</Button>
              </Box>
              {adminWalkers.length === 0 ? <Typography color="text.secondary">No hay perfiles para administrar.</Typography> : <Stack spacing={1}>{adminWalkers.map((walker) => <Paper key={walker.id} elevation={0} sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 2 }}><Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "flex-start", md: "center" }}><Box sx={{ flex: 1 }}><Typography fontWeight={850}>{walker.name}</Typography><Typography variant="caption" color="text.secondary">{walker.email} · {walker.neighborhood || "Sin zona"} · {money(walker.basePrice)}</Typography></Box><Chip size="small" color={statusColor(walker.approvalStatus)} label={walker.approvalStatus || "PENDING"} /><Chip size="small" label={walker.active ? "Activo" : "Inactivo"} /><Stack direction="row" spacing={0.5}><Button size="small" onClick={() => void adminWalkerAction(walker, "approve")}><CheckCircleOutlineIcon fontSize="small" /></Button><Button size="small" onClick={() => void adminWalkerAction(walker, "reject")}>Rechazar</Button><Button size="small" onClick={() => void adminWalkerAction(walker, "toggle")}>{walker.active ? "Desactivar" : "Activar"}</Button><Button size="small" color="error" onClick={() => void adminWalkerAction(walker, "delete")}><DeleteOutlineIcon fontSize="small" /></Button></Stack></Stack></Paper>)}</Stack>}
            </Paper>
          )}
        </>
      )}

      <Dialog open={Boolean(requestWalker)} onClose={() => setRequestWalker(null)} fullWidth maxWidth="sm">
        <DialogTitle>Solicitar paseo con {requestWalker?.name}</DialogTitle>
        <Box component="form" onSubmit={submitRequest}>
          <DialogContent dividers>
            <Stack spacing={1.5}>
              <TextField select label="Mascota" value={requestForm.petId} onChange={(event) => updateRequestField("petId", event.target.value)} helperText={pets.length ? "Selecciona la mascota que saldrá a pasear." : "Puedes enviar la solicitud sin mascota asignada."}>
                <MenuItem value="">Sin asignar todavía</MenuItem>
                {pets.map((pet) => <MenuItem key={pet.id} value={String(pet.id)}>{pet.name}</MenuItem>)}
              </TextField>
              <TextField label="Fecha y hora" type="datetime-local" value={requestForm.requestedStart} onChange={(event) => updateRequestField("requestedStart", event.target.value)} InputLabelProps={{ shrink: true }} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField fullWidth label="Duración (minutos)" type="number" value={requestForm.durationMinutes} onChange={(event) => updateRequestField("durationMinutes", event.target.value)} /><TextField fullWidth label="Presupuesto" type="number" value={requestForm.ownerBudget} onChange={(event) => updateRequestField("ownerBudget", event.target.value)} /></Stack>
              <TextField label="Dirección del servicio" value={requestForm.serviceAddress} onChange={(event) => updateRequestField("serviceAddress", event.target.value)} />
              <TextField label="Notas" multiline minRows={3} value={requestForm.notes} onChange={(event) => updateRequestField("notes", event.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setRequestWalker(null)}>Cancelar</Button><Button type="submit" variant="contained" disabled={busy}>Enviar solicitud</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={applicationOpen} onClose={() => setApplicationOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Postulación de paseador</DialogTitle>
        <Box component="form" onSubmit={submitApplication}>
          <DialogContent dividers><Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField fullWidth required label="Nombre" value={applicationForm.name} onChange={(event) => updateApplicationField("name", event.target.value)} /><TextField fullWidth required type="email" label="Correo" value={applicationForm.email} onChange={(event) => updateApplicationField("email", event.target.value)} /></Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField fullWidth required type="password" label="Contraseña" value={applicationForm.password} onChange={(event) => updateApplicationField("password", event.target.value)} /><TextField fullWidth label="Teléfono" value={applicationForm.phone} onChange={(event) => updateApplicationField("phone", event.target.value)} /></Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField fullWidth label="Zona" value={applicationForm.neighborhood} onChange={(event) => updateApplicationField("neighborhood", event.target.value)} /><TextField fullWidth type="number" label="Experiencia (años)" value={applicationForm.experienceYears} onChange={(event) => updateApplicationField("experienceYears", event.target.value)} /><TextField fullWidth type="number" label="Tarifa base" value={applicationForm.basePrice} onChange={(event) => updateApplicationField("basePrice", event.target.value)} /></Stack>
            <TextField label="Biografía" multiline minRows={2} value={applicationForm.bio} onChange={(event) => updateApplicationField("bio", event.target.value)} />
            <TextField label="Servicios" multiline minRows={2} value={applicationForm.services} onChange={(event) => updateApplicationField("services", event.target.value)} />
            <TextField label="Disponibilidad" multiline minRows={2} value={applicationForm.availability} onChange={(event) => updateApplicationField("availability", event.target.value)} />
            <TextField label="Condiciones de tarifa" multiline minRows={2} value={applicationForm.priceNotes} onChange={(event) => updateApplicationField("priceNotes", event.target.value)} />
          </Stack></DialogContent>
          <DialogActions><Button onClick={() => setApplicationOpen(false)}>Cancelar</Button><Button type="submit" variant="contained" disabled={busy}>Enviar postulación</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(selectedRequest)} onClose={() => setSelectedRequest(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedRequest ? `Solicitud #${selectedRequest.id} · ${selectedRequest.petName || "Sin mascota"}` : "Detalle de solicitud"}</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Chip color={statusColor(selectedRequest.status)} label={selectedRequest.status} /><Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>{selectedRequest.walkerName} · {selectedRequest.ownerName}</Typography></Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1 }}><Typography variant="body2"><strong>Fecha:</strong> {dateTime(selectedRequest.requestedStart)}</Typography><Typography variant="body2"><strong>Duración:</strong> {selectedRequest.durationMinutes ? `${selectedRequest.durationMinutes} min` : "Por definir"}</Typography><Typography variant="body2"><strong>Dirección:</strong> {selectedRequest.serviceAddress || "Por definir"}</Typography><Typography variant="body2"><strong>Tarifa:</strong> dueño {money(selectedRequest.ownerBudget)} · paseador {money(selectedRequest.walkerQuotedPrice)}</Typography></Box>
            {isWalker ? <Box component="form" onSubmit={saveQuote} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" }, gap: 1, alignItems: "center" }}><TextField size="small" label="Tarifa propuesta" type="number" value={quote} onChange={(event) => setQuote(event.target.value)} /><TextField size="small" select label="Estado" value={quoteStatus} onChange={(event) => setQuoteStatus(event.target.value)}><MenuItem value="NEGOTIATING">En negociación</MenuItem><MenuItem value="ACCEPTED">Aceptar</MenuItem><MenuItem value="REJECTED">Rechazar</MenuItem></TextField><Button type="submit" variant="contained" disabled={busy}>Guardar</Button></Box> : <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button variant="contained" onClick={() => void decideRequest("ACCEPTED")} disabled={busy}>Aceptar propuesta</Button><Button color="error" variant="outlined" onClick={() => void decideRequest("REJECTED")} disabled={busy}>Rechazar</Button><Button variant="outlined" onClick={() => void decideRequest("CANCELLED")} disabled={busy}>Cancelar</Button></Stack>}
            {isWalker && (selectedRequest.status === "ACCEPTED" || selectedRequest.status === "NEGOTIATING") && <Button variant="outlined" startIcon={<StartIcon />} onClick={() => void startWalk()} disabled={busy} sx={{ alignSelf: "flex-start" }}>Iniciar paseo</Button>}
            <Divider />
            <Typography variant="subtitle1" fontWeight={900}>Chat de la solicitud</Typography>
            {messages.length === 0 ? <Typography variant="body2" color="text.secondary">Todavía no hay mensajes.</Typography> : <Stack spacing={1}>{messages.map((item) => <Paper key={item.id} elevation={0} sx={{ p: 1.25, bgcolor: "#f7fafc", border: "1px solid #e2e8f0" }}><Typography variant="body2" fontWeight={800}>{item.senderName || "Usuario"}</Typography><Typography variant="body2">{item.body}</Typography><Typography variant="caption" color="text.secondary">{dateTime(item.createdAt)}</Typography></Paper>)}</Stack>}
            <Box component="form" onSubmit={sendMessage} sx={{ display: "flex", gap: 1 }}><TextField fullWidth size="small" label="Escribe un mensaje" value={message} onChange={(event) => setMessage(event.target.value)} /><Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={busy || !message.trim()}>Enviar</Button></Box>
          </Stack>}
        </DialogContent>
        <DialogActions><Button onClick={() => setSelectedRequest(null)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(selectedWalk)} onClose={() => setSelectedWalk(null)} fullWidth maxWidth="lg">
        <DialogTitle>{selectedWalk ? `Mapa del paseo #${selectedWalk.id}` : "Mapa del paseo"}</DialogTitle>
        <DialogContent dividers>
          {selectedWalk && <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Chip color={statusColor(selectedWalkIsPaused ? "PAUSED" : selectedWalk.status)} label={selectedWalkIsPaused ? "PAUSED" : selectedWalk.status} /><Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>{selectedWalk.petName || "Sin mascota"} · {selectedWalk.walkerName || "Paseador"} · {selectedWalk.ownerName || "Dueño"}</Typography></Stack>
            <Typography variant="body2" color="text.secondary">Inicio: {dateTime(selectedWalk.startedAt)} · Última posición: {selectedWalk.lastPosition ? `${selectedWalk.lastPosition.latitude.toFixed(5)}, ${selectedWalk.lastPosition.longitude.toFixed(5)}` : "Sin posiciones aún"}</Typography>
            <WalkMap positions={walkPositions} />
            {walkStops.length > 0 && <Box sx={{ display: "grid", gap: 0.75 }}>
              <Typography variant="subtitle2" fontWeight={900}>Paradas del paseo</Typography>
              {walkStops.map((stop, index) => <Paper key={stop.id || `${stop.createdAt || stop.recordedAt || index}`} elevation={0} sx={{ p: 1, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <Typography variant="body2" fontWeight={800}>{stop.note || "Parada"}</Typography>
                <Typography variant="caption" color="text.secondary">{dateTime(stop.createdAt || stop.recordedAt)}</Typography>
              </Paper>)}
            </Box>}
          </Stack>}
        </DialogContent>
        <DialogActions>
          {selectedWalk && isWalker && selectedWalk.walkerProfileId === me?.walkerProfileId && ["IN_PROGRESS", "PAUSED"].includes(selectedWalk.status) && <>
            <Button startIcon={<MyLocationIcon />} onClick={sendPosition} disabled={busy || selectedWalkIsPaused}>Enviar mi posición</Button>
            <Button startIcon={selectedWalkIsPaused ? <StartIcon /> : <PauseCircleOutlineIcon />} onClick={() => void toggleWalkPause()} disabled={busy}>{selectedWalkIsPaused ? "Reanudar" : "Hacer una pausa"}</Button>
            <Button startIcon={<StopCircleOutlinedIcon />} onClick={() => setStopDialogOpen(true)} disabled={busy}>Registrar parada</Button>
            <Button color="error" startIcon={<StopCircleOutlinedIcon />} onClick={() => void completeWalk()} disabled={busy}>Marcar finalizado</Button>
          </>}
          <Button onClick={() => selectedWalk && void openWalk(selectedWalk.id)} disabled={busy}>Actualizar mapa</Button><Button onClick={() => setSelectedWalk(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={stopDialogOpen} onClose={() => !busy && setStopDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Registrar parada</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Nota de la parada"
            placeholder="Agua, descanso, entrega…"
            value={stopNote}
            onChange={(event) => setStopNote(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopDialogOpen(false)} disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={() => void saveWalkStop()} disabled={busy}>Guardar parada</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice("")} message={notice} />
    </Box>
  );
};

export default DogWalksPage;
