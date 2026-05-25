import { Box } from "@mui/material";
import { glass } from "./glass";

export default function UltraGlassPanel({ children, sx = {} }) {
  return (
    <Box
      sx={{
        ...glass,
        p: 3,
        borderRadius: "32px",
        background: "rgba(255,255,255,0.12)",
        boxShadow: "0 35px 80px rgba(0,0,0,0.45)",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
