import axios, { unwrap } from "../axios";

const uploadApi = {
  async uploadImage(
    file: File,
    folder = "accommodation/properties",
  ): Promise<{ url: string; publicId?: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);

    const res = await axios.post("/public/upload/single", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const payload = unwrap<{ url?: string; secure_url?: string; publicId?: string; public_id?: string }>(
      res.data,
    );

    const url = payload?.url ?? payload?.secure_url ?? "";
    const publicId = payload?.publicId ?? payload?.public_id;

    if (!url) {
      throw new Error("Upload succeeded but the server response did not include a URL.");
    }

    return { url, publicId };
  },
};

export default uploadApi;