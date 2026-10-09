import { AtSign, BriefcaseBusiness, Camera, Globe2, Play } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { PartnerLogo } from "../../components/brand/PartnerLogo";
import { getApiErrorMessage } from "../../api/axios";
import { fetchLandingConfig, subscribeToNewsletter } from "../../api/landingApi";
import { partnerImages } from "../../config/partnerImages";

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
		<footer className="relative flex min-h-[420px] flex-col bg-[#17130f] text-[#f3eee4] max-[767px]:block max-[767px]:min-h-0">
			<img className="absolute inset-0 h-full w-full object-cover object-[center_56%]" src={partnerImages.landing.hero} alt="" aria-hidden="true" />
			<div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(27_19_12_/.26)_0%,rgb(26_19_13_/.52)_40%,rgb(18_15_12_/.84)_100%),linear-gradient(90deg,rgb(20_17_13_/.44),rgb(39_27_17_/.24)_50%,rgb(20_17_13_/.48))]" aria-hidden="true" />
			<div className="relative z-[1] mx-auto grid w-[min(1280px,calc(100%_-_64px))] flex-1 grid-cols-[1.2fr_.8fr_1.1fr_1.25fr] content-center gap-9 pt-[42px] pb-8 max-[1023px]:grid-cols-2 max-[1023px]:gap-[42px] max-[767px]:w-[min(calc(100%_-_36px),560px)] max-[767px]:flex-initial max-[767px]:gap-x-[22px] max-[767px]:gap-y-9 max-[767px]:pt-[55px] max-[767px]:pb-[42px]">
				<div>
					<a className="inline-flex items-center gap-3" href="#home">
						<PartnerLogo variant="landing-footer" />
					</a>
					<p className="mt-3 text-[13px] leading-[1.8] text-[#f3eee4]/[.68] max-[767px]:text-xs">Your trusted travel partner in Kenya. Book transport, accommodation, tours, restaurants and more — all in one place.</p>
					<div className="mt-4 flex gap-[10px]" aria-label="Social media">
						{socialLinks.filter(({ key }) => socialUrls[key]).map(({ key, label, icon: Icon }) => (
							<a className="grid h-9 w-9 place-items-center rounded-full border border-white/[.16] text-[#f5e6ce]" href={socialUrls[key] ?? "#"} key={label} aria-label={label} target="_blank" rel="noreferrer"><Icon size={17} /></a>
						))}
					</div>
					{configError ? <p className="mt-2 text-xs text-amber-100" role="status">{configError}</p> : null}
				</div>
				<div>
					<h2 className="mb-3 text-sm font-bold text-[#edbd6a] max-[767px]:mb-[13px] max-[767px]:text-xs">Quick Links</h2>
					<ul>
						<li className="mb-3 max-[767px]:mb-2"><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href="#home">Home</a></li>
						<li className="mb-3 max-[767px]:mb-2"><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href="#destinations">Destinations</a></li>
						<li className="mb-3 max-[767px]:mb-2"><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href="#services">Partners</a></li>
						<li className="mb-3 max-[767px]:mb-2"><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href="#about">About Us</a></li>
						<li><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href="#contact">Contact</a></li>
					</ul>
				</div>
				<div>
					<h2 className="mb-3 text-sm font-bold text-[#edbd6a] max-[767px]:mb-[13px] max-[767px]:text-xs">Partner With Us</h2>
					<ul>
						<li className="mb-3 max-[767px]:mb-2"><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href={registrationUrl}>Transport Partner</a></li>
						<li className="mb-3 max-[767px]:mb-2"><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href={registrationUrl}>Accommodation Partner</a></li>
						<li className="mb-3 max-[767px]:mb-2"><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href={registrationUrl}>Restaurant Partner</a></li>
						<li className="mb-3 max-[767px]:mb-2"><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href={registrationUrl}>Hotel Partner</a></li>
						<li><a className="text-[13px] leading-[1.8] text-[#f3eee4]/[.68] hover:text-white max-[767px]:text-xs" href={registrationUrl}>Become a Partner</a></li>
					</ul>
				</div>
				<div>
					<h2 className="mb-3 text-sm font-bold text-[#edbd6a] max-[767px]:mb-[13px] max-[767px]:text-xs">Subscribe to Our Newsletter</h2>
					<p className="mt-3 text-[13px] leading-[1.8] text-[#f3eee4]/[.68] max-[767px]:text-xs">Get the latest travel deals, destinations and inspiration.</p>
					{!subscribed ? (
						<form className="mt-5 flex gap-2" onSubmit={subscribe}>
							<label className="sr-only" htmlFor="landing-newsletter-email">Email address</label>
							<input className="min-h-[46px] min-w-0 rounded-[7px] border border-white/[.17] bg-white/[.07] px-[13px] text-xs text-white placeholder:text-white/[.48]" id="landing-newsletter-email" name="email" type="email" placeholder="Enter your email address" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
							<button className="min-h-[46px] shrink-0 rounded-[7px] bg-[#d89b3d] px-[15px] text-xs font-bold text-[#21170e]" type="submit" disabled={submitting}>{submitting ? "Sending..." : "Subscribe"}</button>
						</form>
					) : (
						<p className="mt-4 text-sm text-[#edbd6a]" role="status">Thanks — you’re subscribed to DigitalSafaris travel updates.</p>
					)}
					{error ? <p className="mt-3 text-xs text-red-300" role="alert">{error}</p> : null}
				</div>
			</div>
			<div className="relative z-[1] mx-auto flex min-h-[70px] w-[min(1280px,calc(100%_-_64px))] items-center justify-between gap-5 border-t border-white/[.11] text-xs text-[#f3eee4]/[.53] max-[767px]:w-[min(calc(100%_-_36px),560px)] max-[767px]:min-h-[86px] max-[767px]:flex-col max-[767px]:items-start max-[767px]:justify-center max-[767px]:gap-2 max-[767px]:text-[10px]">
				<p>© 2026 DigitalSafaris. All rights reserved.</p>
				<div className="flex gap-7 max-[767px]:gap-4">
					<a className="hover:text-white" href={websiteUrl("/privacy-policy")}>Privacy Policy</a>
					<a className="hover:text-white" href={websiteUrl("/terms-of-service")}>Terms of Service</a>
					<a className="hover:text-white" href="#contact">Help</a>
				</div>
			</div>
		</footer>
	);
}
