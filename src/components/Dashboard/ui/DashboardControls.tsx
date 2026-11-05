import React, { useId, useState } from "react";
import { Button, Menu, MenuItem, Stack } from "@mui/material";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import RadarIcon from "@mui/icons-material/Radar";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { MapStyle } from "./FiruappStyles.ts";

export interface DashboardControlsProps {
  demoEnabled: boolean;
  onDemoToggle: () => void;
  showGeofences: boolean;
  onShowGeofencesChange: (visible: boolean) => void;
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;
}

export default function DashboardControls({ demoEnabled, onDemoToggle, showGeofences, onShowGeofencesChange, mapStyle, onMapStyleChange }: DashboardControlsProps) {
  const [mapMenuAnchor, setMapMenuAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const mapMenuOpen = Boolean(mapMenuAnchor);

  return (
    <Stack
      direction="row"
      spacing={1}
      flexWrap="wrap"
      useFlexGap
      role="group"
      aria-label="Dashboard controls"
      sx={{
        "& .MuiButton-root": { minHeight: 42, borderRadius: 2, textTransform: "none", fontWeight: 800 },
        "& .MuiButton-contained": { bgcolor: "#062346", "&:hover": { bgcolor: "#0f355f" } },
        "& .MuiButton-outlined": { bgcolor: "white", color: "#33445e", borderColor: "#dbe7f3" },
      }}
    >
      <Button
        variant={demoEnabled ? "contained" : "outlined"}
        startIcon={<ScienceOutlinedIcon />}
        aria-pressed={demoEnabled}
        onClick={onDemoToggle}
      >
        Demo Data
      </Button>
      <Button
        variant={showGeofences ? "contained" : "outlined"}
        startIcon={<RadarIcon />}
        aria-pressed={showGeofences}
        onClick={() => onShowGeofencesChange(!showGeofences)}
      >
        Geofences
      </Button>
      <Button
        variant="outlined"
        startIcon={<MapOutlinedIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        aria-haspopup="menu"
        aria-expanded={mapMenuOpen}
        aria-controls={mapMenuOpen ? menuId : undefined}
        title={`Map style: ${mapStyle === "clean" ? "Clear" : "Detailed"}`}
        onClick={(event) => setMapMenuAnchor(event.currentTarget)}
      >
        Maps
      </Button>
      <Menu id={menuId} anchorEl={mapMenuAnchor} open={mapMenuOpen} onClose={() => setMapMenuAnchor(null)}>
        {([{ value: "clean", label: "Clear map" }, { value: "natural", label: "Detailed map" }] as const).map(({ value, label }) => (
          <MenuItem
            key={value}
            role="menuitemradio"
            aria-checked={mapStyle === value}
            selected={mapStyle === value}
            onClick={() => {
              onMapStyleChange(value);
              setMapMenuAnchor(null);
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}
