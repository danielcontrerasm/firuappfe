import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Avatar,
  Alert,
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import EntityListPage, { Column } from "./EntityListPage.tsx";
import { petImageEndpoint, usePetImage } from "../../services/usePetImage.ts";
import { buildApiUrl, buildAssetUrl } from "../../config/runtime";
import { isOwnedByCurrentUser } from "../../services/auth.ts";
import { getApiErrorMessage } from "../../config/plans.ts";
import { usePlan } from "../../context/PlanContext.tsx";
import {
  inviteTemporaryAccess,
  listTemporaryAccess,
  revokeTemporaryAccess,
  TemporaryAccessDto,
  TemporaryAccessPermission,
  TemporaryAccessRole,
} from "../../services/temporaryAccess.ts";

type PetStatus = "active" | "lost" | "offline";

export interface PetRow {
  id: string;
  name: string;
  ownerName: string;
  type: string;
  race: string;
  weight: string;
  age: string;
  imei: string;
  terminalId: string;
  imageUrl?: string;
  status: PetStatus;
  lastSeen: string;
}

type SharedPersonDto = {
  userId: number;
  name: string;
  email: string;
  sharedAt: string;
};

type TemporaryAccessMode = "ONCE" | "RECURRING";

type TemporaryAccessForm = {
  name: string;
  email: string;
  role: TemporaryAccessRole;
  mode: TemporaryAccessMode;
  startsAt: string;
  endsAt: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  permissions: Record<TemporaryAccessPermission, boolean>;
};

const temporaryAccessPermissionLabels: Array<{ value: TemporaryAccessPermission; label: string; description: string }> = [
  { value: "LIVE_LOCATION", label: "Ubicación en vivo", description: "Posición actual y estado de conexión." },
  { value: "ALERTS", label: "Alertas y batería", description: "Alertas de seguridad y batería." },
  { value: "HISTORY", label: "Historial y recorridos", description: "Recorridos disponibles para esta mascota." },
  { value: "GEOFENCES", label: "Geocercas", description: "Estado de las zonas seguras de esta mascota." },
];

const weekdays = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 7, label: "Dom" },
];

const toLocalDateTimeInput = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const createTemporaryAccessForm = (): TemporaryAccessForm => {
  const startsAt = new Date(Date.now() + 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  return {
    name: "",
    email: "",
    role: "WALKER",
    mode: "ONCE",
    startsAt: toLocalDateTimeInput(startsAt),
    endsAt: toLocalDateTimeInput(endsAt),
    startTime: "08:00",
    endTime: "17:00",
    daysOfWeek: [1, 2, 3, 4, 5],
    permissions: {
      LIVE_LOCATION: true,
      ALERTS: true,
      HISTORY: true,
      GEOFENCES: true,
    },
  };
};

const mapTemporaryAccess = (access: any, fallbackId?: string | number): TemporaryAccessDto => ({
  id: access?.id ?? access?.accessId ?? fallbackId ?? `temporary-${Date.now()}`,
  name: access?.name ?? access?.userName ?? access?.inviteeName ?? "Usuario invitado",
  email: access?.email ?? access?.userEmail ?? "",
  role: access?.role ?? "WALKER",
  status: access?.status ?? "ACTIVE",
  startsAt: access?.startsAt ?? access?.validFrom ?? access?.startAt,
  endsAt: access?.endsAt ?? access?.validUntil ?? access?.endAt,
  permissions: access?.permissions ?? [],
  recurrence: access?.recurrence ?? null,
});

const formatTemporaryAccessDate = (value?: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const emptyPetDraft: PetRow = {
  id: "",
  name: "",
  ownerName: "",
  type: "Dog",
  race: "",
  weight: "",
  age: "",
  imei: "",
  terminalId: "",
  imageUrl: "",
  status: "active",
  lastSeen: "New pet",
};

const normalizeImageUrl = (imageUrl?: string) => {
  const cleanedUrl = imageUrl?.trim().replaceAll("\\", "/");
  if (!cleanedUrl) return undefined;
  return buildAssetUrl(cleanedUrl);
};

const getPetImageUrl = (dto: any) =>
  dto.imageUrl ??
  dto.avatarUrl ??
  dto.photoUrl ??
  dto.petImageUrl ??
  dto.image ??
  dto.imagePath;

const extractPetDtos = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const collectionKeys = ["content", "items", "pets", "results", "rows", "payload", "records", "data"];
  for (const key of collectionKeys) {
    const value = data[key];
    if (Array.isArray(value) && value.length) return value;
    if (value && typeof value === "object") {
      const nested = extractPetDtos(value);
      if (nested.length) return nested;
    }
  }
  return [];
};

const mapDtoToPetRow = (dto: any, fallback: PetRow = emptyPetDraft): PetRow => ({
  ...fallback,
  id: String(dto.id ?? fallback.id),
  name: dto.name ?? fallback.name,
  ownerName: dto.ownerName ?? fallback.ownerName,
  type: dto.type ?? fallback.type,
  race: dto.race ?? fallback.race,
  weight: dto.weight != null ? `${dto.weight} kg` : fallback.weight,
  age: dto.age != null ? `${dto.age} years` : fallback.age,
  imei: dto.imei ?? dto.IMEI ?? fallback.imei,
  terminalId: dto.terminalId ?? dto.terminal_id ?? dto.terminalID ?? fallback.terminalId,
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
  const [sharePet, setSharePet] = useState<PetRow | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharedPeople, setSharedPeople] = useState<SharedPersonDto[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSaving, setShareSaving] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const [petFeedback, setPetFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const [temporaryAccessPet, setTemporaryAccessPet] = useState<PetRow | null>(null);
  const [temporaryAccesses, setTemporaryAccesses] = useState<TemporaryAccessDto[]>([]);
  const [temporaryAccessForm, setTemporaryAccessForm] = useState<TemporaryAccessForm>(createTemporaryAccessForm);
  const [temporaryAccessLoading, setTemporaryAccessLoading] = useState(false);
  const [temporaryAccessSaving, setTemporaryAccessSaving] = useState(false);
  const [temporaryAccessFeedback, setTemporaryAccessFeedback] = useState<{ severity: "success" | "error" | "warning"; message: string } | null>(null);
  const { limits, isAdmin, canUseCaregiverAccess, hasRecurringCaregiverSchedule } = usePlan();

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
        const response = await axios.get(buildApiUrl("/api/pets"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const petDtos = extractPetDtos(response.data);

        if (!cancelled) {
          setPets(petDtos.filter((dto: any) => isOwnedByCurrentUser(dto)).map((dto: any) => mapDtoToPetRow(dto)));
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
        imei: editingPet.imei.trim(),
        terminalId: editingPet.terminalId.trim(),
        imageUrl: editingPet.imageUrl,
      };

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = editPetImage
        ? await axios.put(
            buildApiUrl(`/api/pets/${editingPet.id}`),
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
            buildApiUrl(`/api/pets/${editingPet.id}`),
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

  const handleOpenShare = async (pet: PetRow) => {
    setSharePet(pet);
    setShareEmail("");
    setSharedPeople([]);
    setShareFeedback(null);
    setShareLoading(true);
    try {
      const response = await axios.get(buildApiUrl(`/api/pets/${pet.id}/shares`), {
        headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : undefined,
      });
      const people = Array.isArray(response.data) ? response.data : response.data?.items ?? [];
      setSharedPeople(people.map((person: any) => ({
        userId: Number(person.userId ?? person.id),
        name: person.name ?? person.fullName ?? "Usuario autorizado",
        email: person.email ?? "",
        sharedAt: person.sharedAt ?? person.createdAt ?? "",
      })));
    } catch (error) {
      console.error("Error loading shared pet users:", error);
      setShareFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudieron cargar las personas autorizadas.") });
    } finally {
      setShareLoading(false);
    }
  };

  const handleSharePet = async () => {
    if (!sharePet || !shareEmail.trim()) return;
    if (!isAdmin && sharedPeople.length >= limits.authorizedPeoplePerPet) {
      setShareFeedback({ severity: "error", message: `Tu plan permite hasta ${limits.authorizedPeoplePerPet} personas autorizadas por mascota.` });
      return;
    }

    setShareSaving(true);
    setShareFeedback(null);
    try {
      const response = await axios.post(
        buildApiUrl(`/api/pets/${sharePet.id}/shares`),
        { email: shareEmail.trim() },
        { headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : undefined }
      );
      const person = response.data;
      setSharedPeople((current) => {
        const normalizedEmail = String(person?.email ?? shareEmail).trim().toLowerCase();
        if (current.some((item) => item.userId === Number(person?.userId) || item.email.toLowerCase() === normalizedEmail)) {
          return current;
        }
        return [...current, {
          userId: Number(person?.userId ?? Date.now()),
          name: person?.name ?? normalizedEmail,
          email: person?.email ?? normalizedEmail,
          sharedAt: person?.sharedAt ?? new Date().toISOString(),
        }];
      });
      setShareEmail("");
      setShareFeedback({ severity: "success", message: "La mascota fue compartida. La persona ya puede verla con su cuenta." });
    } catch (error) {
      console.error("Error sharing pet:", error);
      setShareFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudo compartir la mascota.") });
    } finally {
      setShareSaving(false);
    }
  };

  const handleRevokeShare = async (userId: number) => {
    if (!sharePet) return;
    try {
      await axios.delete(buildApiUrl(`/api/pets/${sharePet.id}/shares/${userId}`), {
        headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : undefined,
      });
      setSharedPeople((current) => current.filter((person) => person.userId !== userId));
      setShareFeedback({ severity: "success", message: "El acceso fue revocado." });
    } catch (error) {
      console.error("Error revoking pet share:", error);
      setShareFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudo revocar el acceso.") });
    }
  };

  const handleOpenTemporaryAccess = async (pet: PetRow) => {
    setTemporaryAccessPet(pet);
    setTemporaryAccessForm(createTemporaryAccessForm());
    setTemporaryAccessFeedback(null);
    setTemporaryAccesses([]);

    if (!canUseCaregiverAccess && !isAdmin) return;

    setTemporaryAccessLoading(true);
    try {
      const accesses = await listTemporaryAccess(pet.id);
      setTemporaryAccesses(accesses.map((access, index) => mapTemporaryAccess(access, `${pet.id}-${index}`)));
    } catch (error) {
      console.error("Error loading temporary pet access:", error);
      setTemporaryAccessFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudieron cargar los accesos temporales.") });
    } finally {
      setTemporaryAccessLoading(false);
    }
  };

  const handleCloseTemporaryAccess = () => {
    if (temporaryAccessSaving) return;
    setTemporaryAccessPet(null);
    setTemporaryAccessFeedback(null);
  };

  const handleTemporaryPermissionChange = (permission: TemporaryAccessPermission, checked: boolean) => {
    setTemporaryAccessForm((current) => ({
      ...current,
      permissions: { ...current.permissions, [permission]: checked },
    }));
  };

  const handleTemporaryDayChange = (day: number) => {
    setTemporaryAccessForm((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter((value) => value !== day)
        : [...current.daysOfWeek, day].sort((a, b) => a - b),
    }));
  };

  const handleCreateTemporaryAccess = async () => {
    if (!temporaryAccessPet) return;
    if (!canUseCaregiverAccess && !isAdmin) {
      setTemporaryAccessFeedback({ severity: "warning", message: "El acceso temporal está disponible desde el plan Family." });
      return;
    }
    if (temporaryAccessForm.mode === "RECURRING" && !hasRecurringCaregiverSchedule && !isAdmin) {
      setTemporaryAccessFeedback({ severity: "warning", message: "Los horarios recurrentes están disponibles únicamente para Premium." });
      return;
    }
    if (!temporaryAccessForm.name.trim() || !temporaryAccessForm.email.trim()) {
      setTemporaryAccessFeedback({ severity: "error", message: "Ingresa el nombre y correo del cuidador o paseador." });
      return;
    }

    const startsAt = new Date(temporaryAccessForm.startsAt);
    const endsAt = new Date(temporaryAccessForm.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      setTemporaryAccessFeedback({ severity: "error", message: "La fecha de finalización debe ser posterior al inicio." });
      return;
    }
    if (temporaryAccessForm.mode === "RECURRING" && temporaryAccessForm.daysOfWeek.length === 0) {
      setTemporaryAccessFeedback({ severity: "error", message: "Selecciona al menos un día para el horario recurrente." });
      return;
    }

    setTemporaryAccessSaving(true);
    setTemporaryAccessFeedback(null);
    try {
      const response = await inviteTemporaryAccess(temporaryAccessPet.id, {
        email: temporaryAccessForm.email.trim(),
        name: temporaryAccessForm.name.trim(),
        role: temporaryAccessForm.role,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        permissions: temporaryAccessPermissionLabels
          .filter(({ value }) => temporaryAccessForm.permissions[value])
          .map(({ value }) => value),
        recurrence: temporaryAccessForm.mode === "RECURRING"
          ? {
              daysOfWeek: temporaryAccessForm.daysOfWeek,
              startTime: temporaryAccessForm.startTime,
              endTime: temporaryAccessForm.endTime,
            }
          : null,
        createAccountIfMissing: true,
        sendCredentials: true,
      });
      const createdAccess = mapTemporaryAccess(response?.access ?? response?.temporaryAccess ?? response, `${temporaryAccessPet.id}-${Date.now()}`);
      setTemporaryAccesses((current) => [createdAccess, ...current]);
      setTemporaryAccessForm(createTemporaryAccessForm());
      setTemporaryAccessFeedback({
        severity: "success",
        message: `Se creó el acceso para ${temporaryAccessForm.name.trim()} y se enviaron las instrucciones a su correo.`,
      });
    } catch (error) {
      console.error("Error creating temporary pet access:", error);
      setTemporaryAccessFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudo crear el acceso temporal.") });
    } finally {
      setTemporaryAccessSaving(false);
    }
  };

  const handleRevokeTemporaryAccess = async (accessId: string | number) => {
    if (!temporaryAccessPet) return;
    setTemporaryAccessSaving(true);
    try {
      await revokeTemporaryAccess(temporaryAccessPet.id, accessId);
      setTemporaryAccesses((current) => current.filter((access) => String(access.id) !== String(accessId)));
      setTemporaryAccessFeedback({ severity: "success", message: "El acceso temporal fue revocado." });
    } catch (error) {
      console.error("Error revoking temporary pet access:", error);
      setTemporaryAccessFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudo revocar el acceso temporal.") });
    } finally {
      setTemporaryAccessSaving(false);
    }
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
        imei: creatingPet.imei.trim(),
        terminalId: creatingPet.terminalId.trim(),
      };
      const formData = new FormData();
      formData.append(
        "pet",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      if (newPetImage) {
        formData.append("image", newPetImage);
      }

      const response = await axios.post(buildApiUrl("/api/pets"), formData, {
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

  const handleDeletePet = async (pet: PetRow) => {
    setPetFeedback(null);
    try {
      await axios.delete(buildApiUrl(`/api/pets/${pet.id}`), {
        headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : undefined,
      });
      setPets((currentPets) => currentPets.filter((currentPet) => currentPet.id !== pet.id));
      setPetFeedback({ severity: "success", message: `${pet.name} fue eliminada correctamente.` });
    } catch (error) {
      console.error("Error deleting pet:", error);
      setPetFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudo eliminar la mascota.") });
    }
  };

  return (
    <>
      {petFeedback && <Alert severity={petFeedback.severity} sx={{ mb: 1.5 }} onClose={() => setPetFeedback(null)}>{petFeedback.message}</Alert>}
      <EntityListPage<PetRow>
        title={loadingPets ? "Mis mascotas · Cargando…" : "Mis mascotas"}
        columns={columns}
        rows={pets}
        renderMobileRow={row => <div className="firu-managed-pet-main"><AuthenticatedPetAvatar name={row.name} petId={row.id} imageUrl={row.imageUrl} size={58} /><div><h2>{row.name}</h2><p>{row.race || row.type}</p><span className={`firu-status-badge ${row.status === 'lost' ? 'is-lost' : ''}`}>{row.status === 'lost' ? 'Se busca' : row.status === 'offline' ? 'Sin conexión' : 'Registrada'}</span></div></div>}
        searchField="name"
        searchPlaceholder="Buscar mascota"
        filterLabel="Estado"
        filterField="status"
        filterOptions={[
          { label: "Registradas", value: "active" },
          { label: "Perdidas", value: "lost" },
          { label: "Sin conexión", value: "offline" },
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
        onShare={handleOpenShare}
        onTemporaryAccess={handleOpenTemporaryAccess}
        onDelete={handleDeletePet}
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
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="IMEI"
              value={creatingPet?.imei ?? ""}
              onChange={(event) => handleCreateChange("imei", event.target.value)}
              fullWidth
            />
            <TextField
              label="Terminal ID"
              value={creatingPet?.terminalId ?? ""}
              onChange={(event) => handleCreateChange("terminalId", event.target.value)}
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
        open={Boolean(temporaryAccessPet)}
        onClose={handleCloseTemporaryAccess}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ color: "#0f172a", fontWeight: 900 }}>
          Acceso temporal · {temporaryAccessPet?.name || "mascota"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          {!canUseCaregiverAccess && !isAdmin && (
            <Alert severity="warning">
              Esta función está disponible desde el plan Family. Premium también permite horarios recurrentes.
            </Alert>
          )}
          {temporaryAccessFeedback && <Alert severity={temporaryAccessFeedback.severity}>{temporaryAccessFeedback.message}</Alert>}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Nombre del cuidador o paseador"
              value={temporaryAccessForm.name}
              onChange={(event) => setTemporaryAccessForm((current) => ({ ...current, name: event.target.value }))}
              fullWidth
              required
              disabled={!canUseCaregiverAccess && !isAdmin}
            />
            <TextField
              label="Correo electrónico"
              type="email"
              value={temporaryAccessForm.email}
              onChange={(event) => setTemporaryAccessForm((current) => ({ ...current, email: event.target.value }))}
              fullWidth
              required
              disabled={!canUseCaregiverAccess && !isAdmin}
              helperText="Si no existe, se creará la cuenta automáticamente."
            />
            <TextField
              select
              label="Tipo de acceso"
              value={temporaryAccessForm.role}
              onChange={(event) => setTemporaryAccessForm((current) => ({ ...current, role: event.target.value as TemporaryAccessRole }))}
              fullWidth
              disabled={!canUseCaregiverAccess && !isAdmin}
            >
              <MenuItem value="WALKER">Paseador</MenuItem>
              <MenuItem value="CAREGIVER">Cuidador</MenuItem>
            </TextField>
            <TextField
              select
              label="Tipo de vigencia"
              value={temporaryAccessForm.mode}
              onChange={(event) => setTemporaryAccessForm((current) => ({ ...current, mode: event.target.value as TemporaryAccessMode }))}
              fullWidth
              disabled={!canUseCaregiverAccess && !isAdmin}
            >
              <MenuItem value="ONCE">Acceso puntual</MenuItem>
              <MenuItem value="RECURRING" disabled={!hasRecurringCaregiverSchedule && !isAdmin}>Horario recurrente · Premium</MenuItem>
            </TextField>
            <TextField
              label="Inicio"
              type="datetime-local"
              value={temporaryAccessForm.startsAt}
              onChange={(event) => setTemporaryAccessForm((current) => ({ ...current, startsAt: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={!canUseCaregiverAccess && !isAdmin}
            />
            <TextField
              label="Vencimiento"
              type="datetime-local"
              value={temporaryAccessForm.endsAt}
              onChange={(event) => setTemporaryAccessForm((current) => ({ ...current, endsAt: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={!canUseCaregiverAccess && !isAdmin}
            />
          </Box>

          {temporaryAccessForm.mode === "RECURRING" && (
            <Box sx={{ display: "grid", gap: 1.5, p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 900 }}>
                Horario recurrente
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {weekdays.map((day) => {
                  const selected = temporaryAccessForm.daysOfWeek.includes(day.value);
                  return (
                    <Button
                      key={day.value}
                      size="small"
                      variant={selected ? "contained" : "outlined"}
                      onClick={() => handleTemporaryDayChange(day.value)}
                      disabled={!hasRecurringCaregiverSchedule && !isAdmin}
                      sx={{ minWidth: 48, borderRadius: 2, textTransform: "none" }}
                    >
                      {day.label}
                    </Button>
                  );
                })}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Hora de inicio"
                  type="time"
                  value={temporaryAccessForm.startTime}
                  onChange={(event) => setTemporaryAccessForm((current) => ({ ...current, startTime: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  disabled={!hasRecurringCaregiverSchedule && !isAdmin}
                />
                <TextField
                  label="Hora de finalización"
                  type="time"
                  value={temporaryAccessForm.endTime}
                  onChange={(event) => setTemporaryAccessForm((current) => ({ ...current, endTime: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  disabled={!hasRecurringCaregiverSchedule && !isAdmin}
                />
              </Box>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 900, mb: 0.5 }}>
              Permisos para esta mascota
            </Typography>
            <FormGroup>
              {temporaryAccessPermissionLabels.map((permission) => (
                <FormControlLabel
                  key={permission.value}
                  control={(
                    <Checkbox
                      checked={temporaryAccessForm.permissions[permission.value]}
                      onChange={(event) => handleTemporaryPermissionChange(permission.value, event.target.checked)}
                      disabled={!canUseCaregiverAccess && !isAdmin}
                    />
                  )}
                  label={(
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{permission.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{permission.description}</Typography>
                    </Box>
                  )}
                />
              ))}
            </FormGroup>
          </Box>

          <Alert severity="info">
            Si el correo no pertenece a un usuario, el sistema creará una cuenta de paseador/cuidador y enviará las credenciales temporales por correo. El acceso queda limitado a esta mascota y a la vigencia indicada.
          </Alert>

          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 900, mb: 1 }}>
              Accesos activos
            </Typography>
            {temporaryAccessLoading ? (
              <Typography variant="body2" color="text.secondary">Cargando accesos temporales…</Typography>
            ) : temporaryAccesses.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Todavía no hay accesos temporales para esta mascota.</Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 1 }}>
                {temporaryAccesses.map((access) => (
                  <Box key={String(access.id)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#f8fafc" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{access.name || access.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {access.email} · {access.role === "CAREGIVER" ? "Cuidador" : "Paseador"}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {formatTemporaryAccessDate(access.startsAt)} → {formatTemporaryAccessDate(access.endsAt)}
                      </Typography>
                    </Box>
                    <Button size="small" color="error" onClick={() => handleRevokeTemporaryAccess(access.id)} disabled={temporaryAccessSaving}>
                      Revocar
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseTemporaryAccess} disabled={temporaryAccessSaving}>Cerrar</Button>
          <Button
            variant="contained"
            onClick={handleCreateTemporaryAccess}
            disabled={(!canUseCaregiverAccess && !isAdmin) || temporaryAccessSaving || !temporaryAccessForm.name.trim() || !temporaryAccessForm.email.trim()}
            sx={{ fontWeight: 900 }}
          >
            {temporaryAccessSaving ? "Guardando…" : "Crear acceso y enviar correo"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(sharePet)}
        onClose={() => setSharePet(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ color: "#0f172a", fontWeight: 900 }}>
          Compartir {sharePet?.name || "mascota"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField
            label="Correo de la persona autorizada"
            type="email"
            value={shareEmail}
            onChange={(event) => setShareEmail(event.target.value)}
            fullWidth
            size="small"
            placeholder="persona@example.com"
            helperText={`${sharedPeople.length} / ${isAdmin ? "sin límite" : limits.authorizedPeoplePerPet} personas autorizadas`}
            disabled={shareSaving}
          />
          {shareFeedback && <Alert severity={shareFeedback.severity}>{shareFeedback.message}</Alert>}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#0f172a", mb: 1 }}>
              Personas con acceso
            </Typography>
            {shareLoading ? (
              <Typography variant="body2" color="text.secondary">Cargando accesos…</Typography>
            ) : sharedPeople.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Todavía no has compartido esta mascota.</Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 1 }}>
                {sharedPeople.map((person) => (
                  <Box key={`${person.userId}-${person.email}`} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: 1, borderRadius: 2, bgcolor: "#f8fafc" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{person.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{person.email}</Typography>
                    </Box>
                    <Button size="small" color="error" onClick={() => handleRevokeShare(person.userId)}>Revocar</Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSharePet(null)}>Cerrar</Button>
          <Button variant="contained" onClick={handleSharePet} disabled={shareSaving || !shareEmail.trim() || (!isAdmin && sharedPeople.length >= limits.authorizedPeoplePerPet)}>
            {shareSaving ? "Compartiendo…" : "Compartir"}
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
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="IMEI"
              value={editingPet?.imei ?? ""}
              onChange={(event) => handleEditChange("imei", event.target.value)}
              fullWidth
            />
            <TextField
              label="Terminal ID"
              value={editingPet?.terminalId ?? ""}
              onChange={(event) => handleEditChange("terminalId", event.target.value)}
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
