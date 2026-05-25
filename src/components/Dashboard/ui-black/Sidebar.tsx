import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import AddLocationIcon from "@mui/icons-material/AddLocation";
import TimelineIcon from "@mui/icons-material/Timeline";
import LogoutIcon from "@mui/icons-material/Logout";
import { glass } from "./glass.tsx";

export default function Sidebar() {
  return (
    <Box
      sx={{
        width: 260,
        minHeight: "100vh",
        px: 3,
        py: 4,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid rgba(255,255,255,0.35)",
        ...glass,
        borderRadius: "0 28px 28px 0",
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography sx={{ fontSize: 46 }}>🐶</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#004b5a" }}>
            Firuapp
          </Typography>
        </Box>
      </Box>

      <List>
        <ListItemButton sx={{ ...glass, mb: 2, borderRadius: 3 }}>
          <ListItemIcon>
            <PetsIcon sx={{ color: "#004b5a" }} />
          </ListItemIcon>
          <ListItemText primary="All Pets" />
        </ListItemButton>

        <ListItemButton>
          <ListItemIcon><AddLocationIcon sx={{ color: "#004b5a" }} /></ListItemIcon>
          <ListItemText primary="Create Geofence" />
        </ListItemButton>

        <ListItemButton>
          <ListItemIcon><TimelineIcon sx={{ color: "#004b5a" }} /></ListItemIcon>
          <ListItemText primary="Day Route" />
        </ListItemButton>
      </List>

      <List>
        <ListItemButton>
          <ListItemIcon><LogoutIcon sx={{ color: "#004b5a" }} /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );
}
