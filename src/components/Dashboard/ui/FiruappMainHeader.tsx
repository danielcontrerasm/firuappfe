import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  InputBase,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import CheckIcon from "@mui/icons-material/Check";
import LanguageIcon from "@mui/icons-material/Language";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import FiruBrand from "./FiruBrand.tsx";
import { DashboardCopy, DashboardLanguage } from "./dashboardI18n.ts";

export type MainHeaderAccountDetails = {
  name: string;
  email: string;
  id: string;
  role: string;
};

interface FiruappMainHeaderProps {
  language: DashboardLanguage;
  copy: DashboardCopy;
  dashboardTheme: "current" | "reference";
  accountDetails: MainHeaderAccountDetails;
  accountMenuAnchor: HTMLElement | null;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  controls?: React.ReactNode;
  searchBarRef?: React.Ref<HTMLDivElement>;
  onAccountMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onAccountMenuClose: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
}

const FiruappMainHeader: React.FC<FiruappMainHeaderProps> = ({
  language,
  copy,
  dashboardTheme,
  accountDetails,
  accountMenuAnchor,
  searchValue = "",
  onSearchChange,
  controls,
  searchBarRef,
  onAccountMenuOpen,
  onAccountMenuClose,
  onToggleTheme,
  onToggleLanguage,
  onLogout,
}) => {
  const initials = accountDetails.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "DC";

  return (
    <Box ref={searchBarRef} component="header" className="firu-main-header">
      <Box component={RouterLink} to="/owner-dashboard" className="firu-main-header-brand" aria-label="FiruApp">
        <FiruBrand horizontal />
      </Box>
      <Divider orientation="vertical" flexItem className="firu-main-header-divider" />

      <Box className="firu-main-header-search">
        <InputBase
          fullWidth
          value={searchValue}
          onChange={onSearchChange ? (event) => onSearchChange(event.target.value) : undefined}
          readOnly={!onSearchChange}
          placeholder={copy.search}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          }
          inputProps={{ "aria-label": copy.search }}
        />
      </Box>

      {controls && <Box className="firu-main-header-controls">{controls}</Box>}

      <Stack direction="row" spacing={1.1} alignItems="center" className="firu-main-header-actions">
        <IconButton
          aria-label={`Switch to ${dashboardTheme === "reference" ? "current" : "reference"} dashboard theme`}
          title={`Switch to ${dashboardTheme === "reference" ? "current" : "reference"} theme`}
          onClick={onToggleTheme}
          className="firu-main-header-action"
        >
          {dashboardTheme === "reference" ? <CheckIcon sx={{ color: "#0f5de7" }} /> : <PaletteOutlinedIcon />}
        </IconButton>
        <Button
          onClick={onToggleLanguage}
          startIcon={<LanguageIcon />}
          aria-label={copy.switchLanguage}
          title={copy.switchLanguage}
          className="firu-main-header-language"
        >
          {language.toUpperCase()}
        </Button>
        <IconButton component={RouterLink} to="/alerts" aria-label={copy.alertsCount} className="firu-main-header-action">
          <Badge color="error" variant="dot">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
        <IconButton aria-label={copy.account} className="firu-main-header-action firu-main-header-message">
          <Badge color="primary" badgeContent={3} max={9}>
            <MessageOutlinedIcon />
          </Badge>
        </IconButton>
        <IconButton
          aria-label="Open account details"
          aria-haspopup="menu"
          aria-expanded={Boolean(accountMenuAnchor)}
          onClick={onAccountMenuOpen}
          className="firu-main-header-account"
        >
          <Avatar>{initials}</Avatar>
        </IconButton>
        <KeyboardArrowDownIcon className="firu-main-header-chevron" />
      </Stack>

      <Menu
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={onAccountMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "firu-main-header-account-menu" }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 900, letterSpacing: 1 }}>
            {copy.account}
          </Typography>
          <Typography sx={{ color: "#071735", fontWeight: 900 }}>{accountDetails.name}</Typography>
          <Typography variant="body2" sx={{ color: "#64748b", overflowWrap: "anywhere" }}>{accountDetails.email}</Typography>
        </Box>
        <Divider />
        <MenuItem disabled sx={{ opacity: "1 !important", color: "#33445e !important" }}>
          {copy.role}: {accountDetails.role}
        </MenuItem>
        <MenuItem disabled sx={{ opacity: "1 !important", color: "#33445e !important" }}>
          {copy.accountId}: {accountDetails.id}
        </MenuItem>
        <Divider />
        <MenuItem onClick={onToggleLanguage}>
          <LanguageIcon fontSize="small" />
          <span>{copy.switchLanguage} ({language.toUpperCase()})</span>
        </MenuItem>
        <MenuItem onClick={onToggleTheme}>
          <PaletteOutlinedIcon fontSize="small" />
          <span>{dashboardTheme === "reference" ? "Switch to current theme" : "Switch to reference theme"}</span>
        </MenuItem>
        <Divider />
        <MenuItem onClick={onLogout} className="firu-main-header-logout-item">
          <LogoutIcon fontSize="small" />
          <span>{copy.logout}</span>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FiruappMainHeader;
