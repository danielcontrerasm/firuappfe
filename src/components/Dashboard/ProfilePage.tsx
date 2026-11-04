import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import PageHeader from "./ui/PageHeader.tsx";

export default function ProfilePage() {
  const navigate = useNavigate();
  let user: Record<string, any> = {};
  try { user = jwtDecode(localStorage.getItem('token') || ''); } catch { /* A missing token uses the account placeholder. */ }
  const groups = [
    { title: 'Mi FiruApp', items: [
      { label: 'Mis mascotas', to: '/pets', Icon: PetsOutlinedIcon },
      { label: 'Mis dispositivos', to: '/sensors', Icon: SmartphoneOutlinedIcon },
      { label: 'Familia y voluntarios', to: '/volunteers', Icon: PeopleOutlineIcon },
      { label: 'Zonas seguras', to: '/geofence', Icon: FavoriteBorderIcon },
    ] },
    { title: 'Explora', items: [
      { label: 'Comunidad', to: '/lost-pets', Icon: PeopleOutlineIcon },
      { label: 'Historial de recorridos', to: '/routes/recent', Icon: HistoryOutlinedIcon },
      { label: 'Notificaciones', to: '/alerts', Icon: NotificationsNoneIcon },
      { label: 'Usuarios', to: '/users', Icon: PersonOutlineIcon },
    ] },
  ];
  const logout = () => {
    sessionStorage.removeItem(`firuapp-alerts:${user.sub || user.id || user.userId || 1}`);
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };
  return <div className="firu-content-page">
    <PageHeader title="Mi perfil" />
    <main className="firu-page-content">
      <section className="firu-profile-hero">
        <div className="firu-profile-avatar"><PersonOutlineIcon /></div>
        <h2>{user.name || 'Mi cuenta'}</h2><p>{user.sub || 'Gestiona tus datos y preferencias'}</p>
        <span className="firu-protected-badge"><VerifiedUserOutlinedIcon />{localStorage.getItem('token') ? 'Sesión iniciada' : 'Tu espacio FiruApp'}</span>
      </section>
      {groups.map(group => <section className="firu-profile-group" key={group.title}><h2>{group.title}</h2><div className="firu-menu-card">
        {group.items.map(({ label, to, Icon }) => <Link key={to} to={to}><span className="firu-menu-icon"><Icon /></span><span>{label}</span><ChevronRightIcon /></Link>)}
      </div></section>)}
      <button type="button" className="firu-logout" onClick={logout}><LogoutIcon />Cerrar sesión</button>
    </main>
  </div>;
}
