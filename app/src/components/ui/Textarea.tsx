import { forwardRef, type TextareaHTMLAttributes } from "react";
import { classNames } from "../../utils/helpers";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, className, id, ...rest }, ref) => {
    const textareaId = id || rest.name || Math.random().toString(36).slice(2);
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          {...rest}
          className={classNames(
            "w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-alt",
            error
              ? "border-danger focus:border-danger focus:ring-danger/30"
              : "border-border focus:border-secondary-500 focus:ring-secondary-500/40",
            className
          )}
        />
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : helper ? (
          <p className="text-xs text-text-muted">{helper}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;