import type { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
	circle?: boolean;
}

export function Skeleton({ circle = false, className = "", ...props }: SkeletonProps) {
	return <div aria-hidden="true" className={`animate-pulse bg-stone-200 ${circle ? "rounded-full" : "rounded-lg"} ${className}`.trim()} {...props} />;
}