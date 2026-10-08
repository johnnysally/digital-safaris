import { useState, type ImgHTMLAttributes } from "react";

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
	src?: string | null;
	alt: string;
	fallback?: string;
}

export function Avatar({ src, alt, fallback, className = "", onError, ...props }: AvatarProps) {
	const [imageFailed, setImageFailed] = useState(false);
	const initials = (fallback || alt).trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

	if (src && !imageFailed) {
		return <img src={src} alt={alt} className={`h-10 w-10 rounded-full object-cover ${className}`.trim()} onError={(event) => { setImageFailed(true); onError?.(event); }} {...props} />;
	}

	return (
		<span role="img" aria-label={alt} className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900 ${className}`.trim()}>
			{initials || "?"}
		</span>
	);
}