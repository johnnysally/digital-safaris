import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
	default: "bg-stone-100 text-stone-700",
	success: "bg-emerald-100 text-emerald-800",
	warning: "bg-amber-100 text-amber-900",
	danger: "bg-rose-100 text-rose-800",
	outline: "border border-stone-300 bg-transparent text-stone-700",
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
	return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${variants[variant]} ${className}`.trim()} {...props} />;
}