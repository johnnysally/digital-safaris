import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
	return <select className={`min-h-10 min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500 ${className}`.trim()} {...props}>{children}</select>;
}