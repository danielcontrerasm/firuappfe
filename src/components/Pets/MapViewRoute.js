import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { CenterRouteMap, normalizeRouteLocations } from "./routeMapUtils";
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

const MapViewRoute = ({ petId = 1 }) => {
  const [routePoints, setRoutePoints] = useState([]);
  const [mapStyle, setMapStyle] = useState("natural");

  useEffect(() => {
    const fetchPetRoute = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          buildApiUrl(`/api/pets/${petId}/route`),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setRoutePoints(normalizeRouteLocations(response.data));
      } catch (error) {
        console.error("Error fetching pet route:", error);
        setRoutePoints([]);
      }
    };

    fetchPetRoute();
  }, [petId]);

  const coords = useMemo(
    () => routePoints.map((point) => [point.latitude, point.longitude]),
    [routePoints]
  );

  const petIcon = useMemo(
    () => createPetIcon(),
    []
  );
  const activeMapStyle = mapStyles[mapStyle];

  return (
    <div className="firu-route-page">
      <div className="firu-route-header">
        <h2>Movement trail</h2>
        <p>
          Route positions for the selected pet, ordered as a location trail.
        </p>
      </div>

      <div className={`firu-route-map-shell map-style-${mapStyle}`}>
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

          <CenterRouteMap coords={coords} />

          {coords.length > 1 && (
            <Polyline positions={coords} pathOptions={{ color: "#8b5cf6", weight: 4, opacity: 0.65, dashArray: "8 8" }} />
          )}

          {routePoints.map((point, index) => (
            <Marker
              key={`${point.id ?? "point"}-${point.latitude}-${point.longitude}-${index}`}
              position={[point.latitude, point.longitude]}
              icon={petIcon}
            >
              <Popup>
                <strong>{point.petName}</strong>
                <br />
                Point #{index + 1}
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
        </div>

        <div className="firu-route-card">
          <div className="firu-route-card-label">ROUTE POINTS</div>
          <div className="firu-route-card-value">{routePoints.length}</div>
          <div className="firu-route-card-copy">Positions for this pet route</div>
        </div>
      </div>
    </div>
  );
};

export default MapViewRoute;
