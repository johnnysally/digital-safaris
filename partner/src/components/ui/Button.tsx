import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: "border border-[var(--gold)] bg-[var(--gold)] text-white shadow-sm hover:brightness-95",
	secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--gold)] hover:bg-[var(--surface-strong)]",
	ghost: "border border-transparent bg-transparent text-[var(--text-soft)] hover:bg-[var(--surface-strong)]",
	danger: "border border-rose-700 bg-rose-700 text-white shadow-sm hover:border-rose-800 hover:bg-rose-800",
};

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
	return (
		<button
			type={type}
			className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`.trim()}
			{...props}
		/>
	);
}