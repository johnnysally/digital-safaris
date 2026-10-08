import { BadgeCheck, Headphones, ShieldCheck, Tag } from "lucide-react";
import { heroPhoto } from "./data";

const trustPoints = [
	{ icon: BadgeCheck, title: "Trusted Partners", description: "Verified & Reliable" },
	{ icon: ShieldCheck, title: "Secure Bookings", description: "Your safety comes first" },
	{ icon: Headphones, title: "24/7 Support", description: "We’re here to help" },
	{ icon: Tag, title: "Best Prices", description: "Great value, always" },
];

export function TravelHero() {
	return (
		<section
			className="landing-hero"
			id="home"
			style={{
				backgroundImage: `linear-gradient(90deg, rgb(23 23 18 / 68%), rgb(28 25 17 / 19%) 75%), linear-gradient(180deg, rgb(16 20 17 / 28%), transparent 46%, rgb(30 20 13 / 42%)), url('${heroPhoto}')`,
			}}
		>
			<div className="landing-container landing-hero-content">
				<p className="mb-1 text-[9px] font-bold tracking-[.2em] text-white/90">YOUR ULTIMATE TRAVEL COMPANION</p>
				<h1 className="landing-hero-title">
					Discover Amazing<br />Experiences Across <span className="text-[#f7ad3e]">Kenya</span>
				</h1>
				<p className="mt-1 max-w-[480px] text-[10px] leading-[1.35] text-white/95">
					Book transport, accommodation, tours, restaurants and more — all in one place.<br className="hidden sm:block" /> Explore. Experience. Create unforgettable memories.
				</p>

				<div className="landing-trust-grid mt-2.5 grid max-w-[470px] grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4 sm:gap-3">
					{trustPoints.map(({ icon: Icon, title, description }) => (
						<div className="flex items-center gap-1.5" key={title}>
							<Icon className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#f2aa3c] p-[2px] text-[#382719]" />
							<span className="leading-tight"><strong className="block text-[8px]">{title}</strong><small className="block text-[7px] text-white/85">{description}</small></span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
