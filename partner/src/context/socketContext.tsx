import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { createSocket } from "../api/socketApi";
import type { PartnerRole } from "../utils/constants";
import storage from "../utils/storage";

type SocketContextValue = {
	connect: (role: PartnerRole) => Socket;
	disconnect: (role: PartnerRole) => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
	const sockets = useRef(new Map<PartnerRole, { token: string; socket: Socket }>());

	const disconnect = useCallback((role: PartnerRole) => {
		sockets.current.get(role)?.socket.disconnect();
		sockets.current.delete(role);
	}, []);

	const connect = useCallback((role: PartnerRole) => {
		const token = storage.getAccessToken(role);
		if (!token) throw new Error(`Cannot connect ${role} socket without an access token`);

		const current = sockets.current.get(role);
		if (current?.token === token) {
			if (!current.socket.connected) current.socket.connect();
			return current.socket;
		}

		disconnect(role);
		const socket = createSocket({ token, role });
		sockets.current.set(role, { token, socket });
		socket.connect();
		return socket;
	}, [disconnect]);

	useEffect(() => () => {
		for (const { socket } of sockets.current.values()) socket.disconnect();
		sockets.current.clear();
	}, []);

	const value = useMemo(() => ({ connect, disconnect }), [connect, disconnect]);
	return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
	const context = useContext(SocketContext);
	if (!context) throw new Error("useSocket must be used within a SocketProvider");
	return context;
}

export function usePartnerSocket(role: PartnerRole) {
	const { connect, disconnect } = useSocket();

	useEffect(() => {
		connect(role);
		return () => disconnect(role);
	}, [connect, disconnect, role]);
}
