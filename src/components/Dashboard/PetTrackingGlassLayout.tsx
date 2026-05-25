// PetTrackingGlassLayout.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
  Chip,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RefreshIcon from "@mui/icons-material/Refresh";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";

export interface Pet {
  id: string;
  name: string;
  species: string;
  status: "online" | "offline" | "lost";
  lastSeen: string;
  battery: number;
  ownerName?: string;
  collarId?: string;
}

interface Props {
  pets: Pet[];
  onRefresh?: () => void;
}

const statusColor = (status: Pet["status"]) => {
  switch (status) {
    case "online":
      return "success";
    case "offline":
      return "default";
    case "lost":
      return "error";
    default:
      return "default";
  }
};

const glassCardSx = {
  borderRadius: 4,
  p: 2,
  bgcolor: "rgba(15, 23, 42, 0.35)", // slate-ish with transparency
  border: "1px solid rgba(148, 163, 184, 0.45)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 25px 50px rgba(15, 23, 42, 0.5)",
};

const PetTrackingGlassLayout: React.FC<Props> = ({ pets, onRefresh }) => {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(
    pets && pets.length > 0 ? pets[0] : null
  );

  useEffect(() => {
    if (!pets || pets.length === 0) {
      setSelectedPet(null);
      return;
    }
    setSelectedPet((prev) => {
      if (!prev) return pets[0];
      const found = pets.find((p) => p.id === prev.id);
      return found ?? pets[0];
    });
  }, [pets]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // gradient background
        background:
          "radial-gradient(circle at top left, #1d4ed8, transparent 55%), radial-gradient(circle at bottom right, #22c55e, #020617 55%)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1280,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "260px 1.4fr 1.1fr" },
          gridAutoRows: "minmax(0, 1fr)",
          gap: 2.5,
        }}
      >
        {/* SIDEBAR – app info, summary */}
        <Card sx={{ ...glassCardSx, display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.3,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(30, 64, 175, 0.8)",
              }}
            >
              <PetsIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="rgba(148,163,184,0.9)">
                FiruApp
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                Pet Tracking
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="rgba(226,232,240,0.9)"
            sx={{ mb: 2 }}
          >
            Monitor your pets in real time, visualize geofences and get alerts
            when they leave safe zones.
          </Typography>

          <Divider sx={{ borderColor: "rgba(148,163,184,0.35)", my: 2 }} />

          <Typography
            variant="caption"
            color="rgba(148,163,184,0.9)"
            sx={{ mb: 1 }}
          >
            Overview
          </Typography>

          <Stack spacing={1.2}>
            <Box>
              <Typography variant="caption" color="rgba(148,163,184,0.9)">
                Total pets
              </Typography>
              <Typography variant="h6">{pets.length}</Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Chip
                size="small"
                label={`Online: ${
                  pets.filter((p) => p.status === "online").length
                }`}
                color="success"
                variant="outlined"
              />
              <Chip
                size="small"
                label={`Lost: ${
                  pets.filter((p) => p.status === "lost").length
                }`}
                color="error"
                variant="outlined"
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="caption" color="rgba(148,163,184,0.9)">
                Refresh data
              </Typography>
              <IconButton
                size="small"
                onClick={onRefresh}
                disabled={!onRefresh}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(148,163,184,0.5)",
                  p: 0.5,
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
          </Stack>
        </Card>

        {/* MAP VIEW – glass card center */}
        <Card
          sx={{
            ...glassCardSx,
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: 260, md: 420 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Live map
            </Typography>
            {selectedPet && (
              <Chip
                size="small"
                icon={<LocationOnIcon fontSize="small" />}
                label={`Tracking: ${selectedPet.name}`}
                sx={{ borderRadius: "999px" }}
              />
            )}
          </Box>

          <Typography
            variant="caption"
            color="rgba(148,163,184,0.9)"
            sx={{ mb: 1 }}
          >
            Current position, path history and geofence.
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              mt: 1,
              borderRadius: 3,
              border: "1px solid rgba(148,163,184,0.4)",
              bgcolor: "rgba(15,23,42,0.65)",
              backdropFilter: "blur(24px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "rgba(148,163,184,0.9)",
            }}
          >
            {/* Replace this div with your real map component */}
            Map goes here (Google Maps / Leaflet)
          </Box>
        </Card>

        {/* PET LIST – right column glass list */}
        <Card
          sx={{
            ...glassCardSx,
            display: "flex",
            flexDirection: "column",
            maxHeight: { xs: 300, md: "auto" },
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
            Pets
          </Typography>

          {pets.length === 0 && (
            <Typography
              variant="body2"
              color="rgba(148,163,184,0.9)"
              sx={{ flexGrow: 1 }}
            >
              No pets registered yet. Add one in the admin panel.
            </Typography>
          )}

          <List
            dense
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              pr: 0.5,
              "&::-webkit-scrollbar": {
                width: 6,
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "rgba(148,163,184,0.6)",
                borderRadius: 999,
              },
            }}
          >
            {pets.map((pet) => (
              <ListItemButton
                key={pet.id}
                onClick={() => setSelectedPet(pet)}
                sx={{
                  mb: 1,
                  borderRadius: 3,
                  border:
                    selectedPet?.id === pet.id
                      ? "1px solid rgba(59,130,246,0.9)"
                      : "1px solid transparent",
                  bgcolor:
                    selectedPet?.id === pet.id
                      ? "rgba(37,99,235,0.16)"
                      : "rgba(15,23,42,0.4)",
                  transition: "all 0.18s ease",
                }}
              >
                <Stack direction="row" spacing={1.3} alignItems="center">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: 14,
                      bgcolor: "rgba(30,64,175,0.9)",
                    }}
                  >
                    {pet.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {pet.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={pet.status.toUpperCase()}
                            color={statusColor(pet.status)}
                            variant={
                              pet.status === "offline" ? "outlined" : "filled"
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="rgba(148,163,184,0.9)"
                        >
                          {pet.species} • Last seen {pet.lastSeen}
                        </Typography>
                      }
                    />
                  </Box>
                </Stack>
              </ListItemButton>
            ))}
          </List>

          {selectedPet && (
            <>
              <Divider
                sx={{
                  my: 1.5,
                  borderColor: "rgba(148,163,184,0.4)",
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    color="rgba(148,163,184,0.9)"
                  >
                    Owner
                  </Typography>
                  <Typography variant="body2">
                    {selectedPet.ownerName ?? "—"}
                  </Typography>
                </Stack>
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography
                    variant="caption"
                    color="rgba(148,163,184,0.9)"
                  >
                    Battery
                  </Typography>
                  <Chip
                    size="small"
                    icon={<BatteryChargingFullIcon fontSize="small" />}
                    label={`${selectedPet.battery}%`}
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </>
          )}
        </Card>
      </Box>
    </Box>
  );
};

export default PetTrackingGlassLayout;
