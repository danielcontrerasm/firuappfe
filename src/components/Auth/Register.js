import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PetsIcon from "@mui/icons-material/Pets";
import PlaceIcon from "@mui/icons-material/Place";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/runtime";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(buildApiUrl("/api/auth/register"), {
        name,
        email,
        password,
        role: "USER",
      });
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed", error);
      alert("Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
        background:
          "radial-gradient(circle at top left, rgba(16,185,129,0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(6,182,212,0.16), transparent 32%), linear-gradient(180deg, #f5f8fc 0%, #eefcf7 100%)",
        color: "#102033",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1080,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
          gap: { xs: 2.5, md: 4 },
          alignItems: "center",
        }}
      >
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 900, letterSpacing: 2 }}>
            FiruApp Owner Access
          </Typography>
          <Typography
            variant="h2"
            sx={{
              mt: 1,
              maxWidth: 540,
              color: "#0f172a",
              fontWeight: 950,
              letterSpacing: -1.4,
              fontSize: { md: 50, lg: 58 },
            }}
          >
            Create one account to manage every pet journey.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, maxWidth: 540, color: "#64748b", lineHeight: 1.7 }}>
            Register once and start tracking routes, safe zones, recovery groups, and daily pet activity from one workspace.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
            <Chip icon={<PetsIcon />} label="Pet profiles" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 900, border: "1px solid #bfdbfe" }} />
            <Chip icon={<PlaceIcon />} label="Safe zones" sx={{ bgcolor: "#ecfeff", color: "#0e7490", fontWeight: 900, border: "1px solid #a5f3fc" }} />
            <Chip icon={<FavoriteBorderIcon />} label="Owner workflows" sx={{ bgcolor: "#fdf2f8", color: "#be185d", fontWeight: 900, border: "1px solid #fbcfe8" }} />
          </Stack>
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 460,
            justifySelf: "center",
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            textAlign: "left",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(226,232,240,0.95)",
            boxShadow: "0 24px 70px rgba(15,23,42,0.14)",
            backdropFilter: "blur(18px)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              component="img"
              src="/logo_sidebar.png"
              alt="FiruApp logo"
              sx={{ width: 150, height: 118, objectFit: "contain" }}
            />
            <Typography variant="h4" sx={{ mt: 1, color: "#0f172a", fontWeight: 950 }}>
              Create account
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "#64748b" }}>
              Set up your owner profile to manage pets, routes, and alerts.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                label="Full name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#f8fafc" } }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#f8fafc" } }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Use a password you can keep for owner access."
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#f8fafc" } }}
              />
            </Stack>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={!loading ? <PersonAddAlt1Icon /> : undefined}
              sx={{
                mt: 2.5,
                mb: 1,
                bgcolor: "#0f172a",
                "&:hover": { bgcolor: "#111827" },
                color: "#fff",
                fontWeight: 900,
                borderRadius: 3,
                textTransform: "none",
                height: 48,
                boxShadow: "0 14px 30px rgba(15,23,42,0.22)",
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Create account"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2, color: "#64748b", textAlign: "center" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#0e7490", fontWeight: 900, textDecoration: "none" }}>
              Sign in
            </a>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default Register;
