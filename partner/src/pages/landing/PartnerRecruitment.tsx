import { ArrowRight } from "lucide-react";
import { heroPhoto, partnerBenefits } from "./data";

interface PartnerRecruitmentProps {
	registrationUrl: string;
}

export function PartnerRecruitment({ registrationUrl }: PartnerRecruitmentProps) {
	return (
		<section className="landing-partner-banner" aria-labelledby="partner-banner-title">
			<img src={heroPhoto} alt="" loading="lazy" />
			<div />
			<div className="landing-container landing-partner-banner-content">
				<p>BUILT FOR LOCAL BUSINESSES</p>
				<h2 id="partner-banner-title" className="landing-section-title">Grow Your Business<br />with DigitalSafaris</h2>
				<p>Join our trusted network of transport, accommodation, restaurant, tour and hotel partners. Get more visibility, more bookings and grow your business.</p>
				<ul>
					{partnerBenefits.map((benefit) => <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>)}
				</ul>
				<a className="inline-flex items-center gap-2 bg-[#f2a92f] font-bold text-[#342316] hover:bg-[#ffc273]" href={registrationUrl}>
					Partner With Us <ArrowRight size={17} />
				</a>
			</div>
		</section>
	);
}
