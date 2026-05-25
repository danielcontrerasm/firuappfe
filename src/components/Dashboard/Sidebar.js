// src/components/Dashboard/Sidebar.js
import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import TimelineIcon from "@mui/icons-material/Timeline";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "All My Pets", icon: <PetsIcon />, path: "/owner-dashboard" },
    { label: "Create Geofence", icon: <TrackChangesIcon />, path: "/geofence" },
    { label: "Day route", icon: <TimelineIcon />, path: "/route" },
  ];

  return (
    <Box
      sx={{
        background: "linear-gradient(170deg, #006d77, #004d40)",
        color: "#fff",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/firuapp-logo-120x80.png" // your resized logo
          alt="Firuapp"
          style={{ maxWidth: "100%", borderRadius: 16 }}
        />
      </Box>

      {/* Menu */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: "rgba(255,255,255,0.92)",
              "&.Mui-selected": {
                backgroundColor: "rgba(255,255,255,0.16)",
              },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.12)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.25)", mb: 1 }} />

      {/* Logout */}
      <ListItemButton
        onClick={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
        sx={{
          borderRadius: 2,
          color: "rgba(255,255,255,0.85)",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItemButton>
    </Box>
  );
};

export default Sidebar;
