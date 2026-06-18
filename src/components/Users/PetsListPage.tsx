import React, { useEffect, useState } from "react";
import axios from "axios";
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
import { petImageEndpoint, usePetImage } from "../../services/usePetImage.ts";

type PetStatus = "active" | "lost" | "offline";

export interface PetRow {
  id: string;
  name: string;
  ownerName: string;
  type: string;
  race: string;
  weight: string;
  age: string;
  imageUrl?: string;
  status: PetStatus;
  lastSeen: string;
}

const emptyPetDraft: PetRow = {
  id: "",
  name: "",
  ownerName: "",
  type: "Dog",
  race: "",
  weight: "",
  age: "",
  imageUrl: "",
  status: "active",
  lastSeen: "New pet",
};

const API_BASE_URL = "http://localhost:8080";

const normalizeImageUrl = (imageUrl?: string) => {
  const cleanedUrl = imageUrl?.trim().replaceAll("\\", "/");
  if (!cleanedUrl) return undefined;
  if (cleanedUrl.startsWith("http") || cleanedUrl.startsWith("data:")) return cleanedUrl;
  return encodeURI(`${API_BASE_URL}${cleanedUrl.startsWith("/") ? "" : "/"}${cleanedUrl}`);
};

const getPetImageUrl = (dto: any) =>
  dto.imageUrl ??
  dto.avatarUrl ??
  dto.photoUrl ??
  dto.petImageUrl ??
  dto.image ??
  dto.imagePath;

const mapDtoToPetRow = (dto: any, fallback: PetRow = emptyPetDraft): PetRow => ({
  ...fallback,
  id: String(dto.id ?? fallback.id),
  name: dto.name ?? fallback.name,
  ownerName: dto.ownerName ?? fallback.ownerName,
  type: dto.type ?? fallback.type,
  race: dto.race ?? fallback.race,
  weight: dto.weight != null ? `${dto.weight} kg` : fallback.weight,
  age: dto.age != null ? `${dto.age} years` : fallback.age,
  status: (dto.status ?? fallback.status) as PetStatus,
  imageUrl: normalizeImageUrl(getPetImageUrl(dto)) ?? petImageEndpoint(dto.id) ?? fallback.imageUrl,
  lastSeen: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString() : fallback.lastSeen,
});

const AuthenticatedPetAvatar = ({
  name,
  petId,
  imageUrl,
  size = 32,
  onStatusChange,
}: {
  name: string;
  petId?: string | number;
  imageUrl?: string;
  size?: number;
  onStatusChange?: (status: string) => void;
}) => {
  const resolvedSrc = usePetImage(petId, imageUrl);

  useEffect(() => {
    if (!onStatusChange) return;
    if (resolvedSrc) {
      onStatusChange(resolvedSrc.startsWith("blob:") ? "Image loaded from cache" : "Using local preview");
    } else {
      onStatusChange(petId ? "No image available" : "No image endpoint");
    }
  }, [onStatusChange, petId, resolvedSrc]);

  return (
    <Avatar src={resolvedSrc} sx={{ width: size, height: size }}>
      {name?.charAt(0).toUpperCase()}
    </Avatar>
  );
};

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
        <AuthenticatedPetAvatar name={row.name} petId={row.id} imageUrl={row.imageUrl} />
        {row.name}
      </Box>
    ),
  },
  { field: "ownerName", label: "Owner" },
  { field: "type", label: "Type" },
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
  const [pets, setPets] = useState<PetRow[]>([]);
  const [editingPet, setEditingPet] = useState<PetRow | null>(null);
  const [creatingPet, setCreatingPet] = useState<PetRow | null>(null);
  const [newPetImage, setNewPetImage] = useState<File | null>(null);
  const [editPetImage, setEditPetImage] = useState<File | null>(null);
  const [savingPet, setSavingPet] = useState(false);
  const [creatingPetRequest, setCreatingPetRequest] = useState(false);
  const [loadingPets, setLoadingPets] = useState(true);
  const [editImageStatus, setEditImageStatus] = useState("");

  const handleEditChange = (field: keyof PetRow, value: string) => {
    setEditingPet((current) => current ? { ...current, [field]: value } : current);
  };

  const handleCreateChange = (field: keyof PetRow, value: string) => {
    setCreatingPet((current) => current ? { ...current, [field]: value } : current);
  };

  const parseNumber = (value: string) => {
    const parsed = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };

  useEffect(() => {
    let cancelled = false;

    const fetchPets = async () => {
      setLoadingPets(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/pets`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const petDtos = Array.isArray(response.data)
          ? response.data
          : response.data?.content || response.data?.items || [];

        if (!cancelled) {
          setPets(petDtos.map((dto: any) => mapDtoToPetRow(dto)));
        }
      } catch (error) {
        console.error("Error fetching pets:", error);
        if (!cancelled) {
          setPets([]);
          alert("Failed to load pets from the database.");
        }
      } finally {
        if (!cancelled) {
          setLoadingPets(false);
        }
      }
    };

    fetchPets();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveEdit = async () => {
    if (!editingPet) return;

    setSavingPet(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        id: Number(editingPet.id),
        name: editingPet.name,
        type: editingPet.type,
        race: editingPet.race,
        age: parseNumber(editingPet.age),
        weight: parseNumber(editingPet.weight),
        status: editingPet.status,
        ownerName: editingPet.ownerName,
        imageUrl: editingPet.imageUrl,
      };

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = editPetImage
        ? await axios.put(
            `http://localhost:8080/api/pets/${editingPet.id}`,
            (() => {
              const formData = new FormData();
              formData.append(
                "pet",
                new Blob([JSON.stringify(payload)], { type: "application/json" })
              );
              formData.append("image", editPetImage);
              return formData;
            })(),
            { headers }
          )
        : await axios.put(
            `http://localhost:8080/api/pets/${editingPet.id}`,
            payload,
            { headers }
          );

      setPets((currentPets) =>
        currentPets.map((pet) =>
          pet.id === editingPet.id ? mapDtoToPetRow(response.data, editingPet) : pet
        )
      );
      setEditingPet(null);
      setEditPetImage(null);
    } catch (error) {
      console.error("Error updating pet:", error);
      alert("Failed to update pet.");
    } finally {
      setSavingPet(false);
    }
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;

    setEditPetImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleEditChange("imageUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNewPetImageUpload = (file?: File) => {
    if (!file) return;

    setNewPetImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleCreateChange("imageUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePet = async () => {
    if (!creatingPet) return;

    setCreatingPetRequest(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: creatingPet.name,
        type: creatingPet.type,
        race: creatingPet.race,
        age: parseNumber(creatingPet.age),
        weight: parseNumber(creatingPet.weight),
        status: creatingPet.status,
      };
      const formData = new FormData();
      formData.append(
        "pet",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      if (newPetImage) {
        formData.append("image", newPetImage);
      }

      const response = await axios.post("http://localhost:8080/api/pets", formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const createdPet = mapDtoToPetRow(response.data, {
        ...creatingPet,
        id: String(response.data?.id ?? Date.now()),
      });

      setPets((currentPets) => [...currentPets, createdPet]);
      setCreatingPet(null);
      setNewPetImage(null);
    } catch (error) {
      console.error("Error creating pet:", error);
      alert("Failed to create pet.");
    } finally {
      setCreatingPetRequest(false);
    }
  };

  return (
    <>
      <EntityListPage<PetRow>
        title={loadingPets ? "Pets · Loading..." : "Pets"}
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
          setCreatingPet(emptyPetDraft);
          setNewPetImage(null);
        }}
        onEdit={(row) => {
          setEditImageStatus("");
          setEditPetImage(null);
          setEditingPet(row);
        }}
        onDelete={(row) => {
          setPets((currentPets) => currentPets.filter((pet) => pet.id !== row.id));
        }}
      />

      <Dialog
        open={Boolean(creatingPet)}
        onClose={() => setCreatingPet(null)}
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
          New pet
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                "& .MuiAvatar-root": {
                  border: "3px solid #ffffff",
                  boxShadow: "0 12px 28px rgba(15,23,42,0.18)",
                },
              }}
            >
              <AuthenticatedPetAvatar
                name={creatingPet?.name || "Pet"}
                imageUrl={creatingPet?.imageUrl}
                size={72}
              />
            </Box>
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
                onChange={(event) => handleNewPetImageUpload(event.target.files?.[0])}
              />
            </Button>
          </Box>
          {creatingPet?.imageUrl && (
            <TextField
              label="Image URL"
              value={creatingPet.imageUrl}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
            />
          )}
          <TextField
            label="Name"
            value={creatingPet?.name ?? ""}
            onChange={(event) => handleCreateChange("name", event.target.value)}
            fullWidth
          />
          <TextField
            label="Type"
            value={creatingPet?.type ?? ""}
            onChange={(event) => handleCreateChange("type", event.target.value)}
            fullWidth
          />
          <TextField
            label="Race"
            value={creatingPet?.race ?? ""}
            onChange={(event) => handleCreateChange("race", event.target.value)}
            fullWidth
          />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Weight"
              value={creatingPet?.weight ?? ""}
              onChange={(event) => handleCreateChange("weight", event.target.value)}
              fullWidth
            />
            <TextField
              label="Age"
              value={creatingPet?.age ?? ""}
              onChange={(event) => handleCreateChange("age", event.target.value)}
              fullWidth
            />
          </Box>
          <TextField
            select
            label="Status"
            value={creatingPet?.status ?? "active"}
            onChange={(event) => handleCreateChange("status", event.target.value as PetStatus)}
            fullWidth
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="lost">Lost</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreatingPet(null)} sx={{ borderRadius: 3, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePet}
            disabled={creatingPetRequest || !creatingPet?.name.trim()}
            sx={{ bgcolor: "#0f172a", borderRadius: 3, textTransform: "none", fontWeight: 900 }}
          >
            {creatingPetRequest ? "Creating..." : "Create pet"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(editingPet)}
        onClose={() => {
          setEditingPet(null);
          setEditPetImage(null);
        }}
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
            <Box
              sx={{
                "& .MuiAvatar-root": {
                  border: "3px solid #ffffff",
                  boxShadow: "0 12px 28px rgba(15,23,42,0.18)",
                },
              }}
            >
              <AuthenticatedPetAvatar
                name={editingPet?.name || "Pet"}
                petId={editingPet?.id}
                imageUrl={editingPet?.imageUrl}
                size={72}
                onStatusChange={setEditImageStatus}
              />
            </Box>
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
          {editImageStatus && (
            <TextField
              label="Image status"
              value={editImageStatus}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
            />
          )}
          {editingPet?.imageUrl && (
            <TextField
              label="Image URL"
              value={editingPet.imageUrl}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
            />
          )}
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
            label="Type"
            value={editingPet?.type ?? ""}
            onChange={(event) => handleEditChange("type", event.target.value)}
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
          <Button
            onClick={() => {
              setEditingPet(null);
              setEditPetImage(null);
            }}
            sx={{ borderRadius: 3, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={savingPet}
            sx={{ bgcolor: "#0f172a", borderRadius: 3, textTransform: "none", fontWeight: 900 }}
          >
            {savingPet ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PetsListPage;
