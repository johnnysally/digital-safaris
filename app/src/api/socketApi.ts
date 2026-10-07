import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "../utils/constants";

export interface SocketAuth {
  token: string;
}

export function createSocket({ token }: SocketAuth): Socket {
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    socket.emit("join", "customer");
  });

  return socket;
}

export default createSocket;