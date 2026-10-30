import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "surface" | "warm";
  hover?: boolean;
};

const variantClasses = {
  surface: "bg-surface-raised",
  warm: "bg-surface-card",
} as const;

export const Card: React.FC<CardProps> = ({
  variant = "surface",
  hover = true,
  className = "",
  ...props
}) => (
  <div
    className={`rounded-card border border-brand-border p-card ${variantClasses[variant]} ${hover ? "card-hover-effect" : ""} ${className}`.trim()}
    {...props}
  />
);
