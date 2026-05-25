import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/auth/login", {
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
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #5FC3E4 0%, #E55D87 100%)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          borderRadius: 4,
          width: "100%",
          maxWidth: 380,
          textAlign: "center",
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
       
 <img
            src={process.env.PUBLIC_URL + "/icons/logo_bg.png"}
            alt="FiruApp logo"
            width={200}
            height={120}
          />
        <Typography variant="h5" mt={2} mb={1} fontWeight={600}>
          Welcome to FiruApp
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Track your pets and keep them safe 🐶
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              mb: 1,
              bgcolor: "#5FC3E4",
              "&:hover": { bgcolor: "#4ab3d5" },
              color: "#fff",
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
              height: 45,
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
          </Button>
        </form>

        <Typography variant="body2" mt={2}>
          Don’t have an account?{" "}
          <a href="/register" style={{ color: "#E55D87", textDecoration: "none" }}>
            Sign up
          </a>
        </Typography>
      </Paper>
    </Box>



  );
};

export default Login;

