import type { HTMLAttributes } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
	variant?: AlertVariant;
	title?: string;
}

const variants: Record<AlertVariant, string> = {
	info: "border-sky-200 bg-sky-50 text-sky-950",
	success: "border-emerald-200 bg-emerald-50 text-emerald-950",
	warning: "border-amber-200 bg-amber-50 text-amber-950",
	error: "border-rose-200 bg-rose-50 text-rose-950",
};

export function Alert({ variant = "info", title, className = "", children, ...props }: AlertProps) {
	return (
		<div role={variant === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${variants[variant]} ${className}`.trim()} {...props}>
			{title ? <h3 className="mb-1 font-semibold">{title}</h3> : null}
			<div>{children}</div>
		</div>
	);
}