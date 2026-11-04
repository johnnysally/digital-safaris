import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { useAuthStore } from '../store';

type Handler = (...args: unknown[]) => void;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', 'customer');
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, accessToken]);

  const on = (event: string, handler: Handler) => {
    socketRef.current?.on(event, handler);
  };

  const off = (event: string, handler: Handler) => {
    socketRef.current?.off(event, handler);
  };

  const emit = (event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  };

  return { connected, socket: socketRef.current, on, off, emit };
}

export default useSocket;