import React from "react";
import { Avatar, Box, Chip } from "@mui/material";
import EntityListPage, { Column } from "./EntityListPage.tsx";

type UserRole = "OWNER" | "ADMIN";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  petsCount: number;
}

const mockUsers: UserRow[] = [
  {
    id: "u1",
    name: "Daniel Contreras",
    email: "daniel@example.com",
    role: "OWNER",
    petsCount: 3,
  },
  {
    id: "u2",
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    petsCount: 0,
  },
];

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
    field: "petsCount",
    label: "Pets",
  },
];

const UsersListPage: React.FC = () => {
  return (
    <EntityListPage<UserRow>
      title="Users"
      columns={columns}
      rows={mockUsers}
      searchField="name"
      searchPlaceholder="Search by user name"
      filterLabel="Role"
      filterField="role"
      filterOptions={[
        { label: "Owners", value: "OWNER" },
        { label: "Admins", value: "ADMIN" },
      ]}
      onCreate={() => {
        console.log("Create User");
      }}
      onEdit={(row) => {
        console.log("Edit User", row);
      }}
      onDelete={(row) => {
        console.log("Delete User", row);
      }}
    />
  );
};

export default UsersListPage;
