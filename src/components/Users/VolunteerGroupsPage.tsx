import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SearchIcon from "@mui/icons-material/Search";
import { buildApiUrl } from "../../config/runtime";

type VolunteerMemberDto = {
  userId: number;
  name: string;
  email: string;
  phone: string;
};

type SearchGroupDto = {
  id: number;
  groupName: string;
  description: string;
  status: string;
  area: string;
  city: string;
  membersCount: number;
  leaderName: string;
  leaderPhone: string;
  coverageRadiusKm: number;
  createdAt: string;
  petId: number;
  petName: string;
  petStatus: string;
  createdById: number;
  createdByName: string;
  createdByEmail: string;
  volunteers: VolunteerMemberDto[];
};

type NewGroupFormState = {
  groupName: string;
  description: string;
  status: string;
  area: string;
  city: string;
  coverageRadiusKm: string;
  petId: string;
  petStatus: string;
  leaderName: string;
  leaderPhone: string;
};

type PetOption = {
  id: string;
  name: string;
  status: string;
};

const currentUser: VolunteerMemberDto = {
  userId: 104,
  name: "Daniel Contreras",
  email: "daniel@example.com",
  phone: "+57 300 555 0120",
};

const searchableVolunteers: VolunteerMemberDto[] = [
  currentUser,
  { userId: 105, name: "Laura Perez", email: "laura@example.com", phone: "+57 301 222 8844" },
  { userId: 106, name: "Carlos Rios", email: "carlos@example.com", phone: "+57 302 410 7788" },
  { userId: 107, name: "Maria Gomez", email: "maria@example.com", phone: "+57 300 700 1199" },
];

const mockGroups: SearchGroupDto[] = [
  {
    id: 1,
    groupName: "North Zone Rescue",
    description: "Search support around Laureles parks and nearby creek paths.",
    status: "active",
    area: "Laureles",
    city: "Medellin",
    membersCount: 2,
    leaderName: "Maria Gomez",
    leaderPhone: "+57 300 700 1199",
    coverageRadiusKm: 5,
    createdAt: "2026-05-24T15:20:00Z",
    petId: 3,
    petName: "Rocky",
    petStatus: "lost",
    createdById: 101,
    createdByName: "Laura Perez",
    createdByEmail: "laura@example.com",
    volunteers: [
      { userId: 107, name: "Maria Gomez", email: "maria@example.com", phone: "+57 300 700 1199" },
      { userId: 106, name: "Carlos Rios", email: "carlos@example.com", phone: "+57 302 410 7788" },
    ],
  },
  {
    id: 2,
    groupName: "Poblado Evening Watch",
    description: "Evening volunteers checking high-traffic streets and dog parks.",
    status: "standby",
    area: "El Poblado",
    city: "Medellin",
    membersCount: 1,
    leaderName: "Daniel Contreras",
    leaderPhone: "+57 300 555 0120",
    coverageRadiusKm: 3.5,
    createdAt: "2026-05-22T18:45:00Z",
    petId: 2,
    petName: "Bella",
    petStatus: "active",
    createdById: 104,
    createdByName: "Daniel Contreras",
    createdByEmail: "daniel@example.com",
    volunteers: [currentUser],
  },
];

const statusColor = (status: string) => {
  if (status.toLowerCase() === "active") return "success";
  if (status.toLowerCase() === "closed") return "default";
  return "warning";
};

const mapDtoToVolunteer = (dto: any): VolunteerMemberDto => ({
  userId: Number(dto.userId ?? dto.id ?? 0),
  name: dto.name ?? dto.fullName ?? dto.username ?? "Unknown volunteer",
  email: dto.email ?? "",
  phone: dto.phone ?? dto.phoneNumber ?? "",
});

const mapDtoToSearchGroup = (dto: any): SearchGroupDto => {
  const volunteers = Array.isArray(dto.volunteers) ? dto.volunteers.map(mapDtoToVolunteer) : [];

  return {
    id: Number(dto.id ?? 0),
    groupName: dto.groupName ?? dto.name ?? "Unnamed group",
    description: dto.description ?? "",
    status: dto.status ?? "standby",
    area: dto.area ?? dto.zone ?? "",
    city: dto.city ?? "",
    membersCount: Number(dto.membersCount ?? volunteers.length ?? 0),
    leaderName: dto.leaderName ?? dto.leader?.name ?? "",
    leaderPhone: dto.leaderPhone ?? dto.leader?.phone ?? "",
    coverageRadiusKm: Number(dto.coverageRadiusKm ?? dto.coverageRadius ?? 0),
    createdAt: dto.createdAt ?? new Date().toISOString(),
    petId: Number(dto.petId ?? dto.pet?.id ?? 0),
    petName: dto.petName ?? dto.pet?.name ?? "",
    petStatus: dto.petStatus ?? dto.pet?.status ?? "active",
    createdById: Number(dto.createdById ?? dto.createdBy?.id ?? 0),
    createdByName: dto.createdByName ?? dto.createdBy?.name ?? "",
    createdByEmail: dto.createdByEmail ?? dto.createdBy?.email ?? "",
    volunteers,
  };
};

const createDefaultGroupForm = (): NewGroupFormState => ({
  groupName: "",
  description: "",
  status: "active",
  area: "",
  city: "Medellin",
  coverageRadiusKm: "3",
  petId: "",
  petStatus: "lost",
  leaderName: currentUser.name,
  leaderPhone: currentUser.phone,
});

const VolunteerGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<SearchGroupDto[]>(mockGroups);
  const [pets, setPets] = useState<PetOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<SearchGroupDto | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState<NewGroupFormState>(createDefaultGroupForm);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [groupsResponse, petsResponse] = await Promise.allSettled([
          axios.get(buildApiUrl("/api/search-groups"), { headers }),
          axios.get(buildApiUrl("/api/pets"), { headers }),
        ]);

        if (!cancelled && groupsResponse.status === "fulfilled") {
          const groupDtos = Array.isArray(groupsResponse.value.data)
            ? groupsResponse.value.data
            : groupsResponse.value.data?.content || groupsResponse.value.data?.items || [];

          if (groupDtos.length > 0) {
            setGroups(groupDtos.map((dto: any) => mapDtoToSearchGroup(dto)));
          }
        }

        if (!cancelled && petsResponse.status === "fulfilled") {
          const petDtos = Array.isArray(petsResponse.value.data)
            ? petsResponse.value.data
            : petsResponse.value.data?.content || petsResponse.value.data?.items || [];

          setPets(
            petDtos.map((dto: any) => ({
              id: String(dto.id ?? ""),
              name: dto.name ?? `Pet ${dto.id ?? ""}`,
              status: dto.status ?? "active",
            }))
          );
        }
      } catch (error) {
        console.warn("Falling back to local mock groups because /api/search-groups could not be loaded.", error);
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesSearch =
        !term ||
        group.groupName.toLowerCase().includes(term) ||
        group.petName.toLowerCase().includes(term) ||
        group.area.toLowerCase().includes(term) ||
        group.city.toLowerCase().includes(term);
      const matchesStatus = status === "all" || group.status.toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
  }, [groups, search, status]);

  const volunteersForSearch = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    const groupMemberIds = new Set(activeGroup?.volunteers.map((volunteer) => volunteer.userId));

    return searchableVolunteers.filter((volunteer) => {
      const notInGroup = !groupMemberIds.has(volunteer.userId);
      const matchesSearch =
        !term ||
        volunteer.name.toLowerCase().includes(term) ||
        volunteer.email.toLowerCase().includes(term) ||
        volunteer.phone.includes(term);
      return notInGroup && matchesSearch;
    });
  }, [activeGroup, memberSearch]);

  const handleJoinGroup = async (groupId: number) => {
    setJoiningGroupId(groupId);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        buildApiUrl(`/api/search-groups/${groupId}/join`),
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      if (response.data) {
        const updatedGroup = mapDtoToSearchGroup(response.data);
        setGroups((currentGroups) => currentGroups.map((group) => (group.id === groupId ? updatedGroup : group)));
        setActiveGroup((current) => (current?.id === groupId ? updatedGroup : current));
        return;
      }

      setGroups((currentGroups) =>
        currentGroups.map((group) => {
          if (group.id !== groupId || group.volunteers.some((volunteer) => volunteer.userId === currentUser.userId)) {
            return group;
          }

          const volunteers = [...group.volunteers, currentUser];
          return { ...group, volunteers, membersCount: volunteers.length };
        })
      );
    } catch (error: any) {
      console.error(`Error joining search group ${groupId}:`, error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Unknown error";
      alert(`Failed to join the volunteer group. ${message}`);
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleAddVolunteer = (volunteer: VolunteerMemberDto) => {
    if (!activeGroup) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== activeGroup.id || group.volunteers.some((member) => member.userId === volunteer.userId)) {
          return group;
        }

        const volunteers = [...group.volunteers, volunteer];
        return { ...group, volunteers, membersCount: volunteers.length };
      })
    );
    setActiveGroup((current) =>
      current
        ? {
            ...current,
            volunteers: [...current.volunteers, volunteer],
            membersCount: current.volunteers.length + 1,
          }
        : current
    );
  };

  const handleCreateGroup = async () => {
    const groupName = newGroupForm.groupName.trim();
    const description = newGroupForm.description.trim();
    const area = newGroupForm.area.trim();
    const city = newGroupForm.city.trim();
    const petId = Number(newGroupForm.petId);
    const leaderName = newGroupForm.leaderName.trim();
    const leaderPhone = newGroupForm.leaderPhone.trim();
    const coverageRadiusKm = Number(newGroupForm.coverageRadiusKm);
    const selectedPet = pets.find((pet) => pet.id === newGroupForm.petId);
    const petName = selectedPet?.name ?? "";

    if (!groupName || !description || !area || !city || !petId || !leaderName || !leaderPhone || !coverageRadiusKm) {
      return;
    }

    const payload = {
      groupName,
      description,
      status: newGroupForm.status,
      area,
      city,
      coverageRadiusKm,
      petId,
      petName,
      petStatus: newGroupForm.petStatus,
      leaderName,
      leaderPhone,
      createdById: currentUser.userId,
      createdByName: currentUser.name,
      createdByEmail: currentUser.email,
      volunteerUserIds: [currentUser.userId],
    };

    setIsCreatingGroup(true);
    try {
      const token = localStorage.getItem("token");
      const decodedToken = token ? jwtDecode<Record<string, any>>(token) : null;
      console.log("Creating search group:", {
        endpoint: buildApiUrl("/api/search-groups"),
        hasToken: Boolean(token),
        tokenLength: token?.length ?? 0,
        tokenPreview: token ? `${token.slice(0, 18)}...${token.slice(-10)}` : null,
        authorizationHeaderPreview: token ? `Bearer ${token.slice(0, 18)}...${token.slice(-10)}` : null,
        tokenUserId: decodedToken?.id ?? decodedToken?.userId ?? decodedToken?.sub,
        tokenRole: decodedToken?.role ?? decodedToken?.roles ?? decodedToken?.authorities,
        payload,
      });
      const response = await axios.post(buildApiUrl("/api/search-groups"), payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const createdGroup = response.data
        ? mapDtoToSearchGroup(response.data)
        : {
            id: groups.reduce((maxId, group) => Math.max(maxId, group.id), 0) + 1,
            groupName,
            description,
            status: newGroupForm.status,
            area,
            city,
            membersCount: 1,
            leaderName,
            leaderPhone,
            coverageRadiusKm,
            createdAt: new Date().toISOString(),
            petId,
            petName,
            petStatus: newGroupForm.petStatus,
            createdById: currentUser.userId,
            createdByName: currentUser.name,
            createdByEmail: currentUser.email,
            volunteers: [currentUser],
          };

      setGroups((currentGroups) => [createdGroup, ...currentGroups]);
      setIsCreateDialogOpen(false);
      setNewGroupForm(createDefaultGroupForm());
    } catch (error: any) {
      console.error("Error creating search group:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Unknown error";
      alert(`Failed to create the volunteer group in /api/search-groups. ${message}`);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        p: { xs: 1.5, md: 2 },
        borderRadius: 4,
        background: "linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(236,254,255,0.58) 100%)",
        border: "1px solid rgba(226,232,240,0.8)",
      }}
    >
      <Toolbar disableGutters sx={{ mb: 2, justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#053042" }}>
            Volunteer Groups
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b" }}>
            Search groups tied to pets, coverage areas, and available volunteers.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateDialogOpen(true)}
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 900,
            background: "linear-gradient(135deg, #10b981 0%, #22c55e 50%, #a3e635 100%)",
            boxShadow: "0 12px 30px rgba(16,185,129,0.35)",
          }}
        >
          New group
        </Button>
      </Toolbar>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Search groups, pets, or areas"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 300 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          sx={{ minWidth: 180 }}
          SelectProps={{ native: true }}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="standby">Standby</option>
          <option value="closed">Closed</option>
        </TextField>
      </Box>

      <Stack spacing={2}>
        {filteredGroups.map((group) => {
          const hasJoined = group.volunteers.some((volunteer) => volunteer.userId === currentUser.userId);

          return (
            <Box
              key={group.id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.2fr) minmax(360px, 0.8fr)" },
                gap: 2,
                p: 2,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.96)",
                border: "1px solid rgba(226,232,240,0.95)",
                boxShadow: "0 16px 38px rgba(15,23,42,0.08)",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 900 }}>
                      {group.groupName}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b" }}>
                      {group.description}
                    </Typography>
                  </Box>
                  <Chip size="small" label={group.status.toUpperCase()} color={statusColor(group.status)} />
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                  <Chip label={`${group.area}, ${group.city}`} />
                  <Chip label={`${group.coverageRadiusKm} km coverage`} />
                  <Chip label={`${group.membersCount} members`} />
                  <Chip label={`${group.petName} · ${group.petStatus}`} color={group.petStatus === "lost" ? "error" : "default"} />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 900 }}>
                      Leader
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 800 }}>
                      {group.leaderName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {group.leaderPhone}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 900 }}>
                      Created by
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 800 }}>
                      {group.createdByName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {group.createdByEmail}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Button
                    variant={hasJoined ? "outlined" : "contained"}
                    startIcon={<GroupAddIcon />}
                    disabled={hasJoined || joiningGroupId === group.id}
                    onClick={() => handleJoinGroup(group.id)}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, bgcolor: hasJoined ? undefined : "#0f172a" }}
                  >
                    {hasJoined ? "Joined" : joiningGroupId === group.id ? "Joining..." : "Join group"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddAltIcon />}
                    onClick={() => {
                      setActiveGroup(group);
                      setMemberSearch("");
                    }}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                  >
                    Add member
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                  border: "1px solid rgba(226,232,240,0.95)",
                  bgcolor: "#ffffff",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>Volunteer</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Phone</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.volunteers.map((volunteer) => (
                      <TableRow key={volunteer.userId}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: "#0f172a", fontSize: 13 }}>
                              {volunteer.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 800 }}>
                                {volunteer.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#64748b" }}>
                                {volunteer.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{volunteer.phone}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          );
        })}
      </Stack>

      <Dialog open={Boolean(activeGroup)} onClose={() => setActiveGroup(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900, color: "#0f172a" }}>
          Add volunteer
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            {activeGroup ? `Search users to add to ${activeGroup.groupName}.` : ""}
          </Typography>
          <TextField
            label="Search by name, email, or phone"
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
            fullWidth
            size="small"
          />
          <Stack spacing={1}>
            {volunteersForSearch.map((volunteer) => (
              <Box
                key={volunteer.userId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(226,232,240,0.95)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: "#06b6d4" }}>
                    {volunteer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: "#0f172a" }}>
                      {volunteer.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      {volunteer.email} · {volunteer.phone}
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="Add to group">
                  <IconButton onClick={() => handleAddVolunteer(volunteer)}>
                    <PersonAddAltIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            {volunteersForSearch.length === 0 && (
              <Typography variant="body2" sx={{ py: 2, textAlign: "center", color: "#64748b" }}>
                No available volunteers found.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setActiveGroup(null)} sx={{ borderRadius: 3, textTransform: "none" }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setNewGroupForm(createDefaultGroupForm());
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#0f172a" }}>Create volunteer group</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField
            label="Group name"
            value={newGroupForm.groupName}
            onChange={(event) => setNewGroupForm((current) => ({ ...current, groupName: event.target.value }))}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Description"
            value={newGroupForm.description}
            onChange={(event) => setNewGroupForm((current) => ({ ...current, description: event.target.value }))}
            fullWidth
            size="small"
            multiline
            minRows={3}
            required
          />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              select
              label="Status"
              value={newGroupForm.status}
              onChange={(event) => setNewGroupForm((current) => ({ ...current, status: event.target.value }))}
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="active">Active</option>
              <option value="standby">Standby</option>
              <option value="closed">Closed</option>
            </TextField>
            <TextField
              label="Coverage radius (km)"
              type="number"
              value={newGroupForm.coverageRadiusKm}
              onChange={(event) => setNewGroupForm((current) => ({ ...current, coverageRadiusKm: event.target.value }))}
              size="small"
              inputProps={{ min: 1, step: 0.5 }}
              required
            />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Area"
              value={newGroupForm.area}
              onChange={(event) => setNewGroupForm((current) => ({ ...current, area: event.target.value }))}
              size="small"
              required
            />
            <TextField
              label="City"
              value={newGroupForm.city}
              onChange={(event) => setNewGroupForm((current) => ({ ...current, city: event.target.value }))}
              size="small"
              required
            />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              select
              label="Pet"
              value={newGroupForm.petId}
              onChange={(event) => setNewGroupForm((current) => ({ ...current, petId: event.target.value }))}
              size="small"
              required
              SelectProps={{ native: true }}
              helperText={pets.length === 0 ? "No pets available from /api/pets." : "Choose the pet for this search group."}
            >
              <option value="">Select a pet</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </TextField>
            <TextField
              select
              label="Pet status"
              value={newGroupForm.petStatus}
              onChange={(event) => setNewGroupForm((current) => ({ ...current, petStatus: event.target.value }))}
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="lost">Lost</option>
              <option value="active">Active</option>
              <option value="recovered">Recovered</option>
            </TextField>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Leader name"
              value={newGroupForm.leaderName}
              onChange={(event) => setNewGroupForm((current) => ({ ...current, leaderName: event.target.value }))}
              size="small"
              required
            />
            <TextField
              label="Leader phone"
              value={newGroupForm.leaderPhone}
              onChange={(event) => setNewGroupForm((current) => ({ ...current, leaderPhone: event.target.value }))}
              size="small"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setIsCreateDialogOpen(false);
              setNewGroupForm(createDefaultGroupForm());
            }}
            sx={{ borderRadius: 3, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={isCreatingGroup}
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: 900 }}
          >
            {isCreatingGroup ? "Creating..." : "Create group"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VolunteerGroupsPage;
