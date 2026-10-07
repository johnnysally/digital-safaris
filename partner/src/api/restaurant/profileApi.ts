import axios, { unwrap } from "../axios";
import type { ProfileResponse, RestaurantPartner } from "../../types";

const profileApi = {
  async get(): Promise<ProfileResponse<RestaurantPartner>> {
    const res = await axios.get("/restaurant/profile");
    return unwrap<ProfileResponse<RestaurantPartner>>(res.data);
  },

  async update(
    payload: Partial<RestaurantPartner>
  ): Promise<RestaurantPartner> {
    const res = await axios.patch("/restaurant/profile", payload);
    return unwrap<RestaurantPartner>(res.data);
  },

  async toggleOpen(
    isOpen: boolean
  ): Promise<{ isOpen: boolean; isAcceptingOrders: boolean }> {
    const res = await axios.post("/restaurant/profile/toggle-open", {
      isOpen,
    });
    return unwrap<{ isOpen: boolean; isAcceptingOrders: boolean }>(res.data);
  },

  async uploadLogo(
    file: File
  ): Promise<{ logo: string; publicId?: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post("/restaurant/profile/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<{ logo: string; publicId?: string }>(res.data);
  },

  async uploadCover(
    file: File
  ): Promise<{ coverImage: string; publicId?: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post("/restaurant/profile/cover", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<{ coverImage: string; publicId?: string }>(res.data);
  },
};

export default profileApi;