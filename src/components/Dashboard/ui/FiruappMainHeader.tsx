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
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
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
  accountDetails: MainHeaderAccountDetails;
  accountMenuAnchor: HTMLElement | null;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  controls?: React.ReactNode;
  searchBarRef?: React.Ref<HTMLDivElement>;
  onAccountMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onAccountMenuClose: () => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
}

const FiruappMainHeader: React.FC<FiruappMainHeaderProps> = ({
  language,
  copy,
  accountDetails,
  accountMenuAnchor,
  searchValue = "",
  onSearchChange,
  controls,
  searchBarRef,
  onAccountMenuOpen,
  onAccountMenuClose,
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
    <Paper
      ref={searchBarRef}
      component="header"
      elevation={0}
      sx={{
        minHeight: { xs: "auto", md: 78 },
        px: { xs: 2, md: 2.75 },
        py: { xs: 1.5, md: 0 },
        borderRadius: 0,
        bgcolor: "rgba(255,255,255,0.94)",
        borderBottom: "1px solid rgba(226,232,240,0.86)",
        boxShadow: "0 12px 34px rgba(15,23,42,0.045)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: { xs: "wrap", md: "nowrap" },
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: "auto" },
          maxWidth: 675,
          minWidth: { md: 240 },
          flex: { md: "1 1 360px" },
          height: 46,
          display: "flex",
          alignItems: "center",
          gap: 1.35,
          bgcolor: "#f8fbff",
          border: "1px solid #d8e5f1",
          px: 1.7,
          borderRadius: 2.2,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92), 0 10px 22px rgba(15,23,42,0.035)",
        }}
      >
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

      {controls}

      <Stack direction="row" spacing={1.35} alignItems="center" sx={{ ml: "auto" }}>
        <Button
          onClick={onToggleLanguage}
          startIcon={<LanguageIcon />}
          aria-label={copy.switchLanguage}
          title={copy.switchLanguage}
          sx={{ minWidth: 74, height: 52, bgcolor: "#f8fbff", border: "1px solid #d8e5f1", borderRadius: 2, color: "#1f3350", fontWeight: 900 }}
        >
          {language.toUpperCase()}
        </Button>
        <IconButton component={RouterLink} to="/alerts" aria-label={copy.alertsCount} sx={{ width: 52, height: 52, bgcolor: "#f8fbff", border: "1px solid #d8e5f1", borderRadius: 2 }}>
          <Badge color="error" variant="dot">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
        <IconButton aria-label={copy.account} sx={{ width: 52, height: 52, bgcolor: "#f8fbff", border: "1px solid #d8e5f1", borderRadius: 2 }}>
          <Badge color="primary" badgeContent={3} max={9}>
            <MessageOutlinedIcon />
          </Badge>
        </IconButton>
        <IconButton
          aria-label="Open account details"
          aria-haspopup="menu"
          aria-expanded={Boolean(accountMenuAnchor)}
          onClick={onAccountMenuOpen}
          sx={{ p: 0.25, borderRadius: 2.5 }}
        >
          <Avatar sx={{ width: 50, height: 50, bgcolor: "#062346", color: "white", fontWeight: 950, fontSize: 18 }}>{initials}</Avatar>
        </IconButton>
        <KeyboardArrowDownIcon sx={{ color: "#3d516e", display: { xs: "none", sm: "block" } }} />
      </Stack>

      <Menu
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={onAccountMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { mt: 1, minWidth: 270, borderRadius: 2.5, boxShadow: "0 18px 45px rgba(15,23,42,0.16)" } }}
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
        <Divider />
        <MenuItem onClick={onLogout} sx={{ color: "#e53935", fontWeight: 800, gap: 1 }}>
          <LogoutIcon fontSize="small" />
          <span>{copy.logout}</span>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default FiruappMainHeader;
