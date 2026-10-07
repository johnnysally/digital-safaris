import axios, { unwrap } from "../axios";
import type { ProfileResponse, TransportPartner } from "../../types";

const profileApi = {
  async get(): Promise<ProfileResponse<TransportPartner>> {
    const res = await axios.get("/transport/profile");
    return unwrap<ProfileResponse<TransportPartner>>(res.data);
  },

  async update(
    payload: Partial<TransportPartner>
  ): Promise<TransportPartner> {
    const res = await axios.patch("/transport/profile", payload);
    return unwrap<TransportPartner>(res.data);
  },

  async goOnline(): Promise<{ isOnline: boolean; isAvailable: boolean }> {
    const res = await axios.post("/transport/profile/online");
    return unwrap<{ isOnline: boolean; isAvailable: boolean }>(res.data);
  },

  async goOffline(): Promise<{ isOnline: boolean; isAvailable: boolean }> {
    const res = await axios.post("/transport/profile/offline");
    return unwrap<{ isOnline: boolean; isAvailable: boolean }>(res.data);
  },

  async uploadAvatar(
    file: File
  ): Promise<{ avatar: string; publicId?: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post("/transport/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<{ avatar: string; publicId?: string }>(res.data);
  },
};

export default profileApi;