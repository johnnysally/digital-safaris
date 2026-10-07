import axios, { unwrap } from "./axios";
import type { Backup } from "../types";

const backupApi = {
  async list(): Promise<Backup[]> {
    const res = await axios.get("/admin/backups");
    const body = unwrap<Backup[] | { backups: Backup[] }>(res.data);
    if (Array.isArray(body)) return body;
    return body.backups ?? [];
  },

  async create(): Promise<Backup> {
    const res = await axios.post("/admin/backups");
    return unwrap<Backup>(res.data);
  },

  async restore(filename: string): Promise<void> {
    await axios.post(`/admin/backups/${encodeURIComponent(filename)}/restore`);
  },

  async upload(file: File): Promise<Backup> {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post("/admin/backups/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<Backup>(res.data);
  },

  async download(filename: string): Promise<Blob> {
    const res = await axios.get(
      `/admin/backups/${encodeURIComponent(filename)}/download`,
      { responseType: "blob" }
    );
    return res.data as Blob;
  },

  async email(filename: string): Promise<void> {
    await axios.post(`/admin/backups/${encodeURIComponent(filename)}/email`);
  },

  async remove(filename: string): Promise<void> {
    await axios.delete(`/admin/backups/${encodeURIComponent(filename)}`);
  },
};

export default backupApi;