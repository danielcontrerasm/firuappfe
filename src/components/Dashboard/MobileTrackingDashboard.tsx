import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Badge, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import BatteryFullOutlinedIcon from "@mui/icons-material/BatteryFullOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import CloseIcon from "@mui/icons-material/Close";
import FiruBrand from "./ui/FiruBrand.tsx";
import FiruappMapView from "./ui/FiruappMapView.tsx";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";
import { Pet } from "./ui/FiruappStyles.ts";
import { usePetImage } from "../../services/usePetImage.ts";

function PetPhoto({ pet }: { pet: Pet }) {
  const src = usePetImage(pet.apiId || pet.id, pet.imageUrl || pet.avatarUrl);
  return <Avatar src={src} alt={pet.name} className="firu-pet-photo">{pet.name.charAt(0)}</Avatar>;
}

export default function MobileTrackingDashboard({ pets, selectedPet, onSelect, onLocationsChange, alertCount, city, filters, onFiltersChange }: {
  pets: Pet[];
  selectedPet?: Pet;
  onSelect: (id: string) => void;
  onLocationsChange: (locations: any[]) => void;
  alertCount: number;
  city?: string;
  filters: { city: string; neighborhood: string; ownerName: string; petName: string };
  onFiltersChange: React.Dispatch<React.SetStateAction<{ city: string; neighborhood: string; ownerName: string; petName: string }>>;
}) {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const onlineCount = pets.filter(pet => pet.gpsOnline).length;
  const status = (pet: Pet) => pet.status === "lost" ? "Se busca" : pet.gpsOnline ? "En seguimiento" : "Sin conexión";
  const openPet = (id: string) => { onSelect(id); setDetailOpen(true); };

  return (
    <div className="firu-mobile-tracking">
      <FiruappSidebar current="all" />
      <header className="firu-tracking-header">
        <FiruBrand />
        <IconButton component={Link} to="/alerts" aria-label="Ver alertas" className="firu-notification-button">
          <Badge badgeContent={alertCount} color="error"><NotificationsNoneIcon /></Badge>
        </IconButton>
      </header>
      <div className="firu-pet-chips" aria-label="Seleccionar mascota">
        {pets.map(pet => <button key={pet.id} type="button" className={`firu-pet-chip${selectedPet?.id === pet.id ? " is-selected" : ""}`} aria-pressed={selectedPet?.id === pet.id} onClick={() => onSelect(pet.id)}>
          <PetPhoto pet={pet} /><span><strong>{pet.name}</strong><small className={pet.gpsOnline ? "is-online" : ""}><i />{pet.gpsOnline ? "En vivo" : "Sin conexión"}</small></span>
        </button>)}
        <IconButton component={Link} to="/pets" aria-label="Gestionar mascotas" className="firu-add-pet"><AddIcon /></IconButton>
      </div>
      <main>
        <div className="firu-tracking-map">
          <FiruappMapView pets={pets} petDataMode="database" locationCity={city} onSelectPet={openPet} onLocationsChange={onLocationsChange} />
          <div className="firu-map-summary">
            <div><PetsOutlinedIcon /><span><strong>{pets.length} mascotas</strong><small>En seguimiento</small></span></div>
            <div><span className={`firu-live-dot${onlineCount ? " is-online" : ""}`} /><span><strong>{onlineCount} GPS</strong><small>En línea</small></span></div>
            <Link to="/routes/recent"><RouteOutlinedIcon /><span><strong>Historial</strong><small>Ver recorridos</small></span></Link>
          </div>
        </div>
        <section className="firu-pets-sheet" aria-label="Mis mascotas">
          <div className="firu-sheet-handle" />
          <div className="firu-section-heading"><h1>Mis mascotas ({pets.length})</h1><Link to="/pets">Ver todas <ChevronRightIcon /></Link></div>
          <div className="firu-pet-search">
            <label><SearchIcon /><input aria-label="Buscar mascota" placeholder="Buscar mascota…" value={filters.petName} onChange={e => onFiltersChange(current => ({ ...current, petName: e.target.value }))} /></label>
            <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><TuneIcon /><span>Filtrar</span></button>
          </div>
          {showFilters && <div className="firu-mobile-filters">
            {([['city', 'Ciudad'], ['neighborhood', 'Barrio'], ['ownerName', 'Nombre del dueño']] as const).map(([key, label]) => <label key={key}>{label}<input value={filters[key]} onChange={event => onFiltersChange(current => ({ ...current, [key]: event.target.value }))} /></label>)}
            <button type="button" className="firu-text-button" onClick={() => onFiltersChange({ city: '', neighborhood: '', ownerName: '', petName: '' })}>Limpiar filtros</button>
          </div>}
          <div className="firu-mobile-pet-list">
            {pets.map(pet => <button type="button" key={pet.id} className="firu-mobile-pet-row" onClick={() => openPet(pet.id)}>
              <PetPhoto pet={pet} />
              <span className="firu-pet-name"><strong>{pet.name}</strong><small>{pet.breed || pet.race || 'Mascota'}</small></span>
              <span className={`firu-status-badge ${pet.status === 'lost' ? 'is-lost' : pet.gpsOnline ? 'is-online' : ''}`}><i />{status(pet)}</span>
              <span className="firu-battery"><BatteryFullOutlinedIcon />{pet.battery == null ? '—' : `${pet.battery}%`}</span>
              <ChevronRightIcon />
            </button>)}
            {!pets.length && <div className="firu-empty-state"><PetsOutlinedIcon /><h2>No hay mascotas para mostrar</h2><p>Agrega una mascota o ajusta los filtros para encontrarla.</p><Link to="/pets">Gestionar mascotas</Link></div>}
          </div>
        </section>
      </main>
      <Dialog open={detailOpen && Boolean(selectedPet)} onClose={() => setDetailOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle className="firu-pet-detail-title">{selectedPet?.name}<IconButton aria-label="Cerrar detalles" onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton></DialogTitle>
        {selectedPet && <DialogContent><div className="firu-pet-detail"><PetPhoto pet={selectedPet} /><h2>{selectedPet.name}</h2><p>{selectedPet.breed || selectedPet.race}</p><span className="firu-status-badge">{status(selectedPet)}</span><p>Batería: {selectedPet.battery == null ? 'Sin datos' : `${selectedPet.battery}%`}</p></div></DialogContent>}
        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2, '& > :not(style) ~ :not(style)': { ml: 0 } }}>
          <Button fullWidth variant="contained" onClick={() => navigate(`/routes/recent?petId=${selectedPet?.apiId || selectedPet?.id}`)}>Ver recorrido</Button>
          <Button fullWidth variant="outlined" onClick={() => navigate(`/geofence?petId=${selectedPet?.apiId || selectedPet?.id}`)}>Ver zona segura</Button>
          <Button fullWidth onClick={() => navigate('/pets')}>Gestionar mascota</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
