// ui/FiruappMapView.tsx
import React, { useEffect, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import axios from "axios";
import { Circle, MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import DrawIcon from "@mui/icons-material/Draw";
import PolylineIcon from "@mui/icons-material/Polyline";
import RadarIcon from "@mui/icons-material/Radar";
import { firuColors, Pet } from "./FiruappStyles.ts";

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
}

const fallbackCenter: LatLngExpression = [6.2442, -75.5812];

const petImagesById: Record<string, string> = {
  "1": "/beagle.png",
  "2": "/german.png",
  "3": "/labrador.png",
};

const petImagesByName: Record<string, string> = {
  peluche: "/beagle.png",
  bella: "/german.png",
  rocky: "/labrador.png",
};

const knownPets = [
  { id: "1", name: "Peluche" },
  { id: "2", name: "Bella" },
  { id: "3", name: "Rocky" },
];

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
      <div class="firu-pet-marker ${status === "lost" ? "lost" : ""}">
        ${imageUrl ? `<img src="${imageUrl}" alt="" />` : "🐾"}
      </div>
    `,
    iconSize: [58, 58],
    iconAnchor: [29, 58],
    popupAnchor: [0, -58],
  });

const FiruappMapView: React.FC<MapViewProps> = ({ apiUrl = "http://localhost:8080/api/pets/locations", selectedPet }) => {
  const [petLocations, setPetLocations] = useState<PetLocation[]>([]);
  const [petGeofences, setPetGeofences] = useState<PetGeofence[]>([]);
  const [geofencesLoaded, setGeofencesLoaded] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapStyle, setMapStyle] = useState<"clean" | "natural">("natural");

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
      try {
        const token = localStorage.getItem("token");
        const responses = await Promise.all(
          knownPets.map(async (pet) => {
            try {
              const response = await axios.get(`http://localhost:8080/api/geofences/${pet.id}`, {
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
  }, []);

  const displayMarkers = petLocations.length
    ? petLocations
    : [
        { id: "demo-1", petId: selectedPet?.id || "1", latitude: 6.2442, longitude: -75.5812, petName: selectedPet?.name || "Peluche", timestamp: new Date().toISOString(), imageUrl: selectedPet?.imageUrl || selectedPet?.avatarUrl || petImagesById[String(selectedPet?.id || "1")], status: selectedPet?.status },
        { id: "demo-2", petId: "2", latitude: 6.2482, longitude: -75.5862, petName: "Bella", timestamp: new Date().toISOString(), imageUrl: petImagesById["2"], status: "active" },
      ];
  const isLiveLocationData = petLocations.length > 0;
  const activeMapStyle = mapStyles[mapStyle];

  // const mainMarker = displayMarkers[0];
  // const routeLine: LatLngExpression[] = displayMarkers.map((pet) => [pet.latitude, pet.longitude]);

  return (
    <Box sx={{ position: "relative", height: { xs: 520, md: "calc(100vh - 230px)" }, minHeight: 560 }}>
      <Box
        sx={{
          height: "100%",
          borderRadius: 5,
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
          "& .firu-pet-marker img": {
            width: "100%",
            height: "100%",
            objectFit: "cover",
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
            const color = geofenceColors[index % geofenceColors.length];
            return geofence.type === "circle" ? (
              <Circle
                key={`${geofence.petId}-${geofence.id}`}
                center={geofence.center as LatLngExpression}
                radius={geofence.radiusMeters}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 3 }}
              >
                <Popup>
                  <strong>{geofence.petName}</strong>
                  <br />
                  Saved circle geofence
                </Popup>
              </Circle>
            ) : (
              <Polygon
                key={`${geofence.petId}-${geofence.id}`}
                positions={geofence.coordinates as LatLngExpression[]}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 3 }}
              >
                <Popup>
                  <strong>{geofence.petName}</strong>
                  <br />
                  Saved polygon geofence
                </Popup>
              </Polygon>
            );
          })}

          {displayMarkers.map((pet) => (
            <Marker key={pet.id} position={[pet.latitude, pet.longitude]} icon={createPetIcon(pet.imageUrl || pet.avatarUrl, pet.status)}>
              <Popup>
                <strong>{pet.petName || "Unnamed Pet"}</strong>
                <br />
                Last seen: {pet.timestamp ? new Date(pet.timestamp).toLocaleString() : "Unknown"}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          right: 24,
          top: 24,
          zIndex: 1000,
          bgcolor: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(226,232,240,0.95)",
          boxShadow: "0 14px 30px rgba(15,23,42,0.10)",
          backdropFilter: "blur(16px)",
          borderRadius: 999,
          p: 0.75,
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
              sx={{ bgcolor: "#f8fafc", color: firuColors.dark, fontWeight: 800, "& .MuiChip-icon": { color: firuColors.cyan } }}
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
            "& .MuiChip-icon": { color: showGeofences ? "white" : firuColors.cyan },
          }}
        />
      </Stack>

      <Box
        sx={{
          position: "absolute",
          left: 24,
          bottom: 24,
          zIndex: 1000,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "GPS LOCK", color: firuColors.cyan },
          { label: "LIVE", color: firuColors.green },
          { label: geofencesLoaded ? `${showGeofences ? petGeofences.length : 0} GEOFENCES SHOWN` : "LOADING GEOFENCES", color: firuColors.violet },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              px: 1.5,
              py: 0.8,
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              borderRadius: 999,
              color: firuColors.dark,
              bgcolor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(226,232,240,0.95)",
              boxShadow: "0 12px 28px rgba(15,23,42,0.10)",
              fontSize: 12,
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
