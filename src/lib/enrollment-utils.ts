/** TiDB/MySQL ENUM values sometimes arrive with unexpected casing — normalize for UI logic. */
export function normalizeEnrollmentPaymentStatus(raw: unknown): "Paid" | "Pending" | "Refunded" {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "pending") return "Pending";
  if (s === "refunded") return "Refunded";
  return "Pending";
}

export function enrollmentSlugMatches(stored: string, routeSlug: string): boolean {
  return stored.trim().toLowerCase() === routeSlug.trim().toLowerCase();
}

export function enrollmentItemTypeMatches(
  stored: unknown,
  expected: "course" | "event",
): boolean {
  return String(stored ?? "").trim().toLowerCase() === expected;
}
