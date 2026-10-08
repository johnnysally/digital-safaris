import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { landingServices } from "./data";

interface PartnerServicesProps {
	websiteUrl: (path: string) => string;
}

export function PartnerServices({ websiteUrl }: PartnerServicesProps) {
	return (
		<section className="mx-auto w-[min(1280px,calc(100%_-_64px))] py-[86px] pb-[82px] max-[767px]:w-[min(calc(100%_-_36px),560px)] max-[767px]:py-16 max-[767px]:pb-[62px]" id="services">
			<div className="mb-[30px] flex items-end justify-between gap-4 max-[767px]:mb-[22px] max-[767px]:items-start">
				<div>
					<p className="mb-2 text-[11px] font-bold tracking-[.2em] text-[#a66c2d]">ONE CONNECTED TRAVEL ECOSYSTEM</p>
					<h2 className="font-['Cormorant_Garamond',Georgia,'Times_New_Roman',serif] text-[clamp(30px,3vw,42px)] leading-[1.12] font-bold tracking-[-.02em] text-[#172333] max-[767px]:text-[32px]">Explore Our Partner Services</h2>
					<p className="mt-[9px] text-[15px] text-[#706d66]">Everything you need for a perfect trip — all in one place.</p>
				</div>
				<a className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#a64f08] hover:text-[#744017] max-[767px]:mt-1.5 max-[767px]:text-[11px]" href="#services">
					View All Services <ArrowRight size={12} />
				</a>
			</div>
			<div className="grid grid-cols-5 gap-5 max-[1023px]:grid-cols-3 max-[767px]:grid-cols-2 max-[767px]:gap-[13px] max-[380px]:grid-cols-1">
				{landingServices.map(({ name, label, description, action, image, icon: Icon, to, external }) => {
					const card = (
						<>
							<div className="relative h-[190px] overflow-visible max-[767px]:h-[145px] max-[380px]:h-[175px]">
								<img className="h-full w-full rounded-t-[13px] object-cover [transition:transform_.4s_ease] group-hover:scale-105" src={image} alt="" loading="lazy" />
								<div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
								<span className="absolute -bottom-[21px] left-5 grid h-12 w-12 place-items-center rounded-full border-[3px] border-white bg-[#2a2118] text-white shadow">
									<Icon size={13} />
								</span>
							</div>
							<div className="px-5 pt-[34px] pb-[22px] max-[767px]:px-[13px] max-[767px]:pt-[30px] max-[767px]:pb-[14px]">
								<h3 className="text-base leading-none font-bold text-[#1c2837] max-[767px]:text-sm">{name}</h3>
								<p className="mt-2 min-h-16 text-[13px] leading-[1.6] max-[767px]:mt-1 max-[767px]:min-h-[70px] max-[767px]:text-xs">{description}</p>
								<span className="mt-4 inline-flex min-h-10 items-center justify-center gap-1 rounded-[7px] border border-[#efc697] px-3 text-xs font-semibold text-[#a55e20] transition group-hover:bg-[#a55e20] group-hover:text-white max-[767px]:mt-1 max-[767px]:gap-1 max-[767px]:px-[7px] max-[767px]:text-[10px]">
									{action}<ArrowRight size={10} />
								</span>
							</div>
							<span className="sr-only">{label}</span>
						</>
					);
					return external ? (
						<a className="group min-h-[360px] overflow-hidden rounded-[13px] border border-[#e8d7b9] bg-[linear-gradient(145deg,#fffaf0,#f8ecd5)] shadow-[0_10px_28px_rgb(78_53_23_/_8%)] transition hover:-translate-y-1 hover:shadow-lg max-[767px]:min-h-[315px] max-[380px]:min-h-[340px]" href={websiteUrl(to)} key={name} aria-label={action}>
							{card}
						</a>
					) : (
						<Link className="group min-h-[360px] overflow-hidden rounded-[13px] border border-[#e8d7b9] bg-[linear-gradient(145deg,#fffaf0,#f8ecd5)] shadow-[0_10px_28px_rgb(78_53_23_/_8%)] transition hover:-translate-y-1 hover:shadow-lg max-[767px]:min-h-[315px] max-[380px]:min-h-[340px]" to={to} key={name} aria-label={action}>
							{card}
						</Link>
					);
				})}
			</div>
		</section>
	);
}
