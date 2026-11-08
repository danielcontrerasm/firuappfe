import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
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
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SendIcon from "@mui/icons-material/Send";
import { buildApiUrl, buildAssetUrl, searchGroupEndpoints } from "../../config/runtime";
import { getCurrentUserId } from "../../services/auth.ts";

type GroupChatDialogProps = {
  groupId: number;
  groupName: string;
  onClose: () => void;
};

type ChatAttachment = {
  id: string;
  name: string;
  url: string;
  contentType: string;
};

type ChatLocation = {
  latitude: number;
  longitude: number;
};

type GroupChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  attachments: ChatAttachment[];
  location?: ChatLocation;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const extractCollection = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  for (const key of ["content", "items", "messages", "results", "rows", "payload", "records", "data"]) {
    const nested = extractCollection(data[key]);
    if (nested.length) return nested;
  }

  return [];
};

const normalizeMediaUrl = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "";
  const trimmed = value.trim();
  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  return buildAssetUrl(trimmed) ?? trimmed;
};

const mapChatMessage = (dto: any, index: number): GroupChatMessage => {
  const attachmentDtos = Array.isArray(dto.attachments)
    ? dto.attachments
    : Array.isArray(dto.files)
      ? dto.files
      : Array.isArray(dto.media)
        ? dto.media
        : [];
  const location = dto.location ?? dto.sharedLocation;
  const latitude = Number(location?.latitude ?? dto.latitude);
  const longitude = Number(location?.longitude ?? dto.longitude);

  return {
    id: String(dto.id ?? dto.messageId ?? `${dto.createdAt ?? Date.now()}-${index}`),
    senderId: String(dto.senderId ?? dto.sender?.id ?? dto.userId ?? dto.user?.id ?? ""),
    senderName: dto.senderName ?? dto.sender?.name ?? dto.userName ?? dto.user?.name ?? "Group member",
    text: dto.text ?? dto.content ?? dto.message ?? dto.body ?? "",
    createdAt: dto.createdAt ?? dto.sentAt ?? dto.timestamp ?? new Date().toISOString(),
    attachments: attachmentDtos
      .map((attachment: any, attachmentIndex: number): ChatAttachment => ({
        id: String(attachment.id ?? `${index}-${attachmentIndex}`),
        name: attachment.name ?? attachment.fileName ?? attachment.originalName ?? "Attachment",
        url: normalizeMediaUrl(attachment.url ?? attachment.downloadUrl ?? attachment.fileUrl ?? attachment.path),
        contentType: attachment.contentType ?? attachment.mimeType ?? attachment.type ?? "",
      }))
      .filter((attachment: ChatAttachment) => attachment.url),
    location:
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { latitude, longitude }
        : undefined,
  };
};

const formatMessageDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
};

const isImage = (attachment: ChatAttachment) => attachment.contentType.startsWith("image/");
const isVideo = (attachment: ChatAttachment) => attachment.contentType.startsWith("video/");

const GroupChatDialog: React.FC<GroupChatDialogProps> = ({ groupId, groupName, onClose }) => {
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingLocation, setPendingLocation] = useState<ChatLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");
  const currentUserId = useMemo(() => getCurrentUserId() ?? "", []);

  const loadMessages = useCallback(async () => {
    try {
      const response = await axios.get(buildApiUrl(searchGroupEndpoints.messages(groupId)), {
        headers: getAuthHeaders(),
      });
      setMessages(extractCollection(response.data).map(mapChatMessage));
      setError("");
    } catch (loadError: any) {
      console.error(`Error loading messages for search group ${groupId}:`, loadError);
      setError(
        loadError?.response?.data?.message ||
          loadError?.response?.data?.error ||
          "No fue posible cargar el chat del grupo."
      );
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadMessages();
    const intervalId = window.setInterval(loadMessages, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadMessages]);

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    setPendingFiles((current) => [...current, ...selectedFiles]);
    event.target.value = "";
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite compartir la ubicación.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPendingLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
        setError("");
      },
      () => {
        setIsLocating(false);
        setError("No fue posible obtener tu ubicación.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text && pendingFiles.length === 0 && !pendingLocation) return;

    const payload = {
      text,
      content: text,
      location: pendingLocation,
      latitude: pendingLocation?.latitude,
      longitude: pendingLocation?.longitude,
    };

    setIsSending(true);
    try {
      let body: FormData | typeof payload = payload;
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        formData.append("message", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        pendingFiles.forEach((file) => formData.append("files", file));
        body = formData;
      }

      await axios.post(buildApiUrl(searchGroupEndpoints.messages(groupId)), body, {
        headers: getAuthHeaders(),
      });
      setMessageText("");
      setPendingFiles([]);
      setPendingLocation(null);
      await loadMessages();
    } catch (sendError: any) {
      console.error(`Error sending message to search group ${groupId}:`, sendError);
      setError(
        sendError?.response?.data?.message ||
          sendError?.response?.data?.error ||
          "No fue posible enviar el mensaje."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900, color: "#0f172a" }}>
        Chat · {groupName}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, p: { xs: 1.5, sm: 2 } }}>
        <Box
          sx={{
            minHeight: 360,
            maxHeight: "55vh",
            overflowY: "auto",
            p: 1.5,
            borderRadius: 2,
            bgcolor: "#f8fafc",
            border: "1px solid rgba(226,232,240,0.95)",
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "grid", placeItems: "center", height: 300 }}>
              <CircularProgress size={28} />
            </Box>
          ) : messages.length === 0 ? (
            <Typography sx={{ py: 12, textAlign: "center", color: "#64748b" }}>
              Aún no hay mensajes. Comparte la primera actualización del grupo.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {messages.map((message) => {
                const ownMessage = currentUserId !== "" && message.senderId === currentUserId;
                return (
                  <Box key={message.id} sx={{ display: "flex", justifyContent: ownMessage ? "flex-end" : "flex-start" }}>
                    <Paper
                      elevation={0}
                      sx={{
                        maxWidth: "85%",
                        p: 1.25,
                        borderRadius: 2.5,
                        bgcolor: ownMessage ? "#dcfce7" : "#ffffff",
                        border: "1px solid rgba(226,232,240,0.95)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: 12, bgcolor: ownMessage ? "#16a34a" : "#0f172a" }}>
                          {message.senderName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: "#0f172a" }}>
                          {ownMessage ? "Tú" : message.senderName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          {formatMessageDate(message.createdAt)}
                        </Typography>
                      </Box>
                      {message.text && <Typography sx={{ whiteSpace: "pre-wrap", color: "#334155" }}>{message.text}</Typography>}
                      {message.location && (
                        <Button
                          component="a"
                          href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          startIcon={<LocationOnIcon />}
                          sx={{ mt: 0.5, px: 0, textTransform: "none" }}
                        >
                          Ver ubicación compartida
                        </Button>
                      )}
                      <Stack spacing={0.75} sx={{ mt: message.text || message.location ? 0.75 : 0 }}>
                        {message.attachments.map((attachment) => (
                          <Box key={attachment.id}>
                            {isImage(attachment) ? (
                              <Box component="img" src={attachment.url} alt={attachment.name} sx={{ maxWidth: "100%", maxHeight: 220, borderRadius: 1.5 }} />
                            ) : isVideo(attachment) ? (
                              <Box component="video" src={attachment.url} controls sx={{ maxWidth: "100%", maxHeight: 220, borderRadius: 1.5 }} />
                            ) : (
                              <Button component="a" href={attachment.url} target="_blank" rel="noreferrer" size="small" startIcon={<AttachFileIcon />} sx={{ textTransform: "none" }}>
                                {attachment.name}
                              </Button>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {error && <Typography sx={{ color: "#b91c1c", fontSize: 13 }}>{error}</Typography>}

        {pendingFiles.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {pendingFiles.map((file, index) => (
              <Chip
                key={`${file.name}-${file.size}-${index}`}
                label={file.name}
                onDelete={() => setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                size="small"
              />
            ))}
          </Box>
        )}

        {pendingLocation && (
          <Chip
            icon={<LocationOnIcon />}
            label={`Ubicación: ${pendingLocation.latitude.toFixed(5)}, ${pendingLocation.longitude.toFixed(5)}`}
            onDelete={() => setPendingLocation(null)}
            color="success"
            variant="outlined"
          />
        )}

        <TextField
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Escribe un mensaje…"
          multiline
          minRows={2}
          maxRows={5}
          fullWidth
          disabled={isSending}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Adjuntar imágenes, videos o documentos">
            <IconButton component="label" disabled={isSending} aria-label="Adjuntar archivos">
              <AttachFileIcon />
              <input
                hidden
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleSelectFiles}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Compartir ubicación">
            <span>
              <IconButton onClick={handleShareLocation} disabled={isSending || isLocating} aria-label="Compartir ubicación">
                {isLocating ? <CircularProgress size={22} /> : <LocationOnIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} startIcon={<CloseIcon />} sx={{ textTransform: "none" }}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={isSending || (!messageText.trim() && pendingFiles.length === 0 && !pendingLocation)}
            startIcon={isSending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            sx={{ textTransform: "none", fontWeight: 900 }}
          >
            {isSending ? "Enviando…" : "Enviar"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default GroupChatDialog;
