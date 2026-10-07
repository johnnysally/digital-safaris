import { useState } from "react";
import { useBranding } from "../../context/brandingContext";
import { classNames } from "../../utils/helpers";

type Size = "sm" | "md" | "lg";

interface LogoProps {
  size?: Size;
  showText?: boolean;
  className?: string;
}

const SIZES: Record<Size, string> = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
};

export default function Logo({
  size = "md",
  showText = true,
  className,
}: LogoProps) {
  const { branding } = useBranding();
  const [errored, setErrored] = useState(false);

  const primary = branding.logoUrl || branding.logo;
  const src = errored || !primary ? "/logo.svg" : primary;

  return (
    <span
      className={classNames("inline-flex items-center gap-2", className)}
      aria-label={branding.metaTitle || "Digital Safaris"}
    >
      <img
        src={src}
        alt={branding.metaTitle || "Digital Safaris"}
        className={classNames("w-auto object-contain", SIZES[size])}
        onError={() => setErrored(true)}
      />
      {showText && (
        <span className="text-sm font-semibold text-text-primary">
          {branding.metaTitle || "Digital Safaris"}
        </span>
      )}
    </span>
  );
}