import { classNames } from "../../utils/helpers";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={classNames(
        "animate-pulse rounded-md bg-border",
        className
      )}
    />
  );
}