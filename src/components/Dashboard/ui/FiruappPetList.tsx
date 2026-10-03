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
import { buildApiUrl } from "../../../config/runtime";

interface PetsListProps {
  pets: Pet[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onStatusChange?: (id: string, status: Pet["status"]) => void;
  containerRef?: React.Ref<HTMLDivElement>;
}

const statusColorMap: Record<string, string> = {
  active: firuColors.green,
  lost: firuColors.red,
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

const FiruappPetsList: React.FC<PetsListProps> = ({ pets, selectedId, onSelect, onStatusChange, containerRef }) => {
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
      ref={containerRef}
      sx={{
        ...compactPanel,
        position: "absolute",
        left: { xs: 10, sm: 16 },
        right: { xs: 10, sm: 16 },
        bottom: { xs: 12, sm: 16 },
        zIndex: 1000,
        width: "auto",
        maxHeight: "none",
        overflow: "visible",
        background: "transparent",
        border: "none",
        boxShadow: "none",
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
            Live pets
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, color: firuColors.dark, lineHeight: 1.1, fontSize: { xs: 16, sm: 20 } }}
          >
            My Pets
          </Typography>
        </Box>
        <Chip
          label={`${pets.length} online`}
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
          overflowY: "hidden",
          pb: 0.25,
        }}
      >
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
                minHeight: 92,
                borderRadius: 2,
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
              <ListItemAvatar sx={{ minWidth: { xs: 54, sm: 62 } }}>
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
                        fontSize: { xs: 12.5, sm: 14 },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pet.name}
                    </Typography>
                    <Chip
                      label={pet.status === "active" ? "LIVE" : "LOST"}
                      size="small"
                      sx={{
                        height: { xs: 22, sm: 24 },
                        bgcolor: statusColor,
                        color: "white",
                        fontSize: { xs: 9.5, sm: 10.5 },
                        fontWeight: 900,
                        "& .MuiChip-label": { px: { xs: 0.55, sm: 0.75 } },
                      }}
                    />
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
                      {details || "Breed · Age · Weight"}
                    </Typography>
                  </Box>
                }
              />
              <MoreVertIcon sx={{ color: petStatus === "lost" ? "#ff3444" : "#6b7c95", fontSize: { xs: 20, sm: 22 } }} />
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
