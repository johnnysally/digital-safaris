import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/generateToken.js";
import { env } from "./env.js";
import logger from "../utils/logger.js";

let io = null;

const defaultAllowed = [env.clientUrl, env.adminUrl, env.partnerUrl, env.websiteUrl]
  .filter(Boolean);
const allowed = env.corsOrigins.length ? env.corsOrigins : defaultAllowed;

const ROOM_RULES = {
  customer: (id) => [`customer:${id}`],
  admin: () => ["admin"],
  restaurant: (id) => [`restaurant:${id}`],
  transport: (id) => [`transport:${id}`, "transport:available"],
  accommodation: (id) => [`accommodation:${id}`],
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowed,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    logger.info("[socket] handshake", {
      origin: socket.handshake.headers.origin,
      hasToken: Boolean(token),
      tokenPreview: token ? `${String(token).slice(0, 10)}…` : null,
    });

    if (!token) {
      logger.warn("[socket] REJECT: no token in handshake.auth");
      return next(new Error("AUTH_REQUIRED"));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.id;
      socket.data.userType = decoded.type;
      logger.info("[socket] authenticated", {
        userId: decoded.id,
        userType: decoded.type,
      });
      next();
    } catch (err) {
      logger.warn("[socket] REJECT: bad token", { error: err.message });
      next(new Error("AUTH_INVALID"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, userType } = socket.data;
    logger.info("[socket] connected", {
      socketId: socket.id,
      userId,
      userType,
    });

    const autoRooms = ROOM_RULES[userType]?.(userId) ?? [];
    for (const room of autoRooms) socket.join(room);

    socket.on("join", (room) => {
      if (typeof room !== "string" || room.length > 64) return;
      if (autoRooms.includes(room)) {
        socket.join(room);
        logger.debug("[socket] joined room", { userId, room });
      } else {
        logger.warn("[socket] rejected room join", { userId, room });
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info("[socket] disconnected", { socketId: socket.id, reason });
    });
  });

  logger.info("Socket.IO handler registered", { allowedOrigins: allowed });
  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

export { initSocket, getIO };