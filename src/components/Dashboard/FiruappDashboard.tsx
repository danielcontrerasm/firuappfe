// pages/FiruappDashboard.tsx
import React, { useMemo, useState } from "react";
import FiruappSidebar from "./ui/FiruappSidebar.tsx";
import FiruappMapView from "./ui/FiruappMapView.tsx";
import FiruappPetsList from "./ui/FiruappPetList.tsx";
import { Pet, glassPanel, firuColors } from "./ui/FiruappStyles.ts";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import SearchIcon from "@mui/icons-material/Search";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import WifiIcon from "@mui/icons-material/Wifi";
import SpeedIcon from "@mui/icons-material/Speed";
import PlaceIcon from "@mui/icons-material/Place";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const mockPets: Pet[] = [
  { id: "1", name: "Peluche", status: "active", breed: "Golden Retriever", age: "4 years", weight: "28 kg", battery: 82, signal: "Strong", speed: "3.2 km/h", lastSeen: "2 min ago", imageUrl: "/beagle.png" },
  { id: "2", name: "Bella", status: "active", breed: "Beagle", age: "2 years", weight: "11 kg", battery: 74, signal: "Good", speed: "1.8 km/h", lastSeen: "1 min ago", imageUrl: "/german.png" },
  { id: "3", name: "Rocky", status: "lost", breed: "Mixed Breed", age: "6 years", weight: "22 kg", battery: 28, signal: "Weak", speed: "0.6 km/h", lastSeen: "Just now", imageUrl: "/labrador.png" },
];

const MetricCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color, display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography variant="caption" sx={{ color: firuColors.muted, fontWeight: 800 }}>
        {label}
      </Typography>
    </Stack>
    <Typography variant="body1" sx={{ mt: 0.8, fontWeight: 900, color: firuColors.dark }}>
      {value}
    </Typography>
  </Box>
);

const FiruappDashboard: React.FC = () => {
  const [dashboardPets, setDashboardPets] = useState<Pet[]>(mockPets);
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>(mockPets[0]?.id);
  const [section, setSection] = useState<"all" | "geofence" | "route">("all");

  const selectedPet = useMemo(() => dashboardPets.find((pet) => pet.id === selectedPetId) || dashboardPets[0], [dashboardPets, selectedPetId]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: firuColors.bg, color: firuColors.text }}>
      <FiruappSidebar current={section} onChange={setSection} />

      <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            ...glassPanel,
            borderRadius: 5,
            px: { xs: 2, md: 2.5 },
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, maxWidth: 560, display: "flex", alignItems: "center", gap: 1.2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", px: 1.5, py: 1, borderRadius: 3 }}>
            <SearchIcon sx={{ color: firuColors.muted }} />
            <InputBase placeholder="Search pets, places, geofences..." sx={{ flex: 1, fontSize: 14 }} />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<AddIcon />} variant="contained" sx={{ bgcolor: firuColors.dark, borderRadius: 3, textTransform: "none", fontWeight: 900, display: { xs: "none", sm: "inline-flex" } }}>
              Add Pet
            </Button>
            <IconButton sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Badge color="error" variant="dot"><NotificationsNoneIcon /></Badge>
            </IconButton>
            <IconButton sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Badge color="primary" badgeContent={6}><MessageOutlinedIcon /></Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: firuColors.dark, fontWeight: 900 }}>DC</Avatar>
          </Stack>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="overline" sx={{ color: firuColors.muted, fontWeight: 900, letterSpacing: 2 }}>
              FiruApp Command Center
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 950, color: firuColors.dark, letterSpacing: -1.4, fontSize: { xs: 32, md: 44 } }}>
              Live pet tracking
            </Typography>
            <Typography variant="body1" sx={{ color: firuColors.muted, mt: 0.5 }}>
              Monitor locations, safe zones, routes, and alerts from one focused dashboard.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Owner mode · Medellín" sx={{ bgcolor: "#ecfeff", color: "#0e7490", fontWeight: 900, border: "1px solid #a5f3fc" }} />
            <Chip label="Mock pet profiles" sx={{ bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 900, border: "1px solid #fed7aa" }} />
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr",
              lg: "minmax(0, 1fr) 360px",
            },
            gap: 2.5,
            alignItems: "start",
          }}
        >

          <Paper elevation={0} sx={{ ...glassPanel, borderRadius: 5, p: 1.5, position: "relative", overflow: "hidden" }}>
            <FiruappMapView selectedPet={selectedPet} />
            <FiruappPetsList
              pets={dashboardPets}
              selectedId={selectedPetId}
              onSelect={setSelectedPetId}
              onStatusChange={(petId, status) => {
                setDashboardPets((currentPets) => currentPets.map((pet) => (pet.id === petId ? { ...pet, status } : pet)));
              }}
            />
          </Paper>

          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ ...glassPanel, borderRadius: 5, overflow: "hidden" }}>
              <Box sx={{ height: 110, background: "linear-gradient(135deg, #67e8f9, #86efac, #c4b5fd)" }} />
              <Box sx={{ px: 2.5, pb: 2.5, mt: -5 }}>
                <Avatar
                  src={selectedPet.imageUrl}
                  sx={{
                    width: 72,
                    height: 72,
                    border: "4px solid white",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
                  }}
                >
                  {selectedPet.name?.charAt(0)}
                </Avatar>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 950, color: firuColors.dark }}>
                      {selectedPet.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: firuColors.muted }}>
                      {selectedPet.breed || "Tracked pet"}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedPet.status === "active" ? "LIVE" : "LOST"}
                    sx={{
                      bgcolor: selectedPet.status === "active" ? "#dcfce7" : "#ffedd5",
                      color: selectedPet.status === "active" ? "#15803d" : "#c2410c",
                      fontWeight: 950,
                    }}
                  />
                </Stack>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mt: 2.5 }}>
                  <MetricCard icon={<BatteryChargingFullIcon fontSize="small" />} label="Battery" value={`${selectedPet.battery ?? 82}%`} color={firuColors.green} />
                  <MetricCard icon={<WifiIcon fontSize="small" />} label="Signal" value={selectedPet.signal || "Strong"} color={firuColors.cyan} />
                  <MetricCard icon={<SpeedIcon fontSize="small" />} label="Speed" value={selectedPet.speed || "3.2 km/h"} color={firuColors.violet} />
                  <MetricCard icon={<PlaceIcon fontSize="small" />} label="Last seen" value={selectedPet.lastSeen || "2 min ago"} color={firuColors.orange} />
                </Box>

                <Stack direction="row" spacing={1.25} sx={{ mt: 2.5 }}>
                  <Button fullWidth variant="contained" sx={{ bgcolor: firuColors.dark, borderRadius: 3, textTransform: "none", fontWeight: 900 }}>
                    Open Map
                  </Button>
                  <Button fullWidth variant="outlined" sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}>
                    Message
                  </Button>
                </Stack>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...glassPanel, borderRadius: 5, p: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <WarningAmberIcon sx={{ color: firuColors.orange }} />
                <Typography variant="h6" sx={{ fontWeight: 950, color: firuColors.dark }}>
                  Recent alerts
                </Typography>
              </Stack>
              <Stack spacing={1.25}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: "#c2410c" }}>
                    Boundary warning detected
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#9a3412" }}>
                    Rocky is near the safe-zone edge.
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "#ecfeff", border: "1px solid #a5f3fc" }}>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: "#0e7490" }}>
                    New family message
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#155e75" }}>
                    Maria shared a route update.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default FiruappDashboard;
