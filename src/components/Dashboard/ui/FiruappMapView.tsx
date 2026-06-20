// ui/FiruappMapView.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import axios from "axios";
import { Circle, MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import DrawIcon from "@mui/icons-material/Draw";
import PolylineIcon from "@mui/icons-material/Polyline";
import RadarIcon from "@mui/icons-material/Radar";
import { firuColors, Pet } from "./FiruappStyles.ts";
import { loadPetImage } from "../../../services/usePetImage.ts";
import { buildApiUrl } from "../../../config/runtime";

interface PetLocation {
  id: string | number;
  petId?: string | number;
  latitude: number;
  longitude: number;
  petName?: string;
  timestamp?: string;
  imageUrl?: string;
  avatarUrl?: string;
  status?: string;
}

interface PetGeofence {
  id: string | number;
  petId: string;
  petName: string;
  type: "polygon" | "circle";
  coordinates?: LatLngExpression[];
  center?: LatLngExpression;
  radiusMeters?: number;
}

interface MapViewProps {
  apiUrl?: string;
  selectedPet?: Pet;
  pets?: Pet[];
  petDataMode?: "mock" | "database" | "mixed";
  onSelectPet?: (id: string) => void;
}

const fallbackCenter: LatLngExpression = [6.2442, -75.5812];

const petImagesById: Record<string, string> = {
  "2": "/german.png",
  "3": "/labrador.png",
};

const petImagesByName: Record<string, string> = {
  bella: "/german.png",
  rocky: "/labrador.png",
};

const geofenceColors = [firuColors.cyan, firuColors.green, firuColors.orange, firuColors.violet];
const mapStyles = {
  clean: {
    label: "Clean map",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    filter: "saturate(0.82) contrast(1.02) brightness(1.03)",
  },
  natural: {
    label: "Natural map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    filter: "saturate(1.45) contrast(1.08) brightness(1.02)",
  },
};

const normalizePetName = (name?: string) => name?.trim().toLowerCase();
const normalizeStatus = (status?: string) => status?.trim().toLowerCase().replace(/[\s-]+/g, "_");
const isAlertStatus = (status?: string) => {
  const normalized = normalizeStatus(status);
  return normalized === "lost" || normalized === "out_of_geofence" || normalized === "outside_geofence" || normalized === "outside_safe_zone";
};

const normalizeImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (/^(https?:)?\/\//.test(url) || url.startsWith("/")) return url;
  return `/${url}`;
};

const normalizeCoordinate = (coordinate: any): LatLngExpression | null => {
  if (Array.isArray(coordinate)) {
    const longitude = Number(coordinate[0]);
    const latitude = Number(coordinate[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
  }

  const latitude = Number(coordinate?.latitude ?? coordinate?.lat);
  const longitude = Number(coordinate?.longitude ?? coordinate?.lng ?? coordinate?.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
};

const normalizeCircleCenter = (geofence: any): LatLngExpression | null => {
  const center = geofence?.center || geofence;
  const latitude = Number(center.latitude ?? center.lat ?? geofence?.centerLat ?? geofence?.centerLatitude ?? geofence?.latitude);
  const longitude = Number(center.longitude ?? center.lng ?? center.lon ?? geofence?.centerLng ?? geofence?.centerLongitude ?? geofence?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
};

/*
 * Optional client-side geofence containment detection.
 * Disabled for now while we decide whether alert state should come only from the backend.
 *
 * const toLatLngPair = ...
 * const distanceMeters = ...
 * const pointInPolygon = ...
 * const isPointInsideGeofence = ...
 */

const normalizeGeofences = (data: any, pet: { id: string; name: string }): PetGeofence[] => {
  const rawGeofences = data?.geofences || data?.items || data || [];
  const geofences = Array.isArray(rawGeofences) ? rawGeofences : [rawGeofences];

  return geofences
    .map((geofence: any, index: number) => {
      const type = (geofence?.type || geofence?.shape || "").toLowerCase();
      const center = normalizeCircleCenter(geofence);
      const radiusMeters = Number(geofence?.radiusMeters ?? geofence?.radius ?? geofence?.radiusInMeters);

      if (type === "circle" || (center && Number.isFinite(radiusMeters))) {
        if (!center || !Number.isFinite(radiusMeters)) return null;
        return {
          id: geofence.id ?? `${pet.id}-circle-${index}`,
          petId: pet.id,
          petName: pet.name,
          type: "circle",
          center,
          radiusMeters,
        };
      }

      const rawCoordinates = geofence?.coordinates || geofence?.polygon || geofence?.points || [];
      const coordinates = rawCoordinates.map(normalizeCoordinate).filter(Boolean) as LatLngExpression[];
      if (coordinates.length < 3) return null;

      return {
        id: geofence.id ?? `${pet.id}-geofence-${index}`,
        petId: pet.id,
        petName: pet.name,
        type: "polygon",
        coordinates,
      };
    })
    .filter(Boolean) as PetGeofence[];
};

const CenterMap: React.FC<{ markers: PetLocation[] }> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) return;
    const avgLat = markers.reduce((sum, p) => sum + p.latitude, 0) / markers.length;
    const avgLng = markers.reduce((sum, p) => sum + p.longitude, 0) / markers.length;
    map.setView([avgLat, avgLng], 14);
  }, [markers, map]);

  return null;
};

const createPetIcon = (imageUrl?: string, status?: string) =>
  L.divIcon({
    className: "firu-pet-marker-wrapper",
    html: `
      <div class="firu-pet-marker-shell ${isAlertStatus(status) ? "alert" : ""}">
        <div class="firu-pet-marker ${isAlertStatus(status) ? "alert" : ""}">
          ${imageUrl ? `<img src="${imageUrl}" alt="" />` : "🐾"}
        </div>
      </div>
    `,
    iconSize: [58, 58],
    iconAnchor: [29, 58],
    popupAnchor: [0, -58],
  });

const mockPetLocations: PetLocation[] = [
  {
    id: "mock-location-1",
    petId: "mock-2",
    latitude: 6.2442,
    longitude: -75.5812,
    petName: "Bella",
    timestamp: new Date().toISOString(),
    imageUrl: "/german.png",
    status: "active",
  },
  {
    id: "mock-location-2",
    petId: "mock-3",
    latitude: 6.2482,
    longitude: -75.5862,
    petName: "Rocky",
    timestamp: new Date().toISOString(),
    imageUrl: "/labrador.png",
    status: "lost",
  },
];

const FiruappMapView: React.FC<MapViewProps> = ({
  apiUrl = buildApiUrl("/api/pets/locations"),
  selectedPet,
  pets = [],
  petDataMode = "mixed",
  onSelectPet,
}) => {
  const [petLocations, setPetLocations] = useState<PetLocation[]>([]);
  const [petGeofences, setPetGeofences] = useState<PetGeofence[]>([]);
  const [geofencesLoaded, setGeofencesLoaded] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapStyle, setMapStyle] = useState<"clean" | "natural">("natural");
  const [petImageBlobUrls, setPetImageBlobUrls] = useState<Record<string, string>>({});
  const statusByPetId = useMemo(
    () =>
      Object.fromEntries(
        pets
          .map((pet) => [String(pet.apiId || pet.id), pet.status] as const)
          .filter(([petId]) => !petId.startsWith("mock-"))
      ),
    [pets]
  );
  const dashboardPetIdByLocationPetId = useMemo(
    () =>
      Object.fromEntries(
        pets.flatMap((pet) => {
          const ids = new Set([pet.id, pet.apiId].filter(Boolean).map(String));
          return Array.from(ids).map((id) => [id, pet.id] as const);
        })
      ),
    [pets]
  );
  const statusAlertPetIds = useMemo(
    () =>
      pets
        .filter((pet) => isAlertStatus(pet.status))
        .map((pet) => String(pet.apiId || pet.id)),
    [pets]
  );
  const visiblePetIds = useMemo(
    () =>
      new Set(
        pets.flatMap((pet) => Array.from(new Set([pet.id, pet.apiId].filter(Boolean).map(String))))
      ),
    [pets]
  );

  useEffect(() => {
    const fetchPetLocations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const locations: unknown = (response.data && response.data.locations) || response.data || [];

        if (Array.isArray(locations)) {
          const normalized = locations
            .map((loc: any) => {
              if (!loc) return null;
              const latitude = Number(loc.latitude);
              const longitude = Number(loc.longitude);
              if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
              const petId = loc.petId ?? loc.pet_id ?? loc.pet?.id ?? loc.pet?.petId ?? loc.pet?.pet_id;
              const petName = loc.petName ?? loc.name ?? loc.pet?.name;
              const imageUrl = normalizeImageUrl(
                loc.imageUrl ??
                  loc.avatarUrl ??
                  loc.pet?.imageUrl ??
                  loc.pet?.avatarUrl ??
                  (petId != null ? petImagesById[String(petId)] : undefined) ??
                  (petName ? petImagesByName[normalizePetName(petName) || ""] : undefined)
              );
              return {
                id: loc.id ?? loc.petId ?? `${latitude}-${longitude}`,
                petId,
                latitude,
                longitude,
                petName,
                timestamp: loc.timestamp ?? loc.updatedAt ?? loc.createdAt,
                imageUrl,
                avatarUrl: normalizeImageUrl(loc.avatarUrl ?? loc.pet?.avatarUrl),
                status: loc.status ?? loc.pet?.status,
              } satisfies PetLocation;
            })
            .filter(Boolean) as PetLocation[];

          setPetLocations(normalized);
        }
      } catch (error) {
        console.error("Error fetching pet locations:", error);
      }
    };

    fetchPetLocations();
    const interval = window.setInterval(fetchPetLocations, 8000);
    return () => window.clearInterval(interval);
  }, [apiUrl]);

  useEffect(() => {
    const fetchPetGeofences = async () => {
      const petsForGeofences = pets
        .map((pet) => ({
          id: pet.apiId || pet.id,
          name: pet.name,
        }))
        .filter((pet) => pet.id && !String(pet.id).startsWith("mock-"));

      if (!petsForGeofences.length) {
        setPetGeofences([]);
        setGeofencesLoaded(true);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const responses = await Promise.all(
          petsForGeofences.map(async (pet) => {
            try {
              const response = await axios.get(buildApiUrl(`/api/geofences/${pet.id}`), {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              });
              return normalizeGeofences(response.data, pet);
            } catch (error) {
              console.error(`Error fetching geofences for ${pet.name}:`, error);
              return [];
            }
          })
        );

        setPetGeofences(responses.flat());
      } finally {
        setGeofencesLoaded(true);
      }
    };

    fetchPetGeofences();
  }, [pets]);

  const displayMarkers = useMemo(
    () => {
      if (petDataMode === "mock") {
        return mockPetLocations.filter((location) => visiblePetIds.has(String(location.petId ?? location.id)));
      }

      if (petDataMode === "database") {
        return petLocations.filter((location) => visiblePetIds.has(String(location.petId ?? location.id)));
      }

      return [...mockPetLocations, ...petLocations].filter((location) => visiblePetIds.has(String(location.petId ?? location.id)));
    },
    [petDataMode, petLocations, visiblePetIds]
  );
  const markerPetIds = useMemo(
    () =>
      Array.from(
        new Set(
          displayMarkers
            .map((pet) => pet.petId)
            .filter((petId): petId is string | number => petId != null)
            .map(String)
        )
      ),
    [displayMarkers]
  );
  const markerPetIdsKey = markerPetIds.join("|");

  /*
   * Optional client-side outside-geofence marker detection.
   * Keep disabled for now; current alert styling follows explicit backend pet status only.
   *
   * const outsideGeofencePetIds = useMemo(() => { ... }, [displayMarkers, petGeofences]);
   */
  const alertPetIds = useMemo(
    () => new Set(statusAlertPetIds),
    [statusAlertPetIds]
  );

  useEffect(() => {
    if (!markerPetIds.length) return undefined;

    let cancelled = false;

    const fetchMarkerImages = async () => {
      const entries = await Promise.all(
        markerPetIds.map(async (petId) => {
          try {
            const objectUrl = await loadPetImage(petId);
            if (!objectUrl) return null;
            return [petId, objectUrl] as const;
          } catch (error) {
            console.error(`Error loading marker image for pet ${petId}:`, error);
            return null;
          }
        })
      );

      if (!cancelled) {
        setPetImageBlobUrls(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, string]>));
      }
    };

    fetchMarkerImages();

    return () => {
      cancelled = true;
    };
  }, [markerPetIds, markerPetIdsKey]);

  const isLiveLocationData = petLocations.length > 0;
  const activeMapStyle = mapStyles[mapStyle];

  // const mainMarker = displayMarkers[0];
  // const routeLine: LatLngExpression[] = displayMarkers.map((pet) => [pet.latitude, pet.longitude]);

  return (
    <Box
      sx={{
        position: "relative",
        height: { xs: "calc(100vh - 170px)", md: "calc(100vh - 230px)" },
        minHeight: { xs: 440, md: 560 },
      }}
    >
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          position: "absolute",
          top: 14,
          right: 12,
          zIndex: 1000,
          px: 1.25,
          py: 0.7,
          borderRadius: 999,
          bgcolor: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(226,232,240,0.95)",
          boxShadow: "0 12px 26px rgba(15,23,42,0.12)",
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <GpsFixedIcon sx={{ fontSize: 15, color: isLiveLocationData ? firuColors.green : firuColors.orange }} />
        <Typography variant="caption" sx={{ color: firuColors.dark, fontWeight: 900 }}>
          {displayMarkers.length} active
        </Typography>
      </Box>

      <Box
        sx={{
          height: "100%",
          borderRadius: { xs: 4, md: 5 },
          overflow: "hidden",
          border: "1px solid rgba(203,213,225,0.9)",
          boxShadow: "0 20px 45px rgba(15,23,42,0.10)",
          "& .leaflet-container": { background: "#e7f4f6" },
          "& .leaflet-tile-pane": { filter: activeMapStyle.filter },
          "& .leaflet-control-zoom": { border: "none !important", boxShadow: "0 12px 28px rgba(15,23,42,.16)" },
          "& .leaflet-control-zoom a": { border: "none !important", color: firuColors.dark },
          "& .leaflet-popup-content-wrapper, & .leaflet-popup-tip": {
            borderRadius: 16,
            boxShadow: "0 18px 40px rgba(15,23,42,.18)",
          },
          "& .firu-pet-marker": {
            position: "relative",
            zIndex: 1,
            width: 50,
            height: 50,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            background: "#ffffff",
            border: `4px solid ${firuColors.green}`,
            boxShadow: "0 14px 30px rgba(15,23,42,.24)",
            overflow: "hidden",
            fontSize: 24,
          },
          "& .firu-pet-marker.lost": {
            borderColor: firuColors.orange,
          },
          "& .firu-pet-marker.alert": {
            borderColor: firuColors.red,
            boxShadow: "0 14px 32px rgba(239,68,68,.34)",
          },
          "& .firu-pet-marker-shell": {
            position: "relative",
            width: 58,
            height: 58,
            display: "grid",
            placeItems: "center",
          },
          "& .firu-pet-marker-shell.alert::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `2px solid ${firuColors.red}`,
            background: "rgba(239,68,68,.2)",
            animation: "firuRedPulse 1.35s ease-out infinite",
          },
          "& .firu-pet-marker-wrapper:has(.firu-pet-marker-shell.alert)": {
            filter: "drop-shadow(0 0 12px rgba(239,68,68,.55))",
          },
          "& .firu-pet-marker img": {
            width: "100%",
            height: "100%",
            objectFit: "cover",
          },
          "& .firu-geofence-alert": {
            animation: "firuGeofenceAlertPulse 1.4s ease-in-out infinite",
            filter: "drop-shadow(0 0 8px rgba(239,68,68,.45))",
          },
          "& .firu-marker-wrap": { position: "relative", width: 58, height: 58 },
          "& .firu-marker-pulse": {
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(6,182,212,.22)",
            border: "2px solid rgba(6,182,212,.75)",
            animation: "firuPulse 1.8s ease-out infinite",
          },
          "& .firu-marker-core": {
            position: "absolute",
            left: 9,
            top: 9,
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            borderRadius: "18px",
            background: "#ffffff",
            border: "4px solid #ffffff",
            boxShadow: "0 12px 28px rgba(15,23,42,.28)",
            fontSize: 23,
          },
          "@keyframes firuPulse": {
            "0%": { transform: "scale(.72)", opacity: 0.9 },
            "100%": { transform: "scale(1.65)", opacity: 0 },
          },
          "@keyframes firuRedPulse": {
            "0%": { transform: "scale(.72)", opacity: 0.85 },
            "100%": { transform: "scale(1.9)", opacity: 0 },
          },
          "@keyframes firuGeofenceAlertPulse": {
            "0%, 100%": { strokeOpacity: 1, fillOpacity: 0.14, strokeWidth: 4 },
            "50%": { strokeOpacity: 0.42, fillOpacity: 0.28, strokeWidth: 7 },
          },
        }}
      >
        <MapContainer center={fallbackCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            key={mapStyle}
            url={activeMapStyle.url}
            attribution={activeMapStyle.attribution}
          />
          <CenterMap markers={displayMarkers} />

          {/*
          <Circle center={[mainMarker.latitude, mainMarker.longitude]} radius={550} pathOptions={{ color: firuColors.cyan, fillColor: firuColors.cyan, fillOpacity: 0.08, weight: 2 }} />
          <Circle center={[mainMarker.latitude + 0.003, mainMarker.longitude - 0.003]} radius={420} pathOptions={{ color: firuColors.green, fillColor: firuColors.green, fillOpacity: 0.08, weight: 2 }} />
          {routeLine.length > 1 && <Polyline positions={routeLine} pathOptions={{ color: firuColors.violet, weight: 4, opacity: 0.65, dashArray: "8 8" }} />}
          */}

          {showGeofences && petGeofences.map((geofence, index) => {
            const isAlertGeofence = alertPetIds.has(String(geofence.petId));
            const color = isAlertGeofence ? firuColors.red : geofenceColors[index % geofenceColors.length];
            return geofence.type === "circle" ? (
              <Circle
                key={`${geofence.petId}-${geofence.id}-${isAlertGeofence ? "alert" : "safe"}`}
                center={geofence.center as LatLngExpression}
                radius={geofence.radiusMeters}
                pathOptions={{ color, fillColor: color, fillOpacity: isAlertGeofence ? 0.16 : 0.1, weight: isAlertGeofence ? 4 : 3, className: isAlertGeofence ? "firu-geofence-alert" : undefined }}
              >
                <Popup>
                  <strong>{geofence.petName}</strong>
                  <br />
                  Saved circle geofence
                </Popup>
              </Circle>
            ) : (
              <Polygon
                key={`${geofence.petId}-${geofence.id}-${isAlertGeofence ? "alert" : "safe"}`}
                positions={geofence.coordinates as LatLngExpression[]}
                pathOptions={{ color, fillColor: color, fillOpacity: isAlertGeofence ? 0.16 : 0.1, weight: isAlertGeofence ? 4 : 3, className: isAlertGeofence ? "firu-geofence-alert" : undefined }}
              >
                <Popup>
                  <strong>{geofence.petName}</strong>
                  <br />
                  Saved polygon geofence
                </Popup>
              </Polygon>
            );
          })}

          {displayMarkers.map((pet) => {
            const petId = pet.petId != null ? String(pet.petId) : undefined;
            const markerImage = petId ? petImageBlobUrls[petId] : undefined;
            const markerStatus = petId && alertPetIds.has(petId)
              ? "out_of_geofence"
              : (petId && statusByPetId[petId]) || pet.status;
            const markerState = isAlertStatus(markerStatus) ? "alert" : "safe";
            const dashboardPetId = petId ? dashboardPetIdByLocationPetId[petId] : undefined;

            return (
              <Marker
                key={`${pet.id}-${markerState}-${markerImage || pet.imageUrl || pet.avatarUrl || "no-image"}`}
                position={[pet.latitude, pet.longitude]}
                icon={createPetIcon(markerImage || pet.imageUrl || pet.avatarUrl, markerStatus)}
                eventHandlers={{
                  click: () => {
                    if (dashboardPetId) onSelectPet?.(dashboardPetId);
                  },
                }}
              >
                <Popup>
                  <strong>{pet.petName || "Unnamed Pet"}</strong>
                  <br />
                  Last seen: {pet.timestamp ? new Date(pet.timestamp).toLocaleString() : "Unknown"}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          right: { xs: 12, md: 24 },
          top: { xs: 68, md: 24 },
          zIndex: 1000,
          bgcolor: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(226,232,240,0.95)",
          boxShadow: "0 14px 30px rgba(15,23,42,0.10)",
          backdropFilter: "blur(16px)",
          borderRadius: 999,
          p: { xs: 0.5, md: 0.75 },
          maxWidth: { xs: "calc(100% - 24px)", md: "none" },
          overflowX: "auto",
        }}
      >
        {[
          { label: "Draw", icon: DrawIcon },
          { label: "Circle", icon: RadarIcon },
          { label: "Route", icon: PolylineIcon },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Chip
              key={item.label}
              icon={<Icon sx={{ fontSize: 17 }} />}
              label={item.label}
              sx={{
                display: { xs: "none", md: "inline-flex" },
                bgcolor: "#f8fafc",
                color: firuColors.dark,
                fontWeight: 800,
                "& .MuiChip-icon": { color: firuColors.cyan },
              }}
            />
          );
        })}
        <Chip
          icon={<GpsFixedIcon sx={{ fontSize: 17 }} />}
          label={isLiveLocationData ? "Live location data" : "Mock location data"}
          sx={{
            bgcolor: isLiveLocationData ? "#dcfce7" : "#fff7ed",
            color: isLiveLocationData ? "#15803d" : "#c2410c",
            border: `1px solid ${isLiveLocationData ? "#bbf7d0" : "#fed7aa"}`,
            fontWeight: 800,
            height: { xs: 28, md: 32 },
            "& .MuiChip-label": { px: { xs: 1, md: 1.5 }, fontSize: { xs: 11, md: 13 } },
            "& .MuiChip-icon": { color: isLiveLocationData ? "#16a34a" : "#f97316" },
          }}
        />
        <Chip
          label={activeMapStyle.label}
          onClick={() => setMapStyle((current) => current === "natural" ? "clean" : "natural")}
          sx={{
            bgcolor: "#f8fafc",
            color: firuColors.dark,
            border: "1px solid #e2e8f0",
            fontWeight: 800,
            cursor: "pointer",
            height: { xs: 28, md: 32 },
            "& .MuiChip-label": { px: { xs: 1, md: 1.5 }, fontSize: { xs: 11, md: 13 } },
          }}
        />
        <Chip
          icon={<RadarIcon sx={{ fontSize: 17 }} />}
          label={showGeofences ? "Hide geofences" : "Show geofences"}
          onClick={() => setShowGeofences((current) => !current)}
          sx={{
            bgcolor: showGeofences ? firuColors.dark : "#f8fafc",
            color: showGeofences ? "white" : firuColors.dark,
            fontWeight: 800,
            cursor: "pointer",
            height: { xs: 28, md: 32 },
            "& .MuiChip-label": { px: { xs: 1, md: 1.5 }, fontSize: { xs: 11, md: 13 } },
            "& .MuiChip-icon": { color: showGeofences ? "white" : firuColors.cyan },
          }}
        />
      </Stack>

      <Box
        sx={{
          position: "absolute",
          left: { xs: 12, md: 24 },
          bottom: { xs: 12, md: 24 },
          zIndex: 1000,
          display: "flex",
          gap: 0.75,
          flexWrap: "wrap",
          maxWidth: { xs: "calc(100% - 24px)", md: "none" },
        }}
      >
        {[
          { label: "GPS LOCK", color: firuColors.cyan },
          { label: "LIVE", color: firuColors.green },
          { label: geofencesLoaded ? `${showGeofences ? petGeofences.length : 0} GEOFENCES SHOWN` : "LOADING GEOFENCES", color: firuColors.violet },
        ].map((item, index) => (
          <Box
            key={item.label}
            sx={{
              display: { xs: index > 1 ? "none" : "flex", md: "flex" },
              px: 1.5,
              py: { xs: 0.65, md: 0.8 },
              alignItems: "center",
              gap: 0.8,
              borderRadius: 999,
              color: firuColors.dark,
              bgcolor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(226,232,240,0.95)",
              boxShadow: "0 12px 28px rgba(15,23,42,0.10)",
              fontSize: { xs: 11, md: 12 },
              fontWeight: 900,
            }}
          >
            <GpsFixedIcon sx={{ fontSize: 15, color: item.color }} />
            {item.label}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          position: "absolute",
          right: 24,
          bottom: 24,
          zIndex: 1000,
          width: 220,
          p: 2,
          borderRadius: 4,
          bgcolor: "rgba(15,23,42,0.92)",
          color: "white",
          boxShadow: "0 18px 45px rgba(15,23,42,0.25)",
          display: { xs: "none", md: "block" },
        }}
      >
        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 900, letterSpacing: 1 }}>
          ACTIVE SIGNALS
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.5 }}>
          {displayMarkers.length}
        </Typography>
        <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
          Tracking collars reporting now
        </Typography>
      </Box>
    </Box>
  );
};

export default FiruappMapView;
