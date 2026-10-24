// @vitest-environment jsdom
/**
 * Render smoke test: every gated screen mounts, fetches and paints real content
 * with no thrown error. The API is mocked at the fetch boundary.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./auth.jsx";

const USER = {
  id: 1,
  email: "cenius@cenius.ai",
  display_name: "Marta Ellery",
  ropewalk_name: "Ellery Ropewalk, Whitby",
  created_at: "2026-06-01T09:00:00",
};

const ORDER = {
  id: 1,
  customer: "Whitby Harbour Trust",
  fibre_type: "hemp",
  strand_count: 3,
  lay_direction: "Z",
  lay_length_mm: 40,
  diameter_mm: 24,
  length_m: 220,
  quantity: 2,
  total_length_m: 440,
  status: "confirmed",
  notes: "Mooring warps for the east pier.",
  created_at: "2026-09-28T09:00:00",
  updated_at: "2026-09-28T09:00:00",
  schedule: {
    id: 3,
    order_id: 1,
    sequence: 3,
    run_date: "2026-10-26",
    status: "planned",
    planned_length_m: 440,
  },
};

const RUN = {
  id: 3,
  order_id: 1,
  sequence: 3,
  run_date: "2026-10-26",
  status: "planned",
  planned_length_m: 440,
  customer: "Whitby Harbour Trust",
  fibre_type: "hemp",
  length_m: 220,
  quantity: 2,
  lay_direction: "Z",
};

const OVERVIEW = {
  active_orders: 7,
  draft_orders: 2,
  confirmed_orders: 5,
  complete_orders: 1,
  total_scheduled_m: 1740,
  next_runs: [RUN],
  recent_orders: [ORDER],
  bale_totals: {
    hemp: { count: 5, weight_kg: 156 },
    sisal: { count: 6, weight_kg: 143.4 },
  },
  hemp_bales: 6,
  sisal_bales: 6,
};

const BALES = {
  items: [
    {
      id: 1,
      bale_ref: "HEMP-1184",
      fibre_type: "hemp",
      weight_kg: 26.4,
      received_on: "2026-09-30",
      status: "in_stock",
    },
  ],
  totals: {
    hemp: { count: 1, weight_kg: 26.4 },
    sisal: { count: 0, weight_kg: 0 },
  },
  used_count: 0,
};

const ROUTES = [
  [/^\/api\/auth\/me$/, () => USER],
  [/^\/api\/overview$/, () => OVERVIEW],
  [/^\/api\/orders$/, () => ({ items: [ORDER], total: 1 })],
  [/^\/api\/orders\/1$/, () => ORDER],
  [/^\/api\/schedule$/, () => [RUN]],
  [/^\/api\/bales$/, () => BALES],
];

function jsonResponse(data, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

beforeEach(() => {
  window.localStorage.setItem("ropewalk.token", "test-token");
  global.fetch = vi.fn((url) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, "");
    for (const [pattern, handler] of ROUTES) {
      if (pattern.test(path)) return jsonResponse(handler());
    }
    return jsonResponse({ detail: "not found" }, 404);
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("signed-in screens render real content", () => {
  const cases = [
    ["/", "The walk as it stands"],
    ["/orders", "Orders"],
    ["/orders/new", "New cordage order"],
    ["/orders/1", "Whitby Harbour Trust"],
    ["/schedule", "Ropewalk schedule"],
    ["/stock", "Bale stock"],
    ["/profile", "Ropemaker profile"],
  ];

  for (const [path, heading] of cases) {
    it(`renders ${path}`, async () => {
      renderAt(path);
      const title = await screen.findByRole("heading", { level: 1, name: heading });
      expect(title).toBeTruthy();
      expect(screen.queryAllByRole("alert")).toHaveLength(0);
    });
  }

  it("shows the order spec and its run on the detail page", async () => {
    renderAt("/orders/1");
    expect(await screen.findByText("Rope lay & fibre spec")).toBeTruthy();
    expect(screen.getAllByText("440 m").length).toBeGreaterThan(0);
    expect(screen.getByText("Mooring warps for the east pier.")).toBeTruthy();
  });

  it("shows hemp and sisal totals on the stock ledger", async () => {
    renderAt("/stock");
    expect(await screen.findByText("Hemp in stock")).toBeTruthy();
    expect(screen.getByText("Sisal in stock")).toBeTruthy();
    expect(screen.getByText("HEMP-1184")).toBeTruthy();
  });
});

describe("sign-in card", () => {
  it("prints the demo credential and keeps the password masked", async () => {
    window.localStorage.clear();
    renderAt("/login");
    expect(await screen.findByText("cenius@cenius.ai")).toBeTruthy();
    expect(screen.getByText(/Demo:/)).toBeTruthy();
    const password = document.querySelector("input[type=password]");
    expect(password).toBeTruthy();
    expect(document.querySelector("button[type=submit]")).toBeTruthy();
    expect(document.querySelector("input[name=email]")).toBeTruthy();
  });

  it("redirects an anonymous visitor away from a gated route", async () => {
    window.localStorage.clear();
    renderAt("/orders");
    expect(await screen.findByRole("heading", { level: 1, name: /sign in to the ropewalk/i })).toBeTruthy();
  });
});
