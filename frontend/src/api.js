/**
 * The one fetch wrapper: bearer token, JSON in/out, field-level 422 mapping.
 * All calls are same-origin `/api/...`; Vite proxies them to the FastAPI service.
 */

const TOKEN_KEY = "ropewalk.token";

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage disabled (private mode) — the session then lasts one page view */
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

export class ApiError extends Error {
  constructor(message, { status = 0, fields = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

function mapFieldErrors(detail) {
  const fields = {};
  if (!Array.isArray(detail)) return fields;
  for (const item of detail) {
    if (!item || !Array.isArray(item.loc)) continue;
    const key = item.loc[item.loc.length - 1];
    if (typeof key === "string" && !fields[key]) {
      fields[key] = item.msg || "Invalid value";
    }
  }
  return fields;
}

export async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the ropewalk service. Check that the backend is running.",
      { status: 0 }
    );
  }

  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent("ropewalk:unauthorized"));
    throw new ApiError("Your session has expired. Sign in again.", { status: 401 });
  }

  if (response.status === 204) return null;

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const detail = data ? data.detail : null;
    const fields = mapFieldErrors(detail);
    let message = "Something went wrong. Please try again.";
    if (typeof detail === "string") message = detail;
    else if (Object.keys(fields).length) message = "Check the highlighted fields.";
    throw new ApiError(message, { status: response.status, fields });
  }

  return data;
}

export const api = {
  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => apiRequest("/auth/me"),
  updateProfile: (payload) => apiRequest("/auth/me", { method: "PATCH", body: payload }),

  overview: () => apiRequest("/overview"),

  orders: () => apiRequest("/orders"),
  order: (id) => apiRequest(`/orders/${id}`),
  createOrder: (payload) => apiRequest("/orders", { method: "POST", body: payload }),
  updateOrder: (id, payload) => apiRequest(`/orders/${id}`, { method: "PATCH", body: payload }),
  deleteOrder: (id) => apiRequest(`/orders/${id}`, { method: "DELETE" }),

  schedule: () => apiRequest("/schedule"),
  generateSchedule: () => apiRequest("/schedule/generate", { method: "POST" }),
  updateScheduleEntry: (id, payload) =>
    apiRequest(`/schedule/${id}`, { method: "PATCH", body: payload }),

  bales: () => apiRequest("/bales"),
  createBale: (payload) => apiRequest("/bales", { method: "POST", body: payload }),
  updateBale: (id, payload) => apiRequest(`/bales/${id}`, { method: "PATCH", body: payload }),
  deleteBale: (id) => apiRequest(`/bales/${id}`, { method: "DELETE" }),
};
