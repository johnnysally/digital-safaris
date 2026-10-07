import axios, { unwrap, unwrapList } from "./axios";
import type { Admin, AdminRole, Paginated, ListParams } from "../types";

interface CreateAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: AdminRole;
}

interface SingleResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

const adminApi = {
  async list(params?: ListParams): Promise<Paginated<Admin>> {
    const res = await axios.get("/admin/admins", { params });
    return unwrapList<Admin>(res.data);
  },

  async create(payload: CreateAdminPayload): Promise<Admin> {
    const res = await axios.post<SingleResponse<{ admin: Admin }>>(
      "/admin/admins",
      payload
    );
    const body = unwrap<{ admin: Admin } | Admin>(res.data);
    return "admin" in (body as object)
      ? (body as { admin: Admin }).admin
      : (body as Admin);
  },

  async changeRole(id: string, role: AdminRole): Promise<Admin> {
    const res = await axios.post(`/admin/admins/${id}/role`, { role });
    return unwrap<Admin>(res.data);
  },

  async suspend(id: string, reason: string): Promise<Admin> {
    const res = await axios.post(`/admin/admins/${id}/suspend`, { reason });
    return unwrap<Admin>(res.data);
  },

  async reactivate(id: string): Promise<Admin> {
    const res = await axios.post(`/admin/admins/${id}/reactivate`);
    return unwrap<Admin>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/admin/admins/${id}`);
  },
};

export default adminApi;