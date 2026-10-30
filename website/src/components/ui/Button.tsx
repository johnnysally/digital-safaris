import React from "react";
import { Link, type LinkProps } from "react-router-dom";

export type ButtonVariant = "primary" | "secondary";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-amber text-white shadow-sm hover:bg-brand-amber-hover transform hover:-translate-y-0.5",
  secondary:
    "border border-content-strong text-content-strong hover:bg-content-strong hover:text-white",
};

export const buttonClassName = (
  variant: ButtonVariant = "primary",
  className = "",
) => (
  `inline-flex items-center justify-center gap-2 rounded-control px-8 py-4 text-xs font-bold uppercase tracking-wider transition-all ${variantClasses[variant]} ${className}`.trim()
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  ...props
}) => (
  <button className={buttonClassName(variant, className)} {...props} />
);

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant;
  className?: string;
};

export const ButtonLink: React.FC<ButtonLinkProps> = ({
  variant = "primary",
  className = "",
  ...props
}) => (
  <Link className={buttonClassName(variant, className)} {...props} />
);
