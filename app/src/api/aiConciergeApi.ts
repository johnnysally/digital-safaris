import axios, { unwrap } from "./axios";
import type { AiChatResponse } from "../types";

const aiConciergeApi = {
  async chat(payload: {
    message: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<AiChatResponse> {
    const res = await axios.post("/customer/ai-concierge/chat", payload);
    return unwrap<AiChatResponse>(res.data);
  },
};

export default aiConciergeApi;