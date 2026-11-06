const collectionKeys = ["content", "items", "pets", "results", "rows", "payload", "records", "data"];

/**
 * API deployments return pet collections in several compatible envelopes
 * (array, content/items, or a nested data/payload response). Keep the page
 * selectors independent of that transport detail.
 */
export const extractPetDtos = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  for (const key of collectionKeys) {
    const nested = extractPetDtos(record[key]);
    if (nested.length) return nested;
  }

  return [];
};
