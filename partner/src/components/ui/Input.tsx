import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={`min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-[0.9rem] py-[0.8rem] text-sm text-[var(--text)] placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 ${className}`.trim()}
			{...props}
		/>
	);
}