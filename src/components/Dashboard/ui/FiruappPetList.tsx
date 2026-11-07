// ui/FiruappPetsList.tsx
import React, { useState } from "react";
import {
  Avatar,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
} from "@mui/material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupsIcon from "@mui/icons-material/Groups";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import { useNavigate } from "react-router-dom";
import { compactPanel, firuColors, Pet } from "./FiruappStyles.ts";
import { usePetImage } from "../../../services/usePetImage.ts";
import { buildApiUrl } from "../../../config/runtime";
import { DashboardCopy, getDashboardCopy } from "./dashboardI18n.ts";

interface PetsListProps {
  pets: Pet[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onStatusChange?: (id: string, status: Pet["status"]) => void;
  containerRef?: React.Ref<HTMLDivElement>;
  copy?: DashboardCopy;
  variant?: "default" | "reference";
}

const getBatteryColor = (battery?: number) => {
  if (battery == null) return firuColors.muted;
  if (battery <= 20) return firuColors.red;
  if (battery <= 50) return firuColors.orange;
  return firuColors.green;
};

const FiruappPetAvatar: React.FC<{ pet: Pet; petStatus: string }> = ({ pet, petStatus }) => {
  const resolvedSrc = usePetImage(pet.apiId || pet.id, pet.imageUrl || pet.avatarUrl);

  return (
    <Avatar
      src={resolvedSrc}
      sx={{
        width: { xs: 44, sm: 52 },
        height: { xs: 44, sm: 52 },
        bgcolor: petStatus === "lost" ? "#fed7aa" : "#bbf7d0",
        color: petStatus === "lost" ? "#c2410c" : "#15803d",
        border: { xs: "2px solid white", sm: "3px solid white" },
        boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
        fontWeight: 900,
        fontSize: { xs: 15, sm: 18 },
      }}
    >
      {pet.name.charAt(0)}
    </Avatar>
  );
};

const FiruappPetsList: React.FC<PetsListProps> = ({ pets, selectedId, onSelect, onStatusChange, containerRef, copy = getDashboardCopy("en"), variant = "default" }) => {
  const [menuAnchor, setMenuAnchor] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [menuPet, setMenuPet] = useState<Pet | null>(null);
  const navigate = useNavigate();
  const isDemoPet = menuPet?.id.startsWith("mock-");

  const handleRightClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, pet: Pet) => {
    event.preventDefault();
    setMenuAnchor({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
    setMenuPet(pet);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuPet(null);
  };

  const updatePetStatus = async (status: Pet["status"]) => {
    if (!menuPet) return;

    const petId = menuPet.apiId || menuPet.id;
    const endpoint =
      status === "lost"
        ? buildApiUrl(`/api/pets/${petId}/lost`)
        : buildApiUrl(`/api/pets/${petId}/found`);

    try {
      const token = localStorage.getItem("token");
      const decodedToken = token ? jwtDecode<Record<string, any>>(token) : null;
      console.log("Updating pet status:", {
        petName: menuPet.name,
        dashboardId: menuPet.id,
        apiId: menuPet.apiId,
        petId,
        status,
        endpoint,
        hasToken: Boolean(token),
        tokenUserId: decodedToken?.id ?? decodedToken?.userId ?? decodedToken?.sub,
        tokenRole: decodedToken?.role ?? decodedToken?.authorities,
      });
      await axios.post(endpoint, {}, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      onStatusChange?.(petId, status);
      handleCloseMenu();
    } catch (error: any) {
      console.error(`Error marking pet as ${status}:`, error);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Unknown error";
      alert(`${status === "lost" ? copy.markLost : copy.markFound}: ${menuPet.name}. ${message}`);
    }
  };

  const handleCreateGeofence = () => {
    if (menuPet) {
      navigate(`/geofence?petId=${menuPet.apiId || menuPet.id}`);
    }
    handleCloseMenu();
  };

  const handleViewReport = () => {
    console.log("View Report for:", menuPet?.name);
    handleCloseMenu();
  };

  const handleCreateSearchGroup = () => {
    if (menuPet) {
      const searchParams = new URLSearchParams({
        create: "true",
        petId: String(menuPet.apiId || menuPet.id),
      });
      navigate(`/volunteers?${searchParams.toString()}`);
    }
    handleCloseMenu();
  };

  return (
    <Box
      ref={containerRef}
      className="firuapp-pets-list"
      sx={{
        ...compactPanel,
        position: "absolute",
        left: { xs: 10, sm: 20 },
        right: { xs: 10, sm: "auto" },
        bottom: { xs: 12, sm: 20 },
        zIndex: 1000,
        maxHeight: "none",
        overflow: "visible",
        background: "transparent",
        border: "none",
        boxShadow: "none",
        width: { xs: "auto", md: "calc(100% - 150px)" },
      }}
    >
      <Box
        sx={{
          px: { xs: 1.25, sm: 2 },
          pt: { xs: 1.25, sm: 2 },
          pb: { xs: 0.75, sm: 1.25 },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          display: "none",
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: firuColors.muted, fontWeight: 900, letterSpacing: 1.1, fontSize: { xs: 10, sm: 12 } }}
          >
            {copy.trackedPets}
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, color: firuColors.dark, lineHeight: 1.1, fontSize: { xs: 16, sm: 20 } }}
          >
            {copy.myPets}
          </Typography>
        </Box>
        <Chip
          label={`${pets.filter((pet) => pet.gpsOnline).length} ${copy.online.toLowerCase()}`}
          size="small"
          sx={{
            height: { xs: 22, sm: 24 },
            bgcolor: "#dcfce7",
            color: "#15803d",
            fontWeight: 800,
            fontSize: { xs: 10, sm: 11 },
            "& .MuiChip-label": { px: { xs: 0.75, sm: 1 } },
          }}
        />
      </Box>

      <List
        sx={{
          p: 0,
          pt: 0,
          display: "grid",
          gridAutoFlow: { xs: "column", md: "initial" },
          gridTemplateColumns: { xs: `repeat(${Math.max(pets.length, 1)}, minmax(250px, 1fr))`, md: "repeat(2, minmax(0, 1fr))" },
          gap: 1.2,
          overflowX: "auto",
          overflowY: { xs: "hidden", md: "auto" },
          // Keep four cards visible (two rows) while allowing larger households to scroll.
          maxHeight: { xs: "none", md: 184 },
          pb: 0.25,
        }}
      >
        {pets.map((pet) => {
          const petStatus = pet.status.toLowerCase();
          const isSelected = pet.id === selectedId;
          const gpsOnline = pet.gpsOnline === true;
          const details = [pet.race || pet.breed, pet.age, pet.weight].filter(Boolean).join(" · ");
          const referenceLastSeen = pet.lastSeen || (gpsOnline ? "Actualizado recientemente" : "Última conexión no disponible");

          return (
            <ListItemButton
              key={pet.id}
              className={`${variant === "reference" ? "firuapp-reference-pet-row" : ""}${isSelected ? " is-selected" : ""}`.trim()}
              onClick={() => onSelect?.(pet.id)}
              onContextMenu={(e) => handleRightClick(e, pet)}
              sx={variant === "reference" ? undefined : {
                minHeight: 82,
                borderRadius: 2.2,
                mb: 0,
                px: { xs: 1.25, sm: 1.6 },
                py: { xs: 1, sm: 1.15 },
                border: isSelected
                  ? `1.5px solid ${petStatus === "lost" ? "#ff7780" : "#dbe7f3"}`
                  : `1px solid ${petStatus === "lost" ? "#ffb9bd" : "#dbe7f3"}`,
                background: petStatus === "lost" ? "rgba(255,255,255,0.94)" : "#ffffff",
                boxShadow: isSelected ? "0 14px 28px rgba(15,23,42,0.14)" : "0 10px 24px rgba(15,23,42,0.10)",
                "&:hover": { background: "#ffffff", boxShadow: "0 16px 32px rgba(15,23,42,0.16)" },
              }}
            >
              <ListItemAvatar sx={{ minWidth: variant === "reference" ? 64 : { xs: 54, sm: 62 } }}>
                <FiruappPetAvatar pet={pet} petStatus={petStatus} />
              </ListItemAvatar>
              {variant === "reference" ? (
                <>
                  <Box className="firuapp-reference-pet-copy">
                    <Typography className="firuapp-reference-pet-name">{pet.name}</Typography>
                    <Typography className={`firuapp-reference-pet-status${gpsOnline ? " is-online" : ""}`}>
                      <span aria-hidden="true" />
                      {gpsOnline ? copy.onlineLabel : copy.offlineLabel}
                    </Typography>
                    <Typography className="firuapp-reference-pet-last-seen">{referenceLastSeen}</Typography>
                  </Box>
                  <Box className={`firuapp-reference-pet-battery${petStatus === "lost" ? " is-lost" : ""}`}>
                    <BatteryChargingFullIcon />
                    <span>{pet.battery == null ? "--%" : `${pet.battery}%`}</span>
                  </Box>
                </>
              ) : (
                <>
                  <ListItemText
                    sx={{ minWidth: 0, mr: 1 }}
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 900,
                            color: firuColors.dark,
                            lineHeight: 1.15,
                            fontSize: { xs: 12.5, sm: 14 },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {pet.name}
                        </Typography>
                        <Chip
                          className={`firu-pet-status-chip ${gpsOnline ? "is-online" : "is-offline"}`}
                          label={gpsOnline ? copy.onlineLabel : copy.offlineLabel}
                          size="small"
                          sx={{
                            height: { xs: 22, sm: 24 },
                            bgcolor: gpsOnline ? firuColors.green : firuColors.muted,
                            color: "white",
                            fontSize: { xs: 9.5, sm: 10.5 },
                            fontWeight: 900,
                            "& .MuiChip-label": { px: { xs: 0.55, sm: 0.75 } },
                          }}
                        />
                        {petStatus === "lost" && (
                          <Chip label={copy.lostLabel} size="small" sx={{ bgcolor: firuColors.red, color: "white", fontWeight: 900 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: { xs: 0.25, sm: 0.45 } }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: firuColors.muted,
                            fontWeight: 700,
                            lineHeight: 1.2,
                            fontSize: { xs: 10, sm: 12 },
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {details || copy.breedAgeWeight}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip
                    icon={<BatteryChargingFullIcon sx={{ fontSize: { xs: 14, sm: 15 } }} />}
                    label={pet.battery == null ? "--%" : `${pet.battery}%`}
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 26 },
                      alignSelf: "center",
                      borderRadius: 999,
                      bgcolor: "#f8fbff",
                      border: `1px solid ${getBatteryColor(pet.battery)}`,
                      color: getBatteryColor(pet.battery),
                      fontSize: { xs: 10, sm: 11 },
                      fontWeight: 950,
                      flexShrink: 0,
                      "& .MuiChip-icon": { color: "inherit", ml: 0.65 },
                      "& .MuiChip-label": { px: { xs: 0.55, sm: 0.75 } },
                    }}
                  />
                  <MoreVertIcon sx={{ color: petStatus === "lost" ? "#ff3444" : "#6b7c95", fontSize: { xs: 20, sm: 22 } }} />
                </>
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Menu
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={menuAnchor ? { top: menuAnchor.mouseY, left: menuAnchor.mouseX } : undefined}
        PaperProps={{
          sx: {
            py: 0.75,
            borderRadius: 3,
            boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
            "& .MuiMenuItem-root": { minHeight: 38, px: 1.5, fontSize: 14, fontWeight: 600 },
            "& .MuiListItemIcon-root": { minWidth: 34 },
          },
        }}
      >
        <MenuItem onClick={handleCreateGeofence} disabled={isDemoPet}>
          <ListItemIcon><AddLocationAltIcon fontSize="small" /></ListItemIcon>
          {copy.createGeofence}
        </MenuItem>
        <MenuItem onClick={handleViewReport}>
          <ListItemIcon><AssessmentIcon fontSize="small" /></ListItemIcon>
          {copy.report}
        </MenuItem>
        <MenuItem onClick={handleCreateSearchGroup} disabled={isDemoPet}>
          <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon>
          {copy.searchGroup}
        </MenuItem>
        <MenuItem onClick={() => updatePetStatus("lost")} disabled={isDemoPet}>
          <ListItemIcon><ReportProblemIcon fontSize="small" color="warning" /></ListItemIcon>
          {copy.markLost}
        </MenuItem>
        <MenuItem onClick={() => updatePetStatus("active")} disabled={isDemoPet}>
          <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
          {copy.markFound}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FiruappPetsList;
