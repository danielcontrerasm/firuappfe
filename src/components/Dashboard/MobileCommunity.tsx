import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PageHeader from "./ui/PageHeader.tsx";

export default function MobileCommunity({ pets }: { pets: any[] }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const filtered = pets.filter(pet => `${pet.name} ${pet.city} ${pet.lastSeenArea}`.toLowerCase().includes(search.toLowerCase()) && (filter !== 'Avistamientos' || pet.status === 'sighting_pending') && (filter !== 'Guardados' || favorites.includes(pet.id)));
  const favorite = (id: string) => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  return <div className="firu-content-page">
    <PageHeader title="Comunidad" action={<IconButton aria-label="Buscar en la comunidad" onClick={() => setSearchOpen(!searchOpen)}><SearchIcon /></IconButton>} />
    <main className="firu-page-content">
      <section className="firu-community-hero"><div><h2>Juntos los<br />encontramos</h2><p>Una comunidad que protege a nuestras mascotas.</p></div><span><FavoriteBorderIcon /></span></section>
      {searchOpen && <label className="firu-community-search"><SearchIcon /><input autoFocus aria-label="Buscar en la comunidad" placeholder="Nombre, ciudad o zona…" value={search} onChange={event => setSearch(event.target.value)} /></label>}
      <div className="firu-filter-tabs" role="group" aria-label="Filtrar comunidad">{['Todos', 'Avistamientos', 'Guardados'].map(label => <button type="button" key={label} className={filter === label ? 'is-active' : ''} aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>)}<Link to="/volunteers">Voluntarios</Link></div>
      <div className="firu-section-heading"><h2>Mascotas que necesitan ayuda</h2></div>
      <p className="firu-example-note">Casos de ejemplo</p>
      <div className="firu-community-cards">{filtered.map(pet => <article className="firu-community-card" key={pet.id}>
        <div className="firu-community-photo"><img src={pet.imageUrl} alt={pet.name} /><span>{pet.status === 'sighting_pending' ? 'Avistamiento' : 'Se busca'}</span></div>
        <div className="firu-community-card-body"><div className="firu-section-heading"><h3>{pet.name}</h3><IconButton aria-label={`${favorites.includes(pet.id) ? 'Quitar' : 'Guardar'} a ${pet.name}`} aria-pressed={favorites.includes(pet.id)} onClick={() => favorite(pet.id)}>{favorites.includes(pet.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}</IconButton></div>
          <p>Visto por última vez cerca de {pet.lastSeenArea}</p><div className="firu-community-location"><PlaceOutlinedIcon />{pet.city}, Antioquia</div>
          <button type="button" className="firu-case-link" onClick={() => setSelected(pet)}>Ver detalles<ChevronRightIcon /></button>
        </div>
      </article>)}</div>
      {!filtered.length && <div className="firu-empty-state"><FavoriteBorderIcon /><h2>No hay casos para mostrar</h2><p>Prueba otro filtro o busca por nombre y ciudad.</p></div>}
    </main>
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle>{selected?.name}</DialogTitle><DialogContent><p>Casos de ejemplo</p><p>Última ubicación: {selected?.lastSeenArea}</p><p>Último avistamiento: {selected?.lastSeen}</p><p>Responsable: {selected?.ownerName}</p><p>{selected?.notes}</p><p>Recompensa: {selected?.reward}</p></DialogContent><DialogActions><Button onClick={() => setSelected(null)}>Cerrar</Button><Button component={Link} to="/volunteers">Ver voluntarios</Button></DialogActions>
    </Dialog>
  </div>;
}
