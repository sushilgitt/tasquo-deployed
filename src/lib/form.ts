import { z } from "zod";

/** Reads a trimmed string field from FormData ("" if missing). */
export function getString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Reads an optional field; empty strings become null. */
export function getOptional(fd: FormData, key: string): string | null {
  const v = getString(fd, key);
  return v === "" ? null : v;
}

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(200, "Name must be 200 characters or fewer");

export const uuidSchema = z.uuid();

// HTML <input type="date"> submits YYYY-MM-DD.
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

/** Returns a valid uuid or null, so bad URL params become 404s instead of DB errors. */
export function parseUuid(value: string): string | null {
  const r = uuidSchema.safeParse(value);
  return r.success ? r.data : null;
}
