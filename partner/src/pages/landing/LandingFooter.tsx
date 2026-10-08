import { AtSign, BriefcaseBusiness, Camera, Globe2, Play } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../../api/axios";
import { fetchLandingConfig, subscribeToNewsletter } from "../../api/landingApi";
import { heroPhoto } from "./data";

interface LandingFooterProps {
	registrationUrl: string;
	websiteUrl: (path: string) => string;
}

const socialLinks = [
	{ key: "facebook", label: "Facebook", icon: Globe2 },
	{ key: "x", label: "X", icon: AtSign },
	{ key: "instagram", label: "Instagram", icon: Camera },
	{ key: "youtube", label: "YouTube", icon: Play },
	{ key: "linkedin", label: "LinkedIn", icon: BriefcaseBusiness },
];

export function LandingFooter({ registrationUrl, websiteUrl }: LandingFooterProps) {
	const [subscribed, setSubscribed] = useState(false);
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [socialUrls, setSocialUrls] = useState<Record<string, string | null>>({});
	const [configError, setConfigError] = useState("");

	useEffect(() => {
		let active = true;
		fetchLandingConfig()
			.then((config) => {
				if (active) setSocialUrls(config.social_links || {});
			})
			.catch(() => {
				if (active) setConfigError("Social links are temporarily unavailable.");
			});
		return () => {
			active = false;
		};
	}, []);

	async function subscribe(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError("");
		try {
			await subscribeToNewsletter(email);
			setSubscribed(true);
			setEmail("");
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "We could not subscribe you right now. Please try again."));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<footer className="landing-footer">
			<img className="landing-footer-backdrop" src={heroPhoto} alt="" aria-hidden="true" />
			<div className="landing-footer-shade" aria-hidden="true" />
			<div className="landing-container landing-footer-main">
				<div>
					<a className="inline-flex items-center gap-3" href="#home">
						<span className="grid h-11 w-11 place-items-center rounded-full border border-amber-300 font-serif text-xl text-amber-200">D</span>
						<strong className="font-serif text-xl">Digital<span className="text-[#eab657]">Safaris</span></strong>
					</a>
					<p>Your trusted travel partner in Kenya. Book transport, accommodation, tours, restaurants and more — all in one place.</p>
					<div className="landing-social-links" aria-label="Social media">
						{socialLinks.filter(({ key }) => socialUrls[key]).map(({ key, label, icon: Icon }) => (
							<a href={socialUrls[key] ?? "#"} key={label} aria-label={label} target="_blank" rel="noreferrer"><Icon size={17} /></a>
						))}
					</div>
					{configError ? <p className="mt-2 text-xs text-amber-100" role="status">{configError}</p> : null}
				</div>
				<div>
					<h2>Quick Links</h2>
					<ul>
						<li><a className="hover:text-white" href="#home">Home</a></li>
						<li><a className="hover:text-white" href="#destinations">Destinations</a></li>
						<li><a className="hover:text-white" href="#services">Partners</a></li>
						<li><a className="hover:text-white" href="#about">About Us</a></li>
						<li><a className="hover:text-white" href="#contact">Contact</a></li>
					</ul>
				</div>
				<div>
					<h2>Partner With Us</h2>
					<ul>
						<li><a className="hover:text-white" href={registrationUrl}>Transport Partner</a></li>
						<li><a className="hover:text-white" href={registrationUrl}>Accommodation Partner</a></li>
						<li><a className="hover:text-white" href={registrationUrl}>Restaurant Partner</a></li>
						<li><a className="hover:text-white" href={registrationUrl}>Hotel Partner</a></li>
						<li><a className="hover:text-white" href={registrationUrl}>Become a Partner</a></li>
					</ul>
				</div>
				<div>
					<h2>Subscribe to Our Newsletter</h2>
					<p>Get the latest travel deals, destinations and inspiration.</p>
					{!subscribed ? (
						<form className="landing-newsletter" onSubmit={subscribe}>
							<label className="sr-only" htmlFor="landing-newsletter-email">Email address</label>
							<input id="landing-newsletter-email" name="email" type="email" placeholder="Enter your email address" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
							<button type="submit" disabled={submitting}>{submitting ? "Sending..." : "Subscribe"}</button>
						</form>
					) : (
						<p className="mt-4 text-sm text-[#edbd6a]" role="status">Thanks — you’re subscribed to DigitalSafaris travel updates.</p>
					)}
					{error ? <p className="mt-3 text-xs text-red-300" role="alert">{error}</p> : null}
				</div>
			</div>
			<div className="landing-container landing-footer-bottom">
				<p>© 2026 DigitalSafaris. All rights reserved.</p>
				<div>
					<a className="hover:text-white" href={websiteUrl("/privacy-policy")}>Privacy Policy</a>
					<a className="hover:text-white" href={websiteUrl("/terms-of-service")}>Terms of Service</a>
					<a className="hover:text-white" href="#contact">Help</a>
				</div>
			</div>
		</footer>
	);
}
