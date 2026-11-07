import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PetsIcon from "@mui/icons-material/Pets";
import RadarIcon from "@mui/icons-material/Radar";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageIcon from "@mui/icons-material/Language";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import FiruBrand from "./FiruBrand.tsx";
import { DashboardCopy, DashboardLanguage } from "./dashboardI18n.ts";

export type OwnerAccountDetails = {
  name: string;
  email: string;
  id: string;
  role: string;
};

interface OwnerReferenceTopbarProps {
  language: DashboardLanguage;
  copy: DashboardCopy;
  dashboardTheme: "current" | "reference";
  accountDetails: OwnerAccountDetails;
  accountMenuAnchor: HTMLElement | null;
  searchBarRef?: React.Ref<HTMLDivElement>;
  onAccountMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onAccountMenuClose: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
}

const OwnerReferenceTopbar: React.FC<OwnerReferenceTopbarProps> = ({
  language,
  copy,
  dashboardTheme,
  accountDetails,
  accountMenuAnchor,
  searchBarRef,
  onAccountMenuOpen,
  onAccountMenuClose,
  onToggleTheme,
  onToggleLanguage,
  onLogout,
}) => {
  const location = useLocation();
  const labels = language === "es"
    ? {
        map: "Mapa",
        pets: "Mascotas",
        geofences: "Geocercas",
        alerts: "Alertas",
        routes: "Rutas",
        reports: "Reportes",
        help: "Ayuda",
        switchTheme: "Cambiar tema",
        switchLanguage: "Cambiar idioma",
      }
    : {
        map: "Map",
        pets: "Pets",
        geofences: "Geofences",
        alerts: "Alerts",
        routes: "Routes",
        reports: "Reports",
        help: "Help",
        switchTheme: "Switch theme",
        switchLanguage: "Switch language",
      };

  const navItems = [
    { label: labels.map, to: "/owner-dashboard", Icon: PlaceOutlinedIcon },
    { label: labels.pets, to: "/pets", Icon: PetsIcon },
    { label: labels.geofences, to: "/geofence", Icon: RadarIcon },
    { label: labels.alerts, to: "/alerts", Icon: NotificationsNoneIcon },
    { label: labels.routes, to: "/routes/recent", Icon: RouteOutlinedIcon },
    { label: labels.reports, to: "/routes/recent", Icon: BarChartOutlinedIcon },
  ];

  const initials = accountDetails.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "DC";

  return (
    <Box ref={searchBarRef} component="header" className="owner-reference-topbar">
      <Box component={RouterLink} to="/owner-dashboard" className="owner-reference-brand-link" aria-label="FiruApp">
        <FiruBrand />
      </Box>
      <Divider orientation="vertical" flexItem className="owner-reference-topbar-divider" />

      <Box component="nav" aria-label={language === "es" ? "Navegación principal" : "Main navigation"} className="owner-reference-topnav">
        {navItems.map(({ label, to, Icon }, index) => {
          const active = index === 0
            ? location.pathname === "/owner-dashboard"
            : location.pathname === to && to !== "/routes/recent";

          return (
            <Box
              component={RouterLink}
              to={to}
              key={`${label}-${index}`}
              className={`owner-reference-topnav-link${active ? " is-active" : ""}`}
            >
              <Icon fontSize="small" />
              <span>{label}</span>
            </Box>
          );
        })}
      </Box>

      <Stack direction="row" alignItems="center" spacing={0.4} className="owner-reference-topbar-actions">
        <IconButton component={RouterLink} to="/alerts" aria-label={labels.alerts} className="owner-reference-header-icon">
          <Badge color="error" badgeContent={3} max={9}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
        <IconButton aria-label={labels.help} className="owner-reference-header-icon">
          <HelpOutlineIcon />
        </IconButton>
        <IconButton
          aria-label="Open account details"
          aria-haspopup="menu"
          aria-expanded={Boolean(accountMenuAnchor)}
          onClick={onAccountMenuOpen}
          className="owner-reference-account-button"
        >
          <Avatar>{initials}</Avatar>
        </IconButton>
        <KeyboardArrowDownIcon className="owner-reference-account-chevron" />
      </Stack>

      <Menu
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={onAccountMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "owner-reference-account-menu" }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="overline" sx={{ color: "#6b7b92", fontWeight: 900, letterSpacing: 1 }}>
            {copy.account}
          </Typography>
          <Typography sx={{ color: "#14233f", fontWeight: 900 }}>{accountDetails.name}</Typography>
          <Typography variant="body2" sx={{ color: "#6b7b92", overflowWrap: "anywhere" }}>{accountDetails.email}</Typography>
        </Box>
        <Divider />
        <MenuItem disabled sx={{ opacity: "1 !important", color: "#425471 !important" }}>
          {copy.role}: {accountDetails.role}
        </MenuItem>
        <MenuItem disabled sx={{ opacity: "1 !important", color: "#425471 !important" }}>
          {copy.accountId}: {accountDetails.id}
        </MenuItem>
        <Divider />
        <MenuItem onClick={onToggleLanguage}>
          <LanguageIcon fontSize="small" />
          <span>{labels.switchLanguage} ({language.toUpperCase()})</span>
        </MenuItem>
        <MenuItem onClick={onToggleTheme}>
          <PaletteOutlinedIcon fontSize="small" />
          <span>{labels.switchTheme}: {dashboardTheme === "reference" ? "current" : "reference"}</span>
        </MenuItem>
        <Divider />
        <MenuItem onClick={onLogout} className="owner-reference-logout-item">
          <LogoutIcon fontSize="small" />
          <span>{copy.logout}</span>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default OwnerReferenceTopbar;
