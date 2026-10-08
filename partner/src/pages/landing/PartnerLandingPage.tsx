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
		<main className="landing-page">
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
