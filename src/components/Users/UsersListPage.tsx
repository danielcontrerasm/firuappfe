import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EntityListPage, { Column } from "./EntityListPage.tsx";
import { buildApiUrl } from "../../config/runtime";
import { getStoredAuthToken } from "../../services/auth.ts";
import { getApiErrorMessage, normalizePlan, Plan, PLAN_ORDER, getPlanLabel } from "../../config/plans.ts";
import { updateUserPlan } from "../../services/currentUser.ts";

type UserRole = "OWNER" | "WALKER" | "ADMIN";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  petsCount: number;
  plan: Plan;
}

const normalizeUserRole = (value: unknown): UserRole => {
  const role = String(value ?? "USER").trim().toUpperCase();
  if (role.includes("ADMIN")) return "ADMIN";
  if (role.includes("WALKER")) return "WALKER";
  return "OWNER";
};

const mapUserRow = (value: any, index: number): UserRow => ({
  id: String(value?.id ?? value?.userId ?? `server-${index}`),
  name: String(value?.name ?? "Sin nombre"),
  email: String(value?.email ?? ""),
  role: normalizeUserRole(value?.role),
  petsCount: Number(value?.petsCount ?? 0),
  plan: normalizePlan(value?.plan),
});

const UsersListPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error" | "info"; message: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    plan: "BASIC" as Plan,
  });

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const token = getStoredAuthToken();
      const response = await axios.get(buildApiUrl("/api/admin/users"), token ? {
        headers: { Authorization: `Bearer ${token}` },
      } : undefined);
      const collection = Array.isArray(response.data)
        ? response.data
        : response.data?.users ?? response.data?.content ?? [];
      setUsers(collection.map(mapUserRow));
    } catch (error) {
      console.error("Error loading admin users:", error);
      setUsers([]);
      setFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudieron cargar todos los usuarios.") });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handlePlanChange = async (row: UserRow, plan: Plan) => {
    if (row.plan === plan) return;
    setPendingUserId(row.id);
    setFeedback(null);
    try {
      const result = await updateUserPlan(row.id, plan);
      setUsers((current) => current.map((user) => user.id === row.id ? { ...user, plan: result.plan } : user));
      setFeedback({ severity: "success", message: `El plan de ${row.name} ahora es ${getPlanLabel(result.plan)}.` });
    } catch (error) {
      console.error("Error updating user plan:", error);
      setFeedback({ severity: "error", message: getApiErrorMessage(error, "No se pudo actualizar el plan del usuario.") });
    } finally {
      setPendingUserId(null);
    }
  };

  const closeCreateDialog = () => {
    if (creating) return;
    setCreateOpen(false);
    setCreateError("");
    setNewUser({ name: "", email: "", phone: "", password: "", plan: "BASIC" });
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const token = getStoredAuthToken();
      const response = await axios.post(
        buildApiUrl("/api/auth/register"),
        {
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          phone: newUser.phone.trim() || undefined,
          plan: newUser.plan,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      const responseUser = response.data?.user && typeof response.data.user === "object"
        ? response.data.user
        : response.data && typeof response.data === "object"
          ? response.data
          : {};
      const createdUser: UserRow = {
        id: String(responseUser.id ?? `new-${Date.now()}`),
        name: String(responseUser.name ?? newUser.name.trim()),
        email: String(responseUser.email ?? newUser.email.trim()),
        role: String(responseUser.role ?? "USER").toUpperCase().includes("ADMIN") ? "ADMIN" : "OWNER",
        petsCount: Number(responseUser.petsCount ?? 0),
        plan: normalizePlan(responseUser.plan ?? newUser.plan),
      };

      setUsers((current) => [createdUser, ...current]);
      setFeedback({ severity: "success", message: `El usuario ${createdUser.name} fue creado correctamente.` });
      setCreateOpen(false);
      setCreateError("");
      setNewUser({ name: "", email: "", phone: "", password: "", plan: "BASIC" });
    } catch (error) {
      console.error("Error creating user:", error);
      setCreateError(getApiErrorMessage(error, "No se pudo crear el usuario."));
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<UserRow>[] = [
    {
      field: "name",
      label: "User",
      render: (row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {row.name.charAt(0).toUpperCase()}
          </Avatar>
          {row.name}
        </Box>
      ),
    },
    { field: "email", label: "Email" },
    {
      field: "role",
      label: "Role",
      render: (row) => (
        <Chip
          size="small"
          label={row.role}
          color={row.role === "ADMIN" ? "primary" : row.role === "WALKER" ? "secondary" : "default"}
        />
      ),
    },
    {
      field: "plan",
      label: "Plan",
      render: (row) => (
        <TextField
          select
          size="small"
          value={row.plan}
          disabled={pendingUserId === row.id}
          onChange={(event) => handlePlanChange(row, event.target.value as Plan)}
          sx={{ minWidth: 145 }}
        >
          {PLAN_ORDER.map((plan) => <MenuItem key={plan} value={plan}>{getPlanLabel(plan)}</MenuItem>)}
        </TextField>
      ),
    },
    {
      field: "petsCount",
      label: "Pets",
    },
  ];

  return (
    <>
      {feedback && <Alert severity={feedback.severity} sx={{ mx: { xs: 1.5, md: 2 }, mt: 1.5 }}>{feedback.message}</Alert>}
      {loadingUsers && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mx: { xs: 1.5, md: 2 }, mt: 1.5 }}>
          <CircularProgress size={20} />
          Cargando usuarios…
        </Box>
      )}
      <EntityListPage<UserRow>
        title="Users"
        columns={columns}
        rows={users}
        searchField="name"
        searchPlaceholder="Search by user name"
        filterLabel="Role"
        filterField="role"
        filterOptions={[
          { label: "Owners", value: "OWNER" },
          { label: "Walkers", value: "WALKER" },
          { label: "Admins", value: "ADMIN" },
        ]}
        onCreate={() => {
          setFeedback(null);
          setCreateError("");
          setCreateOpen(true);
        }}
        onEdit={(row) => setFeedback({ severity: "success", message: `Seleccionaste a ${row.name}.` })}
        onDelete={(row) => setFeedback({ severity: "error", message: `La eliminación de ${row.name} aún no está disponible en el contrato de usuarios.` })}
      />

      <Dialog open={createOpen} onClose={closeCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle>Crear usuario</DialogTitle>
        <Box component="form" onSubmit={handleCreateUser}>
          <DialogContent dividers>
            <Stack spacing={1.5}>
              <TextField
                label="Nombre completo"
                value={newUser.name}
                onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))}
                required
                autoComplete="name"
                fullWidth
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={newUser.email}
                onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
                required
                autoComplete="email"
                fullWidth
              />
              <TextField
                label="Teléfono (opcional)"
                value={newUser.phone}
                onChange={(event) => setNewUser((current) => ({ ...current, phone: event.target.value }))}
                autoComplete="tel"
                fullWidth
              />
              <TextField
                label="Contraseña temporal"
                type="password"
                value={newUser.password}
                onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
                required
                autoComplete="new-password"
                fullWidth
              />
              <TextField
                select
                label="Plan"
                value={newUser.plan}
                onChange={(event) => setNewUser((current) => ({ ...current, plan: event.target.value as Plan }))}
                fullWidth
              >
                {PLAN_ORDER.map((plan) => <MenuItem key={plan} value={plan}>{getPlanLabel(plan)}</MenuItem>)}
              </TextField>
              {createError && <Alert severity="error">{createError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeCreateDialog} disabled={creating}>Cancelar</Button>
            <Button type="submit" variant="contained" startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <PersonAddAlt1Icon />} disabled={creating}>
              {creating ? "Creando…" : "Crear usuario"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};

export default UsersListPage;
