import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { CenterRouteMap, normalizeRouteLocations } from "./routeMapUtils";
import FiruappPetsList from "../Dashboard/ui/FiruappPetList.tsx";
import "./routeMapStyles.css";

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

const petsWithoutPositions = [
  { id: "1", name: "Peluche", status: "active", breed: "Golden Retriever", age: "4 years", weight: "28 kg", imageUrl: "/beagle.png" },
  { id: "2", name: "Bella", status: "active", breed: "Beagle", age: "2 years", weight: "11 kg", imageUrl: "/german.png" },
  { id: "3", name: "Rocky", status: "lost", breed: "Mixed Breed", age: "6 years", weight: "22 kg", imageUrl: "/labrador.png" },
];

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

const MultiPetRouteView = ({ apiBaseUrl = "http://localhost:8080/api/pets" }) => {
  const [routePoints, setRoutePoints] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [mapStyle, setMapStyle] = useState("natural");

  const routePets = useMemo(() => petsWithoutPositions, []);
  const activeMapStyle = mapStyles[mapStyle];

  const selectedPet = useMemo(
    () => routePets.find((pet) => pet.id === selectedPetId),
    [routePets, selectedPetId]
  );

  useEffect(() => {
    if (!selectedPetId) {
      setRoutePoints([]);
      return;
    }

    const fetchPetRoute = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${apiBaseUrl}/${selectedPetId}/route`, {
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
      }
    };

    fetchPetRoute();
  }, [apiBaseUrl, selectedPet?.name, selectedPetId]);

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
          Select a pet to draw its recent route positions on the map.
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
          <span className="firu-route-tool">Timeline</span>
          <span className="firu-route-tool">GPS</span>
          <button
            className="firu-route-tool firu-geofence-button"
            onClick={() => setMapStyle((current) => current === "natural" ? "clean" : "natural")}
          >
            {activeMapStyle.label}
          </button>
        </div>

        <div className="firu-route-status">
          <span className="firu-route-pill"><span className="firu-route-dot" /> GPS LOCK</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> HISTORY</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> {selectedRoute ? selectedRoute.petName : "SELECT PET"}</span>
        </div>

        <div className="firu-route-card">
          <div className="firu-route-card-label">ROUTE POINTS</div>
          <div className="firu-route-card-value">{selectedRoute ? selectedRoute.points.length : 0}</div>
          <div className="firu-route-card-copy">
            {selectedRoute ? `${selectedRoute.petName}'s last 3 hours` : "Select a pet to show its trail"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiPetRouteView;
