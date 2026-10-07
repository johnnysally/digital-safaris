import { io, type Socket } from "socket.io-client";
import { SOCKET_URL, type PartnerRole } from "../utils/constants";

interface CreateSocketOptions {
  token: string;
  role: PartnerRole;
}

export function createSocket({ token, role }: CreateSocketOptions): Socket {
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    socket.emit("join", role);
  });

  return socket;
}

export default createSocket;