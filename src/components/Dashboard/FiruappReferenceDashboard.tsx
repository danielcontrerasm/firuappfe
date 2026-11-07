import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import PetsIcon from "@mui/icons-material/Pets";
import RadarIcon from "@mui/icons-material/Radar";
import DoNotDisturbAltOutlinedIcon from "@mui/icons-material/DoNotDisturbAltOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import DirectionsOutlinedIcon from "@mui/icons-material/DirectionsOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { usePetImage } from "../../services/usePetImage.ts";
import FiruappMapView from "./ui/FiruappMapView.tsx";
import FiruappPetsList from "./ui/FiruappPetList.tsx";
import OwnerReferenceSidebar from "./ui/OwnerReferenceSidebar.tsx";
import OwnerReferenceTopbar, { OwnerAccountDetails } from "./ui/OwnerReferenceTopbar.tsx";
import { DashboardCopy, DashboardLanguage } from "./ui/dashboardI18n.ts";
import { MapStyle, Pet, PetDataMode } from "./ui/FiruappStyles.ts";
import "./firuapp-reference-theme.css";

export type ReferencePetLocation = {
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

export type ReferencePetFilters = {
  city: string;
  neighborhood: string;
  ownerName: string;
  petName: string;
};

export type ReferenceAlertItem = {
  id: string | number;
  title: string;
  time: string;
  severity: "critical" | "warning";
  onDismiss?: () => void;
};

interface FiruappReferenceDashboardProps {
  language: DashboardLanguage;
  copy: DashboardCopy;
  dashboardTheme: "current" | "reference";
  accountDetails: OwnerAccountDetails;
  accountMenuAnchor: HTMLElement | null;
  onAccountMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onAccountMenuClose: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
  filteredDashboardPets: Pet[];
  selectedPet?: Pet;
  selectedPetId?: string;
  onSelectPet: (id: string) => void;
  onStatusChange: (id: string, status: Pet["status"]) => void;
  petDataMode: PetDataMode;
  showGeofences: boolean;
  onShowGeofencesChange: (visible: boolean) => void;
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;
  selectedPetGpsCity?: string;
  selectedPetLocation?: ReferencePetLocation;
  selectedPetLastSeen: string;
  selectedPetLocationLabel: string;
  selectedPetCoordinates: string;
  selectedPetBattery?: number;
  selectedPetBatteryColor: string;
  selectedPetIsLost: boolean;
  selectedPetGpsOnline: boolean;
  selectedPetLocationColor: string;
  selectedPetLocationBg: string;
  selectedPetLocationBorder: string;
  onlinePets: Pet[];
  lostPets: Pet[];
  recentAlertItems: ReferenceAlertItem[];
  alertsConnected: boolean;
  onLocationsChange: (locations: ReferencePetLocation[]) => void;
  petFilters: ReferencePetFilters;
  onPetFiltersChange: (filters: ReferencePetFilters) => void;
  cityOptions: string[];
  detailsPanelOpen: boolean;
  onDetailsPanelChange: (open: boolean) => void;
  searchBarRef: React.Ref<HTMLDivElement>;
  filterBarRef: React.Ref<HTMLDivElement>;
  mapPanelRef: React.Ref<HTMLDivElement>;
  petListRef: React.Ref<HTMLDivElement>;
}

const ReferenceSummaryCard = ({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: string }) => (
  <Paper elevation={0} className="owner-reference-summary-card">
    <Box className={`owner-reference-summary-icon ${tone}`}>{icon}</Box>
    <Box className="owner-reference-summary-copy">
      <Typography variant="h4">{value}</Typography>
      <Typography variant="body2">{label}</Typography>
    </Box>
  </Paper>
);

const ReferencePetAvatar: React.FC<{ pet: Pet; size?: number }> = ({ pet, size = 66 }) => {
  const resolvedSrc = usePetImage(pet.apiId || pet.id, pet.imageUrl || pet.avatarUrl);
  return (
    <Avatar
      src={resolvedSrc}
      sx={{
        width: size,
        height: size,
        border: "3px solid #ffffff",
        boxShadow: "0 10px 24px rgba(20, 35, 63, 0.14)",
        bgcolor: "#dbeafe",
        color: "#0f5de7",
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      {pet.name?.charAt(0)}
    </Avatar>
  );
};

const ReferenceMetric = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) => (
  <Box className="owner-reference-detail-metric">
    <Box className={`owner-reference-detail-metric-icon ${tone}`}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption">{label}</Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  </Box>
);

const FiruappReferenceDashboard: React.FC<FiruappReferenceDashboardProps> = ({
  language,
  copy,
  dashboardTheme,
  accountDetails,
  accountMenuAnchor,
  onAccountMenuOpen,
  onAccountMenuClose,
  onToggleTheme,
  onToggleLanguage,
  onLogout,
  filteredDashboardPets,
  selectedPet,
  selectedPetId,
  onSelectPet,
  onStatusChange,
  petDataMode,
  showGeofences,
  onShowGeofencesChange,
  mapStyle,
  onMapStyleChange,
  selectedPetGpsCity,
  selectedPetLocation,
  selectedPetLastSeen,
  selectedPetLocationLabel,
  selectedPetCoordinates,
  selectedPetBattery,
  selectedPetBatteryColor,
  selectedPetIsLost,
  selectedPetGpsOnline,
  selectedPetLocationColor,
  selectedPetLocationBg,
  selectedPetLocationBorder,
  onlinePets,
  lostPets,
  recentAlertItems,
  alertsConnected,
  onLocationsChange,
  petFilters,
  onPetFiltersChange,
  cityOptions,
  detailsPanelOpen,
  onDetailsPanelChange,
  searchBarRef,
  filterBarRef,
  mapPanelRef,
  petListRef,
}) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [activityTab, setActivityTab] = useState<"movement" | "alerts">("movement");
  const [mapMode, setMapMode] = useState<"list" | "map">("map");

  const labels = language === "es"
    ? {
        pets: "Mascotas",
        online: "En línea",
        offline: "Fuera de línea",
        geofences: "Geocercas",
        activeAlerts: "Alertas activas",
        lostPets: "Mascotas perdidas",
        quickActions: "Acciones rápidas",
        addPet: "Agregar mascota",
        createGeofence: "Crear geocerca",
        trackedPets: "Mis Mascotas",
        searchPet: "Buscar mascota...",
        all: "Todas",
        location: selectedPetGpsCity || "Perímetro Urbano Barranquilla",
        list: "Lista",
        map: "Mapa",
        lastSeen: "Última actualización",
        address: "Ubicación actual",
        battery: "Batería",
        signal: "Señal",
        speed: "Velocidad",
        accuracy: "Precisión GPS",
        movement: "Movimientos",
        alerts: "Alertas",
        currentPosition: "Posición actual",
        enteredGeofence: "Entró a geocerca: Casa",
        lastMovement: "Último movimiento",
        today: "Hoy",
        noAlerts: "No hay alertas recientes",
        route: "Ver ruta",
        share: "Compartir",
        alert: "Alertar",
        onlineStatus: "En línea",
        offlineStatus: "Fuera de línea",
        notAvailable: "No disponible",
      }
    : {
        pets: "Pets",
        online: "Online",
        offline: "Offline",
        geofences: "Geofences",
        activeAlerts: "Active alerts",
        lostPets: "Lost pets",
        quickActions: "Quick actions",
        addPet: "Add pet",
        createGeofence: "Create geofence",
        trackedPets: "My Pets",
        searchPet: "Search pet...",
        all: "All",
        location: selectedPetGpsCity || "Urban Perimeter Barranquilla",
        list: "List",
        map: "Map",
        lastSeen: "Last update",
        address: "Current location",
        battery: "Battery",
        signal: "Signal",
        speed: "Speed",
        accuracy: "GPS accuracy",
        movement: "Movement",
        alerts: "Alerts",
        currentPosition: "Current position",
        enteredGeofence: "Entered geofence: Home",
        lastMovement: "Last movement",
        today: "Today",
        noAlerts: "No recent alerts",
        route: "View route",
        share: "Share",
        alert: "Alert",
        onlineStatus: "Online",
        offlineStatus: "Offline",
        notAvailable: "Not available",
      };

  const visiblePets = useMemo(() => {
    if (statusFilter === "online") return filteredDashboardPets.filter((pet) => pet.gpsOnline);
    if (statusFilter === "offline") return filteredDashboardPets.filter((pet) => !pet.gpsOnline);
    return filteredDashboardPets;
  }, [filteredDashboardPets, statusFilter]);

  const petCount = filteredDashboardPets.length;
  const offlineCount = Math.max(petCount - onlinePets.length, 0);
  const selectedPetBreed = selectedPet?.breed || selectedPet?.race || copy.mixedBreed;
  const selectedPetAge = selectedPet?.age || (language === "es" ? "6 años" : "6 years");
  const selectedPetWeight = selectedPet?.weight || "22 kg";
  const selectedPetStatus = selectedPetGpsOnline ? labels.onlineStatus : labels.offlineStatus;
  const selectedPetBatteryValue = selectedPetBattery == null ? labels.notAvailable : `${selectedPetBattery}%`;
  const selectedPetSignal = selectedPetGpsOnline ? (selectedPet?.signal || (language === "es" ? "Alta" : "Strong")) : labels.offlineStatus;
  const selectedPetSpeed = selectedPet?.speed || "0.0 km/h";

  const handleShare = async () => {
    const shareText = `${selectedPet?.name || copy.petsCount}: ${selectedPetLocationLabel}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: selectedPet?.name || "FiruApp", text: shareText });
      } else {
        await navigator.clipboard?.writeText(shareText);
      }
    } catch {
      // Sharing can be cancelled by the user; no UI error is needed.
    }
  };

  return (
    <Box className="owner-reference-dashboard">
      <OwnerReferenceTopbar
        language={language}
        copy={copy}
        dashboardTheme={dashboardTheme}
        accountDetails={accountDetails}
        accountMenuAnchor={accountMenuAnchor}
        searchBarRef={searchBarRef}
        onAccountMenuOpen={onAccountMenuOpen}
        onAccountMenuClose={onAccountMenuClose}
        onToggleTheme={onToggleTheme}
        onToggleLanguage={onToggleLanguage}
        onLogout={onLogout}
      />

      <Box className="owner-reference-layout">
        <OwnerReferenceSidebar language={language} />

        <Box component="main" className="owner-reference-main">
          <Box ref={filterBarRef} className="owner-reference-summary-area">
            <Box className="owner-reference-summary-grid">
              <ReferenceSummaryCard icon={<PetsIcon />} value={petCount} label={labels.pets} tone="blue" />
              <ReferenceSummaryCard icon={<SignalCellularAltIcon />} value={onlinePets.length} label={labels.online} tone="green" />
              <ReferenceSummaryCard icon={<RadarIcon />} value={3} label={labels.geofences} tone="blue" />
              <ReferenceSummaryCard icon={<WarningAmberOutlinedIcon />} value={recentAlertItems.length} label={labels.activeAlerts} tone="orange" />
              <ReferenceSummaryCard icon={<DoNotDisturbAltOutlinedIcon />} value={lostPets.length} label={labels.lostPets} tone="red" />
            </Box>

            <Paper elevation={0} className="owner-reference-quick-actions">
              <Typography variant="subtitle1">{labels.quickActions}</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<span className="owner-reference-plus">+</span>} onClick={() => navigate("/pets")}>
                  {labels.addPet}
                </Button>
                <Button variant="contained" startIcon={<span className="owner-reference-outline-shield">◇</span>} onClick={() => navigate("/geofence")}>
                  {labels.createGeofence}
                </Button>
              </Stack>
            </Paper>
          </Box>

          <Box className={`owner-reference-content-grid${detailsPanelOpen ? "" : " no-details"}`}>
            <Paper ref={petListRef} elevation={0} className="owner-reference-pet-panel">
              <Stack direction="row" alignItems="center" justifyContent="space-between" className="owner-reference-panel-heading">
                <Typography variant="h6">{labels.trackedPets} ({petCount})</Typography>
                <IconButton aria-label={language === "es" ? "Opciones de lista" : "List options"} size="small">
                  <FormatListBulletedIcon />
                </IconButton>
              </Stack>

              <TextField
                fullWidth
                size="small"
                placeholder={labels.searchPet}
                value={petFilters.petName}
                onChange={(event) => onPetFiltersChange({ ...petFilters, petName: event.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                className="owner-reference-pet-search"
              />

              <Stack direction="row" spacing={0.8} className="owner-reference-pet-tabs">
                {[
                  { key: "all" as const, label: `${labels.all} (${petCount})` },
                  { key: "online" as const, label: `${labels.online} (${onlinePets.length})` },
                  { key: "offline" as const, label: `${labels.offline} (${offlineCount})` },
                ].map((tab) => (
                  <Button key={tab.key} className={statusFilter === tab.key ? "is-active" : ""} onClick={() => setStatusFilter(tab.key)}>
                    {tab.label}
                  </Button>
                ))}
              </Stack>

              <FiruappPetsList
                containerRef={undefined}
                pets={visiblePets}
                selectedId={selectedPetId}
                onSelect={(petId) => {
                  onSelectPet(petId);
                  onDetailsPanelChange(true);
                }}
                onStatusChange={onStatusChange}
                copy={copy}
              />
            </Paper>

            <Paper ref={mapPanelRef} elevation={0} className="owner-reference-map-panel">
              <FiruappMapView
                pets={filteredDashboardPets}
                petDataMode={petDataMode}
                showGeofences={showGeofences}
                onShowGeofencesChange={onShowGeofencesChange}
                mapStyle={mapStyle}
                onMapStyleChange={onMapStyleChange}
                locationCity={selectedPetGpsCity}
                mapResizeKey={detailsPanelOpen ? "reference-details" : "reference-map"}
                onSelectPet={(petId) => {
                  onSelectPet(petId);
                  onDetailsPanelChange(true);
                }}
                onLocationsChange={onLocationsChange}
              />
              <Box className="owner-reference-map-toolbar">
                <Button startIcon={<PlaceOutlinedIcon />} endIcon={<KeyboardArrowDownIcon />} className="owner-reference-map-location">
                  {labels.location}
                </Button>
                <Stack direction="row" className="owner-reference-map-mode">
                  <Button startIcon={<FormatListBulletedIcon />} className={mapMode === "list" ? "is-active" : ""} onClick={() => setMapMode("list")}>
                    {labels.list}
                  </Button>
                  <Button startIcon={<MapOutlinedIcon />} className={mapMode === "map" ? "is-active" : ""} onClick={() => setMapMode("map")}>
                    {labels.map}
                  </Button>
                </Stack>
              </Box>
            </Paper>

            {detailsPanelOpen && (
              <Box className="owner-reference-detail-column">
                {selectedPet ? (
                  <Paper elevation={0} className="owner-reference-detail-card">
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                        <ReferencePetAvatar pet={selectedPet} />
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="h5" className="owner-reference-detail-name">{selectedPet.name}</Typography>
                            <Chip label={selectedPetStatus} size="small" className={`owner-reference-status-chip${selectedPetGpsOnline ? " is-online" : ""}`} />
                          </Stack>
                          <Typography variant="body2" className="owner-reference-detail-subtitle">
                            {selectedPetBreed} · {selectedPetAge} · {selectedPetWeight}
                          </Typography>
                        </Box>
                      </Stack>
                      <IconButton size="small" aria-label={language === "es" ? "Más opciones" : "More options"}>
                        <MoreVertIcon />
                      </IconButton>
                    </Stack>

                    <Box className="owner-reference-location-card">
                      <PlaceOutlinedIcon />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" className="owner-reference-location-title">{selectedPetLocationLabel || labels.address}</Typography>
                        <Typography variant="caption">{selectedPetCityLabel(selectedPetLocation, selectedPetGpsCity, language)}</Typography>
                      </Box>
                      <Typography className="owner-reference-location-arrow">›</Typography>
                    </Box>

                    <Box className="owner-reference-update-row">
                      <AccessTimeOutlinedIcon />
                      <Box>
                        <Typography variant="caption">{labels.lastSeen}</Typography>
                        <Typography variant="body2">{selectedPetLastSeen}</Typography>
                      </Box>
                    </Box>

                    <Box className="owner-reference-metrics-grid">
                      <ReferenceMetric icon={<BatteryFullIcon />} label={labels.battery} value={selectedPetBatteryValue} tone="green" />
                      <ReferenceMetric icon={<SignalCellularAltIcon />} label={labels.signal} value={selectedPetSignal} tone="green" />
                      <ReferenceMetric icon={<SpeedOutlinedIcon />} label={labels.speed} value={selectedPetSpeed} tone="violet" />
                      <ReferenceMetric icon={<TimelineIcon />} label={labels.accuracy} value={language === "es" ? "6 metros" : "6 meters"} tone="blue" />
                    </Box>

                    <Stack direction="row" spacing={0.8} className="owner-reference-detail-actions">
                      <Button variant="contained" startIcon={<DirectionsOutlinedIcon />} onClick={() => navigate(`/routes/recent?petId=${selectedPet.apiId || selectedPet.id}`)}>{labels.route}</Button>
                      <Button variant="outlined" startIcon={<ShareOutlinedIcon />} onClick={handleShare}>{labels.share}</Button>
                      <Button variant="outlined" color="error" startIcon={<NotificationsActiveOutlinedIcon />} onClick={() => onStatusChange(selectedPet.apiId || selectedPet.id, "lost")}>{labels.alert}</Button>
                    </Stack>
                  </Paper>
                ) : (
                  <Paper elevation={0} className="owner-reference-empty-detail">
                    <Typography variant="h6">{labels.trackedPets}</Typography>
                    <Typography variant="body2">{language === "es" ? "Selecciona una mascota para ver sus detalles." : "Select a pet to view its details."}</Typography>
                  </Paper>
                )}

                <Paper elevation={0} className="owner-reference-activity-card">
                  <Stack direction="row" className="owner-reference-activity-tabs">
                    <Button className={activityTab === "movement" ? "is-active" : ""} onClick={() => setActivityTab("movement")}>{labels.movement}</Button>
                    <Button className={activityTab === "alerts" ? "is-active" : ""} onClick={() => setActivityTab("alerts")}>
                      {labels.alerts}
                      {recentAlertItems.length > 0 && <span className="owner-reference-activity-count">{recentAlertItems.length}</span>}
                    </Button>
                  </Stack>
                  {activityTab === "movement" ? (
                    <Box className="owner-reference-timeline">
                      <ReferenceTimelineItem tone="green" title={labels.currentPosition} time={`${labels.today}, ${selectedPetLastSeen}`} />
                      <ReferenceTimelineItem tone="blue" title={labels.enteredGeofence} time={`${labels.today}, 3:48 p. m.`} />
                      <ReferenceTimelineItem tone="gray" title={labels.lastMovement} time={`${labels.today}, 3:21 p. m.`} />
                    </Box>
                  ) : (
                    <Box className="owner-reference-alert-list">
                      {recentAlertItems.length ? recentAlertItems.map((alert) => (
                        <Stack key={alert.id} direction="row" spacing={1} alignItems="center" className="owner-reference-alert-row">
                          <WarningAmberOutlinedIcon color="error" />
                          <Typography variant="body2">{alert.title}</Typography>
                          <Typography variant="caption">{alert.time}</Typography>
                          {alert.onDismiss && <IconButton size="small" onClick={alert.onDismiss}><CloseIcon fontSize="small" /></IconButton>}
                        </Stack>
                      )) : (
                        <Typography variant="body2" className="owner-reference-no-alerts">
                          <span className={`owner-reference-alert-dot${alertsConnected ? " is-connected" : ""}`} />
                          {labels.noAlerts}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const ReferenceTimelineItem = ({ tone, title, time }: { tone: "green" | "blue" | "gray"; title: string; time: string }) => (
  <Box className="owner-reference-timeline-item">
    <span className={`owner-reference-timeline-dot ${tone}`} />
    <Box>
      <Typography variant="body2">{title}</Typography>
      <Typography variant="caption">{time}</Typography>
    </Box>
  </Box>
);

const selectedPetCityLabel = (location: ReferencePetLocation | undefined, city: string | undefined, language: DashboardLanguage) => {
  const cityName = location?.city || city;
  if (cityName) return cityName;
  return language === "es" ? "Barranquilla, Atlántico" : "Barranquilla, Atlántico";
};

export default FiruappReferenceDashboard;
