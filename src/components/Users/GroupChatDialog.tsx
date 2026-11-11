import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { buildApiUrl, searchGroupEndpoints } from "../../config/runtime";
import { getCurrentUserId } from "../../services/auth.ts";

type GroupChatDialogProps = {
  groupId: number;
  groupName: string;
  onClose: () => void;
};

type GroupChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
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

const mapChatMessage = (dto: any, index: number): GroupChatMessage => {
  return {
    id: String(dto.id ?? dto.messageId ?? `${dto.createdAt ?? Date.now()}-${index}`),
    senderId: String(dto.senderId ?? dto.sender?.id ?? dto.userId ?? dto.user?.id ?? ""),
    senderName: dto.senderName ?? dto.sender?.name ?? dto.userName ?? dto.user?.name ?? "Group member",
    text: dto.body ?? dto.text ?? dto.content ?? dto.message ?? "",
    createdAt: dto.createdAt ?? dto.sentAt ?? dto.timestamp ?? new Date().toISOString(),
  };
};

const formatMessageDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
};

const GroupChatDialog: React.FC<GroupChatDialogProps> = ({ groupId, groupName, onClose }) => {
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
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

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text) return;

    setIsSending(true);
    try {
      await axios.post(buildApiUrl(searchGroupEndpoints.messages(groupId)), { body: text }, {
        headers: getAuthHeaders(),
      });
      setMessageText("");
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
                    </Paper>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {error && <Typography sx={{ color: "#b91c1c", fontSize: 13 }}>{error}</Typography>}

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
      <DialogActions sx={{ px: 2, pb: 2, justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} startIcon={<CloseIcon />} sx={{ textTransform: "none" }}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={isSending || !messageText.trim()}
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
