import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { landingServices } from "./data";

interface PartnerServicesProps {
	websiteUrl: (path: string) => string;
}

export function PartnerServices({ websiteUrl }: PartnerServicesProps) {
	return (
		<section className="landing-container landing-services" id="services">
			<div className="landing-section-heading flex items-end justify-between gap-4">
				<div>
					<p className="eyebrow">ONE CONNECTED TRAVEL ECOSYSTEM</p>
					<h2 className="landing-section-title text-[#172333]">Explore Our Partner Services</h2>
					<p>Everything you need for a perfect trip — all in one place.</p>
				</div>
				<a className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#a64f08] hover:text-[#744017]" href="#services">
					View All Services <ArrowRight size={12} />
				</a>
			</div>
			<div className="landing-service-grid">
				{landingServices.map(({ name, label, description, action, image, icon: Icon, to, external }) => {
					const card = (
						<>
							<div className="landing-service-image">
								<img className="transition duration-300 group-hover:scale-105" src={image} alt="" loading="lazy" />
								<div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
								<span className="absolute -bottom-3 left-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#191c1d] text-white shadow">
									<Icon size={13} />
								</span>
							</div>
							<div className="landing-service-body">
								<h3 className="text-[9px] font-bold leading-none text-[#1c2837]">{name}</h3>
								<p className="mt-1">{description}</p>
								<span className="mt-1 inline-flex min-h-[18px] items-center gap-1 rounded border border-[#efc697] px-2 text-[7px] font-semibold text-[#a55e20] transition group-hover:bg-[#a55e20] group-hover:text-white">
									{action}<ArrowRight size={10} />
								</span>
							</div>
							<span className="sr-only">{label}</span>
						</>
					);
					return external ? (
						<a className="landing-service-card group overflow-hidden rounded-md border border-[#e9e3da] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg" href={websiteUrl(to)} key={name} aria-label={action}>
							{card}
						</a>
					) : (
						<Link className="landing-service-card group overflow-hidden rounded-md border border-[#e9e3da] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg" to={to} key={name} aria-label={action}>
							{card}
						</Link>
					);
				})}
			</div>
		</section>
	);
}
