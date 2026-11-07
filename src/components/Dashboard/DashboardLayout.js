// src/components/Dashboard/DashboardLayout.js
import React from "react";
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";
import FiruappPageTopbar from "./ui/FiruappPageTopbar.tsx";
import { useState } from "react";
import "./firuapp-page-layout.css";

const DashboardLayout = () => {
  const [dashboardTheme, setDashboardTheme] = useState(() => (
    typeof window !== "undefined" && window.localStorage.getItem("firuapp-dashboard-theme") === "current" ? "current" : "reference"
  ));
  const location = useLocation();
  const current =
    location.pathname === "/geofence"
      ? "geofence"
      : location.pathname === "/route" || location.pathname === "/routes/recent"
        ? "route"
        : location.pathname === "/walks"
          ? "walks"
        : "all";
  const isMapPage = ["/geofence", "/route", "/routes/recent"].includes(location.pathname);

  return (
    <Box
      className={`firu-app-layout ${dashboardTheme === "reference" ? "firu-reference-theme" : ""}`}
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "#f4f8fb",
      }}
    >
      <FiruappSidebar current={current} />

      <Box className="firu-layout-column">
        <FiruappPageTopbar
          theme={dashboardTheme}
          onToggleTheme={() => {
            setDashboardTheme((current) => {
              const next = current === "reference" ? "current" : "reference";
              window.localStorage.setItem("firuapp-dashboard-theme", next);
              return next;
            });
          }}
        />
        <Box
          className="firu-layout-content"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: isMapPage ? { xs: 1.5, md: 2 } : { xs: 1.5, md: 2 },
            background: "linear-gradient(180deg, #f4f8fb 0%, #eefbf8 100%)",
          }}
        >
          <Box sx={{ maxWidth: isMapPage ? "none" : 1180, mx: 0 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
