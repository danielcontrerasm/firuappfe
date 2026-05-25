import React, { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import EntityListPage, { Column } from "./EntityListPage.tsx";

type PetStatus = "active" | "lost" | "offline";

export interface PetRow {
  id: string;
  name: string;
  ownerName: string;
  species: string;
  race: string;
  weight: string;
  age: string;
  imageUrl?: string;
  status: PetStatus;
  lastSeen: string;
}

const mockPets: PetRow[] = [
  {
    id: "1",
    name: "Peluche",
    ownerName: "Daniel",
    species: "Dog",
    race: "Golden Retriever",
    weight: "28 kg",
    age: "4 years",
    imageUrl: "/beagle.png",
    status: "active",
    lastSeen: "2 min ago",
  },
  {
    id: "2",
    name: "Bella",
    ownerName: "Daniel",
    species: "Dog",
    race: "Beagle",
    weight: "11 kg",
    age: "2 years",
    imageUrl: "/german.png",
    status: "active",
    lastSeen: "12 min ago",
  },
  {
    id: "3",
    name: "Rocky",
    ownerName: "Laura",
    species: "Dog",
    race: "Mixed Breed",
    weight: "22 kg",
    age: "6 years",
    imageUrl: "/labrador.png",
    status: "lost",
    lastSeen: "Yesterday 18:30",
  },
];

const statusColor = (s: PetStatus) => {
  switch (s) {
    case "active":
      return "success";
    case "lost":
      return "error";
    case "offline":
      return "default";
  }
};

const columns: Column<PetRow>[] = [
  {
    field: "name",
    label: "Pet",
    render: (row) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar src={row.imageUrl} sx={{ width: 32, height: 32 }}>
          {row.name.charAt(0).toUpperCase()}
        </Avatar>
        {row.name}
      </Box>
    ),
  },
  { field: "ownerName", label: "Owner" },
  { field: "species", label: "Species" },
  { field: "race", label: "Race" },
  { field: "weight", label: "Weight" },
  { field: "age", label: "Age" },
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
  { field: "lastSeen", label: "Last Seen" },
];

const PetsListPage: React.FC = () => {
  const [pets, setPets] = useState<PetRow[]>(mockPets);
  const [editingPet, setEditingPet] = useState<PetRow | null>(null);

  const handleEditChange = (field: keyof PetRow, value: string) => {
    setEditingPet((current) => current ? { ...current, [field]: value } : current);
  };

  const handleSaveEdit = () => {
    if (!editingPet) return;

    setPets((currentPets) =>
      currentPets.map((pet) => pet.id === editingPet.id ? editingPet : pet)
    );
    setEditingPet(null);
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleEditChange("imageUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <EntityListPage<PetRow>
        title="Pets"
        columns={columns}
        rows={pets}
        searchField="name"
        searchPlaceholder="Search by pet name"
        filterLabel="Status"
        filterField="status"
        filterOptions={[
          { label: "Active", value: "active" },
          { label: "Lost", value: "lost" },
          { label: "Offline", value: "offline" },
        ]}
        onCreate={() => {
          console.log("Create Pet clicked");
          // open modal or navigate to /pets/new
        }}
        onEdit={(row) => setEditingPet(row)}
        onDelete={(row) => {
          setPets((currentPets) => currentPets.filter((pet) => pet.id !== row.id));
        }}
      />

      <Dialog
        open={Boolean(editingPet)}
        onClose={() => setEditingPet(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "rgba(255,255,255,0.96)",
            border: "1px solid rgba(226,232,240,0.95)",
            boxShadow: "0 24px 70px rgba(15,23,42,0.22)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#0f172a", fontWeight: 900 }}>
          Edit pet
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={editingPet?.imageUrl}
              sx={{
                width: 72,
                height: 72,
                border: "3px solid #ffffff",
                boxShadow: "0 12px 28px rgba(15,23,42,0.18)",
              }}
            >
              {editingPet?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Button
              component="label"
              variant="outlined"
              sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800 }}
            >
              Upload image
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
            </Button>
          </Box>
          <TextField
            label="Name"
            value={editingPet?.name ?? ""}
            onChange={(event) => handleEditChange("name", event.target.value)}
            fullWidth
          />
          <TextField
            label="Owner"
            value={editingPet?.ownerName ?? ""}
            onChange={(event) => handleEditChange("ownerName", event.target.value)}
            fullWidth
          />
          <TextField
            label="Species"
            value={editingPet?.species ?? ""}
            onChange={(event) => handleEditChange("species", event.target.value)}
            fullWidth
          />
          <TextField
            label="Race"
            value={editingPet?.race ?? ""}
            onChange={(event) => handleEditChange("race", event.target.value)}
            fullWidth
          />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Weight"
              value={editingPet?.weight ?? ""}
              onChange={(event) => handleEditChange("weight", event.target.value)}
              fullWidth
            />
            <TextField
              label="Age"
              value={editingPet?.age ?? ""}
              onChange={(event) => handleEditChange("age", event.target.value)}
              fullWidth
            />
          </Box>
          <TextField
            select
            label="Status"
            value={editingPet?.status ?? "active"}
            onChange={(event) => handleEditChange("status", event.target.value as PetStatus)}
            fullWidth
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="lost">Lost</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
          </TextField>
          <TextField
            label="Last seen"
            value={editingPet?.lastSeen ?? ""}
            onChange={(event) => handleEditChange("lastSeen", event.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditingPet(null)} sx={{ borderRadius: 3, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            sx={{ bgcolor: "#0f172a", borderRadius: 3, textTransform: "none", fontWeight: 900 }}
          >
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PetsListPage;
