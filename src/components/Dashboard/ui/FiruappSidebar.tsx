// ui/FiruappSidebar.tsx
import React from "react";
import { Box, Button } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import PetsIcon from "@mui/icons-material/Pets";
import RadarIcon from "@mui/icons-material/Radar";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PersonIcon from "@mui/icons-material/Person";
import SensorsIcon from "@mui/icons-material/Sensors";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupIcon from "@mui/icons-material/Group";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import MobileNavigation from "./MobileNavigation.tsx";
import FiruBrand from "./FiruBrand.tsx";
import { firuColors } from "./FiruappStyles.ts";
import { isCurrentUserAdmin } from "../../../services/auth.ts";

interface SidebarProps {
  current: "all" | "geofence" | "route";
  onChange?: (section: SidebarProps["current"]) => void;
}

const navItems = [
  { label: "Dashboard", icon: DashboardRoundedIcon, to: "/owner-dashboard", section: "all" as const },
  { label: "Recent Routes", icon: AssessmentIcon, to: "/routes/recent" },
  { label: "Geofences", icon: RadarIcon, to: "/geofence", section: "geofence" as const },
  { label: "My Pets", icon: PetsIcon, to: "/pets" },
  { label: "Volunteer Groups", icon: GroupIcon, to: "/volunteers" },
  { label: "Lost Pets Wall", icon: ContentPasteSearchIcon, to: "/lost-pets" },
  { label: "GPS Sensors", icon: SensorsIcon, to: "/sensors", adminOnly: true },
  { label: "Users", icon: PersonIcon, to: "/users", adminOnly: true },
  { label: "Mi perfil", icon: PersonIcon, to: "/profile" },
  { label: "Alerts", icon: NotificationsActiveIcon, to: "/alerts" },
];

const FiruappSidebar: React.FC<SidebarProps> = ({ onChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = isCurrentUserAdmin();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const handleNavigate = (section?: SidebarProps["current"]) => {
    if (section) onChange?.(section);
  };

  const navContent = (
    <Box
      sx={{
        width: { xs: 284, md: 208 },
        minHeight: "100vh",
        py: 2.25,
        px: 1.75,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 1.25,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)",
        borderRight: "1px solid rgba(226,232,240,0.9)",
        boxShadow: "8px 0 28px rgba(15,23,42,0.05)",
        position: "relative",
        zIndex: 20,
      }}
    >
      <Box sx={{ minHeight: 118, display: "grid", placeItems: "center", mb: 1, "& .firu-brand-stacked svg": { width: 104, height: 70 }, "& .firu-brand-stacked > span": { fontSize: 31, letterSpacing: -1.5 } }}>
        <FiruBrand stacked />
      </Box>


      <Box sx={{ display: "grid", gap: 0.55, width: "100%", mt: 0.25 }}>
        {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;

          return (
            <Button
              component={RouterLink}
              to={item.to}
              key={item.label}
              startIcon={<Icon />}
              onClick={() => handleNavigate(item.section)}
              sx={{
                minHeight: 49,
                justifyContent: "flex-start",
                px: 1.45,
                borderRadius: 1.8,
                color: active ? "#ffffff" : "#64748b",
                background: active ? "#062346" : "transparent",
                border: active ? "1px solid rgba(15,23,42,0.1)" : "1px solid transparent",
                boxShadow: active ? "0 14px 28px rgba(6,35,70,0.22)" : "none",
                fontSize: 13.5,
                fontWeight: 800,
                lineHeight: 1.2,
                textAlign: "left",
                textTransform: "none",
                whiteSpace: "nowrap",
                "& .MuiButton-startIcon": {
                  mr: 1.15,
                  "& svg": { fontSize: 20 },
                  color: "inherit",
                },
                "& .MuiButton-icon": {
                  minWidth: 22,
                },
                "&:hover": {
                  color: active ? "#ffffff" : firuColors.dark,
                  background: active ? "#062346" : "#eef7fb",
                },
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Button
        onClick={handleLogout}
        startIcon={<LogoutIcon />}
        sx={{
          minHeight: 48,
          justifyContent: "flex-start",
          px: 1.5,
          borderRadius: 2,
          color: "#ef4444",
          background: "#fff1f2",
          fontSize: 14,
          fontWeight: 800,
          textTransform: "none",
          "& .MuiButton-startIcon": {
            mr: 1.25,
            color: "inherit",
          },
          "&:hover": { background: "#ffe4e6" },
        }}
      >
        Logout
      </Button>
    </Box>
  );

  return (
    <>
      <MobileNavigation />

      <Box component="aside" sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>
        {navContent}
      </Box>


    </>
  );
};

export default FiruappSidebar;
