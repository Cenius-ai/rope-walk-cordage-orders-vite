import { statusLabel } from "../lib/format.js";

const TONES = {
  draft: "neutral",
  confirmed: "accent",
  complete: "ok",
  planned: "neutral",
  in_progress: "warn",
  done: "ok",
  in_stock: "ok",
  opened: "warn",
  used: "muted",
};

export default function StatusPill({ status }) {
  return (
    <span className="pill" data-tone={TONES[status] || "neutral"}>
      <span className="pill__dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
