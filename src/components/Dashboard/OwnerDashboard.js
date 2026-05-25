import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import MapView from "../Pets/MapView"; // your existing map component
import { Fab } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import { Menu, MenuItem } from "@mui/material";

/**
 * @typedef {Object} PetItem
 * @property {string|number} id
 * @property {string} name
 * @property {string=} petName
 * @property {string=} photoUrl
 * @property {"active"|"lost"=} status
 */
/**
 * @typedef {{ mouseX: number; mouseY: number }} ContextMenuAnchor
 */
const OwnerDashboard = () => {
  /** @type {[PetItem[], React.Dispatch<React.SetStateAction<PetItem[]>>]} */
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  /** @type {[PetItem|null, React.Dispatch<React.SetStateAction<PetItem|null>>]} */
  const [selectedPet, setSelectedPet] = useState(null);
  /** @type {[ContextMenuAnchor | null, React.Dispatch<React.SetStateAction<ContextMenuAnchor | null>>]} */
  const [menuAnchor, setMenuAnchor] = useState(null);
  /** @type {[PetItem|null, React.Dispatch<React.SetStateAction<PetItem|null>>]} */
  const [menuPet, setMenuPet] = useState(null);

  useEffect(() => {

    const fetchPets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8080/api/pets/locations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPets(response.data);
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  if (loading) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  const handleRightClick = (event, pet) => {
    event.preventDefault();
    setMenuAnchor({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
    setMenuPet(pet);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuPet(null);
  };

  // Actions
  const handleCreateGeofence = () => {
    if (!menuPet) return;
    console.log("Create Geofence for:", menuPet.petName);
    handleCloseMenu();
    // navigate(`/geofence/${menuPet.id}`);
  };
 const glassPanel = {
  borderRadius: 4,
  background: "rgba(255,255,255,0.65)",
  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
  backdropFilter: "blur(24px)",
};
  const handleViewReport = () => {
    if (!menuPet) return;
    console.log("View Report for:", menuPet.petName);
    handleCloseMenu();
    // navigate(`/reports/${menuPet.id}`);
  };
  return (
    <Box
      sx={{
        ...glassPanel,
        mt: 3,
        px: 3,
        py: 2,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: "#004b5a", mb: 1 }}
      >
        My Pets
      </Typography>
        <List>
          {pets.map((pet, idx) => (
            


            <React.Fragment key={pet.id}>
              <ListItem
                button
                onClick={() => setSelectedPet(pet)}
              onContextMenu={(e) => handleRightClick(e, pet)} // 👈 right-click menu
             sx={{
                borderRadius: 3,
                mb: 1
              }}
              
              >
                <ListItemAvatar>
                  <Avatar
                    src={pet.photoUrl || "https://cdn-icons-png.flaticon.com/512/616/616408.png"}
                    alt={pet.petName}
                         sx={{ width: 44, height: 44, border: "3px solid #e4f6ff" }}
                  />
                </ListItemAvatar>
                <ListItemText
                   primary={
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "#004b5a" }}
                  >
                    {pet.name}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    
                  >
                    {pet.status === "active" ? "Active" : "🐾 Lost"}
                  </Typography>
                }
                />
              </ListItem>
              {idx < pets.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {/* Context Menu */}
  <Menu
    open={Boolean(menuAnchor)}
    onClose={handleCloseMenu}
    anchorReference="anchorPosition"
    anchorPosition={
      menuAnchor
        ? { top: menuAnchor.mouseY, left: menuAnchor.mouseX }
        : undefined
    }
  >
    <MenuItem onClick={handleCreateGeofence}>🗺️ Create Geofence</MenuItem>
    <MenuItem onClick={handleViewReport}>📊 View Daily Report</MenuItem>
    <MenuItem onClick={handleViewReport}>📊 Crar grupo de busqueda </MenuItem>
  </Menu>
        </List>
    

      {/* Map section */}
      <Box sx={{ flexGrow: 1 }}>
        <MapView selectedPet={selectedPet} />
      </Box>
    </Box>
     
  );
};

export default OwnerDashboard;
