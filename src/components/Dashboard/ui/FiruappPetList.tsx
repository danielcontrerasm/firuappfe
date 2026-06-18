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
import { useNavigate } from "react-router-dom";
import { compactPanel, firuColors, Pet } from "./FiruappStyles.ts";
import { usePetImage } from "../../../services/usePetImage.ts";

interface PetsListProps {
  pets: Pet[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onStatusChange?: (id: string, status: Pet["status"]) => void;
}

const statusColorMap: Record<string, string> = {
  active: firuColors.green,
  lost: firuColors.orange,
};

const FiruappPetAvatar: React.FC<{ pet: Pet; petStatus: string }> = ({ pet, petStatus }) => {
  const resolvedSrc = usePetImage(pet.apiId || pet.id, pet.imageUrl || pet.avatarUrl);

  return (
    <Avatar
      src={resolvedSrc}
      sx={{
        width: 38,
        height: 38,
        bgcolor: petStatus === "lost" ? "#fed7aa" : "#bbf7d0",
        color: petStatus === "lost" ? "#c2410c" : "#15803d",
        border: "3px solid white",
        boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
        fontWeight: 900,
      }}
    >
      {pet.name.charAt(0)}
    </Avatar>
  );
};

const FiruappPetsList: React.FC<PetsListProps> = ({ pets, selectedId, onSelect, onStatusChange }) => {
  const [menuAnchor, setMenuAnchor] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [menuPet, setMenuPet] = useState<Pet | null>(null);
  const navigate = useNavigate();

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
        ? `http://localhost:8080/api/pets/${petId}/lost`
        : `http://localhost:8080/api/pets/${petId}/found`;

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
      alert(`Could not mark ${menuPet.name} as ${status}. ${message}`);
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

  return (
    <Box
      sx={{
        ...compactPanel,
        position: "absolute",
        top: 24,
        left: 24,
        zIndex: 1000,
        width: { xs: "calc(100% - 48px)", sm: 300 },
        maxHeight: { xs: 290, md: 360 },
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="overline" sx={{ color: firuColors.muted, fontWeight: 900, letterSpacing: 1.5 }}>
            Live pets
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, color: firuColors.dark, lineHeight: 1.1 }}>
            My Pets
          </Typography>
        </Box>
        <Chip label={`${pets.length} online`} size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 800 }} />
      </Box>

      <List sx={{ p: 1.25, pt: 0, overflowY: "auto", maxHeight: { xs: 210, md: 280 } }}>
        {pets.map((pet) => {
          const petStatus = pet.status.toLowerCase();
          const isSelected = pet.id === selectedId;
          const statusColor = statusColorMap[petStatus] || firuColors.green;
          const details = [pet.race || pet.breed, pet.age, pet.weight].filter(Boolean).join(" · ");

          return (
            <ListItemButton
              key={pet.id}
              onClick={() => onSelect?.(pet.id)}
              onContextMenu={(e) => handleRightClick(e, pet)}
              sx={{
                borderRadius: 3,
                mb: 1,
                px: 1.25,
                py: 1,
                border: isSelected ? `1px solid ${firuColors.cyan}` : "1px solid transparent",
                background: isSelected ? "linear-gradient(135deg, #ecfeff, #f0fdf4)" : "#ffffff",
                boxShadow: isSelected ? "0 14px 24px rgba(6,182,212,0.12)" : "none",
                "&:hover": { background: "#f8fafc" },
              }}
            >
              <ListItemAvatar sx={{ minWidth: 46 }}>
                <FiruappPetAvatar pet={pet} petStatus={petStatus} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 900,
                        color: firuColors.dark,
                        lineHeight: 1.15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pet.name}
                    </Typography>
                    <Chip
                      label={
                        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.55 }}>
                          <Box component="span" sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "white" }} />
                          {pet.status === "active" ? "live" : "lost"}
                        </Box>
                      }
                      size="small"
                      sx={{
                        height: 20,
                        bgcolor: statusColor,
                        color: "white",
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        "& .MuiChip-label": { px: 0.75 },
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.45 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: firuColors.muted,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        display: "block",
                      }}
                    >
                      {details || "Breed · Age · Weight"}
                    </Typography>
                  </Box>
                }
              />
              <MoreVertIcon sx={{ color: firuColors.muted, fontSize: 18 }} />
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
        <MenuItem onClick={handleCreateGeofence}>
          <ListItemIcon><AddLocationAltIcon fontSize="small" /></ListItemIcon>
          Create Geofence
        </MenuItem>
        <MenuItem onClick={handleViewReport}>
          <ListItemIcon><AssessmentIcon fontSize="small" /></ListItemIcon>
          View Daily Report
        </MenuItem>
        <MenuItem onClick={handleViewReport}>
          <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon>
          Create Search Group
        </MenuItem>
        <MenuItem onClick={() => updatePetStatus("lost")}>
          <ListItemIcon><ReportProblemIcon fontSize="small" color="warning" /></ListItemIcon>
          Mark as Lost
        </MenuItem>
        <MenuItem onClick={() => updatePetStatus("active")}>
          <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
          Mark as Found
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FiruappPetsList;
