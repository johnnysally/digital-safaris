import axios, { unwrap } from "../axios";
import type {
  ProfileResponse,
  AccommodationPartner,
} from "../../types";

const profileApi = {
  async get(): Promise<ProfileResponse<AccommodationPartner>> {
    const res = await axios.get("/accommodation/profile");
    return unwrap<ProfileResponse<AccommodationPartner>>(res.data);
  },

  async update(
    payload: Partial<AccommodationPartner>
  ): Promise<AccommodationPartner> {
    const res = await axios.patch("/accommodation/profile", payload);
    return unwrap<AccommodationPartner>(res.data);
  },

  async uploadLogo(
    file: File
  ): Promise<{ logo: string; publicId?: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post("/accommodation/profile/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<{ logo: string; publicId?: string }>(res.data);
  },

  async uploadCover(
    file: File
  ): Promise<{ coverImage: string; publicId?: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post("/accommodation/profile/cover", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<{ coverImage: string; publicId?: string }>(res.data);
  },
};

export default profileApi;