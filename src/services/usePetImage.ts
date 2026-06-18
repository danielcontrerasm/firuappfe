import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/runtime";

const blobUrlCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string | undefined>>();

export const petImageEndpoint = (petId?: string | number) =>
  petId ? buildApiUrl(`/api/pets/${petId}/image`) : undefined;

const shouldUseProtectedImage = (petId?: string | number) =>
  Boolean(petId && !String(petId).startsWith("mock-"));

const fetchProtectedPetImage = async (petId: string) => {
  const cached = blobUrlCache.get(petId);
  if (cached) return cached;

  const pending = pendingRequests.get(petId);
  if (pending) return pending;

  const request = (async () => {
    try {
      const endpoint = petImageEndpoint(petId);
      if (!endpoint) return undefined;

      const token = localStorage.getItem("token");
      const response = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) return undefined;

      const contentType = response.headers.get("content-type") || "";
      const blob = await response.blob();

      if (!contentType.startsWith("image/") || blob.size < 100) return undefined;

      const objectUrl = URL.createObjectURL(blob);
      blobUrlCache.set(petId, objectUrl);
      return objectUrl;
    } finally {
      pendingRequests.delete(petId);
    }
  })();

  pendingRequests.set(petId, request);
  return request;
};

export const loadPetImage = (petId?: string | number) => {
  if (!shouldUseProtectedImage(petId)) return Promise.resolve(undefined);
  return fetchProtectedPetImage(String(petId));
};

export const usePetImage = (petId?: string | number, fallbackSrc?: string) => {
  const [src, setSrc] = useState<string | undefined>(fallbackSrc);

  useEffect(() => {
    let cancelled = false;
    const normalizedPetId = petId != null ? String(petId) : undefined;

    setSrc(fallbackSrc);

    if (!shouldUseProtectedImage(normalizedPetId)) {
      return () => {
        cancelled = true;
      };
    }

    fetchProtectedPetImage(normalizedPetId).then((protectedSrc) => {
      if (!cancelled && protectedSrc) {
        setSrc(protectedSrc);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fallbackSrc, petId]);

  return src;
};
