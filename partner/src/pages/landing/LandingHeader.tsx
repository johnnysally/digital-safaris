import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

export function LandingHeader() {
	const [menuOpen, setMenuOpen] = useState(false);

	const navLinks = [
		{ label: "Home", href: "#home" },
		{ label: "Destinations", href: "#destinations" },
		{ label: "Partners", href: "#services", hasMenu: true },
		{ label: "About Us", href: "#about" },
		{ label: "Contact", href: "#contact" },
	];

	return (
		<header className="absolute inset-x-0 top-0 z-30 h-[86px] bg-[linear-gradient(180deg,rgb(21_23_17_/_60%),transparent)] text-white max-[767px]:h-[72px]">
			<div className="mx-auto flex h-full w-[min(1380px,calc(100%_-_80px))] items-center justify-between gap-8 max-[1023px]:w-[min(calc(100%_-_48px),900px)] max-[767px]:w-[calc(100%_-_32px)] max-[767px]:gap-3">
				<a className="flex shrink-0 items-center gap-1.5 transition duration-200 ease-[ease]" href="#home" aria-label="DigitalSafaris home">
					<span className="grid h-10 w-10 place-items-center rounded-full border border-[#f7bd59] font-serif text-xl font-bold text-[#ffce73] max-[767px]:h-[38px] max-[767px]:w-[38px]">D</span>
					<span className="leading-tight">
						<strong className="block font-serif text-xl">Digital<span className="text-[#f7b54a]">Safaris</span></strong>
						<small className="block text-[9px] tracking-[.12em] text-white/85">TRAVEL · EXPLORE · EXPERIENCE</small>
					</span>
				</a>

				<nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
					{navLinks.map(({ label, href, hasMenu }) => (
						<a className={`inline-flex items-center gap-1 text-sm font-semibold text-white/95 transition duration-200 ease-[ease] hover:text-[#ffc455] ${label === "Home" ? "text-[#ffc455]" : ""}`} href={href} key={label}>
							{label}{hasMenu ? <span aria-hidden="true">⌄</span> : null}
						</a>
					))}
				</nav>

				<div className="hidden shrink-0 items-center lg:flex">
					<a className="grid h-7 w-7 place-items-center rounded-full text-white/90 transition duration-200 ease-[ease] hover:bg-white/10" href="#services" aria-label="Explore partner services">
						<Search size={18} />
					</a>
				</div>

				<button
					className="grid h-9 w-9 place-items-center rounded-md text-white transition duration-200 ease-[ease] hover:bg-white/10 lg:hidden"
					type="button"
					aria-label={menuOpen ? "Close navigation" : "Open navigation"}
					aria-expanded={menuOpen}
					onClick={() => setMenuOpen((open) => !open)}
				>
					{menuOpen ? <X size={20} /> : <Menu size={20} />}
				</button>
			</div>

			{menuOpen ? (
				<nav className="grid gap-1 border-t border-white/15 bg-slate-950/90 px-4 py-3 lg:hidden" aria-label="Mobile navigation">
					{navLinks.map(({ label, href }) => (
						<a className="rounded px-3 py-2 text-sm text-white/90 transition duration-200 ease-[ease] hover:bg-white/10" href={href} key={label} onClick={() => setMenuOpen(false)}>{label}</a>
					))}
				</nav>
			) : null}
		</header>
	);
}
