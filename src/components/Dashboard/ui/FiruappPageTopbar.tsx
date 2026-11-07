import React, { useState } from "react";
import { Avatar, Badge, Box, Button, Divider, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PetsIcon from "@mui/icons-material/Pets";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";

export type PageTheme = "reference" | "current";

type FiruappPageTopbarProps = {
  theme: PageTheme;
  onToggleTheme: () => void;
};

const topLinks = [
  { label: "Mapa", to: "/owner-dashboard", icon: PlaceOutlinedIcon },
  { label: "Mascotas", to: "/pets", icon: PetsIcon },
  { label: "Geocercas", to: "/geofence", icon: PlaceOutlinedIcon },
  { label: "Paseos", to: "/walks", icon: RouteOutlinedIcon },
];

const FiruappPageTopbar: React.FC<FiruappPageTopbarProps> = ({ theme, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);

  const logout = () => {
    setAccountAnchor(null);
    window.localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <Box className="firu-page-topbar">
      <Box className="firu-page-topbar-brand">
        <img src="/logo-head.png" alt="" />
        <strong>Firu<span>App</span></strong>
      </Box>

      <Box component="nav" className="firu-page-topbar-nav" aria-label="Menú principal">
        {topLinks.map(({ label, to, icon: Icon }) => {
          const active = location.pathname === to || (to === "/walks" && location.pathname.startsWith("/walks"));
          return (
            <Button
              key={to}
              component={RouterLink}
              to={to}
              className={active ? "is-active" : ""}
              startIcon={<Icon />}
            >
              {label}
            </Button>
          );
        })}
      </Box>

      <Stack direction="row" spacing={1} alignItems="center" className="firu-page-topbar-actions">
        <Button className="firu-page-language-button" startIcon={<LanguageIcon />}>ES</Button>
        <IconButton className="firu-page-topbar-icon" onClick={onToggleTheme} aria-label="Cambiar tema" title="Cambiar tema">
          {theme === "reference" ? <CheckIcon /> : <PaletteOutlinedIcon />}
        </IconButton>
        <IconButton className="firu-page-topbar-icon" aria-label="Notificaciones">
          <Badge color="error" variant="dot"><NotificationsNoneIcon /></Badge>
        </IconButton>
        <Button
          className="firu-page-account-button"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={(event) => setAccountAnchor(event.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(accountAnchor)}
        >
          <Avatar>DC</Avatar>
          <Box component="span" className="firu-page-account-copy">
            <strong>Mi cuenta</strong>
            <small>FiruApp</small>
          </Box>
        </Button>
        <Menu
          anchorEl={accountAnchor}
          open={Boolean(accountAnchor)}
          onClose={() => setAccountAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ className: "firu-page-account-menu" }}
        >
          <Box className="firu-page-account-heading">
            <Typography variant="overline">Cuenta</Typography>
            <Typography>Mi cuenta FiruApp</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAccountAnchor(null); navigate("/profile"); }}>
            <PersonOutlineIcon fontSize="small" /> Mi perfil
          </MenuItem>
          <MenuItem onClick={onToggleTheme}>
            {theme === "reference" ? <CheckIcon fontSize="small" /> : <PaletteOutlinedIcon fontSize="small" />} Tema FiruApp
          </MenuItem>
          <Divider />
          <MenuItem onClick={logout} className="firu-page-account-logout">
            <LogoutIcon fontSize="small" /> Cerrar sesión
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  );
};

export default FiruappPageTopbar;

