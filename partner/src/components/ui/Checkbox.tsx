import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	label?: string;
}

export function Checkbox({ label, className = "", id, ...props }: CheckboxProps) {
	const control = <input id={id} type="checkbox" className={`h-4 w-4 rounded border-stone-300 accent-amber-700 focus:ring-2 focus:ring-amber-600/30 ${className}`.trim()} {...props} />;
	return label ? <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-700">{control}<span>{label}</span></label> : control;
}