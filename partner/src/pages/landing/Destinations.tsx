import { ArrowRight, MapPin } from "lucide-react";
import { destinations } from "./data";

export function Destinations() {
	return (
		<section className="mx-auto w-[min(1280px,calc(100%_-_64px))] py-24 pb-[100px] max-[767px]:w-[min(calc(100%_-_36px),560px)] max-[767px]:py-[65px]" id="destinations">
			<div className="mb-[30px] flex items-end justify-between gap-4 max-[767px]:mb-[22px] max-[767px]:items-start">
				<div>
					<p className="mb-2 text-[11px] font-bold tracking-[.2em] text-[#a66c2d]">POPULAR DESTINATIONS</p>
					<h2 className="font-['Cormorant_Garamond',Georgia,'Times_New_Roman',serif] text-[clamp(30px,3vw,42px)] leading-[1.12] font-bold tracking-[-.02em] text-[#172333] max-[767px]:text-[32px]">Top Destinations in Kenya</h2>
					<p className="mt-[9px] text-[15px] text-[#706d66]">From wildlife safaris to stunning beaches, explore the best places Kenya has to offer.</p>
				</div>
				<a className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#a55e20] hover:text-[#744017] max-[767px]:mt-1.5 max-[767px]:text-[11px]" href="#services">View All Destinations <ArrowRight size={15} /></a>
			</div>
			<div className="grid grid-cols-3 gap-5 max-[767px]:grid-cols-2 max-[767px]:gap-3">
				{destinations.map((destination, index) => {
					const tags = destination.description.split(", ");
					return (
						<a className="group relative h-[240px] overflow-hidden rounded-xl bg-[#403326] text-white shadow-[0_10px_26px_rgb(32_28_22_/_10%)] max-[767px]:h-[175px]" href="#services" key={destination.name} aria-label={`Explore ${destination.name}: ${destination.description}`}>
						<img className="h-full w-full object-cover [transition:transform_.4s_ease] group-hover:scale-105" src={destination.image} alt="" loading="lazy" />
						<div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_16_12_/_5%)_15%,rgb(18_16_12_/_18%)_42%,rgb(18_16_12_/_86%)_100%)]" />
						<div className="absolute inset-x-5 bottom-[19px] max-[767px]:inset-x-[11px] max-[767px]:bottom-[11px]">
							<span className="mb-2 flex items-center gap-2 text-[9px] font-semibold tracking-[.17em] text-[#fff7e6]/[.82] max-[767px]:mb-1.5 max-[767px]:text-[8px]">0{index + 1} <span className="h-px w-[25px] bg-[#e8b65e]" /> KENYA</span>
							<h3 className="flex items-center gap-[7px] font-['Cormorant_Garamond',Georgia,serif] text-[27px] leading-none font-bold max-[767px]:gap-[5px] max-[767px]:text-[21px]"><MapPin className="shrink-0 text-[#efbd69] max-[767px]:w-[13px]" size={16} aria-hidden="true" />{destination.name}</h3>
							<div className="mt-[11px] flex flex-wrap gap-1.5 max-[767px]:mt-[7px] max-[767px]:gap-1">
								{tags.map((tag) => <span className="rounded-[20px] border border-white/[.26] bg-[#271f17]/[.38] px-2 py-1 text-[10px] leading-[1.2] text-white/[.91] backdrop-blur-[6px] max-[767px]:px-1.5 max-[767px]:py-[3px]" key={tag}>{tag}</span>)}
								</div>
							</div>
						</a>
					);
				})}
			</div>
		</section>
	);
}
