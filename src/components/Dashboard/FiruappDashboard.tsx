// pages/FiruappDashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";
import FiruappMapView from "./ui/FiruappMapView.tsx";
import FiruappPetsList from "./ui/FiruappPetList.tsx";
import { Pet, glassPanel, firuColors } from "./ui/FiruappStyles.ts";
import {
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
  InputBase,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import SearchIcon from "@mui/icons-material/Search";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import WifiIcon from "@mui/icons-material/Wifi";
import SpeedIcon from "@mui/icons-material/Speed";
import PlaceIcon from "@mui/icons-material/Place";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { usePetImage } from "../../services/usePetImage.ts";
import { buildApiUrl, buildWsUrl } from "../../config/runtime";

const mockPets: Pet[] = [
  { id: "mock-2", apiId: "2", name: "Bella", status: "active", ownerName: "Daniel Contreras", city: "Medellin", neighborhood: "Laureles", breed: "Beagle", age: "2 years", weight: "11 kg", battery: 74, signal: "Good", speed: "1.8 km/h", lastSeen: "1 min ago", imageUrl: "/german.png" },
  { id: "mock-3", apiId: "3", name: "Rocky", status: "lost", ownerName: "Laura Perez", city: "Medellin", neighborhood: "El Poblado", breed: "Mixed Breed", age: "6 years", weight: "22 kg", battery: 28, signal: "Weak", speed: "0.6 km/h", lastSeen: "Just now", imageUrl: "/labrador.png" },
];

const ALERT_USER_ID = 1;

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

const MEDELLIN_CITIES = ["Medellin"];
const MEDELLIN_NEIGHBORHOODS = [
  "Laureles",
  "El Poblado",
  "Belen",
  "Envigado",
  "Sabaneta",
  "Robledo",
  "Manrique",
  "Aranjuez",
  "Buenos Aires",
  "Castilla",
  "Guayabal",
  "La America",
  "San Javier",
  "Villa Hermosa",
  "Popular",
];

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

const MetricCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color, display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography variant="caption" sx={{ color: firuColors.muted, fontWeight: 800 }}>
        {label}
      </Typography>
    </Stack>
    <Typography variant="body1" sx={{ mt: 0.8, fontWeight: 900, color: firuColors.dark }}>
      {value}
    </Typography>
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

const FiruappDashboard: React.FC = () => {
  const [dashboardPets, setDashboardPets] = useState<Pet[]>(mockPets);
  const [databasePets, setDatabasePets] = useState<Pet[]>([]);
  const [petDataMode, setPetDataMode] = useState<PetDataMode>("mixed");
  const [petFilters, setPetFilters] = useState<DashboardPetFilters>({
    city: "",
    neighborhood: "",
    ownerName: "",
    petName: "",
  });
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [section, setSection] = useState<"all" | "geofence" | "route">("all");
  const [dbPetsLoaded, setDbPetsLoaded] = useState(false);
  const [alertMessages, setAlertMessages] = useState<DashboardAlert[]>([]);
  const [alertsConnected, setAlertsConnected] = useState(false);

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
          setDbPetsLoaded(true);
        }
      } catch (error) {
        console.error("Error loading dashboard pets from database:", error);
        if (!cancelled) {
          setDatabasePets([]);
          setDbPetsLoaded(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchDatabasePets]);

  useEffect(() => {
    const filteredMockPets = mockPets.filter((pet) => matchesPetFilters(pet, petFilters));
    const nextPets =
      petDataMode === "mock"
        ? filteredMockPets
        : petDataMode === "database"
          ? databasePets
          : [...filteredMockPets, ...databasePets];
    setDashboardPets(nextPets);
    setSelectedPetId((currentSelectedId) =>
      nextPets.some((pet) => pet.id === currentSelectedId)
        ? currentSelectedId
        : undefined
    );
  }, [databasePets, petDataMode, petFilters]);

  const filteredDashboardPets = useMemo(() => {
    return dashboardPets.filter((pet) => matchesPetFilters(pet, petFilters));
  }, [dashboardPets, petFilters]);
  const ownerNameOptions = useMemo(
    () => Array.from(new Set(dashboardPets.map((pet) => (pet.ownerName || "").trim()).filter(Boolean))).sort(),
    [dashboardPets]
  );
  const petNameOptions = useMemo(
    () => Array.from(new Set(dashboardPets.map((pet) => (pet.name || "").trim()).filter(Boolean))).sort(),
    [dashboardPets]
  );
  const neighborhoodOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...MEDELLIN_NEIGHBORHOODS,
          ...dashboardPets.map((pet) => (pet.neighborhood || "").trim()).filter(Boolean),
        ])
      ).sort(),
    [dashboardPets]
  );

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

  const selectedPet = useMemo(() => filteredDashboardPets.find((pet) => pet.id === selectedPetId), [filteredDashboardPets, selectedPetId]);
  const lostPets = useMemo(() => filteredDashboardPets.filter((pet) => pet.status === "lost"), [filteredDashboardPets]);
  const dismissAlert = (alertId: string) => {
    setAlertMessages((currentAlerts) => currentAlerts.filter((alert) => alert.id !== alertId));
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: firuColors.bg, color: firuColors.text }}>
      <FiruappSidebar current={section} onChange={setSection} />

      <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            ...glassPanel,
            borderRadius: 5,
            px: { xs: 2, md: 2.5 },
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, maxWidth: 560, display: "flex", alignItems: "center", gap: 1.2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", px: 1.5, py: 1, borderRadius: 3 }}>
            <SearchIcon sx={{ color: firuColors.muted }} />
            <InputBase placeholder="Search pets, places, geofences..." sx={{ flex: 1, fontSize: 14 }} />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<AddIcon />} variant="contained" sx={{ bgcolor: firuColors.dark, borderRadius: 3, textTransform: "none", fontWeight: 900, display: { xs: "none", sm: "inline-flex" } }}>
              Add Pet
            </Button>
            <IconButton sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Badge color="error" variant="dot"><NotificationsNoneIcon /></Badge>
            </IconButton>
            <IconButton sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Badge color="primary" badgeContent={6}><MessageOutlinedIcon /></Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: firuColors.dark, fontWeight: 900 }}>DC</Avatar>
          </Stack>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="overline" sx={{ color: firuColors.muted, fontWeight: 900, letterSpacing: 2 }}>
              FiruApp Command Center
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 950, color: firuColors.dark, letterSpacing: -1.4, fontSize: { xs: 32, md: 44 } }}>
              Live pet tracking
            </Typography>
            <Typography variant="body1" sx={{ color: firuColors.muted, mt: 0.5 }}>
              Monitor locations, safe zones, routes, and alerts from one focused dashboard.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={
                petDataMode === "mock"
                  ? "Mock pet profiles"
                  : petDataMode === "database"
                    ? dbPetsLoaded ? "Database pets" : "Database loading"
                    : dbPetsLoaded ? "Mock + database pets" : "Mock + loading database"
              }
              sx={{ bgcolor: petDataMode === "mock" ? "#fff7ed" : "#ecfdf5", color: petDataMode === "mock" ? "#c2410c" : "#047857", fontWeight: 900, border: `1px solid ${petDataMode === "mock" ? "#fed7aa" : "#a7f3d0"}` }}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={petDataMode}
              onChange={(_, nextMode) => {
                if (nextMode) setPetDataMode(nextMode);
              }}
              sx={{
                borderRadius: 999,
                bgcolor: "#ffffff",
                boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
                "& .MuiToggleButtonGroup-grouped": {
                  px: 1.25,
                  py: 0.55,
                  borderColor: "#e2e8f0",
                  color: firuColors.muted,
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: "none",
                  "&.Mui-selected": {
                    bgcolor: firuColors.dark,
                    color: "#ffffff",
                    "&:hover": { bgcolor: firuColors.dark },
                  },
                },
              }}
            >
              <ToggleButton value="mock">Mock</ToggleButton>
              <ToggleButton value="database">DB</ToggleButton>
              <ToggleButton value="mixed">Mixed</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        <Paper
          elevation={0}
          sx={{
            ...glassPanel,
            borderRadius: 5,
            px: 1.25,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: { xs: "wrap", xl: "nowrap" },
            overflowX: "auto",
          }}
        >
          <Chip
            label="Owner mode · Medellín"
            sx={{
              height: 34,
              flexShrink: 0,
              bgcolor: "#ecfeff",
              color: "#0e7490",
              fontWeight: 900,
              border: "1px solid #a5f3fc",
              "& .MuiChip-label": { px: 1.25 },
            }}
          />
          <Autocomplete
            freeSolo
            options={MEDELLIN_CITIES}
            inputValue={petFilters.city}
            onInputChange={(_, value) => setPetFilters((current) => ({ ...current, city: value }))}
            sx={{
              width: { xs: "100%", sm: 150 },
              minWidth: { sm: 150 },
              flexShrink: 0,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="City"
                placeholder="Medellin"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#ffffff", height: 38 },
                  "& .MuiInputBase-input": { fontSize: 13, py: 1 },
                  "& .MuiInputLabel-root": { fontSize: 13 },
                }}
              />
            )}
          />
          <Autocomplete
            freeSolo
            options={neighborhoodOptions}
            inputValue={petFilters.neighborhood}
            onInputChange={(_, value) => setPetFilters((current) => ({ ...current, neighborhood: value }))}
            sx={{
              width: { xs: "100%", sm: 190 },
              minWidth: { sm: 190 },
              flexShrink: 0,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Neighborhood"
                placeholder="Medellin neighborhoods"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#ffffff", height: 38 },
                  "& .MuiInputBase-input": { fontSize: 13, py: 1 },
                  "& .MuiInputLabel-root": { fontSize: 13 },
                }}
              />
            )}
          />
          <Autocomplete
            freeSolo
            options={ownerNameOptions}
            inputValue={petFilters.ownerName}
            onInputChange={(_, value) => setPetFilters((current) => ({ ...current, ownerName: value }))}
            sx={{
              width: { xs: "100%", sm: 160 },
              minWidth: { sm: 160 },
              flexShrink: 0,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Owner"
                placeholder="Search owner name"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#ffffff", height: 38 },
                  "& .MuiInputBase-input": { fontSize: 13, py: 1 },
                  "& .MuiInputLabel-root": { fontSize: 13 },
                }}
              />
            )}
          />
          <Autocomplete
            freeSolo
            options={petNameOptions}
            inputValue={petFilters.petName}
            onInputChange={(_, value) => setPetFilters((current) => ({ ...current, petName: value }))}
            sx={{
              width: { xs: "100%", sm: 150 },
              minWidth: { sm: 150 },
              flexShrink: 0,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Pet"
                placeholder="Search pet name"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#ffffff", height: 38 },
                  "& .MuiInputBase-input": { fontSize: 13, py: 1 },
                  "& .MuiInputLabel-root": { fontSize: 13 },
                }}
              />
            )}
          />
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr",
              lg: selectedPet ? "minmax(0, 1fr) 360px" : "1fr",
            },
            gap: 2.5,
            alignItems: "start",
          }}
        >

          <Box sx={{ display: "grid", gap: 1.5 }}>
            {(alertMessages[0]?.message || lostPets.length > 0) && (
              <Stack spacing={1}>
                {alertMessages[0]?.message && (
                  <Paper
                    elevation={0}
                    sx={{
                      ...glassPanel,
                      borderRadius: 4,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      bgcolor: "rgba(255,247,237,0.94)",
                      border: "1px solid #fed7aa",
                    }}
                  >
                    <WarningAmberIcon sx={{ color: firuColors.orange }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={{ display: "block", color: "#c2410c", fontWeight: 950, letterSpacing: 1, textTransform: "uppercase" }}>
                        Live alert
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#9a3412", fontWeight: 800 }}>
                        {alertMessages[0].message}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      aria-label="Dismiss alert"
                      onClick={() => dismissAlert(alertMessages[0].id)}
                      sx={{ color: "#c2410c", "&:hover": { bgcolor: "#ffedd5" } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                )}

                {lostPets.map((pet) => (
                  <Paper
                    key={`lost-${pet.id}`}
                    elevation={0}
                    onClick={() => setSelectedPetId(pet.id)}
                    sx={{
                      ...glassPanel,
                      borderRadius: 4,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.25,
                      cursor: "pointer",
                      bgcolor: "rgba(255,247,237,0.94)",
                      border: "1px solid #fed7aa",
                      "&:hover": { borderColor: "#fdba74", boxShadow: "0 18px 45px rgba(249,115,22,0.16)" },
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                      <WarningAmberIcon sx={{ color: firuColors.orange }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ display: "block", color: "#c2410c", fontWeight: 950, letterSpacing: 1, textTransform: "uppercase" }}>
                          Lost pet
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#9a3412", fontWeight: 800 }}>
                          {pet.name} is marked as lost
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip
                      size="small"
                      label={petDataMode === "database" || pet.id.startsWith("db-") ? "DB" : "Mock"}
                      sx={{ bgcolor: "#ffedd5", color: "#c2410c", fontWeight: 900 }}
                    />
                  </Paper>
                ))}
              </Stack>
            )}

            <Paper elevation={0} sx={{ ...glassPanel, borderRadius: 5, p: 1.5, position: "relative", overflow: "hidden" }}>
              <FiruappMapView
                selectedPet={selectedPet}
                pets={filteredDashboardPets}
                petDataMode={petDataMode}
                onSelectPet={setSelectedPetId}
              />
              <FiruappPetsList
                pets={filteredDashboardPets}
                selectedId={selectedPetId}
                onSelect={setSelectedPetId}
                onStatusChange={(petId, status) => {
                  setDatabasePets((currentPets) => currentPets.map((pet) => ((pet.apiId || pet.id) === petId ? { ...pet, status } : pet)));
                  setDashboardPets((currentPets) => currentPets.map((pet) => ((pet.apiId || pet.id) === petId ? { ...pet, status } : pet)));
                }}
              />
            </Paper>
          </Box>

          {selectedPet && (
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ ...glassPanel, borderRadius: 5, overflow: "hidden" }}>
              <Box sx={{ height: 110, background: "linear-gradient(135deg, #67e8f9, #86efac, #c4b5fd)" }} />
              <Box sx={{ px: 2.5, pb: 2.5, mt: -5 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                  <SelectedPetAvatar pet={selectedPet} />
                  <IconButton
                    size="small"
                    aria-label="Close pet details"
                    onClick={() => setSelectedPetId(undefined)}
                    sx={{ bgcolor: "rgba(255,255,255,0.82)", border: "1px solid #e2e8f0", "&:hover": { bgcolor: "#f8fafc" } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 950, color: firuColors.dark }}>
                      {selectedPet.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: firuColors.muted }}>
                      {selectedPet.breed || "Tracked pet"}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedPet.status === "active" ? "LIVE" : "LOST"}
                    sx={{
                      bgcolor: selectedPet.status === "active" ? "#dcfce7" : "#ffedd5",
                      color: selectedPet.status === "active" ? "#15803d" : "#c2410c",
                      fontWeight: 950,
                    }}
                  />
                </Stack>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mt: 2.5 }}>
                  <MetricCard icon={<BatteryChargingFullIcon fontSize="small" />} label="Battery" value={`${selectedPet.battery ?? 82}%`} color={firuColors.green} />
                  <MetricCard icon={<WifiIcon fontSize="small" />} label="Signal" value={selectedPet.signal || "Strong"} color={firuColors.cyan} />
                  <MetricCard icon={<SpeedIcon fontSize="small" />} label="Speed" value={selectedPet.speed || "3.2 km/h"} color={firuColors.violet} />
                  <MetricCard icon={<PlaceIcon fontSize="small" />} label="Last seen" value={selectedPet.lastSeen || "2 min ago"} color={firuColors.orange} />
                </Box>

                <Stack direction="row" spacing={1.25} sx={{ mt: 2.5 }}>
                  <Button fullWidth variant="contained" sx={{ bgcolor: firuColors.dark, borderRadius: 3, textTransform: "none", fontWeight: 900 }}>
                    Open Map
                  </Button>
                  <Button fullWidth variant="outlined" sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}>
                    Message
                  </Button>
                </Stack>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...glassPanel, borderRadius: 5, p: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WarningAmberIcon sx={{ color: firuColors.orange }} />
                  <Typography variant="h6" sx={{ fontWeight: 950, color: firuColors.dark }}>
                    Recent alerts
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  label={alertsConnected ? "Live" : "Connecting"}
                  sx={{
                    bgcolor: alertsConnected ? "#dcfce7" : "#fff7ed",
                    color: alertsConnected ? "#15803d" : "#c2410c",
                    fontWeight: 900,
                    border: `1px solid ${alertsConnected ? "#bbf7d0" : "#fed7aa"}`,
                  }}
                />
              </Stack>
              <Stack spacing={1.25}>
                {alertMessages.length > 0 ? (
                  alertMessages.map((alert) => (
                    <Box key={alert.id} sx={{ p: 1.5, borderRadius: 3, bgcolor: "#fff7ed", border: "1px solid #fed7aa", display: "flex", gap: 1 }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: "#c2410c" }}>
                          Alert received
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", color: "#9a3412" }}>
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#9a3412", opacity: 0.78 }}>
                          {alert.receivedAt}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        aria-label="Dismiss alert"
                        onClick={() => dismissAlert(alert.id)}
                        sx={{ alignSelf: "flex-start", color: "#c2410c", "&:hover": { bgcolor: "#ffedd5" } }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "#ecfeff", border: "1px solid #a5f3fc" }}>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: "#0e7490" }}>
                      Waiting for live alerts
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#155e75" }}>
                      Subscribed to /topic/alerts/{ALERT_USER_ID}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FiruappDashboard;
