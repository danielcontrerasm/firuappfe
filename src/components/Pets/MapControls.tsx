import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";

export default function MapControls({ coordinates = [], onToggleLayer, cleanLayer = false }: {
  coordinates?: number[][];
  onToggleLayer: () => void;
  cleanLayer?: boolean;
}) {
  const map = useMap();
  const controls = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    mounted.current = true;
    if (controls.current) {
      L.DomEvent.disableClickPropagation(controls.current);
      L.DomEvent.disableScrollPropagation(controls.current);
    }
    return () => { mounted.current = false; };
  }, []);

  const recenter = () => {
    const points = coordinates.filter(point => point.length === 2 && point.every(Number.isFinite));
    if (points.length) map.fitBounds(L.latLngBounds(points as [number, number][]), { padding: [48, 48], maxZoom: 16 });
    else map.setView(map.getCenter(), 13);
  };

  const locate = () => {
    setError("");
    if (!navigator.geolocation) { setError("Tu navegador no permite acceder a tu ubicación."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      if (!mounted.current) return;
      setLocating(false);
      map.flyTo([position.coords.latitude, position.coords.longitude], 16);
    }, () => {
      if (!mounted.current) return;
      setLocating(false);
      setError("No pudimos obtener tu ubicación. Revisa el permiso del navegador.");
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <div className="firu-map-controls" ref={controls} role="group" aria-label="Controles del mapa">
      <button type="button" aria-label="Acercar mapa" onClick={() => map.zoomIn()}><AddIcon /></button>
      <button type="button" aria-label="Alejar mapa" onClick={() => map.zoomOut()}><RemoveIcon /></button>
      <button type="button" aria-label="Centrar mapa" onClick={recenter}><MyLocationIcon /></button>
      <button type="button" aria-label="Cambiar capa del mapa" aria-pressed={cleanLayer} onClick={onToggleLayer}><LayersOutlinedIcon /></button>
      <button type="button" aria-label="Ir a mi ubicación" disabled={locating} onClick={locate}><NearMeOutlinedIcon /></button>
      {error && <div className="firu-map-error" role="status">{error}<button type="button" aria-label="Cerrar aviso" onClick={() => setError("")}>×</button></div>}
    </div>
  );
}
