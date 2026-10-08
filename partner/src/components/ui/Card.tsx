import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] ${className}`.trim()}
			{...props}
		/>
	);
}