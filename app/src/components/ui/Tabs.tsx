import { classNames } from "../../utils/helpers";

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={classNames(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            activeKey === t.key
              ? "border-secondary-500 text-secondary-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}