// Central API client — one place for base URL, auth header, and error handling.
//
// We always call the API with a relative path ("/api/...").
// - Local dev: Vite proxies /api -> http://localhost:4000 (see vite.config.ts).
// - Production: Vercel rewrites /api -> the Render backend (see client/vercel.json).
// This keeps the browser same-origin, so no CORS handling is needed on the client.
const BASE_URL = "";

export const CATEGORIES = [
  "PRODUCT",
  "BUG",
  "FEATURE_REQUEST",
  "UI_UX",
  "SUPPORT",
  "BILLING",
  "OTHER",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  PRODUCT: "Product",
  BUG: "Bug",
  FEATURE_REQUEST: "Feature Request",
  UI_UX: "UI / UX",
  SUPPORT: "Support",
  BILLING: "Billing",
  OTHER: "Other",
};

export interface Feedback {
  id: string;
  category: Category;
  comment: string;
  rating: number | null;
  email: string | null;
  createdAt: string;
}

export interface FeedbackList {
  items: Feedback[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Analytics {
  total: number;
  categoryDistribution: { category: Category; count: number }[];
  recent: Feedback[];
  averageRating: number | null;
  trend: { date: string; count: number }[];
}

export class ApiError extends Error {
  status: number;
  details?: { field: string; message: string }[];
  constructor(status: number, message: string, details?: ApiError["details"]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// --- auth token helpers -----------------------------------------------------

const TOKEN_KEY = "acowale_admin_token";

export const auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
  get isLoggedIn() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
};

// --- fetch wrapper ----------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (withAuth && auth.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let details;
    try {
      const body = await res.json();
      message = body.error || message;
      details = body.details;
    } catch {
      /* non-JSON error body */
    }
    // Expired/invalid token → force re-login.
    if (res.status === 401 && withAuth) {
      auth.clear();
    }
    throw new ApiError(res.status, message, details);
  }

  return res.json();
}

// --- API methods ------------------------------------------------------------

export const api = {
  submitFeedback(data: {
    category: Category;
    comment: string;
    rating?: number;
    email?: string;
  }) {
    return request<{ id: string; createdAt: string }>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(email: string, password: string) {
    return request<{ token: string; admin: { email: string; name: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
  },

  listFeedback(params: {
    category?: Category | "";
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return request<FeedbackList>(`/api/feedback?${qs}`, {}, true);
  },

  analytics() {
    return request<Analytics>("/api/analytics", {}, true);
  },
};
