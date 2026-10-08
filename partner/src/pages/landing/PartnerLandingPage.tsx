import { LandingContact } from "./LandingContact";
import { Destinations } from "./Destinations";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { PartnerRecruitment } from "./PartnerRecruitment";
import { PartnerServices } from "./PartnerServices";
import { TravelHero } from "./TravelHero";
import { TravelStories } from "./TravelStories";
import { WhyChoose } from "./WhyChoose";

function getWebsiteUrl(path: string) {
	const configuredWebsiteUrl = import.meta.env.VITE_WEBSITE_URL;
	if (configuredWebsiteUrl) return `${configuredWebsiteUrl.replace(/\/$/, "")}${path}`;
	if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
		return `${window.location.protocol}//${window.location.hostname}:3003${path}`;
	}
	return path;
}

export default function PartnerLandingPage() {
	const registrationUrl = getWebsiteUrl("/partner-registration");

	return (
		<main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbf4e6_0%,#f5e8d0_42%,#fbf3e4_74%,#f2e4ca_100%)] font-['DM_Sans','Segoe_UI',sans-serif] text-[15px] leading-[1.5] text-[#24231f] [&_button]:cursor-pointer [&_a:focus-visible]:outline-[3px] [&_a:focus-visible]:outline-[#efbb62] [&_a:focus-visible]:outline-offset-[3px] [&_button:focus-visible]:outline-[3px] [&_button:focus-visible]:outline-[#efbb62] [&_button:focus-visible]:outline-offset-[3px] [&_input:focus-visible]:outline-[3px] [&_input:focus-visible]:outline-[#efbb62] [&_input:focus-visible]:outline-offset-[3px] [&_select:focus-visible]:outline-[3px] [&_select:focus-visible]:outline-[#efbb62] [&_select:focus-visible]:outline-offset-[3px] [&_textarea:focus-visible]:outline-[3px] [&_textarea:focus-visible]:outline-[#efbb62] [&_textarea:focus-visible]:outline-offset-[3px] motion-reduce:scroll-auto motion-reduce:[transition-duration:.01ms] motion-reduce:[animation-duration:.01ms] motion-reduce:[animation-iteration-count:1] motion-reduce:[&_*]:scroll-auto motion-reduce:[&_*]:[transition-duration:.01ms] motion-reduce:[&_*]:[animation-duration:.01ms] motion-reduce:[&_*]:[animation-iteration-count:1]">
			<LandingHeader />
			<TravelHero />
			<PartnerServices websiteUrl={getWebsiteUrl} />
			<WhyChoose />
			<PartnerRecruitment registrationUrl={registrationUrl} />
			<Destinations />
			<TravelStories />
			<LandingContact />
			<LandingFooter registrationUrl={registrationUrl} websiteUrl={getWebsiteUrl} />
		</main>
	);
}
