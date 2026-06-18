// ui/FiruappSidebar.tsx
import React from "react";
import { Avatar, Box, Button } from "@mui/material";
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
import { firuColors } from "./FiruappStyles.ts";

interface SidebarProps {
  current: "all" | "geofence" | "route";
  onChange?: (section: SidebarProps["current"]) => void;
}

const navItems = [
  { label: "Dashboard", icon: DashboardRoundedIcon, to: "/owner-dashboard", section: "all" as const },
  { label: "Recent Routes", icon: AssessmentIcon, to: "/routes/recent" },
  { label: "Geofences", icon: RadarIcon, to: "/geofence", section: "geofence" as const },
  { label: "My Pets", icon: PetsIcon, to: "/pets" },
  { label: "Users", icon: PersonIcon, to: "/users" },
  { label: "GPS Sensors", icon: SensorsIcon, to: "/sensors" },
  { label: "Volunteer Groups", icon: GroupIcon, to: "/volunteers" },
  { label: "Alerts", icon: NotificationsActiveIcon, to: "/alerts" },
];

const FiruappSidebar: React.FC<SidebarProps> = ({ onChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 180, md: 180 },
        minHeight: "100vh",
        py: 2.5,
        px: 1.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 2,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)",
        borderRight: "1px solid rgba(226,232,240,0.9)",
        boxShadow: "8px 0 28px rgba(15,23,42,0.05)",
        position: "relative",
        zIndex: 20,
      }}
    >
      <Avatar
        sx={{
          width: 136,
          height: 136,
          mx: "auto",
          borderRadius: 0,
          bgcolor: "transparent",
        }}
      >
        <Box
          component="img"
          src="/logo_sidebar.png"
          alt="Firuapp logo"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: "scale(1.14)",
          }}
        />
      </Avatar>


      <Box sx={{ display: "grid", gap: 1, width: "100%", mt: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;

          return (
            <Button
              component={RouterLink}
              to={item.to}
              key={item.label}
              startIcon={<Icon />}
              onClick={() => item.section && onChange?.(item.section)}
              sx={{
                minHeight: 48,
                justifyContent: "flex-start",
                px: 1.5,
                borderRadius: 3,
                color: active ? "#ffffff" : "#64748b",
                background: active ? firuColors.dark : "transparent",
                border: active ? "1px solid rgba(15,23,42,0.1)" : "1px solid transparent",
                boxShadow: active ? "0 14px 24px rgba(15,23,42,0.18)" : "none",
                fontSize: 14,
                fontWeight: 800,
                lineHeight: 1.2,
                textAlign: "left",
                textTransform: "none",
                whiteSpace: "nowrap",
                "& .MuiButton-startIcon": {
                  mr: 1,
                  color: "inherit",
                },
                "& .MuiButton-icon": {
                  minWidth: 22,
                },
                "&:hover": {
                  color: active ? "#ffffff" : firuColors.dark,
                  background: active ? firuColors.dark : "#eef7fb",
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
          borderRadius: 3,
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
};

export default FiruappSidebar;
