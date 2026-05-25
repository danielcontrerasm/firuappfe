// src/components/Dashboard/DashboardLayout.js
import React from "react";
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";

const DashboardLayout = () => {
  const location = useLocation();
  const current =
    location.pathname === "/geofence"
      ? "geofence"
      : location.pathname === "/route" || location.pathname === "/routes/recent"
        ? "route"
        : "all";
  const isMapPage = ["/geofence", "/route", "/routes/recent"].includes(location.pathname);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "#f4f8fb",
      }}
    >
      <FiruappSidebar current={current} />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: isMapPage ? { xs: 1.5, md: 2 } : { xs: 1.5, md: 2 },
          background:
            "linear-gradient(180deg, #f4f8fb 0%, #eefbf8 100%)",
        }}
      >
        <Box
          sx={{
            maxWidth: isMapPage ? "none" : 1180,
            mx: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
