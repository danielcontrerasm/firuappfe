import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { CenterRouteMap, normalizeRouteLocations } from "./routeMapUtils";
import FiruappPetsList from "../Dashboard/ui/FiruappPetList.tsx";
import "./routeMapStyles.css";
import { buildApiUrl } from "../../config/runtime";

const mapStyles = {
  clean: {
    label: "Clean map",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  natural: {
    label: "Natural map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

const toRouteRangeParam = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const extractPetDtos = (data) => {
  if (Array.isArray(data)) return data;
  return data?.content || data?.items || data?.pets || data?.data || data?.results || data?.rows || data?.payload || [];
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

const createPetIcon = () =>
  L.divIcon({
    className: "firu-marker",
    html: `
      <div class="firu-marker-wrap">
        <div class="firu-marker-pulse"></div>
        <div class="firu-marker-core">🐾</div>
      </div>
    `,
    iconSize: [58, 58],
    iconAnchor: [29, 29],
    popupAnchor: [0, -30],
  });

const MultiPetRouteView = ({ apiBaseUrl = buildApiUrl("/api/pets") }) => {
  const [routePets, setRoutePets] = useState([]);
  const [routePoints, setRoutePoints] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [mapStyle, setMapStyle] = useState("natural");
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeRange, setRouteRange] = useState({ from: "", to: "" });
  const [appliedRouteRange, setAppliedRouteRange] = useState(null);

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
        const databasePets = Array.isArray(petDtos) ? petDtos.map(mapDtoToRoutePet) : [];

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
      routePets.some((pet) => pet.id === currentSelectedId) ? currentSelectedId : null
    );
  }, [routePets]);

  useEffect(() => {
    if (!selectedPetId) {
      setRoutePoints([]);
      setAppliedRouteRange(null);
      return;
    }

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

        setRoutePoints(normalizedRoutePoints);
      } catch (error) {
        console.error("Error fetching pet route:", error);
        setRoutePoints([]);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchPetRoute();
  }, [apiBaseUrl, appliedRouteRange, selectedPet?.name, selectedPetId]);

  const handleApplyRouteRange = () => {
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

    setAppliedRouteRange(routeRange);
  };

  const handleClearRouteRange = () => {
    setRouteRange({ from: "", to: "" });
    setAppliedRouteRange(null);
  };

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

  const petIcon = useMemo(
    () => createPetIcon(),
    []
  );

  return (
    <div className="firu-route-page">
      <div className="firu-route-header">
        <h2>Movement trail · Last 3 hours</h2>
        <p>
          {loadingPets ? "Loading pets from the database." : "Select a database pet and optionally search positions by time range."}
        </p>
      </div>

      <div className={`firu-route-map-shell map-style-${mapStyle}`}>
        <FiruappPetsList
          pets={routePets}
          selectedId={selectedPetId || undefined}
          onSelect={setSelectedPetId}
        />

        <MapContainer
          center={[6.235, -75.585]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            key={mapStyle}
            url={activeMapStyle.url}
            attribution={activeMapStyle.attribution}
          />

          <CenterRouteMap coords={routeCoords} />

          {selectedRoute?.coords.length > 1 && (
            <Polyline
              positions={selectedRoute.coords}
              pathOptions={{ color: "#8b5cf6", weight: 4, opacity: 0.65, dashArray: "8 8" }}
            />
          )}

          {selectedRoute?.points.map((point, pointIndex) => (
            <Marker
              key={`${selectedRoute.petId}-${point.latitude}-${point.longitude}-${pointIndex}`}
              position={[point.latitude, point.longitude]}
              icon={petIcon}
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
        </MapContainer>

        <div className="firu-route-tools">
          <span className="firu-route-tool">Route</span>
          <input
            className="firu-route-time-input"
            type="datetime-local"
            value={routeRange.from}
            onChange={(event) => setRouteRange((current) => ({ ...current, from: event.target.value }))}
            aria-label="Route range from"
          />
          <input
            className="firu-route-time-input"
            type="datetime-local"
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
        </div>

        <div className="firu-route-status">
          <span className="firu-route-pill"><span className="firu-route-dot" /> GPS LOCK</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> {appliedRouteRange ? "RANGE" : "HISTORY"}</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> {selectedRoute ? selectedRoute.petName : loadingPets ? "LOADING PETS" : "SELECT PET"}</span>
        </div>

        <div className="firu-route-card">
          <div className="firu-route-card-label">ROUTE POINTS</div>
          <div className="firu-route-card-value">{loadingRoute ? "..." : selectedRoute ? selectedRoute.points.length : 0}</div>
          <div className="firu-route-card-copy">
            {loadingRoute
              ? "Loading route positions"
              : selectedRoute
                ? appliedRouteRange
                  ? `${selectedRoute.petName}'s selected range`
                  : `${selectedRoute.petName}'s last 3 hours`
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
