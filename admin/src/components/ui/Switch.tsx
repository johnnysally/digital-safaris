import { classNames } from "../../utils/helpers";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  name?: string;
}

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  name,
}: SwitchProps) {
  return (
    <label
      className={classNames(
        "inline-flex items-center gap-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
    >
      <button
        type="button"
        role="switch"
        name={name}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={classNames(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/40",
          checked ? "bg-secondary-500" : "bg-border"
        )}
      >
        <span
          className={classNames(
            "inline-block h-5 w-5 transform rounded-full bg-surface shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-text-primary">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-text-muted">{description}</span>
          )}
        </span>
      )}
    </label>
  );
}