import { BadgeCheck, Headphones, ShieldCheck, Tag } from "lucide-react";
import { partnerImages } from "../../config/partnerImages";

const trustPoints = [
	{ icon: BadgeCheck, title: "Trusted Partners", description: "Verified & Reliable" },
	{ icon: ShieldCheck, title: "Secure Bookings", description: "Your safety comes first" },
	{ icon: Headphones, title: "24/7 Support", description: "We’re here to help" },
	{ icon: Tag, title: "Best Prices", description: "Great value, always" },
];

export function TravelHero() {
	return (
		<section
			className="relative min-h-[720px] bg-[#4c3823] bg-cover bg-[center_49%] text-white max-[1023px]:min-h-[650px] max-[767px]:min-h-[680px] max-[767px]:bg-[61%_center]"
			id="home"
			style={{
				backgroundImage: `linear-gradient(90deg, rgb(23 23 18 / 68%), rgb(28 25 17 / 19%) 75%), linear-gradient(180deg, rgb(16 20 17 / 28%), transparent 46%, rgb(30 20 13 / 42%)), url('${partnerImages.landing.hero}')`,
			}}
		>
			<div className="relative z-[1] mx-auto w-[min(1280px,calc(100%-64px))] pt-[173px] pb-[90px] max-[1023px]:pt-[150px] max-[767px]:w-[min(calc(100%-36px),560px)] max-[767px]:pt-[135px] max-[767px]:pb-16">
				<p className="mb-5 text-xs tracking-[.25em] text-white/90 max-[767px]:max-w-[280px] max-[767px]:text-[10px] max-[767px]:leading-[1.6]">YOUR ULTIMATE TRAVEL COMPANION</p>
				<h1 className="max-w-[740px] font-['Cormorant_Garamond',Georgia,'Times_New_Roman',serif] text-[clamp(48px,5.1vw,76px)] leading-[.96] font-bold tracking-[-.035em] max-[767px]:text-[clamp(43px,12vw,62px)]">
					Discover Amazing<br />Experiences Across <span className="text-[#f7ad3e]">Kenya</span>
				</h1>
				<p className="mt-[22px] max-w-[610px] text-[17px] leading-[1.7] text-white/95 max-[767px]:max-w-[460px] max-[767px]:text-sm">
					Book transport, accommodation, tours, restaurants and more — all in one place.<br className="hidden sm:block" /> Explore. Experience. Create unforgettable memories.
				</p>

				<div className="mt-[38px] grid max-w-[760px] grid-cols-2 gap-6 max-[767px]:mt-[23px] max-[767px]:gap-x-[15px] max-[767px]:gap-y-3 sm:grid-cols-4">
					{trustPoints.map(({ icon: Icon, title, description }) => (
						<div className="flex items-center gap-[11px]" key={title}>
							<Icon className="h-[34px] w-[34px] shrink-0 rounded-full bg-[#f2aa3c] p-2 text-[#382719]" />
							<span className="leading-tight"><strong className="block text-xs">{title}</strong><small className="mt-[3px] block text-[11px] text-white/85">{description}</small></span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
