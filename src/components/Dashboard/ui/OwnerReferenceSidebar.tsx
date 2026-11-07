import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import { DashboardLanguage } from "./dashboardI18n.ts";

interface OwnerReferenceSidebarProps {
  language: DashboardLanguage;
}

const OwnerReferenceSidebar: React.FC<OwnerReferenceSidebarProps> = ({ language }) => {
  const location = useLocation();
  const labels = language === "es"
    ? {
        company: "Mi Empresa",
        panel: "Panel",
        devices: "Dispositivos",
        users: "Usuarios y Grupos",
        routes: "Historial de Rutas",
        stats: "Estadísticas",
        settings: "Configuración",
        appTitle: "App Móvil FiruApp",
        appCopy: "Gestiona tus mascotas desde tu celular",
      }
    : {
        company: "My Company",
        panel: "Dashboard",
        devices: "Devices",
        users: "Users & Groups",
        routes: "Route History",
        stats: "Statistics",
        settings: "Settings",
        appTitle: "FiruApp Mobile App",
        appCopy: "Manage your pets from your phone",
      };

  const navItems = [
    { label: labels.panel, to: "/owner-dashboard", Icon: DashboardCustomizeOutlinedIcon },
    { label: labels.devices, to: "/sensors", Icon: SensorsOutlinedIcon },
    { label: labels.users, to: "/users", Icon: GroupsOutlinedIcon },
    { label: labels.routes, to: "/routes/recent", Icon: RouteOutlinedIcon },
    { label: labels.stats, to: "/routes/recent", Icon: BarChartOutlinedIcon },
    { label: labels.settings, to: "/profile", Icon: SettingsOutlinedIcon },
  ];

  return (
    <Box component="aside" className="owner-reference-sidebar">
      <Button component={RouterLink} to="/profile" className="owner-reference-company-selector" endIcon={<KeyboardArrowDownIcon />}>
        <BusinessOutlinedIcon />
        <span>{labels.company}</span>
      </Button>

      <Box component="nav" aria-label={language === "es" ? "Navegación de la empresa" : "Company navigation"} className="owner-reference-side-nav">
        {navItems.map(({ label, to, Icon }, index) => {
          const active = index === 0 ? location.pathname === "/owner-dashboard" : location.pathname === to && to !== "/routes/recent";
          return (
            <Button
              component={RouterLink}
              to={to}
              key={`${label}-${index}`}
              className={`owner-reference-side-link${active ? " is-active" : ""}`}
              startIcon={<Icon />}
            >
              {label}
            </Button>
          );
        })}
      </Box>

      <Paper elevation={0} className="owner-reference-app-promo">
        <Box className="owner-reference-phone-art">
          <PhoneIphoneOutlinedIcon />
          <Box className="owner-reference-phone-pin">●</Box>
        </Box>
        <Typography variant="subtitle1" className="owner-reference-app-title">{labels.appTitle}</Typography>
        <Typography variant="body2" className="owner-reference-app-copy">{labels.appCopy}</Typography>
        <Stack direction="row" spacing={0.8} className="owner-reference-app-store-icons">
          <Box aria-label="Android app" className="owner-reference-store-icon"><AndroidIcon /></Box>
          <Box aria-label="Apple app" className="owner-reference-store-icon"><AppleIcon /></Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default OwnerReferenceSidebar;
