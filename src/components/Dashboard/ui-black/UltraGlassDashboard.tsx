import { Box, Typography } from "@mui/material";
import Sidebar from "./Sidebar.tsx";
import MapPanel from "./MapPanel.tsx";
import PetsListOverlay from "./PetsListOverlay.tsx";

const demoPets = [
  { id: "1", name: "Peluche", status: "active", avatarUrl: "/dog1.png" },
  { id: "2", name: "Bella", status: "active", avatarUrl: "/dog2.png" },
  { id: "3", name: "Rocky", status: "lost", avatarUrl: "/dog3.png" },
];

export default function UltraGlassDashboard() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#0f1c24" }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, p: 4, position: "relative" }}>
        <Typography variant="h4" sx={{ color: "white", fontWeight: 800, mb: 3 }}>
          My Pets
        </Typography>

        <Box sx={{ position: "relative", width: "100%", maxWidth: 900 }}>
          <MapPanel />
          <PetsListOverlay pets={demoPets} />
        </Box>
      </Box>
    </Box>
  );
}
