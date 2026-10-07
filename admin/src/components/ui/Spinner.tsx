import { classNames } from "../../utils/helpers";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export default function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      className={classNames(
        "inline-block animate-spin rounded-full border-secondary-500/30 border-t-secondary-500",
        SIZES[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}