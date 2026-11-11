import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { PLAN_DETAILS, PLAN_LIMITS, PLAN_ORDER, Plan, getPlanLabel } from "../../config/plans.ts";

type PlanSelectorProps = {
  value: Plan;
  onChange: (plan: Plan) => void;
  language?: "es" | "en";
  disabled?: boolean;
};

const PlanSelector: React.FC<PlanSelectorProps> = ({ value, onChange, language = "es", disabled = false }) => (
  <Box>
    <Typography variant="subtitle1" sx={{ color: "#0f172a", fontWeight: 900, mb: 1 }}>
      Elige tu plan
    </Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.25 }}>
      {PLAN_ORDER.map((plan) => {
        const details = PLAN_DETAILS[plan];
        const selected = value === plan;
        const limits = PLAN_LIMITS[plan];
        return (
          <Paper
            key={plan}
            component="button"
            type="button"
            disabled={disabled}
            onClick={() => onChange(plan)}
            elevation={0}
            sx={{
              p: 1.5,
              textAlign: "left",
              cursor: disabled ? "default" : "pointer",
              borderRadius: 3,
              bgcolor: selected ? "#f0fdfa" : "#ffffff",
              border: selected ? `2px solid ${details.accent}` : "1px solid #dbe5ee",
              boxShadow: selected ? `0 12px 26px ${details.accent}22` : "none",
              opacity: disabled ? 0.65 : 1,
              transition: "transform 160ms ease, box-shadow 160ms ease",
              "&:hover": disabled ? {} : { transform: "translateY(-2px)", boxShadow: `0 12px 26px ${details.accent}22` },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: details.accent, fontWeight: 950 }}>
                  {getPlanLabel(plan, language)}
                </Typography>
                <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 950, mt: 0.35 }}>
                  {details.price}
                </Typography>
              </Box>
              {selected && <CheckCircleOutlineIcon sx={{ color: details.accent }} />}
            </Stack>
            <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "#64748b", fontWeight: 800 }}>
              {details.billing}
            </Typography>
            <Stack spacing={0.35} sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: "#475569" }}>Historial: {limits.historyDays} días</Typography>
              <Typography variant="caption" sx={{ color: "#475569" }}>Zonas seguras: {limits.geofencesPerPet}</Typography>
              <Typography variant="caption" sx={{ color: "#475569" }}>Grupos: {limits.searchGroups}</Typography>
            </Stack>
          </Paper>
        );
      })}
    </Box>
  </Box>
);

export default PlanSelector;
