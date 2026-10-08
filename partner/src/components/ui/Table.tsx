import type { HTMLAttributes, TableHTMLAttributes } from "react";

export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
	return <div className="w-full overflow-x-auto rounded-xl border border-stone-200"><table className={`w-full border-collapse text-left text-sm ${className}`.trim()} {...props} /></div>;
}

export function TableHeader({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
	return <thead className={`bg-stone-50 text-xs uppercase tracking-wide text-stone-600 ${className}`.trim()} {...props} />;
}

export function TableBody({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
	return <tbody className={`divide-y divide-stone-200 bg-white ${className}`.trim()} {...props} />;
}

export function TableRow({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
	return <tr className={`hover:bg-stone-50 ${className}`.trim()} {...props} />;
}

export function TableHead({ className = "", ...props }: HTMLAttributes<HTMLTableCellElement>) {
	return <th scope="col" className={`whitespace-nowrap px-4 py-3 font-semibold ${className}`.trim()} {...props} />;
}

export function TableCell({ className = "", ...props }: HTMLAttributes<HTMLTableCellElement>) {
	return <td className={`px-4 py-3 align-middle text-stone-700 ${className}`.trim()} {...props} />;
}