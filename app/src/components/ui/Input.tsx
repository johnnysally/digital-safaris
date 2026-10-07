import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { classNames } from "../../utils/helpers";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helper, leftIcon, rightIcon, className, id, ...rest },
    ref
  ) => {
    const inputId = id || rest.name || Math.random().toString(36).slice(2);
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            {...rest}
            className={classNames(
              "w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-alt",
              error
                ? "border-danger focus:border-danger focus:ring-danger/30"
                : "border-border focus:border-secondary-500 focus:ring-secondary-500/40",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : helper ? (
          <p className="text-xs text-text-muted">{helper}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;