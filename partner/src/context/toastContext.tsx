import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ToastKind = "success" | "error";
type ToastMessage = { id: number; kind: ToastKind; message: string };
type ToastContextValue = { showToast: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const showToast = useCallback((message: string, kind: ToastKind = "success") => {
		const id = Date.now() + Math.random();
		setToasts((current) => [...current, { id, kind, message }]);
		window.setTimeout(() => {
			setToasts((current) => current.filter((toast) => toast.id !== id));
		}, 5000);
	}, []);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2" aria-live="polite" aria-atomic="false">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						role={toast.kind === "error" ? "alert" : "status"}
						className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${
							toast.kind === "error"
								? "border-[#e6bdb4] bg-[#fff1ed] text-[#8e443b]"
								: "border-[#d4bd91] bg-[#fff9ee] text-[#62461f]"
						}`}
					>
						{toast.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) throw new Error("useToast must be used within a ToastProvider");
	return context;
}
