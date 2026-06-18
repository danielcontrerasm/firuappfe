// FiruappGlassDemo.tsx
import React, { useState } from "react";
import { Box, Typography, Avatar, List, ListItemButton, ListItemAvatar, ListItemText } from "@mui/material";

export const glassPanel = {
  borderRadius: 4,
  background: "rgba(255,255,255,0.65)",
  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
  backdropFilter: "blur(24px)",
};

const mockPets = [
  { id: "2", name: "Bella", status: "Active", color: "#22c55e" },
  { id: "3", name: "Rocky", status: "Lost",   color: "#f97316" },
];

const FiruappGlassDemo: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("2");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background:
          "radial-gradient(circle at top left, #fdfbfb 0%, #ebedee 40%, #dff9fb 100%)",
      }}
    >
      {/* LEFT: simple placeholder sidebar */}
      <Box
        sx={{
          width: 260,
          px: 3,
          py: 4,
          background: "linear-gradient(180deg,#b9f3ff 0%,#b6f6d2 50%,#b9f3ff 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "#ffe59e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            🐶
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#004b5a" }}>
            Firuapp
          </Typography>
        </Box>

        <Box
          sx={{
            ...glassPanel,
            borderRadius: 999,
            py: 1.2,
            px: 2,
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ fontWeight: 600, color: "#004b5a" }}>All Pets</Typography>
        </Box>
        <Typography sx={{ color: "#004b5a", mb: 1.5 }}>Create Geofence</Typography>
        <Typography sx={{ color: "#004b5a", mb: 1.5 }}>Day Route</Typography>
        <Typography sx={{ color: "#004b5a", mt: 8 }}>Logout</Typography>
      </Box>

      {/* RIGHT: main content */}
      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 3, md: 4 },
          display: "flex",
          flexDirection: "column",
          gap: 3,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.65), rgba(226,246,255,0.7))",
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: "#004b5a", mb: 2 }}
        >
          My Pets
        </Typography>

        {/* This is the big glass card that contains map + floating list */}
        <Box
          sx={{
            ...glassPanel,
            maxWidth: 980,
            p: { xs: 2.5, md: 3 },
            border: "1px solid rgba(255,255,255,0.55)",
            boxShadow: "0 24px 60px rgba(15,23,42,0.14)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* “Map” background (replace with your real Leaflet map) */}
          <Box
            sx={{
              borderRadius: 3,
              height: 380,
              backgroundImage:
                "linear-gradient(135deg, rgba(183,245,219,0.9), rgba(167,235,255,0.95))",
            }}
          />

          {/* Floating pet list card ON TOP of the map */}
          <Box
            sx={{
              position: "absolute",
              top: 60,
              left: { xs: 24, md: 80 },
              width: { xs: "70%", md: 320 },
              ...glassPanel,
              borderRadius: 4,
              px: 3,
              py: 2,
              boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
            }}
          >
            <List sx={{ p: 0 }}>
              {mockPets.map((pet) => (
                <ListItemButton
                  key={pet.id}
                  onClick={() => setSelectedId(pet.id)}
                  sx={{
                    mb: 1,
                    borderRadius: 3,
                    backgroundColor:
                      selectedId === pet.id
                        ? "rgba(255,255,255,0.95)"
                        : "rgba(255,255,255,0.85)",
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        border: "3px solid #e4f6ff",
                        bgcolor: pet.color,
                      }}
                    >
                      {pet.name.charAt(0)}
                    </Avatar>
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
                        sx={{
                          color: pet.status === "Lost" ? "#f97316" : "#059669",
                          fontWeight: 500,
                        }}
                      >
                        {pet.status === "Lost" ? "🐾 Lost" : "Active"}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FiruappGlassDemo;
