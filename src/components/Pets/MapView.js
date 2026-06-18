import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup,useMap } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { buildApiUrl } from "../../config/runtime";

/**
 * @typedef {Object} PetLocation
 * @property {string} id
 * @property {number} latitude
 * @property {number} longitude
 * @property {string=} petName
 * @property {string=} timestamp
 */
// 🔹 Componente auxiliar para centrar el mapa
const CenterMap = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const latitudes = markers.map((m) => m.latitude);
      const longitudes = markers.map((m) => m.longitude);

      const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
      const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

      map.setView([avgLat, avgLng], 13); // 🔸 mueve el mapa al centro promedio
    }
  }, [markers, map]);

  return null;
};

const MapView = () => {
  /** @type {[PetLocation[], React.Dispatch<React.SetStateAction<PetLocation[]>>]} */
  const [petLocations, setPetLocations] = useState([]);

  useEffect(() => {
    
    // Fetch pet locations from the backend
    const fetchPetLocations = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("this is the token" +token);
        const response = await axios.get(buildApiUrl("/api/pets/locations"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Raw API response:", response.data);
      

        if (Array.isArray(response.data)) {

     console.log("locations is already an array:");

        } 
        else {
 console.log("locations is not already an array:");

        }
        const locations = response.data.locations || response.data || [];
        setPetLocations(locations);
      } catch (error) {
        console.error("Error fetching pet locations:", error);


       
      }
    };

    fetchPetLocations();
  }, []);

  // Custom icon for pets
  const petIcon = new L.Icon({
    //iconUrl: "https://cdn-icons-png.flaticon.com/512/194/194279.png",
   iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
    iconSize: [38, 38],
  iconAnchor: [19, 38], // center bottom
  popupAnchor: [0, -38],
  });
return ( 
  <MapContainer
    center={[51.505, -0.09]} // Default center position
    zoom={13}
    style={{ height: "500px", width: "100%" }}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
    <CenterMap markers={petLocations} />
    {petLocations.map((pet) => {
      // 👇 Debug log for each pet
      console.log("Rendering pet marker:", pet);

      return (
        <Marker
          key={pet.id}
          position={[pet.latitude, pet.longitude]}
          icon={petIcon}
          
        >
          <Popup>
            <strong>{pet.petName || "Unnamed Pet"}</strong>
            <br />
            Last my dog  seen at:{" "}
            {pet.timestamp
              ? new Date(pet.timestamp).toLocaleString()
              : "Unknown"}
          </Popup>
        </Marker>
      );
    })}
  </MapContainer>
);
};

export default MapView;
