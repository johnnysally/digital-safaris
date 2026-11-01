import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Compass, Home } from "lucide-react";

export default function NotFound() {
	const { pathname } = useLocation();
	const workspace = pathname.startsWith("/partner/transport/")
		? { name: "Transport", to: "/partner/transport/dashboard" }
		: pathname.startsWith("/partner/restaurant/")
			? { name: "Restaurant", to: "/partner/restaurant/dashboard" }
			: pathname.startsWith("/partner/accommodation/")
				? { name: "Accommodation", to: "/partner/accommodation/dashboard" }
				: null;

	return (
		<main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f0e7] px-5 py-12 text-[#30271f]">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(197,138,59,.14),transparent_38rem)]" />
			<section className="relative mx-auto w-full max-w-[520px] text-center">
				<div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-[#ead8bf] bg-[#fffaf2] text-[#a7671c] shadow-[0_8px_24px_rgba(80,51,25,.08)]">
					<Compass size={30} strokeWidth={1.7} aria-hidden="true" />
				</div>
				<p className="m-0 text-xs font-bold uppercase tracking-[.18em] text-[#9b5b17]">
					404 · Page not found
				</p>
				<h1 className="mt-3 font-[Cormorant_Garamond,Georgia,serif] text-5xl font-bold leading-[1.02] text-[#29221c] sm:text-6xl">
					This page isn&apos;t here.
				</h1>
				<p className="mx-auto mt-4 max-w-[420px] text-sm leading-relaxed text-[#70665d] sm:text-base">
					The address may be outdated or incorrect. Choose a destination below to continue.
				</p>
				<div className="mt-7 flex flex-wrap items-center justify-center gap-3">
					<Link
						to={workspace?.to ?? "/partner"}
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#a85f19] px-5 py-2.5 text-sm font-bold text-white no-underline shadow-[0_5px_14px_rgba(128,74,20,.18)] transition hover:bg-[#8e4f14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75410f]"
					>
						<Home size={17} aria-hidden="true" />
						{workspace ? `${workspace.name} dashboard` : "Partner home"}
						<ArrowRight size={16} aria-hidden="true" />
					</Link>
					<Link
						to="/partner"
						className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#e5d6c1] bg-[#fffaf2] px-5 py-2.5 text-sm font-semibold text-[#704d2a] no-underline transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75410f]"
					>
						All partner workspaces
					</Link>
				</div>
			</section>
		</main>
	);
}
