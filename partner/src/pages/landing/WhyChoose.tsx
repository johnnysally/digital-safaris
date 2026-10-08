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
		<section className="landing-reasons" id="about">
			<div className="landing-container items-center">
				<div>
					<p className="eyebrow">TRAVEL WITH CONFIDENCE</p>
					<h2 className="landing-section-title text-[#27251f]">Why Choose DigitalSafaris?</h2>
					<p className="mt-2 text-sm text-[#706d66]">We make travel simple, safe and unforgettable.</p>
					<ul className="landing-reason-list">
						{reasons.map(({ title, description, icon: Icon }) => (
							<li className="landing-reason-item" key={title}>
								<span className="grid shrink-0 place-items-center rounded-full bg-[#282119] text-[#efb557]"><Icon size={18} /></span>
								<span><strong className="block leading-tight text-[#28251f]">{title}</strong><small className="block leading-tight text-[#706d66]">{description}</small></span>
							</li>
						))}
					</ul>
				</div>

				<div className="landing-collage" aria-label="Kenyan travel moments">
					<img src={transportPhoto} alt="A safari vehicle ready to explore Kenya" loading="lazy" />
					<img src={experiencePhoto} alt="A memorable Kenyan travel experience" loading="lazy" />
					<img src={accommodationPhoto} alt="A comfortable place to stay in Kenya" loading="lazy" />
					<img src={diningPhoto} alt="Local dining in Kenya" loading="lazy" />
					<p>More than a trip<br />it’s an experience</p>
				</div>
			</div>
		</section>
	);
}
