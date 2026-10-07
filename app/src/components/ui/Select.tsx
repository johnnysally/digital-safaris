import { forwardRef, type SelectHTMLAttributes } from "react";
import { classNames } from "../../utils/helpers";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  placeholder?: string;
  options: Option[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, helper, placeholder, options, className, id, ...rest },
    ref
  ) => {
    const selectId = id || rest.name || Math.random().toString(36).slice(2);
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          {...rest}
          className={classNames(
            "w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-alt",
            error
              ? "border-danger focus:border-danger focus:ring-danger/30"
              : "border-border focus:border-secondary-500 focus:ring-secondary-500/40",
            className
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : helper ? (
          <p className="text-xs text-text-muted">{helper}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;