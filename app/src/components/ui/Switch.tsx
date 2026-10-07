import { classNames } from "../../utils/helpers";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <p className="text-sm font-medium text-text-primary">{label}</p>
          )}
          {description && (
            <p className="text-xs text-text-muted">{description}</p>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={classNames(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-500/40 disabled:cursor-not-allowed",
          checked ? "bg-secondary-500" : "bg-primary-200"
        )}
      >
        <span
          className={classNames(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}