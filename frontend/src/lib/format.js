/** Formatting helpers shared by every screen. Metric units only. */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const NUMBER = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? NUMBER.format(number) : "—";
}

export function formatMetres(value) {
  return `${formatNumber(value)} m`;
}

export function formatKg(value) {
  return `${formatNumber(value)} kg`;
}

export function formatMm(value) {
  return `${formatNumber(value)} mm`;
}

/** SQLite hands back naive UTC timestamps; parse them as UTC, never local. */
export function parseTimestamp(value) {
  if (!value) return null;
  const text = String(value);
  const withZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text}Z`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parseTimestamp(value);
  if (!date) return "—";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDateTime(value) {
  const date = parseTimestamp(value);
  if (!date) return "—";
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(value)}, ${hours}:${minutes}`;
}

/** Humanised "when", clamped so a future timestamp never reads "-1 days ago". */
export function relativeTime(value, now = new Date()) {
  const date = parseTimestamp(value);
  if (!date) return "—";
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((now.getTime() - date.getTime()) / dayMs);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
}

const STATUS_LABELS = {
  draft: "Draft",
  confirmed: "Confirmed",
  complete: "Complete",
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  in_stock: "In stock",
  opened: "Opened",
  used: "Used",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "—";
}

export function fibreLabel(fibre) {
  if (fibre === "hemp") return "Hemp";
  if (fibre === "sisal") return "Sisal";
  return "—";
}

export function initials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export const TODAY_ISO = () => new Date().toISOString().slice(0, 10);
