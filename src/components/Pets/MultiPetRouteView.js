import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "@mui/material";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { CenterRouteMap, normalizeRouteLocations } from "./routeMapUtils";
import FiruappPetsList from "../Dashboard/ui/FiruappPetList.tsx";
import "./routeMapStyles.css";
import MapControls from "./MapControls.tsx";
import PageHeader from "../Dashboard/ui/PageHeader.tsx";
import { buildApiUrl } from "../../config/runtime";
import { isOwnedByCurrentUser } from "../../services/auth.ts";
import { extractPetDtos } from "../../services/petData.ts";
import { getApiErrorMessage } from "../../config/plans.ts";
import { usePlan } from "../../context/PlanContext.tsx";
import { downloadPetReport } from "../../services/currentUser.ts";

const mapStyles = {
  clean: {
    label: "Mapa claro",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  natural: {
    label: "Mapa detallado",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

const weekDays = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const weekdayAliases = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
  7: "sunday",
  mon: "monday",
  monday: "monday",
  lunes: "monday",
  tue: "tuesday",
  tues: "tuesday",
  tuesday: "tuesday",
  martes: "tuesday",
  wed: "wednesday",
  wednesday: "wednesday",
  miercoles: "wednesday",
  miércoles: "wednesday",
  thu: "thursday",
  thur: "thursday",
  thurs: "thursday",
  thursday: "thursday",
  jueves: "thursday",
  fri: "friday",
  friday: "friday",
  viernes: "friday",
  sat: "saturday",
  saturday: "saturday",
  sabado: "saturday",
  sábado: "saturday",
  sun: "sunday",
  sunday: "sunday",
  domingo: "sunday",
};

const normalizeWeekdayKey = (value) => {
  if (value == null) return "";
  const normalized = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return weekdayAliases[normalized] || "";
};

const normalizeDistanceKm = (item) => {
  const kmValue = Number(item.distanceKm ?? item.totalKm ?? item.km ?? item.walkDistanceKm);
  if (Number.isFinite(kmValue)) return kmValue;

  const meterValue = Number(item.distanceMeters ?? item.totalMeters ?? item.meters ?? item.walkDistanceMeters);
  if (Number.isFinite(meterValue)) return meterValue / 1000;

  const ambiguousDistance = Number(item.distance ?? item.totalDistance ?? item.walkDistance);
  if (!Number.isFinite(ambiguousDistance)) return 0;
  return ambiguousDistance > 100 ? ambiguousDistance / 1000 : ambiguousDistance;
};

const normalizeWalkDistanceWeek = (data) => {
  const raw = data?.walkDistance || data?.distances || data?.week || data?.days || data?.data || data?.items || data?.results || data || [];
  const entries = Array.isArray(raw)
    ? raw
    : Object.entries(raw).map(([day, value]) =>
        typeof value === "object" && value !== null ? { day, ...value } : { day, distanceKm: value }
      );

  const distancesByDay = Object.fromEntries(weekDays.map((day) => [day.key, 0]));
  entries.forEach((item) => {
    const dayKey = normalizeWeekdayKey(item.day ?? item.dayOfWeek ?? item.weekday ?? item.name ?? item.date);
    if (!dayKey) return;
    distancesByDay[dayKey] = normalizeDistanceKm(item);
  });

  return weekDays.map((day) => ({
    ...day,
    distanceKm: distancesByDay[day.key] || 0,
  }));
};

const formatDistanceKm = (distanceKm) => `${distanceKm.toFixed(distanceKm >= 10 ? 1 : 2)} km`;

const toRouteRangeParam = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const recentRoutePeriods = [
  { minutes: 10, label: "10 minutes" },
  { minutes: 60, label: "1 hour" },
];

const toRouteTimeInput = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const normalizePetStatus = (status) => (String(status || "active").toLowerCase() === "lost" ? "lost" : "active");

const mapDtoToRoutePet = (dto) => {
  const id = String(dto.id);
  return {
    id,
    apiId: id,
    name: dto.name || "Unnamed pet",
    status: normalizePetStatus(dto.status),
    ownerName: dto.ownerName || dto.owner?.name || "",
    breed: dto.race || dto.type || "Tracked pet",
    race: dto.race,
    age: dto.age != null ? `${dto.age} years` : undefined,
    weight: dto.weight != null ? `${dto.weight} kg` : undefined,
    imageUrl: dto.imageUrl || dto.avatarUrl || dto.photoUrl || dto.petImageUrl || dto.image || dto.imagePath,
    battery: dto.batteryPercent ?? dto.batteryPercentage ?? dto.battery,
    signal: "Good",
    speed: "0.0 km/h",
  };
};

const createRoutePointIcon = (index) => L.divIcon({
  className: "firu-route-point-marker",
  html: `<div class="firu-route-point">${index + 1}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

const MultiPetRouteView = ({ apiBaseUrl = buildApiUrl("/api/pets") }) => {
  const initialPetId = new URLSearchParams(window.location.search).get("petId");
  const [routePets, setRoutePets] = useState([]);
  const [routePoints, setRoutePoints] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId);
  const [mapStyle, setMapStyle] = useState("clean");
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingWalkDistance, setLoadingWalkDistance] = useState(false);
  const [routeRange, setRouteRange] = useState({ from: "", to: "" });
  const [appliedRouteRange, setAppliedRouteRange] = useState(null);
  const [walkDistanceWeek, setWalkDistanceWeek] = useState(() => normalizeWalkDistanceWeek([]));
  const [routeFeedback, setRouteFeedback] = useState(null);
  const [exportingFormat, setExportingFormat] = useState("");
  const { limits, isAdmin, plan, canExportReports } = usePlan();

  const activeMapStyle = mapStyles[mapStyle];

  const selectedPet = useMemo(
    () => routePets.find((pet) => pet.id === selectedPetId),
    [routePets, selectedPetId]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchPets = async () => {
      setLoadingPets(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(apiBaseUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const petDtos = extractPetDtos(response.data);
        const databasePets = Array.isArray(petDtos)
          ? petDtos.filter((pet) => isOwnedByCurrentUser(pet)).map(mapDtoToRoutePet)
          : [];

        if (!cancelled) {
          setRoutePets(databasePets);
        }
      } catch (error) {
        console.error("Error fetching route pets:", error);
        if (!cancelled) {
          setRoutePets([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPets(false);
        }
      }
    };

    fetchPets();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    setSelectedPetId((currentSelectedId) =>
      routePets.some((pet) => pet.id === currentSelectedId) ? currentSelectedId : (routePets.find(pet => pet.id === initialPetId)?.id || null)
    );
  }, [routePets, initialPetId]);

  useEffect(() => {
    if (!selectedPetId) {
      setRoutePoints([]);
      setLoadingRoute(false);
      setAppliedRouteRange(null);
      setWalkDistanceWeek(normalizeWalkDistanceWeek([]));
      return;
    }

    let cancelled = false;

    const fetchPetRoute = async () => {
      setLoadingRoute(true);
      try {
        const token = localStorage.getItem("token");
        const params =
          appliedRouteRange?.from && appliedRouteRange?.to
            ? new URLSearchParams({
                from: toRouteRangeParam(appliedRouteRange.from),
                to: toRouteRangeParam(appliedRouteRange.to),
              })
            : null;
        const endpoint = params
          ? `${apiBaseUrl}/${selectedPetId}/route/range?${params.toString()}`
          : `${apiBaseUrl}/${selectedPetId}/route`;
        const response = await axios.get(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const normalizedRoutePoints = normalizeRouteLocations(response.data).map((point) => ({
          ...point,
          petId: selectedPetId,
          petName: point.petName || selectedPet?.name || "Unknown",
        }));

        if (!cancelled) setRoutePoints(normalizedRoutePoints);
      } catch (error) {
        console.error("Error fetching pet route:", error);
        if (!cancelled) {
          setRoutePoints([]);
          setRouteFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudo cargar el historial de la mascota.") });
        }
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    };

    fetchPetRoute();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, appliedRouteRange, selectedPet?.name, selectedPetId]);

  useEffect(() => {
    if (!selectedPetId) {
      setWalkDistanceWeek(normalizeWalkDistanceWeek([]));
      return;
    }

    let cancelled = false;

    const fetchWalkDistanceWeek = async () => {
      setLoadingWalkDistance(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${apiBaseUrl}/${selectedPetId}/walk-distance/week`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!cancelled) {
          setWalkDistanceWeek(normalizeWalkDistanceWeek(response.data));
        }
      } catch (error) {
        console.error("Error fetching weekly walk distance:", error);
        if (!cancelled) {
          setWalkDistanceWeek(normalizeWalkDistanceWeek([]));
        }
      } finally {
        if (!cancelled) {
          setLoadingWalkDistance(false);
        }
      }
    };

    fetchWalkDistanceWeek();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, selectedPetId]);

  const weeklyWalkDistanceTotal = useMemo(
    () => walkDistanceWeek.reduce((total, day) => total + day.distanceKm, 0),
    [walkDistanceWeek]
  );

  const handleApplyRouteRange = () => {
    setRouteFeedback(null);
    if (!selectedPetId) {
      alert("Select a pet before searching route positions.");
      return;
    }

    if (!routeRange.from || !routeRange.to) {
      alert("Select both From and To times.");
      return;
    }

    if (new Date(routeRange.from).getTime() > new Date(routeRange.to).getTime()) {
      alert("From must be before To.");
      return;
    }

    const cutoff = Date.now() - limits.historyDays * 24 * 60 * 60 * 1000;
    if (!isAdmin && new Date(routeRange.from).getTime() < cutoff) {
      setRouteFeedback({ severity: "warning", message: `Tu plan ${plan} permite consultar únicamente los últimos ${limits.historyDays} días de historial.` });
      return;
    }

    setAppliedRouteRange(routeRange);
  };

  const handleClearRouteRange = () => {
    setRouteRange({ from: "", to: "" });
    setAppliedRouteRange(null);
  };

  const handleRecentRoutePeriod = ({ minutes, label }) => {
    setRouteFeedback(null);
    const to = new Date();
    const from = new Date(to.getTime() - minutes * 60 * 1000);
    const range = { from: toRouteTimeInput(from), to: toRouteTimeInput(to) };
    setRouteRange(range);
    setAppliedRouteRange({ ...range, presetLabel: label });
  };

  const handleExport = async (format) => {
    if (!selectedPetId) {
      setRouteFeedback({ severity: "warning", message: "Selecciona una mascota antes de descargar el reporte." });
      return;
    }
    if (!canExportReports) {
      setRouteFeedback({ severity: "warning", message: "La descarga de reportes está disponible únicamente para usuarios Premium." });
      return;
    }

    setExportingFormat(format);
    setRouteFeedback(null);
    try {
      await downloadPetReport(selectedPetId, format);
      setRouteFeedback({ severity: "success", message: `El reporte ${format.toUpperCase()} se descargó correctamente.` });
    } catch (error) {
      setRouteFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudo descargar el reporte.") });
    } finally {
      setExportingFormat("");
    }
  };

  const routePeriodLabel = appliedRouteRange
    ? appliedRouteRange.presetLabel ? `Last ${appliedRouteRange.presetLabel}` : "Selected time range"
    : "Last 3 hours";

  const routeCoords = useMemo(
    () => routePoints.map((point) => [point.latitude, point.longitude]),
    [routePoints]
  );

  const selectedRoute = useMemo(
    () =>
      selectedPetId
        ? {
            petId: selectedPetId,
            petName: selectedPet?.name || "Unknown",
            points: routePoints,
            coords: routeCoords,
          }
        : null,
    [routeCoords, routePoints, selectedPet?.name, selectedPetId]
  );


  return (
    <div className="firu-route-page firu-history-page">
      <div className="firu-mobile-only"><PageHeader title="Historial" /></div>
      <div className="firu-history-intro firu-mobile-only"><h2>{selectedPet ? `Recorrido de ${selectedPet.name}` : 'Los pasos de tu mascota'}</h2><p>Selecciona una mascota para ver sus últimas posiciones.</p></div>
      <div className="firu-route-header">
        <h2>Movement trail · {routePeriodLabel}</h2>
        <p>
          {loadingPets ? "Loading pets from the database." : "Select a database pet and optionally search positions by time range."}
        </p>
      </div>

      <Alert severity={canExportReports ? "success" : "info"} sx={{ mb: 1.5 }}>
        {isAdmin
          ? "Administrador: historial y exportaciones sin límite de plan."
          : `Tu plan ${plan} permite ${limits.historyDays} días de historial${canExportReports ? " y exportación PDF/CSV" : ". La exportación está disponible en Premium"}.`}
      </Alert>
      {routeFeedback && <Alert severity={routeFeedback.severity} sx={{ mb: 1.5 }}>{routeFeedback.message}</Alert>}

      <div className={`firu-route-map-shell map-style-${mapStyle}`}>
        <div className="firu-history-pets"><FiruappPetsList
          pets={routePets}
          selectedId={selectedPetId || undefined}
          onSelect={setSelectedPetId}
        /></div>

        <div className="firu-map-canvas"><MapContainer
          center={[6.235, -75.585]}
          zoom={13}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            key={mapStyle}
            url={activeMapStyle.url}
            attribution={activeMapStyle.attribution}
          />

          <CenterRouteMap coords={routeCoords} />
          <MapControls coordinates={routeCoords} cleanLayer={mapStyle === "clean"} onToggleLayer={() => setMapStyle(current => current === "natural" ? "clean" : "natural")} />

          {selectedRoute?.coords.length > 1 && (
            <Polyline
              positions={selectedRoute.coords}
              pathOptions={{ color: "#14b8a6", weight: 5, opacity: 0.9 }}
            />
          )}

          {selectedRoute?.points.map((point, pointIndex) => (
            <Marker
              key={`${selectedRoute.petId}-${point.latitude}-${point.longitude}-${pointIndex}`}
              position={[point.latitude, point.longitude]}
              icon={createRoutePointIcon(pointIndex)}
            >
              <Popup>
                <strong>{selectedRoute.petName}</strong>
                <br />
                Point #{pointIndex + 1}
                <br />
                Lat: {point.latitude.toFixed(5)}, Lng:{" "}
                {point.longitude.toFixed(5)}
                {point.timestamp && (
                  <>
                    <br />
                    {new Date(point.timestamp).toLocaleString()}
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer></div>
        <div className="firu-route-mobile-stats firu-mobile-only"><div><strong>{selectedRoute?.points.length || 0}</strong><span>posiciones</span></div><div><strong>{formatDistanceKm(weeklyWalkDistanceTotal)}</strong><span>esta semana</span></div></div>

        <div className="firu-route-tools firu-route-range-tools">
          <span className="firu-route-tool">Route</span>
          {recentRoutePeriods.map((period) => (
            <button
              key={period.minutes}
              type="button"
              className={`firu-route-tool firu-geofence-button ${appliedRouteRange?.presetLabel === period.label ? "active" : ""}`}
              aria-pressed={appliedRouteRange?.presetLabel === period.label}
              onClick={() => handleRecentRoutePeriod(period)}
              disabled={!selectedPetId || loadingRoute}
            >
              {period.label}
            </button>
          ))}
          <input
            className="firu-route-time-input"
            type="datetime-local"
            step="1"
            value={routeRange.from}
            onChange={(event) => setRouteRange((current) => ({ ...current, from: event.target.value }))}
            aria-label="Route range from"
          />
          <input
            className="firu-route-time-input"
            type="datetime-local"
            step="1"
            value={routeRange.to}
            onChange={(event) => setRouteRange((current) => ({ ...current, to: event.target.value }))}
            aria-label="Route range to"
          />
          <button
            className="firu-route-tool firu-geofence-button"
            onClick={handleApplyRouteRange}
            disabled={!selectedPetId || loadingRoute}
          >
            Search
          </button>
          <button
            className="firu-route-tool firu-geofence-button"
            onClick={handleClearRouteRange}
            disabled={loadingRoute && !appliedRouteRange}
          >
            Clear
          </button>
          <button
            className="firu-route-tool firu-geofence-button"
            onClick={() => setMapStyle((current) => current === "natural" ? "clean" : "natural")}
          >
            {activeMapStyle.label}
          </button>
          <button
            className="firu-route-tool firu-geofence-button"
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={!selectedPetId || Boolean(exportingFormat)}
          >
            {exportingFormat === "pdf" ? "Downloading…" : "Export PDF"}
          </button>
          <button
            className="firu-route-tool firu-geofence-button"
            type="button"
            onClick={() => handleExport("csv")}
            disabled={!selectedPetId || Boolean(exportingFormat)}
          >
            {exportingFormat === "csv" ? "Downloading…" : "Export CSV"}
          </button>
        </div>

        <div className="firu-route-status">
          <span className="firu-route-pill"><span className="firu-route-dot" /> GPS LOCK</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> {appliedRouteRange ? "RANGE" : "HISTORY"}</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> {selectedRoute ? selectedRoute.petName : loadingPets ? "LOADING PETS" : "SELECT PET"}</span>
        </div>

        <div className="firu-walk-distance-table">
          <div className="firu-walk-distance-header">
            <div>
              <strong>Walk distance</strong>
              <span>{selectedPet?.name || "Select pet"}</span>
            </div>
            <span>{loadingWalkDistance ? "..." : formatDistanceKm(weeklyWalkDistanceTotal)}</span>
          </div>
          <table>
            <tbody>
              {walkDistanceWeek.map((day) => (
                <tr key={day.key}>
                  <th>{day.label}</th>
                  <td>{loadingWalkDistance ? "..." : formatDistanceKm(day.distanceKm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="firu-route-card">
          <div className="firu-route-card-label">ROUTE POINTS</div>
          <div className="firu-route-card-value">{loadingRoute ? "..." : selectedRoute ? selectedRoute.points.length : 0}</div>
          <div className="firu-route-card-copy">
            {loadingRoute
              ? "Loading route positions"
              : selectedRoute
                ? `${selectedRoute.petName}'s ${routePeriodLabel.toLowerCase()}`
                : loadingPets
                  ? "Loading database pets"
                  : "Select a pet to show its trail"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiPetRouteView;
