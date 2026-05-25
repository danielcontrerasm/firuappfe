import { Box, Typography, Avatar, List, ListItemButton, ListItemAvatar, ListItemText } from "@mui/material";
import { glass } from "./glass.tsx";

export default function PetsListOverlay({ pets, selectedId, onSelect }) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 40,
        left: 40,
        width: 260,
        ...glass,
        background: "rgba(255,255,255,0.35)",
        px: 3,
        py: 2,
        borderRadius: "26px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
      }}
    >
      <List sx={{ p: 0 }}>
        {pets.map((pet) => (
          <ListItemButton
            key={pet.id}
            onClick={() => onSelect?.(pet.id)}
            sx={{
              mb: 1.2,
              borderRadius: 3,
              background: "rgba(255,255,255,0.70)",
            }}
          >
            <ListItemAvatar>
              <Avatar
                src={pet.avatarUrl}
                sx={{
                  width: 48,
                  height: 48,
                  border: "3px solid white",
                }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: 700, color: "#003b45" }}>
                  {pet.name}
                </Typography>
              }
              secondary={
                <Typography sx={{ fontWeight: 500, color: pet.status === "lost" ? "#e65100" : "#059669" }}>
                  {pet.status === "lost" ? "🐾 Lost" : "Active"}
                </Typography>
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
