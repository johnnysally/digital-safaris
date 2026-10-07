import { forwardRef, type SelectHTMLAttributes } from "react";
import { classNames } from "../../utils/helpers";

interface Option {
  label: string;
  value: string | number;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: Option[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helper, options, placeholder, className, id, ...rest },
  ref
) {
  const selectId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1 block text-xs font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={classNames(
          "w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary",
          "focus:outline-none focus:ring-2",
          error
            ? "border-danger focus:border-danger focus:ring-danger/30"
            : "border-border focus:border-secondary-500 focus:ring-secondary-500/40",
          "disabled:cursor-not-allowed disabled:bg-surface-alt",
          className
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
});

export default Select;