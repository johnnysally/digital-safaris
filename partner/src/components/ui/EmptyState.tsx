import type { ReactNode } from "react";

interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
	return (
		<div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
			{icon ? <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-800">{icon}</div> : null}
			<h3 className="text-base font-semibold text-stone-900">{title}</h3>
			{description ? <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">{description}</p> : null}
			{action ? <div className="mt-5">{action}</div> : null}
		</div>
	);
}