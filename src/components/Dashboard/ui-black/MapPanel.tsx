import { Box } from "@mui/material";
import { glass } from "./glass.tsx";

export default function MapPanel() {
  return (
    <Box
      sx={{
        ...glass,
        borderRadius: "32px",
        overflow: "hidden",
        position: "relative",
        height: 420,
        background: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Your Leaflet map goes here */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgColor: "transparent",
        }}
      >
        MAP GOES HERE
      </Box>

      {/* Green Paw Marker */}
      <Box
        sx={{
          position: "absolute",
          right: 80,
          top: 120,
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "#22c55e",
          color: "white",
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        🐾
      </Box>

      {/* Orange Marker */}
      <Box
        sx={{
          position: "absolute",
          right: 40,
          bottom: 80,
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "#f97316",
          color: "white",
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        🐾
      </Box>
    </Box>
  );
}
