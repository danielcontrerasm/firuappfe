import React, { useState } from "react";
import { Alert, Avatar, Box, Chip, MenuItem, TextField } from "@mui/material";
import EntityListPage, { Column } from "./EntityListPage.tsx";
import { getApiErrorMessage, Plan, PLAN_ORDER, getPlanLabel } from "../../config/plans.ts";
import { updateUserPlan } from "../../services/currentUser.ts";

type UserRole = "OWNER" | "ADMIN";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  petsCount: number;
  plan: Plan;
}

const mockUsers: UserRow[] = [
  {
    id: "1",
    name: "Daniel Contreras",
    email: "daniel@example.com",
    role: "OWNER",
    petsCount: 3,
    plan: "BASIC",
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    petsCount: 0,
    plan: "PREMIUM",
  },
];

const UsersListPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>(mockUsers);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error" | "info"; message: string } | null>(null);

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
          color={row.role === "ADMIN" ? "primary" : "default"}
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
          { label: "Admins", value: "ADMIN" },
        ]}
        onCreate={() => {
          setFeedback({ severity: "info", message: "La creación de usuarios se realiza desde el registro." });
        }}
        onEdit={(row) => setFeedback({ severity: "success", message: `Seleccionaste a ${row.name}.` })}
        onDelete={(row) => setFeedback({ severity: "error", message: `La eliminación de ${row.name} aún no está disponible en el contrato de usuarios.` })}
      />
    </>
  );
};

export default UsersListPage;
