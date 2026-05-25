import React from "react";
import { Chip } from "@mui/material";
import EntityListPage, { Column } from "./EntityListPage.tsx";

type SensorStatus = "online" | "offline" | "error";

export interface SensorRow {
  id: string;
  name: string;
  petName: string;
  type: string;
  status: SensorStatus;
  lastSignal: string;
}

const mockSensors: SensorRow[] = [
  {
    id: "s1",
    name: "Collar-001",
    petName: "Peluche",
    type: "GPS Collar",
    status: "online",
    lastSignal: "1 min ago",
  },
  {
    id: "s2",
    name: "Collar-002",
    petName: "Bella",
    type: "GPS Collar",
    status: "offline",
    lastSignal: "35 min ago",
  },
  {
    id: "s3",
    name: "Beacon-003",
    petName: "Rocky",
    type: "Beacon",
    status: "error",
    lastSignal: "Yesterday",
  },
];

const statusColor = (s: SensorStatus) => {
  switch (s) {
    case "online":
      return "success";
    case "offline":
      return "default";
    case "error":
      return "error";
  }
};

const columns: Column<SensorRow>[] = [
  { field: "name", label: "Sensor" },
  { field: "petName", label: "Pet" },
  { field: "type", label: "Type" },
  {
    field: "status",
    label: "Status",
    render: (row) => (
      <Chip
        size="small"
        label={row.status.toUpperCase()}
        color={statusColor(row.status)}
      />
    ),
  },
  { field: "lastSignal", label: "Last Signal" },
];

const SensorsListPage: React.FC = () => {
  return (
    <EntityListPage<SensorRow>
      title="GPS Sensors"
      columns={columns}
      rows={mockSensors}
      searchField="name"
      searchPlaceholder="Search by sensor name"
      filterLabel="Status"
      filterField="status"
      filterOptions={[
        { label: "Online", value: "online" },
        { label: "Offline", value: "offline" },
        { label: "Error", value: "error" },
      ]}
      onCreate={() => {
        console.log("Create Sensor");
      }}
      onEdit={(row) => {
        console.log("Edit Sensor", row);
      }}
      onDelete={(row) => {
        console.log("Delete Sensor", row);
      }}
    />
  );
};

export default SensorsListPage;
