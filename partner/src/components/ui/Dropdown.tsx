import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
	trigger: ReactNode;
	children: ReactNode;
	align?: "left" | "right";
	className?: string;
}

export function Dropdown({ trigger, children, align = "right", className = "" }: DropdownProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	return (
		<div ref={rootRef} className={`relative inline-block text-left ${className}`.trim()}>
			<button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2">
				{trigger}<ChevronDown size={15} aria-hidden="true" />
			</button>
			{open ? <div role="menu" onClick={(event) => { if (event.target instanceof Element && event.target.closest('[role="menuitem"]')) setOpen(false); }} className={`absolute z-40 mt-2 min-w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl ${align === "right" ? "right-0" : "left-0"}`}>{children}</div> : null}
		</div>
	);
}

export function DropdownItem({ children, onSelect, className = "" }: { children: ReactNode; onSelect?: () => void; className?: string }) {
	return <button type="button" role="menuitem" onClick={onSelect} className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 focus:bg-stone-100 focus:outline-none ${className}`.trim()}>{children}</button>;
}