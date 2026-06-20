import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import PetsIcon from "@mui/icons-material/Pets";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

type LostPetStatus = "critical" | "active_search" | "sighting_pending";

type LostPetRecord = {
  id: string;
  name: string;
  breed: string;
  age: string;
  size: string;
  ownerName: string;
  ownerPhone: string;
  dateLost: string;
  lastSeen: string;
  lastSeenArea: string;
  city: string;
  trackerStatus: string;
  battery: number;
  reward: string;
  volunteers: number;
  notes: string;
  imageUrl: string;
  status: LostPetStatus;
};

const lostPets: LostPetRecord[] = [
  {
    id: "lost-101",
    name: "Rocky",
    breed: "Mixed Breed",
    age: "6 years",
    size: "22 kg",
    ownerName: "Laura Perez",
    ownerPhone: "+57 301 555 0142",
    dateLost: "2026-06-17 19:40",
    lastSeen: "2026-06-18 08:15",
    lastSeenArea: "El Poblado, Parque Lleras",
    city: "Medellin",
    trackerStatus: "GPS weak signal",
    battery: 18,
    reward: "$300.000 COP",
    volunteers: 12,
    notes: "Responds to whistles. Nervous around motorcycles.",
    imageUrl: "/labrador.png",
    status: "critical",
  },
  {
    id: "lost-102",
    name: "Luna",
    breed: "Golden Retriever",
    age: "3 years",
    size: "26 kg",
    ownerName: "Camila Soto",
    ownerPhone: "+57 300 821 9921",
    dateLost: "2026-06-16 07:10",
    lastSeen: "2026-06-18 06:50",
    lastSeenArea: "Laureles, Segundo Parque",
    city: "Medellin",
    trackerStatus: "Last route synced",
    battery: 52,
    reward: "$200.000 COP",
    volunteers: 8,
    notes: "Friendly with people. Usually follows food vendors.",
    imageUrl: "/german.png",
    status: "active_search",
  },
  {
    id: "lost-103",
    name: "Bruno",
    breed: "Beagle",
    age: "4 years",
    size: "14 kg",
    ownerName: "Andres Mejia",
    ownerPhone: "+57 302 611 4403",
    dateLost: "2026-06-14 18:25",
    lastSeen: "2026-06-18 11:20",
    lastSeenArea: "Belen, Parque Biblioteca",
    city: "Medellin",
    trackerStatus: "No live GPS",
    battery: 0,
    reward: "$150.000 COP",
    volunteers: 15,
    notes: "Has blue collar. May hide near parked cars.",
    imageUrl: "/beagle.png",
    status: "sighting_pending",
  },
  {
    id: "lost-104",
    name: "Nala",
    breed: "German Shepherd",
    age: "2 years",
    size: "28 kg",
    ownerName: "Daniel Contreras",
    ownerPhone: "+57 300 555 0120",
    dateLost: "2026-06-18 05:55",
    lastSeen: "2026-06-18 09:05",
    lastSeenArea: "Envigado, Loma del Chocho",
    city: "Envigado",
    trackerStatus: "Geofence breach alert",
    battery: 64,
    reward: "No reward posted",
    volunteers: 5,
    notes: "Very active. Likely moving uphill trails.",
    imageUrl: "/german.png",
    status: "active_search",
  },
  {
    id: "lost-105",
    name: "Milo",
    breed: "French Bulldog",
    age: "5 years",
    size: "11 kg",
    ownerName: "Sara Ospina",
    ownerPhone: "+57 304 228 7180",
    dateLost: "2026-06-15 21:30",
    lastSeen: "2026-06-17 17:40",
    lastSeenArea: "Sabaneta, Parque Principal",
    city: "Sabaneta",
    trackerStatus: "Collar offline",
    battery: 3,
    reward: "$250.000 COP",
    volunteers: 9,
    notes: "Needs medication. Usually approaches families with children.",
    imageUrl: "/labrador.png",
    status: "critical",
  },
  {
    id: "lost-106",
    name: "Kira",
    breed: "Border Collie",
    age: "1 year",
    size: "17 kg",
    ownerName: "Valentina Ruiz",
    ownerPhone: "+57 310 440 1194",
    dateLost: "2026-06-13 16:05",
    lastSeen: "2026-06-18 07:12",
    lastSeenArea: "Robledo, Cerro El Volador",
    city: "Medellin",
    trackerStatus: "Volunteer sighting received",
    battery: 41,
    reward: "$180.000 COP",
    volunteers: 14,
    notes: "Fast runner. May react to tennis balls.",
    imageUrl: "/german.png",
    status: "sighting_pending",
  },
];

const statusLabel: Record<LostPetStatus, string> = {
  critical: "Critical",
  active_search: "Active Search",
  sighting_pending: "Sighting Pending",
};

const statusColor: Record<LostPetStatus, { bg: string; text: string; border: string }> = {
  critical: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  active_search: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  sighting_pending: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
};

const metricCardSx = {
  px: 2,
  py: 1.75,
  borderRadius: 2,
  bgcolor: "rgba(255,255,255,0.94)",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
};

const LostPetsWallPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | LostPetStatus>("all");

  const filteredPets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return lostPets.filter((pet) => {
      const matchesSearch =
        !term ||
        pet.name.toLowerCase().includes(term) ||
        pet.ownerName.toLowerCase().includes(term) ||
        pet.lastSeenArea.toLowerCase().includes(term) ||
        pet.city.toLowerCase().includes(term) ||
        pet.breed.toLowerCase().includes(term);

      const matchesStatus = status === "all" || pet.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  const criticalCount = lostPets.filter((pet) => pet.status === "critical").length;
  const volunteerCount = lostPets.reduce((sum, pet) => sum + pet.volunteers, 0);
  const lowBatteryCount = lostPets.filter((pet) => pet.battery <= 20).length;

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: "#053042" }}>
          Lost Pets Wall
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, color: "#64748b", maxWidth: 760 }}>
          Mock recovery board for active missing-pet cases with owner contact, loss dates, latest sightings, tracker state, and volunteer activity.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box sx={metricCardSx}>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
            Active Cases
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900, color: "#0f172a" }}>
            {lostPets.length}
          </Typography>
        </Box>
        <Box sx={metricCardSx}>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
            Critical Cases
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900, color: "#b91c1c" }}>
            {criticalCount}
          </Typography>
        </Box>
        <Box sx={metricCardSx}>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
            Volunteers Assigned
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900, color: "#0f766e" }}>
            {volunteerCount}
          </Typography>
        </Box>
        <Box sx={metricCardSx}>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
            Low Tracker Battery
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900, color: "#b45309" }}>
            {lowBatteryCount}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <TextField
          size="small"
          label="Search pet, owner, area, city"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: { xs: "100%", md: 340 } }}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" style={{ marginRight: 8, color: "#64748b" }} />,
          }}
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant={status === "all" ? "contained" : "outlined"}
            onClick={() => setStatus("all")}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
          >
            All
          </Button>
          <Button
            variant={status === "critical" ? "contained" : "outlined"}
            color="error"
            onClick={() => setStatus("critical")}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
          >
            Critical
          </Button>
          <Button
            variant={status === "active_search" ? "contained" : "outlined"}
            onClick={() => setStatus("active_search")}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
          >
            Active Search
          </Button>
          <Button
            variant={status === "sighting_pending" ? "contained" : "outlined"}
            color="warning"
            onClick={() => setStatus("sighting_pending")}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
          >
            Sighting Pending
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(3, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        {filteredPets.map((pet) => {
          const colors = statusColor[pet.status];

          return (
            <Box
              key={pet.id}
              sx={{
                bgcolor: "rgba(255,255,255,0.96)",
                border: "1px solid rgba(226,232,240,0.95)",
                borderRadius: 2,
                boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar
                    src={pet.imageUrl}
                    alt={pet.name}
                    sx={{ width: 72, height: 72, borderRadius: 2 }}
                  />
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
                        {pet.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={statusLabel[pet.status]}
                        sx={{
                          bgcolor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          fontWeight: 900,
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b" }}>
                      {pet.breed} · {pet.age} · {pet.size}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        icon={<GpsFixedIcon />}
                        label={`${pet.battery}% battery`}
                        sx={{ bgcolor: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" }}
                      />
                      <Chip
                        size="small"
                        icon={<VolunteerActivismIcon />}
                        label={`${pet.volunteers} volunteers`}
                        sx={{ bgcolor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              <Box sx={{ p: 2, display: "grid", gap: 1.25 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WarningAmberIcon sx={{ color: "#f97316", fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      Date lost:
                    </Box>{" "}
                    {pet.dateLost}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTimeIcon sx={{ color: "#0ea5e9", fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      Last seen:
                    </Box>{" "}
                    {pet.lastSeen}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <PlaceIcon sx={{ color: "#10b981", fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      Last location:
                    </Box>{" "}
                    {pet.lastSeenArea}, {pet.city}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonSearchIcon sx={{ color: "#7c3aed", fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      Owner:
                    </Box>{" "}
                    {pet.ownerName}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneInTalkIcon sx={{ color: "#0f766e", fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      Contact:
                    </Box>{" "}
                    {pet.ownerPhone}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <PetsIcon sx={{ color: "#334155", fontSize: 18, mt: 0.25 }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: "#334155" }}>
                      <Box component="span" sx={{ fontWeight: 800, color: "#0f172a" }}>
                        Tracker:
                      </Box>{" "}
                      {pet.trackerStatus}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b", lineHeight: 1.6 }}>
                      {pet.notes}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 800 }}>
                  Reward: <Box component="span" sx={{ color: "#166534" }}>{pet.reward}</Box>
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 800,
                    bgcolor: "#0f172a",
                    "&:hover": { bgcolor: "#111827" },
                  }}
                >
                  Open case
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>

      {filteredPets.length === 0 && (
        <Box
          sx={{
            mt: 2,
            p: 4,
            borderRadius: 2,
            border: "1px solid rgba(226,232,240,0.95)",
            bgcolor: "rgba(255,255,255,0.92)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900, color: "#0f172a" }}>
            No matching lost-pet cases
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: "#64748b" }}>
            Adjust the search term or status filter to show the mock records again.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LostPetsWallPage;
