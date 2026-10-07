import { classNames } from "../../utils/helpers";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={classNames(
              "relative -mb-px whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-secondary-500 text-secondary-600"
                : "border-b-2 border-transparent text-text-muted hover:text-text-primary"
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={classNames(
                  "ml-2 rounded-full px-1.5 py-0.5 text-xs",
                  active
                    ? "bg-secondary-500/10 text-secondary-600"
                    : "bg-surface-alt text-text-muted"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}