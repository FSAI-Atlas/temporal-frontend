import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string; tenantName?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// User/Tenant API
export const userApi = {
  getTenant: () => api.get("/user/tenant"),
  getUsers: () => api.get("/user/tenant/users"),
  getApiKeys: () => api.get("/user/api-keys"),
  createApiKey: (name: string) => api.post("/user/api-keys", { name }),
  deleteApiKey: (id: string) => api.delete(`/user/api-keys/${id}`),
  getApiKeySecret: (id: string) => api.get(`/user/api-keys/${id}/secret`),
};

// Workflows API
export const workflowsApi = {
  list: (params?: { page?: number; limit?: number; namespace?: string; name?: string }) =>
    api.get("/workflows", { params }),
  get: (id: string) => api.get(`/workflows/${id}`),
  getByName: (name: string) => api.get(`/workflows/name/${name}`),
  getVersions: (name: string) => api.get(`/workflows/name/${name}/versions`),
  getNamespaces: () => api.get("/workflows/namespaces"),
  deactivate: (id: string) => api.patch(`/workflows/${id}/deactivate`),
};

// HITL API
export const hitlApi = {
  getTasks: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get("/hitl/tasks", { params }),
  getPending: (params?: { page?: number; limit?: number }) =>
    api.get("/hitl/tasks/pending", { params }),
  getStats: () => api.get("/hitl/tasks/stats"),
  getTask: (id: string) => api.get(`/hitl/tasks/${id}`),
  decide: (id: string, data: { action: "approve" | "reject"; comment?: string }) =>
    api.post(`/hitl/tasks/${id}/decision`, data),
};

