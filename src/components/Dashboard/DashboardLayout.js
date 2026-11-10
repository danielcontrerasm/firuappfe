// src/components/Dashboard/DashboardLayout.js
import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";
import OwnerReferenceTopbar from "./ui/OwnerReferenceTopbar.tsx";
import { getDashboardCopy } from "./ui/dashboardI18n.ts";
import {
  decodeAuthToken,
  getAuthRoles,
  getCurrentUserEmail,
  getCurrentUserId,
} from "../../services/auth.ts";
import "./firuapp-reference-theme.css";

const DashboardLayout = () => {
  const location = useLocation();
  const [language, setLanguage] = useState(() => (
    typeof window !== "undefined" && window.localStorage.getItem("firuapp-language") === "es" ? "es" : "en"
  ));
  const [dashboardTheme, setDashboardTheme] = useState(() => (
    typeof window !== "undefined" && window.localStorage.getItem("firuapp-dashboard-theme") === "current"
      ? "current"
      : "reference"
  ));
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const copy = getDashboardCopy(language);
  const accountDetails = useMemo(() => {
    const claims = decodeAuthToken();
    const nestedAccounts = [claims.user, claims.profile, claims.account, claims.data, claims.payload]
      .filter((value) => value && typeof value === "object");
    const sources = [claims, ...nestedAccounts];
    const read = (keys) => {
      for (const source of sources) {
        const value = keys
          .map((key) => source[key])
          .find((candidate) => candidate != null && String(candidate).trim() !== "");
        if (value != null) return String(value).trim();
      }
      return "";
    };

    return {
      name: read(["name", "fullName", "displayName", "username"]) || "Daniel Contreras",
      email: getCurrentUserEmail(claims) || read(["email", "mail"]) || "demo@example.com",
      id: getCurrentUserId(claims) || read(["id", "userId", "user_id"]) || "—",
      role: getAuthRoles(claims)[0] || read(["role", "userRole"]) || "USER",
    };
  }, []);

  const current =
    location.pathname === "/geofence"
      ? "geofence"
      : location.pathname === "/route" || location.pathname === "/routes/recent"
        ? "route"
        : "all";
  const isMapPage = ["/geofence", "/route", "/routes/recent"].includes(location.pathname);

  const handleToggleTheme = () => {
    setDashboardTheme((currentTheme) => {
      const next = currentTheme === "reference" ? "current" : "reference";
      window.localStorage.setItem("firuapp-dashboard-theme", next);
      return next;
    });
  };

  const handleToggleLanguage = () => {
    setLanguage((currentLanguage) => {
      const next = currentLanguage === "es" ? "en" : "es";
      window.localStorage.setItem("firuapp-language", next);
      return next;
    });
  };

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <Box className="dashboard-global-shell" sx={{ minHeight: "100vh", background: "#f4f8fb" }}>
      <Box className="dashboard-global-header">
        <OwnerReferenceTopbar
          language={language}
          copy={copy}
          dashboardTheme={dashboardTheme}
          accountDetails={accountDetails}
          accountMenuAnchor={accountMenuAnchor}
          onAccountMenuOpen={(event) => setAccountMenuAnchor(event.currentTarget)}
          onAccountMenuClose={() => setAccountMenuAnchor(null)}
          onToggleTheme={() => {
            setAccountMenuAnchor(null);
            handleToggleTheme();
          }}
          onToggleLanguage={() => {
            setAccountMenuAnchor(null);
            handleToggleLanguage();
          }}
          onLogout={() => {
            setAccountMenuAnchor(null);
            handleLogout();
          }}
        />
      </Box>

      <Box
        className="firu-app-layout"
        sx={{
          minHeight: "calc(100vh - 82px)",
          display: "flex",
          background: "#f4f8fb",
        }}
      >
        <FiruappSidebar current={current} copy={copy} language={language} showBrand={false} />

        <Box
          className="firu-layout-content"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: isMapPage ? { xs: 1.5, md: 2 } : { xs: 1.5, md: 2 },
            background: "linear-gradient(180deg, #f4f8fb 0%, #eefbf8 100%)",
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
    </Box>
  );
};

export default DashboardLayout;
