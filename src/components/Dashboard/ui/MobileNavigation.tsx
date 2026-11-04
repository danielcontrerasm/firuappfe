import React from "react";
import { Link, useLocation } from "react-router-dom";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

const tabs = [
  { to: "/owner-dashboard", label: "Mapa", Icon: PlaceOutlinedIcon },
  { to: "/pets", label: "Mascotas", Icon: PetsOutlinedIcon },
  { to: "/geofence", label: "Zonas", Icon: FavoriteBorderIcon },
  { to: "/alerts", label: "Alertas", Icon: NotificationsNoneIcon },
  { to: "/profile", label: "Más", Icon: MoreHorizIcon },
];

export default function MobileNavigation() {
  const { pathname } = useLocation();
  return (
    <nav className="firu-mobile-nav" aria-label="Navegación principal">
      {tabs.map(({ to, label, Icon }) => {
        const active = pathname === to || (label === "Más" && !tabs.slice(0, 4).some(tab => tab.to === pathname));
        return (
          <Link key={to} to={to} className={active ? "is-active" : ""} aria-current={active ? "page" : false}>
            <Icon /><span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
