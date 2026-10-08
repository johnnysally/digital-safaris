import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
}

export function Modal({ open, onClose, title, description, children, className = "" }: ModalProps) {
	const dialogRef = useRef<HTMLElement>(null);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const getFocusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []);
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
				return;
			}
			if (event.key !== "Tab") return;
			const focusable = getFocusable();
			if (focusable.length === 0) {
				event.preventDefault();
				dialogRef.current?.focus();
				return;
			}
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
				event.preventDefault();
				first.focus();
			}
		};
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);
		(dialogRef.current && getFocusable()[0] ? getFocusable()[0] : dialogRef.current)?.focus();
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
			previousFocus?.focus();
		};
	}, [open, onClose]);

	if (!open) return null;
	return createPortal(
		<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
			<section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={`my-auto w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl outline-none sm:p-6 ${className}`.trim()}>
				<header className="mb-5 flex items-start justify-between gap-4">
					<div><h2 id={titleId} className="text-lg font-semibold text-stone-900">{title}</h2>{description ? <p id={descriptionId} className="mt-1 text-sm leading-6 text-stone-600">{description}</p> : null}</div>
					<button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"><X size={18} /></button>
				</header>
				{children}
			</section>
		</div>,
		document.body,
	);
}