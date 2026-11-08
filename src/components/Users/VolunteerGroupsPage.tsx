import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import SearchIcon from "@mui/icons-material/Search";
import { useSearchParams } from "react-router-dom";
import { buildApiUrl, searchGroupEndpoints } from "../../config/runtime";
import { isOwnedByCurrentUser } from "../../services/auth.ts";

type VolunteerMemberDto = {
  userId: number;
  name: string;
  email: string;
  phone: string;
};

type VolunteerCandidateDto = {
  userId: number;
  name: string;
  email: string;
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
  leaderName: string;
  leaderPhone: string;
};

type PetOption = {
  id: string;
  name: string;
};

const currentUser: VolunteerMemberDto = {
  userId: 104,
  name: "Daniel Contreras",
  email: "daniel@example.com",
  phone: "+57 300 555 0120",
};

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

const extractCollection = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const collectionKeys = ["content", "items", "groups", "results", "rows", "payload", "records", "data"];
  for (const key of collectionKeys) {
    const nested = extractCollection(data[key]);
    if (nested.length) return nested;
  }

  return [];
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const fetchPersistedGroups = async (): Promise<SearchGroupDto[]> => {
  const response = await axios.get(buildApiUrl(searchGroupEndpoints.list), {
    headers: getAuthHeaders(),
  });
  // /api/search-groups is the discovery list used by the Join action. The
  // bearer token and backend determine which groups are accessible; filtering
  // here to owned/member groups hides every group a user could join.
  return extractCollection(response.data)
    .map((dto: any) => mapDtoToSearchGroup(dto));
};

const getAuthenticatedUserId = (): number | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const claims = jwtDecode<Record<string, unknown>>(token);
    const value = claims.userId ?? claims.id ?? claims.sub;
    const userId = Number(value);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
};

const createDefaultGroupForm = (): NewGroupFormState => ({
  groupName: "",
  description: "",
  status: "active",
  area: "",
  city: "Medellin",
  coverageRadiusKm: "3",
  petId: "",
  leaderName: currentUser.name,
  leaderPhone: currentUser.phone,
});

const VolunteerGroupsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState<SearchGroupDto[]>([]);
  const [groupsLoadError, setGroupsLoadError] = useState("");
  const [pets, setPets] = useState<PetOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<VolunteerCandidateDto[]>([]);
  const [memberSearchError, setMemberSearchError] = useState("");
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [activeGroup, setActiveGroup] = useState<SearchGroupDto | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState<NewGroupFormState>(createDefaultGroupForm);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [leavingGroupId, setLeavingGroupId] = useState<number | null>(null);
  const [addingVolunteerId, setAddingVolunteerId] = useState<number | null>(null);
  const [removingVolunteerKey, setRemovingVolunteerKey] = useState<string | null>(null);
  const currentUserId = useMemo(getAuthenticatedUserId, []);

  const refreshGroups = useCallback(async () => {
    const persistedGroups = await fetchPersistedGroups();
    setGroups(persistedGroups);
    return persistedGroups;
  }, []);

  useEffect(() => {
    if (searchParams.get("create") !== "true") return;

    const petId = searchParams.get("petId") ?? "";
    setNewGroupForm((current) => ({ ...current, petId }));
    setIsCreateDialogOpen(true);

    const consumedParams = new URLSearchParams(searchParams);
    consumedParams.delete("create");
    consumedParams.delete("petId");
    setSearchParams(consumedParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [groupsResponse, petsResponse] = await Promise.allSettled([
          fetchPersistedGroups(),
          axios.get(buildApiUrl("/api/pets"), { headers }),
        ]);

        if (!cancelled && groupsResponse.status === "fulfilled") {
          setGroupsLoadError("");
          setGroups(groupsResponse.value);
        }
        if (!cancelled && groupsResponse.status === "rejected") {
          setGroups([]);
          setGroupsLoadError("No fue posible cargar los grupos reales desde el servidor.");
        }

        if (!cancelled && petsResponse.status === "fulfilled") {
          const petDtos = extractCollection(petsResponse.value.data).filter((dto: any) => isOwnedByCurrentUser(dto));

          setPets(
            petDtos.map((dto: any) => ({
              id: String(dto.id ?? ""),
              name: dto.name ?? `Pet ${dto.id ?? ""}`,
            }))
          );
        }
      } catch (error) {
        console.warn("Could not load real search groups from /api/search-groups.", error);
        if (!cancelled) {
          setGroups([]);
          setGroupsLoadError("No fue posible cargar los grupos reales desde el servidor.");
        }
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = memberSearch.trim();
    if (!activeGroup || query.length < 2) {
      setMemberSearchResults([]);
      setMemberSearchError("");
      setIsSearchingMembers(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingMembers(true);
      setMemberSearchError("");

      try {
        const response = await axios.get(buildApiUrl(searchGroupEndpoints.memberCandidates(activeGroup.id)), {
          headers: getAuthHeaders(),
          params: { q: query, page: 0, size: 20 },
          signal: abortController.signal,
        });
        const existingMemberIds = new Set(activeGroup.volunteers.map((volunteer) => volunteer.userId));
        const users = extractCollection(response.data)
          .map((dto: any): VolunteerCandidateDto => ({
            userId: Number(dto.userId ?? dto.id ?? 0),
            name: dto.name ?? dto.fullName ?? dto.username ?? "Unknown volunteer",
            email: dto.email ?? "",
          }))
          .filter((user: VolunteerCandidateDto) => user.userId > 0 && !existingMemberIds.has(user.userId));
        setMemberSearchResults(users);
      } catch (error: any) {
        if (error?.code === "ERR_CANCELED") return;
        console.error("Error searching registered users:", error);
        setMemberSearchResults([]);
        setMemberSearchError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Registered users could not be searched."
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearchingMembers(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [activeGroup, memberSearch]);

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

  const handleJoinGroup = async (groupId: number) => {
    setJoiningGroupId(groupId);
    try {
      await axios.post(
        buildApiUrl(searchGroupEndpoints.join(groupId)),
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      const persistedGroups = await refreshGroups();
      setActiveGroup((current) =>
        current?.id === groupId
          ? persistedGroups.find((group) => group.id === groupId) ?? null
          : current
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

  const handleLeaveGroup = async (groupId: number) => {
    if (!window.confirm("Are you sure you want to leave this volunteer group?")) return;

    setLeavingGroupId(groupId);
    try {
      await axios.post(
        buildApiUrl(searchGroupEndpoints.leave(groupId)),
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      await refreshGroups();
      setActiveGroup((current) => (current?.id === groupId ? null : current));
    } catch (error: any) {
      console.error(`Error leaving search group ${groupId}:`, error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Unknown error";
      alert(`Failed to leave the volunteer group. ${message}`);
    } finally {
      setLeavingGroupId(null);
    }
  };

  const handleRemoveVolunteer = async (groupId: number, userId: number, volunteerName: string) => {
    if (!window.confirm(`Remove ${volunteerName} from this volunteer group?`)) return;

    const volunteerKey = `${groupId}:${userId}`;
    setRemovingVolunteerKey(volunteerKey);
    try {
      await axios.delete(
        buildApiUrl(searchGroupEndpoints.removeVolunteer(groupId, userId)),
        { headers: getAuthHeaders() }
      );
      const persistedGroups = await refreshGroups();
      setActiveGroup((current) =>
        current?.id === groupId
          ? persistedGroups.find((group) => group.id === groupId) ?? null
          : current
      );
    } catch (error: any) {
      console.error(`Error removing volunteer ${userId} from search group ${groupId}:`, error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Unknown error";
      alert(`Failed to remove the volunteer. ${message}`);
    } finally {
      setRemovingVolunteerKey(null);
    }
  };

  const handleAddVolunteer = async (userId: number) => {
    if (!activeGroup) return;
    if (!Number.isInteger(userId) || userId <= 0) return;

    const groupId = activeGroup.id;
    setAddingVolunteerId(userId);
    try {
      await axios.post(
        buildApiUrl(searchGroupEndpoints.addVolunteer(groupId, userId)),
        {},
        { headers: getAuthHeaders() }
      );
      setMemberSearchResults((current) => current.filter((user) => user.userId !== userId));
      try {
        const persistedGroups = await refreshGroups();
        setActiveGroup(persistedGroups.find((group) => group.id === groupId) ?? null);
      } catch (refreshError) {
        console.error("Volunteer added, but search groups could not be refreshed:", refreshError);
        alert("The volunteer was added, but the group list could not be refreshed. Reload the page to see the latest data.");
      }
    } catch (error: any) {
      console.error(`Error adding volunteer ${userId} to search group ${groupId}:`, error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message ||
        "Unknown error";
      alert(`Failed to add the volunteer. ${message}`);
    } finally {
      setAddingVolunteerId(null);
    }
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
      leaderName,
      leaderPhone,
      volunteerUserIds: currentUserId ? [currentUserId] : [],
    };

    setIsCreatingGroup(true);
    try {
      await axios.post(buildApiUrl(searchGroupEndpoints.create), payload, {
        headers: getAuthHeaders(),
      });
      setIsCreateDialogOpen(false);
      setNewGroupForm(createDefaultGroupForm());
      try {
        await refreshGroups();
      } catch (refreshError) {
        console.error("Search group created, but groups could not be refreshed:", refreshError);
        alert("The volunteer group was created, but the list could not be refreshed. Reload the page to see it.");
      }
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

      {!filteredGroups.length && (
        <Box
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 3,
            textAlign: "center",
            bgcolor: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(226,232,240,0.95)",
          }}
        >
          <Typography sx={{ color: "#64748b", fontWeight: 700 }}>
            {groupsLoadError || (groups.length ? "No hay grupos que coincidan con la búsqueda." : "No hay grupos reales registrados todavía.")}
          </Typography>
        </Box>
      )}

      <Stack spacing={2}>
        {filteredGroups.map((group) => {
          const hasJoined = currentUserId != null && group.volunteers.some((volunteer) => volunteer.userId === currentUserId);
          const canManageMembers = currentUserId != null && group.createdById === currentUserId;

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
                  {hasJoined && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={leavingGroupId === group.id ? <CircularProgress size={18} /> : <LogoutIcon />}
                      disabled={leavingGroupId === group.id}
                      onClick={() => handleLeaveGroup(group.id)}
                      sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                    >
                      {leavingGroupId === group.id ? "Leaving..." : "Leave group"}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddAltIcon />}
                    onClick={() => {
                      setActiveGroup(group);
                      setMemberSearch("");
                      setMemberSearchResults([]);
                      setMemberSearchError("");
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
                      {canManageMembers && <TableCell sx={{ fontWeight: 900, width: 56 }} />}
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
                        {canManageMembers && (
                          <TableCell align="right">
                            {volunteer.userId !== currentUserId && (
                              <Tooltip title="Remove from group">
                                <span>
                                  <IconButton
                                    color="error"
                                    aria-label={`Remove ${volunteer.name} from group`}
                                    disabled={removingVolunteerKey === `${group.id}:${volunteer.userId}`}
                                    onClick={() => handleRemoveVolunteer(group.id, volunteer.userId, volunteer.name)}
                                  >
                                    {removingVolunteerKey === `${group.id}:${volunteer.userId}` ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <PersonRemoveIcon />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </TableCell>
                        )}
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
            {activeGroup ? `Search registered users to add to ${activeGroup.groupName}.` : ""}
          </Typography>
          <TextField
            label="Name or email"
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
            fullWidth
            size="small"
            autoFocus
            error={Boolean(memberSearchError)}
            helperText={memberSearchError || "Enter at least 2 characters."}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: isSearchingMembers ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : undefined,
            }}
          />
          <Stack spacing={1}>
            {memberSearchResults.map((volunteer) => (
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: "#06b6d4" }}>
                    {volunteer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: "#0f172a" }}>
                      {volunteer.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", overflowWrap: "anywhere" }}>
                      {volunteer.email}
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="Add to group">
                  <span>
                    <IconButton
                      aria-label={`Add ${volunteer.name} to group`}
                      onClick={() => handleAddVolunteer(volunteer.userId)}
                      disabled={addingVolunteerId !== null}
                    >
                      {addingVolunteerId === volunteer.userId ? <CircularProgress size={20} /> : <PersonAddAltIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
            {memberSearch.trim().length >= 2 && !isSearchingMembers && !memberSearchError && memberSearchResults.length === 0 && (
              <Typography variant="body2" sx={{ py: 2, textAlign: "center", color: "#64748b" }}>
                No available registered users found.
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
