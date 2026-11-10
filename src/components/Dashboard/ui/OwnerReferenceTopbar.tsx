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
import { Link as RouterLink } from "react-router-dom";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
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
  const labels = language === "es"
    ? {
        alerts: "Alertas",
        help: "Ayuda",
        switchTheme: "Cambiar tema",
        switchLanguage: "Cambiar idioma",
      }
    : {
        alerts: "Alerts",
        help: "Help",
        switchTheme: "Switch theme",
        switchLanguage: "Switch language",
      };

  const initials = accountDetails.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "DC";

  return (
    <Box ref={searchBarRef} component="header" className="owner-reference-topbar">
      <Box component={RouterLink} to="/owner-dashboard" className="owner-reference-brand-link" aria-label="FiruApp">
        <FiruBrand horizontal />
      </Box>
      <Divider orientation="vertical" flexItem className="owner-reference-topbar-divider" />

      <Stack direction="row" alignItems="center" spacing={0.4} className="owner-reference-topbar-actions">
        <IconButton
          aria-label={`${labels.switchTheme}: ${dashboardTheme === "reference" ? "current" : "reference"}`}
          title={`${labels.switchTheme}: ${dashboardTheme === "reference" ? "current" : "reference"}`}
          onClick={onToggleTheme}
          className="owner-reference-header-icon"
        >
          <PaletteOutlinedIcon />
        </IconButton>
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
