import { classNames } from "../../utils/helpers";

type Size = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: Size;
  className?: string;
}

const SIZES: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export default function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      className={classNames(
        "inline-block animate-spin rounded-full border-secondary-500 border-t-transparent",
        SIZES[size],
        className
      )}
    />
  );
}