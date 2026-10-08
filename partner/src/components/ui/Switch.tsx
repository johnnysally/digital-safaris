import type { ButtonHTMLAttributes } from "react";

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "onClick" | "role" | "aria-checked"> {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	label?: string;
}

export function Switch({ checked, onCheckedChange, label, className = "", ...props }: SwitchProps) {
	return (
		<button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onCheckedChange(!checked)} className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${checked ? "bg-amber-700" : "bg-stone-300"} ${className}`.trim()} {...props}>
			<span aria-hidden="true" className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
		</button>
	);
}