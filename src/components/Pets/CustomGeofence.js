import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FeatureGroup,
  Circle,
  MapContainer,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import "./routeMapStyles.css";

const defaultGeofenceNames = ["Home", "Park", "Parents House", "Family", "Farm"];
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

const extractPetDtos = (data) => {
  if (Array.isArray(data)) return data;
  return data?.content || data?.items || data?.pets || data?.data || data?.results || [];
};

const normalizeCoordinate = (coordinate) => {
  if (Array.isArray(coordinate)) {
    // Stored polygons commonly come back as GeoJSON-style [longitude, latitude].
    // Leaflet renders positions as [latitude, longitude].
    const longitude = Number(coordinate[0]);
    const latitude = Number(coordinate[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [latitude, longitude]
      : null;
  }

  const latitude = Number(coordinate?.latitude ?? coordinate?.lat);
  const longitude = Number(coordinate?.longitude ?? coordinate?.lng ?? coordinate?.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : null;
};

const normalizeCircleCenter = (geofence) => {
  const center = geofence.center || geofence;
  const latitude = Number(center.latitude ?? center.lat ?? geofence.centerLat ?? geofence.centerLatitude ?? geofence.latitude);
  const longitude = Number(center.longitude ?? center.lng ?? center.lon ?? geofence.centerLng ?? geofence.centerLongitude ?? geofence.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : null;
};

const normalizeGeofences = (data, activePetId, fallbackName, fallbackPet) => {
  const rawGeofences = data?.geofences || data?.items || data || [];
  const geofences = Array.isArray(rawGeofences) ? rawGeofences : [rawGeofences];

  return geofences
    .map((geofence, index) => {
      if (activePetId !== "all" && geofence.petId != null && String(geofence.petId) !== String(activePetId)) {
        return null;
      }

      const type = (geofence.type || geofence.shape || "").toLowerCase();
      const radiusMeters = Number(geofence.radiusMeters ?? geofence.radius ?? geofence.radiusInMeters);
      const center = normalizeCircleCenter(geofence);

      if (type === "circle" || (center && Number.isFinite(radiusMeters))) {
        if (!center || !Number.isFinite(radiusMeters)) return null;
        return {
          id: geofence.id ?? `geofence-${fallbackPet?.id ?? activePetId}-${index}`,
          petId: geofence.petId ?? fallbackPet?.id ?? activePetId,
          petName: geofence.petName ?? geofence.pet?.name ?? fallbackPet?.name,
          name: geofence.name ?? geofence.label ?? fallbackName ?? defaultGeofenceNames[index % defaultGeofenceNames.length],
          type: "circle",
          center,
          radiusMeters,
        };
      }

      const rawCoordinates =
        geofence.coordinates || geofence.polygon || geofence.points || [];
      const coordinates = rawCoordinates.map(normalizeCoordinate).filter(Boolean);

      if (coordinates.length < 3) return null;

      return {
        id: geofence.id ?? `geofence-${fallbackPet?.id ?? activePetId}-${index}`,
        petId: geofence.petId ?? fallbackPet?.id ?? activePetId,
        petName: geofence.petName ?? geofence.pet?.name ?? fallbackPet?.name,
        name: geofence.name ?? geofence.label ?? fallbackName ?? defaultGeofenceNames[index % defaultGeofenceNames.length],
        type: "polygon",
        coordinates,
      };
    })
    .filter(Boolean);
};

const ClickHandler = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e);
    },
  });
  return null;
};

const FitGeofences = ({ geofences, polygon, circleCenter }) => {
  const map = useMap();

  useEffect(() => {
    const coordinates = [
      ...geofences.flatMap((geofence) => geofence.type === "circle" ? [geofence.center] : geofence.coordinates),
      ...polygon,
      ...(circleCenter ? [circleCenter] : []),
    ];

    if (!coordinates.length) return;

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 14);
      return;
    }

    map.fitBounds(coordinates, { padding: [32, 32] });
  }, [geofences, polygon, circleCenter, map]);

  return null;
};

const CustomGeofence = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activePetId = searchParams.get("petId") || "all";
  const activePetIdNumber = Number(activePetId);
  const [drawMode, setDrawMode] = useState("polygon");
  const [polygon, setPolygon] = useState([]);
  const [circleCenter, setCircleCenter] = useState(null);
  const [circleRadius, setCircleRadius] = useState(500);
  const [geofenceName, setGeofenceName] = useState(defaultGeofenceNames[0]);
  const [storedGeofences, setStoredGeofences] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPets, setLoadingPets] = useState(true);
  const [mapStyle, setMapStyle] = useState("natural");
  const [petFilters, setPetFilters] = useState({
    city: "",
    neighborhood: "",
    ownerName: "",
    petName: "",
  });

  const token = useMemo(() => localStorage.getItem("token"), []);
  const activeMapStyle = mapStyles[mapStyle];
  const selectedPet = pets.find((pet) => pet.id === String(activePetId));
  const selectedPetLabel = activePetId === "all" ? "All pets" : selectedPet?.name || "Selected pet";
  const handlePetSelection = useCallback((nextPetId) => {
    setPolygon([]);
    setCircleCenter(null);

    if (nextPetId === "all") {
      setSearchParams({});
      return;
    }

    setSearchParams({ petId: nextPetId });
  }, [setSearchParams]);
  const filteredPets = useMemo(() => {
    const cityTerm = petFilters.city.trim().toLowerCase();
    const neighborhoodTerm = petFilters.neighborhood.trim().toLowerCase();
    const ownerTerm = petFilters.ownerName.trim().toLowerCase();
    const petTerm = petFilters.petName.trim().toLowerCase();

    return pets.filter((pet) => {
      const matchesCity = !cityTerm || pet.city.toLowerCase().includes(cityTerm);
      const matchesNeighborhood = !neighborhoodTerm || pet.neighborhood.toLowerCase().includes(neighborhoodTerm);
      const matchesOwner = !ownerTerm || pet.ownerName.toLowerCase().includes(ownerTerm);
      const matchesPet = !petTerm || pet.name.toLowerCase().includes(petTerm);
      return matchesCity && matchesNeighborhood && matchesOwner && matchesPet;
    });
  }, [petFilters.city, petFilters.neighborhood, petFilters.ownerName, petFilters.petName, pets]);

  useEffect(() => {
    let cancelled = false;

    const fetchPets = async () => {
      setLoadingPets(true);
      try {
        const response = await axios.get("http://localhost:8080/api/pets", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const petDtos = extractPetDtos(response.data);
        if (!cancelled) {
          setPets(
            petDtos.map((pet) => ({
              id: String(pet.id),
              name: pet.name || `Pet ${pet.id}`,
              status: String(pet.status || "active").toLowerCase(),
              ownerName: pet.ownerName || pet.owner?.name || "",
              city: pet.city || pet.owner?.city || pet.address?.city || "",
              neighborhood:
                pet.neighborhood ||
                pet.owner?.neighborhood ||
                pet.address?.neighborhood ||
                pet.zone ||
                "",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching pets for geofence builder:", error);
        if (!cancelled) {
          setPets([]);
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
  }, [token]);

  useEffect(() => {
    if (activePetId === "all") return;
    if (filteredPets.some((pet) => pet.id === String(activePetId))) return;
    if (filteredPets.length === 1) {
      handlePetSelection(filteredPets[0].id);
    }
  }, [activePetId, filteredPets, handlePetSelection]);

  useEffect(() => {
    const fetchStoredGeofences = async () => {
      setLoading(true);
      try {
        if (activePetId === "all") {
          if (!pets.length) {
            setStoredGeofences([]);
            return;
          }

          const responses = await Promise.all(
            pets.map(async (pet) => {
              try {
                const response = await axios.get(`http://localhost:8080/api/geofences/${pet.id}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                return normalizeGeofences(response.data, pet.id, undefined, pet);
              } catch (error) {
                console.error(`Error fetching stored geofences for ${pet.name}:`, error);
                return [];
              }
            })
          );

          setStoredGeofences(responses.flat());
        } else {
          const response = await axios.get(
            `http://localhost:8080/api/geofences/${activePetId}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }
          );

          setStoredGeofences(normalizeGeofences(response.data, activePetId, undefined, selectedPet));
        }
      } catch (error) {
        console.error("Error fetching stored geofences:", error);
        setStoredGeofences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStoredGeofences();
  }, [activePetId, pets, selectedPet, token]);

  const handlePetFilterChange = (event) => {
    handlePetSelection(event.target.value);
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    if (drawMode === "circle") {
      setCircleCenter([lat, lng]);
      return;
    }

    setPolygon((prev) => [...prev, [lat, lng]]);
  };

  const handleClearPolygon = () => {
    setPolygon([]);
    setCircleCenter(null);
  };

  const handleSaveGeofence = async () => {
    if (activePetId === "all") {
      alert("Select one pet before saving a new geofence.");
      return;
    }

    if (drawMode === "circle" && !circleCenter) {
      alert("Click the map to choose the circle center.");
      return;
    }

    if (drawMode === "polygon" && polygon.length < 3) {
      alert("A polygon needs at least 3 points.");
      return;
    }

    try {
      const isCircle = drawMode === "circle";
      const payloadPetId = Number.isFinite(activePetIdNumber) ? activePetIdNumber : activePetId;
      const response = await axios.post(
        `http://localhost:8080/api/geofences/${isCircle ? "circle" : "polygon"}/${activePetId}`,
        isCircle
          ? {
              petId: payloadPetId,
              name: geofenceName,
              type: "circle",
              centerLat: circleCenter[0],
              centerLng: circleCenter[1],
              radiusMeters: circleRadius,
            }
          : { petId: payloadPetId, name: geofenceName, type: "polygon", coordinates: polygon },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const saved = normalizeGeofences([response.data], activePetId, geofenceName, selectedPet);
      setStoredGeofences((prev) => [...prev, ...saved]);
      setPolygon([]);
      setCircleCenter(null);
      alert("Geofence saved successfully!");
    } catch (error) {
      console.error("Error saving geofence:", error);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Unknown error";
      alert(`Failed to save geofence for pet ${activePetId}: ${message}`);
    }
  };

  const handleDeleteGeofence = async (geofence) => {
    const deletePetId = geofence?.petId ?? activePetId;
    const petName = geofence?.petName || pets.find((pet) => pet.id === String(deletePetId))?.name || "this pet";
    const confirmed = window.confirm(`Delete saved geofence for ${petName}?`);
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:8080/api/geofences/${deletePetId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setStoredGeofences((current) => current.filter((item) => String(item.petId) !== String(deletePetId)));
    } catch (error) {
      console.error("Error deleting geofence:", error);
      alert("Failed to delete geofence.");
    }
  };

  return (
    <div className="firu-route-page geofence-page">
      <div className="firu-route-header">
        <h2>Geofence builder</h2>
        <p>
          {activePetId === "all"
            ? "Viewing saved safe zones for all pets. Select one pet to draw and save a new geofence."
            : `Click the map to draw a safe zone, then save it for ${selectedPetLabel}.`}
        </p>
      </div>

      <div className="firu-geofence-searchbar">
        <input
          className="firu-geofence-search-input"
          placeholder="Search by city"
          value={petFilters.city}
          onChange={(event) =>
            setPetFilters((current) => ({ ...current, city: event.target.value }))
          }
        />
        <input
          className="firu-geofence-search-input"
          placeholder="Search by neighborhood"
          value={petFilters.neighborhood}
          onChange={(event) =>
            setPetFilters((current) => ({ ...current, neighborhood: event.target.value }))
          }
        />
        <input
          className="firu-geofence-search-input"
          placeholder="Search by owner name"
          value={petFilters.ownerName}
          onChange={(event) =>
            setPetFilters((current) => ({ ...current, ownerName: event.target.value }))
          }
        />
        <input
          className="firu-geofence-search-input"
          placeholder="Search by pet name"
          value={petFilters.petName}
          onChange={(event) =>
            setPetFilters((current) => ({ ...current, petName: event.target.value }))
          }
        />
      </div>

      <div className={`firu-route-map-shell map-style-${mapStyle}`}>
        <MapContainer
          center={[6.235, -75.585]}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            key={mapStyle}
            url={activeMapStyle.url}
            attribution={activeMapStyle.attribution}
          />

          <ClickHandler onClick={handleMapClick} />
          <FitGeofences geofences={storedGeofences} polygon={polygon} circleCenter={circleCenter} />

          <FeatureGroup>
            {storedGeofences.map((geofence) =>
              geofence.type === "circle" ? (
                <Circle
                  key={geofence.id}
                  center={geofence.center}
                  radius={geofence.radiusMeters}
                  pathOptions={{ color: "#06b6d4", fillColor: "#06b6d4", fillOpacity: 0.1, weight: 3 }}
                >
                  <Popup>
                    <div className="firu-geofence-popup">
                      <strong>{geofence.name}</strong>
                      <span>{geofence.petName || "Pet"} · Circle · {Math.round(geofence.radiusMeters)} m</span>
                      <button type="button" onClick={() => handleDeleteGeofence(geofence)}>
                        Delete
                      </button>
                    </div>
                  </Popup>
                </Circle>
              ) : (
                <Polygon
                  key={geofence.id}
                  positions={geofence.coordinates}
                  pathOptions={{ color: "#06b6d4", fillColor: "#06b6d4", fillOpacity: 0.1, weight: 3 }}
                >
                  <Popup>
                    <div className="firu-geofence-popup">
                      <strong>{geofence.name}</strong>
                      <span>{geofence.petName || "Pet"} · Polygon · {geofence.coordinates.length} points</span>
                      <button type="button" onClick={() => handleDeleteGeofence(geofence)}>
                        Delete
                      </button>
                    </div>
                  </Popup>
                </Polygon>
              )
            )}

            {drawMode === "polygon" && polygon.length > 1 && (
              <Polyline
                positions={[...polygon, polygon[0]]}
                pathOptions={{ color: "#8b5cf6", weight: 4, opacity: 0.75, dashArray: "8 8" }}
              />
            )}

            {drawMode === "polygon" && polygon.length > 2 && (
              <Polygon
                positions={polygon}
                pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.16, weight: 3 }}
              />
            )}

            {drawMode === "circle" && circleCenter && (
              <Circle
                center={circleCenter}
                radius={circleRadius}
                pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.16, weight: 3 }}
              />
            )}
          </FeatureGroup>
        </MapContainer>

        <div className="firu-geofence-pets">
          <div className="firu-geofence-pets-title">Pets</div>
          <button
            type="button"
            className={`firu-geofence-pet-row ${activePetId === "all" ? "active" : ""}`}
            onClick={() => handlePetSelection("all")}
          >
            <div>
              <strong>All pets</strong>
              <span>View all saved geofences</span>
            </div>
          </button>
          {loadingPets ? (
            <div className="firu-geofence-pets-empty">Loading pets...</div>
          ) : filteredPets.length === 0 ? (
            <div className="firu-geofence-pets-empty">No pets match the current filters.</div>
          ) : pets.length === 0 ? (
            <div className="firu-geofence-pets-empty">No pets available.</div>
          ) : (
            filteredPets.map((pet) => (
              <button
                type="button"
                key={pet.id}
                className={`firu-geofence-pet-row ${activePetId === pet.id ? "active" : ""}`}
                onClick={() => handlePetSelection(pet.id)}
              >
                <div>
                  <strong>{pet.name}</strong>
                  <span>
                    {pet.ownerName ? `${pet.ownerName} · ` : ""}
                    {pet.neighborhood ? `${pet.neighborhood}, ` : ""}
                    {pet.city || (pet.status === "lost" ? "Lost pet" : "Active tracking")}
                  </span>
                </div>
                <span className={`firu-geofence-pet-badge ${pet.status === "lost" ? "lost" : "active"}`}>
                  {pet.status === "lost" ? "Lost" : "Live"}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="firu-route-tools firu-geofence-actions">
          <select
            className="firu-geofence-pet-select"
            value={activePetId}
            onChange={handlePetFilterChange}
          >
            <option value="all">All pets</option>
            {filteredPets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
          <select
            className="firu-geofence-name-select"
            value={geofenceName}
            onChange={(event) => setGeofenceName(event.target.value)}
          >
            {defaultGeofenceNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            className={`firu-route-tool firu-geofence-button ${drawMode === "polygon" ? "active" : ""}`}
            onClick={() => setDrawMode("polygon")}
          >
            Polygon
          </button>
          <button
            className={`firu-route-tool firu-geofence-button ${drawMode === "circle" ? "active" : ""}`}
            onClick={() => setDrawMode("circle")}
          >
            Circle
          </button>
          <button
            className="firu-route-tool firu-geofence-button"
            onClick={() => setMapStyle((current) => current === "natural" ? "clean" : "natural")}
          >
            {activeMapStyle.label}
          </button>
          {drawMode === "circle" && (
            <input
              className="firu-geofence-radius"
              min="50"
              max="2000"
              step="50"
              type="number"
              value={circleRadius}
              onChange={(event) => setCircleRadius(Number(event.target.value))}
            />
          )}
          <button className="firu-route-tool firu-geofence-button" onClick={handleSaveGeofence}>
            Save
          </button>
          <button
            className="firu-route-tool firu-geofence-button"
            onClick={handleClearPolygon}
            disabled={drawMode === "circle" ? !circleCenter : !polygon.length}
          >
            Clear
          </button>
        </div>

        <div className="firu-route-status">
          <span className="firu-route-pill"><span className="firu-route-dot" /> {drawMode.toUpperCase()} MODE</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> {selectedPetLabel.toUpperCase()}</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> {drawMode === "circle" ? `${circleRadius} M` : `${polygon.length} POINTS`}</span>
          <span className="firu-route-pill"><span className="firu-route-dot" /> {storedGeofences.length} SAVED</span>
        </div>

        {storedGeofences.length > 0 && (
          <div className="firu-geofence-list">
            <div className="firu-geofence-list-title">Saved geofences</div>
            {storedGeofences.map((geofence) => (
              <div className="firu-geofence-list-row" key={geofence.id}>
                <div>
                  <strong>{geofence.name}</strong>
                  <span>
                    {geofence.petName ? `${geofence.petName} · ` : ""}
                    {geofence.type === "circle"
                      ? `Circle · ${Math.round(geofence.radiusMeters)} m`
                      : `Polygon · ${geofence.coordinates.length} points`}
                  </span>
                </div>
                <button type="button" onClick={() => handleDeleteGeofence(geofence)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="firu-route-card">
          <div className="firu-route-card-label">GEOFENCES</div>
          <div className="firu-route-card-value">{storedGeofences.length}</div>
          <div className="firu-route-card-copy">
            {loading
              ? "Loading saved safe zones"
              : drawMode === "circle" && circleCenter
                ? `${circleRadius} meter circle ready`
                : polygon.length > 0
                ? `${polygon.length} points in current drawing`
                : "Click the map to start drawing"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomGeofence;
