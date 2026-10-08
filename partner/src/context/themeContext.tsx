import { createContext, useContext, type ReactNode } from "react";

const partnerTheme = {
	name: "safari",
	pageClassName: "min-h-screen min-w-[320px] bg-[#f3ebdf] font-sans text-[#2b211a] antialiased",
} as const;

const ThemeContext = createContext(partnerTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
	return <ThemeContext.Provider value={partnerTheme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	return useContext(ThemeContext);
}
