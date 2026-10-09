import { ArrowRight } from "lucide-react";
import { partnerBenefits } from "./data";
import { partnerImages } from "../../config/partnerImages";

interface PartnerRecruitmentProps {
	registrationUrl: string;
}

export function PartnerRecruitment({ registrationUrl }: PartnerRecruitmentProps) {
	return (
		<section className="relative flex min-h-[450px] items-center overflow-hidden bg-[#27190f] text-white max-[767px]:min-h-[510px] max-[767px]:items-start" aria-labelledby="partner-banner-title">
			<img className="absolute inset-0 h-full w-full object-cover" src={partnerImages.landing.hero} alt="" loading="lazy" />
			<div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(28_20_13_/.96)_0%,rgb(32_22_14_/.87)_46%,rgb(30_21_14_/.35)_100%)] max-[767px]:bg-[linear-gradient(90deg,rgb(28_20_13_/.94),rgb(32_22_14_/.74))]" />
			<div className="relative z-[1] mx-auto w-[min(1280px,calc(100%_-_64px))] py-[72px] max-[767px]:w-[min(calc(100%_-_36px),560px)] max-[767px]:py-[65px]">
				<p className="mb-3 text-[11px] font-bold tracking-[.2em] text-[#f2c16d]">BUILT FOR LOCAL BUSINESSES</p>
				<h2 id="partner-banner-title" className="font-['Cormorant_Garamond',Georgia,'Times_New_Roman',serif] text-[clamp(42px,5vw,64px)] leading-[.98] font-bold">Grow Your Business<br />with DigitalSafaris</h2>
				<p className="mt-[18px] max-w-[610px] text-base leading-[1.7] text-white/[.85] max-[767px]:text-sm">Join our trusted network of transport, accommodation, restaurant, tour and hotel partners. Get more visibility, more bookings and grow your business.</p>
				<ul className="mt-6 grid max-w-[600px] grid-cols-2 gap-x-6 gap-y-3 text-[13px] max-[767px]:grid-cols-1 max-[767px]:gap-y-[9px] max-[767px]:text-xs">
					{partnerBenefits.map((benefit) => <li className="flex items-center gap-[9px]" key={benefit}><span className="text-lg text-[#f2c16d]" aria-hidden="true">✓</span>{benefit}</li>)}
				</ul>
				<a className="mt-[27px] inline-flex min-h-[50px] items-center gap-2 rounded-[7px] bg-[#f2a92f] px-[22px] text-sm font-bold text-[#342316] hover:bg-[#ffc273]" href={registrationUrl}>
					Partner With Us <ArrowRight size={17} />
				</a>
			</div>
		</section>
	);
}
