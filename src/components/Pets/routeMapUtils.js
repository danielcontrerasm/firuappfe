import { useEffect } from "react";
import { useMap } from "react-leaflet";

export const normalizeRouteLocations = (data) => {
  const rawRoutes = data?.locations || data?.routes || data || [];
  if (!Array.isArray(rawRoutes)) return [];

  return rawRoutes.flatMap((item) => {
    const petId = item.petId ?? item.pet?.id;
    const petName = item.petName ?? item.pet?.name ?? item.name ?? "Unknown";
    const points = Array.isArray(item.coordinates)
      ? item.coordinates
      : Array.isArray(item.locations)
        ? item.locations
        : [item];

    return points
      .map((point) => {
        const latitude = Number(point.latitude ?? point.lat);
        const longitude = Number(point.longitude ?? point.lng ?? point.lon);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }

        return {
          id: point.id ?? item.id,
          petId,
          petName,
          latitude,
          longitude,
          timestamp: point.timestamp ?? point.createdAt ?? item.timestamp,
        };
      })
      .filter(Boolean);
  });
};

export const CenterRouteMap = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (!coords.length) return;

    if (coords.length === 1) {
      map.setView(coords[0], 14);
      return;
    }

    map.fitBounds(coords, { padding: [32, 32] });
  }, [coords, map]);

  return null;
};
