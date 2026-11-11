// src/components/Dashboard/DashboardLayout.js
import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";
import FiruappMainHeader from "./ui/FiruappMainHeader.tsx";
import { getDashboardCopy } from "./ui/dashboardI18n.ts";
import {
  decodeAuthToken,
  getAuthRoles,
  getCurrentUserEmail,
  getCurrentUserId,
} from "../../services/auth.ts";

const DashboardLayout = () => {
  const location = useLocation();
  const [language, setLanguage] = useState(() => (
    typeof window !== "undefined" && window.localStorage.getItem("firuapp-language") === "es" ? "es" : "en"
  ));
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const copy = getDashboardCopy(language);

  const current =
    location.pathname === "/geofence"
      ? "geofence"
      : location.pathname === "/route" || location.pathname === "/routes/recent"
        ? "route"
        : location.pathname === "/walks"
          ? "walks"
          : "all";
  const isMapPage = ["/geofence", "/route", "/routes/recent"].includes(location.pathname);

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

  const toggleLanguage = () => {
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
    <Box
      className="firu-app-layout"
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "#f7fbff",
      }}
    >
      <FiruappSidebar current={current} copy={copy} language={language} />

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <FiruappMainHeader
          language={language}
          copy={copy}
          accountDetails={accountDetails}
          accountMenuAnchor={accountMenuAnchor}
          onAccountMenuOpen={(event) => setAccountMenuAnchor(event.currentTarget)}
          onAccountMenuClose={() => setAccountMenuAnchor(null)}
          onToggleLanguage={() => {
            setAccountMenuAnchor(null);
            toggleLanguage();
          }}
          onLogout={() => {
            setAccountMenuAnchor(null);
            handleLogout();
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
