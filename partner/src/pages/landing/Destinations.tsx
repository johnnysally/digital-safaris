import { ArrowRight, MapPin } from "lucide-react";
import { destinations } from "./data";

export function Destinations() {
	return (
		<section className="landing-container landing-destinations" id="destinations">
			<div className="landing-section-heading flex items-end justify-between gap-4">
				<div>
					<p className="eyebrow">POPULAR DESTINATIONS</p>
					<h2 className="landing-section-title text-[#172333]">Top Destinations in Kenya</h2>
					<p>From wildlife safaris to stunning beaches, explore the best places Kenya has to offer.</p>
				</div>
				<a className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#a55e20] hover:text-[#744017]" href="#services">View All Destinations <ArrowRight size={15} /></a>
			</div>
			<div className="landing-destination-grid">
				{destinations.map((destination, index) => {
					const tags = destination.description.split(", ");
					return (
						<a className="landing-destination-card group bg-[#403326] text-white" href="#services" key={destination.name} aria-label={`Explore ${destination.name}: ${destination.description}`}>
							<img className="transition duration-300 group-hover:scale-105" src={destination.image} alt="" loading="lazy" />
							<div className="landing-destination-shade" />
							<div className="landing-destination-copy">
								<span className="landing-destination-index">0{index + 1} <span /> KENYA</span>
								<h3><MapPin size={16} aria-hidden="true" />{destination.name}</h3>
								<div className="landing-destination-tags">
									{tags.map((tag) => <span key={tag}>{tag}</span>)}
								</div>
							</div>
						</a>
					);
				})}
			</div>
		</section>
	);
}
