import { BadgeCheck, BriefcaseBusiness, Headphones, ShieldCheck, Star } from "lucide-react";
import accommodationPhoto from "../../../../website/public/accomodation.jpg";
import diningPhoto from "../../../../website/public/food and dinning.jpg";
import experiencePhoto from "../../../../website/public/experience.jpg";
import transportPhoto from "../../../../website/public/trasportation.jpg";
import { heroPhoto } from "./data";

const reasons = [
	{ title: "Verified Partners", description: "Only trusted and vetted service providers.", icon: BadgeCheck },
	{ title: "Easy Booking", description: "Book in just a few clicks.", icon: BriefcaseBusiness },
	{ title: "Secure Payments", description: "Multiple payment options for your convenience.", icon: ShieldCheck },
	{ title: "24/7 Customer Support", description: "We’re always here to help.", icon: Headphones },
	{ title: "Real Reviews", description: "See what other travellers say.", icon: Star },
];

export function WhyChoose() {
	return (
		<section className="py-[94px] bg-[radial-gradient(ellipse_at_92%_8%,rgb(219_169_88_/_19%),transparent_36%),linear-gradient(135deg,#f0dfbf,#f8eedc_55%,#ead3aa)] max-[767px]:py-[62px]" id="about">
			<div className="mx-auto grid w-[min(1280px,calc(100%_-_64px))] grid-cols-[.9fr_1.1fr] items-center gap-20 max-[1023px]:gap-8 max-[767px]:w-[min(calc(100%_-_36px),560px)] max-[767px]:grid-cols-1 max-[767px]:gap-[35px]">
				<div>
					<p className="mb-2 text-[11px] font-bold tracking-[.2em] text-[#a66c2d]">TRAVEL WITH CONFIDENCE</p>
					<h2 className="font-['Cormorant_Garamond',Georgia,'Times_New_Roman',serif] text-[clamp(30px,3vw,42px)] leading-[1.12] font-bold tracking-[-.02em] text-[#27251f] max-[767px]:text-[32px]">Why Choose DigitalSafaris?</h2>
					<p className="mt-2 text-sm text-[#706d66]">We make travel simple, safe and unforgettable.</p>
					<ul className="mt-[30px] grid gap-[18px] max-[767px]:mt-[23px] max-[767px]:gap-[15px]">
						{reasons.map(({ title, description, icon: Icon }) => (
							<li className="flex items-center gap-[13px]" key={title}>
								<span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#282119] text-[#efb557]"><Icon size={18} /></span>
								<span><strong className="block text-sm leading-tight text-[#28251f]">{title}</strong><small className="mt-[3px] block text-xs leading-tight text-[#706d66]">{description}</small></span>
							</li>
						))}
					</ul>
				</div>

				<div className="relative min-h-[470px] max-[767px]:min-h-[390px]" aria-label="Kenyan travel moments">
					<img className="absolute top-[1%] left-[1%] h-[61%] w-[55%] overflow-hidden rounded-[10px] border-[7px] border-[#fff8eb] object-cover shadow-[0_18px_44px_rgb(36_29_20_/_17%)]" src={transportPhoto} alt="A safari vehicle ready to explore Kenya" loading="lazy" />
					<img className="absolute top-[9%] right-[1%] h-[44%] w-[42%] overflow-hidden rounded-[10px] border-[7px] border-[#fff8eb] object-cover shadow-[0_18px_44px_rgb(36_29_20_/_17%)]" src={experiencePhoto} alt="A memorable Kenyan travel experience" loading="lazy" />
					<img className="absolute bottom-[1%] left-[11%] h-[47%] w-[47%] overflow-hidden rounded-[10px] border-[7px] border-[#fff8eb] object-cover shadow-[0_18px_44px_rgb(36_29_20_/_17%)]" src={accommodationPhoto} alt="A comfortable place to stay in Kenya" loading="lazy" />
					<img className="absolute right-[2%] bottom-[2%] h-[48%] w-[43%] overflow-hidden rounded-[10px] border-[7px] border-[#fff8eb] object-cover shadow-[0_18px_44px_rgb(36_29_20_/_17%)]" src={diningPhoto} alt="Local dining in Kenya" loading="lazy" />
					<p className="absolute top-[48%] left-[43%] z-[2] rotate-[-5deg] rounded-[5px] bg-[#fff4dc] px-[13px] py-[9px] font-['Cormorant_Garamond',Georgia,serif] text-[18px] leading-[1.05] text-[#a15d2e] italic shadow-[0_4px_12px_rgb(36_29_20_/_12%)]">More than a trip<br />it’s an experience</p>
				</div>
			</div>
		</section>
	);
}
