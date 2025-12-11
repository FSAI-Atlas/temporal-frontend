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
    // Only clear token for auth endpoint failures, let queries handle 401 gracefully
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (isAuthEndpoint && typeof window !== "undefined") {
        localStorage.removeItem("token");
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

// Tenant/Workspace API
export const tenantApi = {
  get: () => api.get("/tenant"),
  create: (data: { name: string; description?: string }) => api.post("/tenant", data),
  update: (data: { name?: string; description?: string }) => api.patch("/tenant", data),
  getMembers: (params?: { page?: number; limit?: number }) =>
    api.get("/tenant/members", { params }),
  inviteMember: (data: { email: string; name: string; role: "admin" | "member" | "viewer" }) =>
    api.post("/tenant/members/invite", data),
  updateMemberRole: (memberId: string, role: "admin" | "member" | "viewer") =>
    api.patch(`/tenant/members/${memberId}/role`, { role }),
  removeMember: (memberId: string) => api.delete(`/tenant/members/${memberId}`),
  getStats: () => api.get("/tenant/stats"),
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

// Executions API
export const executionsApi = {
  list: (params?: { 
    workflowId?: string; 
    workflowType?: string; 
    status?: string;
    pageSize?: number;
    namespace?: string;
  }) => api.get("/executions", { params }),
  get: (workflowId: string, runId?: string) =>
    api.get(`/executions/${workflowId}`, { params: { runId } }),
  getHistory: (workflowId: string, runId?: string) =>
    api.get(`/executions/${workflowId}/history`, { params: { runId } }),
  getResult: (workflowId: string, runId?: string) =>
    api.get(`/executions/${workflowId}/result`, { params: { runId } }),
  query: (workflowId: string, queryType: string, args?: any[], runId?: string) =>
    api.post(`/executions/${workflowId}/query`, { queryType, args }, { params: { runId } }),
  signal: (workflowId: string, signalName: string, args?: any[], runId?: string) =>
    api.post(`/executions/${workflowId}/signal`, { signalName, args }, { params: { runId } }),
  cancel: (workflowId: string, runId?: string) =>
    api.post(`/executions/${workflowId}/cancel`, {}, { params: { runId } }),
  terminate: (workflowId: string, reason?: string, runId?: string) =>
    api.post(`/executions/${workflowId}/terminate`, { reason }, { params: { runId } }),
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

// Settings API
export const settingsApi = {
  getProfile: () => api.get("/settings/profile"),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.patch("/settings/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/settings/password", data),
  getPreferences: () => api.get("/settings/preferences"),
  deleteAccount: () => api.delete("/settings/account"),
};
