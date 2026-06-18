import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import RadarIcon from "@mui/icons-material/Radar";
import { buildApiUrl } from "../../config/runtime";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl("/api/auth/login"), {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      alert("Login successful!");
      window.location.href = "/owner-dashboard";
    } catch (error) {
      alert("Invalid credentials");
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
          "radial-gradient(circle at top right, rgba(6,182,212,0.16), transparent 34%), linear-gradient(180deg, #f4f8fb 0%, #eefbf8 100%)",
        color: "#102033",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1040,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
          gap: { xs: 2.5, md: 4 },
          alignItems: "center",
        }}
      >
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 900, letterSpacing: 2 }}>
            FiruApp Command Center
          </Typography>
          <Typography
            variant="h2"
            sx={{
              mt: 1,
              maxWidth: 520,
              color: "#0f172a",
              fontWeight: 950,
              letterSpacing: -1.4,
              fontSize: { md: 52, lg: 60 },
            }}
          >
            Track every pet from one calm dashboard.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, maxWidth: 520, color: "#64748b", lineHeight: 1.7 }}>
            Monitor live locations, safe zones, routes, alerts, and owner workflows with one focused interface.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
            <Chip icon={<GpsFixedIcon />} label="Live GPS" sx={{ bgcolor: "#ecfeff", color: "#0e7490", fontWeight: 900, border: "1px solid #a5f3fc" }} />
            <Chip icon={<RadarIcon />} label="Geofences" sx={{ bgcolor: "#ecfdf5", color: "#047857", fontWeight: 900, border: "1px solid #a7f3d0" }} />
            <Chip icon={<ShieldOutlinedIcon />} label="Lost pet alerts" sx={{ bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 900, border: "1px solid #fed7aa" }} />
          </Stack>
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 430,
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
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "#64748b" }}>
              Sign in to manage pets, routes, geofences, and alerts.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#f8fafc" } }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#f8fafc" } }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
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
              {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2, color: "#64748b", textAlign: "center" }}>
            Don&apos;t have an account?{" "}
            <a href="/register" style={{ color: "#0e7490", fontWeight: 900, textDecoration: "none" }}>
              Sign up
            </a>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
