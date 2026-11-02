import { io, type Socket } from "socket.io-client";
import { SOCKET_URL, type PartnerRole } from "../utils/constants";

interface CreateSocketOptions {
  token: string;
  role: PartnerRole;
}

export function createSocket({ token, role }: CreateSocketOptions): Socket {
  if (!token) {
    throw new Error(
      `[socketApi] Cannot open a ${role} socket without an access token.`,
    );
  }

  console.log(`%c[socketApi] connecting ${role} socket`, "color:#0a7", {
    url: SOCKET_URL,
    tokenPreview: `${token.slice(0, 12)}…${token.slice(-6)}`,
  });

  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log(`%c[socketApi] ${role} socket connected`, "color:#0a7", socket.id);
    socket.emit("join", role);
  });

  socket.on("connect_error", (err) => {
    console.error(`[socketApi] ${role} socket connect_error`, {
      message: err.message,
      name: err.name,
    });
  });

  socket.on("disconnect", (reason) => {
    console.warn(`[socketApi] ${role} socket disconnected`, { reason });
  });

  return socket;
}

export default createSocket;