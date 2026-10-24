import { describe, expect, it } from "vitest";

import {
  fibreLabel,
  formatDate,
  formatDateTime,
  formatKg,
  formatMetres,
  formatMm,
  parseTimestamp,
  relativeTime,
  statusLabel,
} from "./format.js";

describe("metric formatting", () => {
  it("formats metres with a thousands separator and the unit", () => {
    expect(formatMetres(1740)).toBe("1,740 m");
    expect(formatMetres(220.5)).toBe("220.5 m");
  });

  it("formats kilograms and millimetres", () => {
    expect(formatKg(25.5)).toBe("25.5 kg");
    expect(formatMm(40)).toBe("40 mm");
  });

  it("never renders NaN for a missing number", () => {
    expect(formatMetres(undefined)).toBe("— m");
    expect(formatKg(null)).toBe("— kg");
  });
});

describe("timestamps", () => {
  it("treats a naive SQLite timestamp as UTC", () => {
    expect(parseTimestamp("2026-10-24T09:30:00").toISOString()).toBe(
      "2026-10-24T09:30:00.000Z"
    );
  });

  it("formats a human date and time", () => {
    expect(formatDate("2026-10-24T09:30:00")).toBe("24 Oct 2026");
    expect(formatDateTime("2026-10-24T09:30:00")).toBe("24 Oct 2026, 09:30");
  });

  it("humanises recent dates and clamps the future to Today", () => {
    const now = new Date("2026-10-24T12:00:00Z");
    expect(relativeTime("2026-10-24T09:00:00", now)).toBe("Today");
    expect(relativeTime("2026-10-23T09:00:00", now)).toBe("Yesterday");
    expect(relativeTime("2026-10-20T09:00:00", now)).toBe("4 days ago");
    expect(relativeTime("2026-12-01T09:00:00", now)).toBe("Today");
  });
});

describe("labels", () => {
  it("humanises enum values", () => {
    expect(statusLabel("in_progress")).toBe("In progress");
    expect(statusLabel("in_stock")).toBe("In stock");
    expect(statusLabel("done")).toBe("Done");
    expect(fibreLabel("hemp")).toBe("Hemp");
    expect(fibreLabel("sisal")).toBe("Sisal");
  });
});
