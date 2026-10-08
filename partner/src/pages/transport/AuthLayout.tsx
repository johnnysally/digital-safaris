import type { ReactNode } from "react";
import { BusFront, Globe2, Mountain, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import transportHero from "../../../../website/public/hero-bg.jpg";

export function TransportAuthLayout({ children }: { children: ReactNode }) {
	return (
		<main className="transport-auth-page">
			<section className="transport-auth-hero" aria-label="DigitalSafaris Transport Partner">
				<img src={transportHero} alt="" />
				<div className="transport-auth-hero-content">
					<Link className="transport-auth-brand" to="/partner/transport/login" aria-label="DigitalSafaris Transport Partner sign in">
						<Mountain size={36} strokeWidth={1.7} />
						<span><strong>Digital<span>Safaris</span></strong><small>Travel · Explore · Experience</small></span>
					</Link>
					<div className="transport-auth-promo">
						<span />
						<h1>Move people.<br />Connect destinations.<br />Grow with <strong>DigitalSafaris.</strong></h1>
						<p><BusFront size={21} /> Transport Partner Portal</p>
					</div>
				</div>
			</section>
			<section className="transport-auth-main">
				<div className="transport-auth-utility"><span><Globe2 size={15} /> English</span></div>
				<div className="transport-auth-content">{children}</div>
				<p className="transport-auth-security"><ShieldCheck size={16} /> Your account and partner data are protected.</p>
			</section>
		</main>
	);
}
