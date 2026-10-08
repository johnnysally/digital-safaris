import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DrawerProps {
	open: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	side?: "left" | "right";
	children: ReactNode;
	className?: string;
}

export function Drawer({ open, onClose, title, description, side = "right", children, className = "" }: DrawerProps) {
	useEffect(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [open, onClose]);

	if (!open) return null;
	const sideClasses = side === "right" ? "right-0 border-l" : "left-0 border-r";

	return createPortal(
		<div className="fixed inset-0 z-50">
			<button type="button" aria-label="Close panel" className="absolute inset-0 h-full w-full cursor-default bg-black/45" onClick={onClose} />
			<aside role="dialog" aria-modal="true" aria-label={title} className={`absolute inset-y-0 ${sideClasses} flex w-full max-w-lg flex-col border-stone-200 bg-white shadow-2xl ${className}`.trim()}>
				<header className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
					<div><h2 className="text-lg font-semibold text-stone-900">{title}</h2>{description ? <p className="mt-1 text-sm text-stone-600">{description}</p> : null}</div>
					<button type="button" aria-label="Close panel" onClick={onClose} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"><X size={18} /></button>
				</header>
				<div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
			</aside>
		</div>,
		document.body,
	);
}