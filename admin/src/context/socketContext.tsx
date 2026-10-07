import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./authContext";
import { SOCKET_URL } from "../utils/constants";

type EventHandler = (...args: unknown[]) => void;

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  on: (event: string, handler: EventHandler) => void;
  off: (event: string, handler: EventHandler) => void;
  emit: (event: string, ...args: unknown[]) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // Tear down on logout
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
      s.emit("join", "admin");
    });
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setConnected(false));

    return () => {
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, accessToken]);

  const on = useCallback(
    (event: string, handler: EventHandler) => {
      socketRef.current?.on(event, handler);
    },
    []
  );

  const off = useCallback((event: string, handler: EventHandler) => {
    socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({ socket, connected, on, off, emit }),
    [socket, connected, on, off, emit]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within <SocketProvider>");
  return ctx;
}

export default SocketContext;