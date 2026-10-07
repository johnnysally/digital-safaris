import { forwardRef, type TextareaHTMLAttributes } from "react";
import { classNames } from "../../utils/helpers";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, helper, rows = 4, className, id, ...rest },
    ref
  ) {
    const areaId = id || rest.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={areaId}
            className="mb-1 block text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          className={classNames(
            "w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-text-primary",
            "placeholder:text-text-muted focus:outline-none focus:ring-2",
            error
              ? "border-danger focus:border-danger focus:ring-danger/30"
              : "border-border focus:border-secondary-500 focus:ring-secondary-500/40",
            "disabled:cursor-not-allowed disabled:bg-surface-alt",
            className
          )}
          {...rest}
        />
        {error ? (
          <p className="mt-1 text-xs text-danger">{error}</p>
        ) : helper ? (
          <p className="mt-1 text-xs text-text-muted">{helper}</p>
        ) : null}
      </div>
    );
  }
);

export default Textarea;