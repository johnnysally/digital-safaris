import { forwardRef, type InputHTMLAttributes } from "react";
import { classNames } from "../../utils/helpers";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, className, id, ...rest },
  ref
) {
  const boxId = id || rest.name;
  return (
    <div className="flex flex-col">
      <label
        htmlFor={boxId}
        className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-primary"
      >
        <input
          ref={ref}
          id={boxId}
          type="checkbox"
          className={classNames(
            "h-4 w-4 rounded border-border bg-surface text-secondary-500",
            "focus:ring-2 focus:ring-secondary-500/40",
            error && "border-danger",
            className
          )}
          {...rest}
        />
        {label && <span>{label}</span>}
      </label>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

export default Checkbox;