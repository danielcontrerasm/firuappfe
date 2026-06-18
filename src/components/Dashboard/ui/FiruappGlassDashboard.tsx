import React, { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import TimelineIcon from "@mui/icons-material/Timeline";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { Link as RouterLink } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import PetsIcon from "@mui/icons-material/Pets";
import SensorsIcon from "@mui/icons-material/Sensors";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupIcon from "@mui/icons-material/Group";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";


export const glass = {
  borderRadius: "28px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.25)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

type PetStatus = "active" | "lost";

interface Pet {
  id: string;
  name: string;
  status: PetStatus;
  avatarUrl?: string;
}

const mockPets: Pet[] = [
  {
    id: "2",
    name: "Bella",
    status: "active",
    avatarUrl: "https://place-puppy.com/97x97",
  },
  {
    id: "3",
    name: "Rocky",
    status: "lost",
    avatarUrl: "https://place-puppy.com/98x98",
  },
];

const FiruappGlassDashboard: React.FC = () => {
  const [selectedPetId, setSelectedPetId] = useState<string>("2");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
       alignItems: "flex-start",   // ⬅ pushes to top
    justifyContent: "flex-start", // ⬅ pushes to left
        background: "radial-gradient(circle at top left,#102938 0%,#051219 55%)",
        p: 3,
      }}
    >
      <Box
        sx={{
          ...glass,
          background: "rgba(255,255,255,0.16)",
          borderRadius: "36px",
          maxWidth: 1120,
          width: "100%",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            p: 4,
            pr: 3,
            borderRight: { xs: "none", md: "1px solid rgba(255,255,255,0.18)" },
            background:
              "linear-gradient(180deg, rgba(187,233,255,0.65) 0%, rgba(176,244,219,0.7) 60%, rgba(181,233,255,0.7) 100%)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 1.6 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                backgroundColor: "#ffd667",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
              }}
            >
              🐶
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#053042", lineHeight: 1.1 }}
            >
              Firuapp
            </Typography>
          </Box>

          <List sx={{ p: 0 }}>
            <ListItemButton
              sx={{
                ...glass,
                background: "rgba(255,255,255,0.92)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                borderRadius: "999px",
                mb: 2,
                color: "#053042",
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                <PeopleAltIcon />
              </ListItemIcon>
              <ListItemText
                primary="All Pets"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>

            <ListItemButton sx={{ borderRadius: 24, color: "#053042", mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                <PlaceIcon />
              </ListItemIcon>
              <ListItemText primary="Create Geofence" />
            </ListItemButton>

            <ListItemButton sx={{ borderRadius: 24, color: "#053042", mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                <TimelineIcon />
              </ListItemIcon>
              <ListItemText primary="Day Route" />
            </ListItemButton>
<ListItemButton
      component={RouterLink}
      to="/users"
      sx={{
        borderRadius: 24,
        mb: 1,
        color: "#053042",
      }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
        <PersonIcon />
      </ListItemIcon>
      <ListItemText primary="Users" />
    </ListItemButton>

    {/* Pets */}
    <ListItemButton
      component={RouterLink}
      to="/pets"
      sx={{
        borderRadius: 24,
        mb: 1,
        color: "#053042",
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
        <PetsIcon />
      </ListItemIcon>
      <ListItemText
        primary="Pets"
        primaryTypographyProps={{ fontWeight: 600 }}
      />
    </ListItemButton>

    {/* GPS Sensors */}
    <ListItemButton
      component={RouterLink}
      to="/sensors"
      sx={{ borderRadius: 24, mb: 1, color: "#053042" }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
        <SensorsIcon />
      </ListItemIcon>
      <ListItemText primary="GPS Sensors" />
    </ListItemButton>

    {/* Balance / Accounts */}
    <ListItemButton
      component={RouterLink}
      to="/balance"
      sx={{ borderRadius: 24, mb: 1, color: "#053042" }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
        <AccountBalanceWalletIcon />
      </ListItemIcon>
      <ListItemText primary="Balance & Accounts" />
    </ListItemButton>

    {/* Reports */}
    <ListItemButton
      component={RouterLink}
      to="/reports"
      sx={{ borderRadius: 24, mb: 1, color: "#053042" }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
        <AssessmentIcon />
      </ListItemIcon>
      <ListItemText primary="Reports" />
    </ListItemButton>

    {/* Volunteer Groups */}
    <ListItemButton
      component={RouterLink}
      to="/volunteers"
      sx={{ borderRadius: 24, mb: 1, color: "#053042" }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
        <GroupIcon />
      </ListItemIcon>
      <ListItemText primary="Volunteer Groups" />
    </ListItemButton>

    {/* Alerts */}
    <ListItemButton
      component={RouterLink}
      to="/alerts"
      sx={{ borderRadius: 24, mb: 1, color: "#053042" }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
        <NotificationsActiveIcon />
      </ListItemIcon>
      <ListItemText primary="Alerts" />
    </ListItemButton>

          </List>

          <Box sx={{ flexGrow: 1 }} />

          <List sx={{ p: 0, mt: 4 }}>
            <ListItemButton sx={{ borderRadius: 20, color: "#053042" }}>
              <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>

        {/* Right side */}
        <Box
          sx={{
            p: 4,
            pl: 3,
            position: "relative",
            background:
              "linear-gradient(135deg, rgba(207,246,255,0.7), rgba(193,244,220,0.7))",
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#053042", mb: 3 }}
          >
            My Pets
          </Typography>

          {/* Map panel */}
          <Box
            sx={{
              ...glass,
              borderRadius: "26px",
              background: "rgba(255,255,255,0.22)",
              position: "relative",
              overflow: "hidden",
              height: 380,
            }}
          >
            {/* Fake map background – replace with Leaflet */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(135deg,#b7f4df 0%,#b7e6ff 35%,#b3f0da 100%)",
                opacity: 0.9,
              }}
            />

            {/* Paw markers */}
            <Box
              sx={{
                position: "absolute",
                right: 110,
                top: 120,
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 20,
                boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
              }}
            >
              🐾
            </Box>
            <Box
              sx={{
                position: "absolute",
                right: 80,
                bottom: 90,
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 20,
                boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
              }}
            >
              🐾
            </Box>
            <Box
              sx={{
                position: "absolute",
                right: 40,
                bottom: 120,
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "#f97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 20,
                boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
              }}
            >
              🐾
            </Box>

            {/* Floating list */}
            <Box
              sx={{
                position: "absolute",
                left: { xs: 20, md: 60 },
                top: 80,
                width: { xs: 260, md: 300 },
                ...glass,
                background: "rgba(255,255,255,0.96)",
                borderRadius: "26px",
                px: 3,
                py: 2,
                boxShadow: "0 20px 55px rgba(0,0,0,0.30)",
              }}
            >
              {mockPets.map((pet) => {
                const isSelected = pet.id === selectedPetId;
                const statusColor =
                  pet.status === "lost" ? "#f97316" : "#059669";

                return (
                  <ListItemButton
                    key={pet.id}
                    onClick={() => setSelectedPetId(pet.id)}
                    sx={{
                      borderRadius: 3,
                      mb: 1,
                      px: 0,
                      backgroundColor: isSelected
                        ? "rgba(243,250,255,1)"
                        : "transparent",
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={pet.avatarUrl}
                        sx={{
                          width: 48,
                          height: 48,
                          mr: 1.5,
                          border: "3px solid #e4f4ff",
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontWeight: 700, color: "#053042" }}
                        >
                          {pet.name}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          sx={{
                            fontWeight: 500,
                            color: statusColor,
                            fontSize: 14,
                          }}
                        >
                          {pet.status === "lost" ? "🐾 Lost" : "Active"}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FiruappGlassDashboard;
