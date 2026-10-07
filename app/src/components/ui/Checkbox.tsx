import { forwardRef, type InputHTMLAttributes } from "react";
import { classNames } from "../../utils/helpers";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id || rest.name || Math.random().toString(36).slice(2);
    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="inline-flex items-center gap-2">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            {...rest}
            className={classNames(
              "h-4 w-4 rounded border-border text-secondary-500 focus:ring-secondary-500/40 disabled:cursor-not-allowed",
              className
            )}
          />
          {label && (
            <span className="text-sm text-text-primary">{label}</span>
          )}
        </label>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;