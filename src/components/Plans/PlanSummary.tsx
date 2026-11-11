import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { PLAN_DETAILS, getPlanLabel } from "../../config/plans.ts";
import { usePlan } from "../../context/PlanContext.tsx";

const PlanSummary: React.FC = () => {
  const { plan, limits, isAdmin, loading } = usePlan();
  const details = PLAN_DETAILS[plan];

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fffd", border: `1px solid ${details.accent}44` }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 900, letterSpacing: 1.2 }}>
            Plan actual
          </Typography>
          <Typography variant="h5" sx={{ color: "#0f172a", fontWeight: 950 }}>
            {loading ? "Cargando…" : getPlanLabel(plan)}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.35, color: "#64748b" }}>
            {isAdmin ? "Acceso administrativo sin límites de plan." : "Tus límites se aplican por mascota y por cuenta."}
          </Typography>
        </Box>
        <Chip label={isAdmin ? "ADMIN" : plan} sx={{ alignSelf: { xs: "flex-start", sm: "center" }, bgcolor: `${details.accent}18`, color: details.accent, fontWeight: 950 }} />
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1, mt: 2 }}>
        <Box><Typography variant="caption" color="text.secondary">Historial</Typography><Typography fontWeight={900}>{Number.isFinite(limits.historyDays) ? `${limits.historyDays} días` : "Sin límite"}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Autorizados / mascota</Typography><Typography fontWeight={900}>{Number.isFinite(limits.authorizedPeoplePerPet) ? limits.authorizedPeoplePerPet : "Sin límite"}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Geocercas / mascota</Typography><Typography fontWeight={900}>{Number.isFinite(limits.geofencesPerPet) ? limits.geofencesPerPet : "Sin límite"}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Exportación</Typography><Typography fontWeight={900}>{limits.canExportReports ? "PDF y CSV" : "Premium"}</Typography></Box>
      </Box>
      <Stack spacing={0.7} sx={{ mt: 2 }}>
        {details.benefits.map((benefit) => (
          <Stack key={benefit} direction="row" spacing={0.7} alignItems="flex-start">
            <CheckCircleOutlineIcon sx={{ color: details.accent, fontSize: 18, mt: 0.15 }} />
            <Typography variant="body2" sx={{ color: "#475569" }}>{benefit}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};

export default PlanSummary;
