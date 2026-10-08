import { createContext, useContext, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

interface TabsContextValue {
	value: string;
	onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ value, defaultValue, onValueChange, children, className = "" }: {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	children: ReactNode;
	className?: string;
}) {
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
	const currentValue = value ?? uncontrolledValue;
	const changeValue = (nextValue: string) => {
		if (value === undefined) setUncontrolledValue(nextValue);
		onValueChange?.(nextValue);
	};
	return (
		<TabsContext.Provider value={{ value: currentValue, onValueChange: changeValue }}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	);
}

export function TabsList({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div role="tablist" className={`inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 ${className}`.trim()} {...props} />;
}

export function TabsTrigger({ value, className = "", children, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
	const tabs = useContext(TabsContext);
	if (!tabs) throw new Error("TabsTrigger must be used inside Tabs.");
	const active = tabs.value === value;
	return <button type="button" role="tab" id={`tab-${value}`} aria-selected={active} aria-controls={`panel-${value}`} tabIndex={active ? 0 : -1} onClick={(event) => { tabs.onValueChange(value); onClick?.(event); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"} ${className}`.trim()} {...props}>{children}</button>;
}

export function TabsContent({ value, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { value: string }) {
	const tabs = useContext(TabsContext);
	if (!tabs) throw new Error("TabsContent must be used inside Tabs.");
	if (tabs.value !== value) return null;
	return <div role="tabpanel" id={`panel-${value}`} aria-labelledby={`tab-${value}`} tabIndex={0} className={className} {...props} />;
}