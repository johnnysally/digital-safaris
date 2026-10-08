import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChefHat, LockKeyhole, Mail, MapPin, Phone, Store, Utensils } from "lucide-react";
import axios, { getApiErrorMessage, unwrap } from "../../api/axios";
import authApi from "../../api/restaurant/authApi";
import { isNonEmpty, isValidEmail, isValidPhoneNumber } from "../../utils/validators";
import loginPhoto from "../../../../website/public/Catering.jpg";

interface RestaurantLocation {
	_id: string;
	name: string;
	latitude?: number;
	longitude?: number;
}

interface PublicSite {
	locations: RestaurantLocation[];
}

const cuisineOptions = ["African", "American", "Chinese", "Indian", "Italian", "Japanese", "Mediterranean", "Seafood", "Other"];

export function RestaurantRegisterPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [countryCode, setCountryCode] = useState("+254");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [address, setAddress] = useState("");
	const [locationId, setLocationId] = useState("");
	const [cuisine, setCuisine] = useState("");
	const [locations, setLocations] = useState<RestaurantLocation[]>([]);
	const [loadingLocations, setLoadingLocations] = useState(true);
	const [locationError, setLocationError] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		let cancelled = false;
		async function loadLocations() {
			setLoadingLocations(true);
			setLocationError("");
			try {
				const response = await axios.get("/public/site");
				const site = unwrap<PublicSite>(response.data);
				const availableLocations = Array.isArray(site.locations) ? site.locations : [];
				if (!cancelled) {
					setLocations(availableLocations);
					if (availableLocations.length === 0) setLocationError("No service areas are available right now. Please try again later.");
				}
			} catch (requestError) {
				if (!cancelled) setLocationError(getApiErrorMessage(requestError, "Could not load available service areas."));
			} finally {
				if (!cancelled) setLoadingLocations(false);
			}
		}
		void loadLocations();
		return () => { cancelled = true; };
	}, []);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		if (!isNonEmpty(name) || !isNonEmpty(address)) {
			setError("Enter your restaurant name and address.");
			return;
		}
		if (!isValidEmail(email)) {
			setError("Enter a valid email address.");
			return;
		}
		if (!isValidPhoneNumber(phone)) {
			setError("Enter a valid phone number.");
			return;
		}
		const selectedLocation = locations.find((location) => location._id === locationId);
		if (!selectedLocation) {
			setError("Choose an available service area.");
			return;
		}
		const { latitude, longitude } = selectedLocation;
		if (typeof latitude !== "number" || !Number.isFinite(latitude) || typeof longitude !== "number" || !Number.isFinite(longitude)) {
			setError("This service area is missing its map coordinates. Please select another area or contact support.");
			return;
		}
		setSubmitting(true);
		try {
			await authApi.register({
				name: name.trim(),
				email: email.trim(),
				phone: phone.trim(),
				countryCode,
				password,
				town: selectedLocation.name,
				address: address.trim(),
				latitude,
				longitude,
				locationId: selectedLocation._id,
				cuisineTypes: cuisine ? [cuisine] : [],
			});
			setSubmitted(true);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Unable to submit your restaurant application. Please try again."));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<main className="relative grid min-h-screen w-full grid-cols-[minmax(0,55%)_minmax(0,45%)] overflow-hidden bg-[#f9f7f0] text-[#17251f] [font-family:Inter,Segoe_UI,sans-serif] max-[900px]:grid-cols-[minmax(0,48%)_minmax(0,52%)] max-[680px]:grid-cols-1 max-[680px]:overflow-auto min-h-screen items-stretch overflow-visible">
			<section className="relative min-h-screen w-full overflow-hidden bg-cover bg-center bg-[#322819] after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgba(5,20,15,.62),rgba(9,20,15,.18)_72%,rgba(12,23,17,.1)),linear-gradient(0deg,rgba(9,17,12,.5),transparent_50%)] after:content-[''] max-[680px]:min-h-[320px] max-[380px]:min-h-[300px]" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 22, 17, .79), rgba(15, 24, 19, .25) 72%, rgba(15, 24, 19, .08)), url("${loginPhoto}")` }}>
				<div className="absolute inset-[32px_clamp(26px,5.1vw,60px)_28px] z-[1] flex flex-col items-start text-white max-[900px]:right-6 max-[900px]:left-[27px] max-[680px]:inset-[20px_24px]">
					<Link to="/partner" className="grid w-max max-w-[220px] justify-items-start gap-px text-white no-underline [&>svg]:block [&>svg]:h-[53px] [&>svg]:w-[178px] [&>span]:pl-[7px] [&>span]:text-[9px] [&>span]:tracking-[.15px] [&>span]:text-white/85 [&>span>i]:mx-1 [&>span>i]:mb-[2px] [&>span>i]:inline-block [&>span>i]:size-[2px] [&>span>i]:rounded-full [&>span>i]:bg-[#e3aa40] max-[680px]:[&>svg]:h-[42px] max-[680px]:[&>svg]:w-[142px]">
						<svg viewBox="0 0 194 47" aria-hidden="true">
							<path d="M8 22 34 8l12 11 16-15 18 18M24 18l10-6 6 6M48 17l14-13 15 18" fill="none" stroke="#eaa331" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
							<path d="M89 21c-2-9 0-15 2-19m-1 10-8-7m8 7 8-8m-8 8-9 1m9-1 9 2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
							<text x="0" y="42" fill="#fff" fontFamily="Georgia, serif" fontSize="23" fontWeight="bold">Digital<tspan fill="#eaa331">Safaris</tspan></text>
						</svg>
						<span>Travel <i /> Explore <i /> Experience</span>
					</Link>
					<div className="mt-[clamp(24px,4.4vh,42px)] w-full max-[680px]:mt-[17px]">
						<div className="inline-flex min-h-8 items-center gap-2 rounded-[18px] bg-[rgba(134,131,76,.42)] px-3 text-[10px] font-semibold text-white [&_svg]:text-[#f2a935] max-[380px]:min-h-7 max-[380px]:text-[9px]"><Utensils size={15} /> Restaurant Partner Portal</div>
						<h1 className="my-4 mb-2 [font-family:Georgia,Times_New_Roman,serif] text-[clamp(27px,3vw,38px)] font-bold leading-[1.08] tracking-[-.8px] text-white max-[900px]:text-[clamp(25px,3.2vw,34px)] max-[680px]:my-[10px] max-[680px]:mb-[6px] max-[680px]:text-[26px] max-[380px]:text-[23px]">Bring your flavours<br />to more travellers.<br /><em className="text-[.76em] not-italic text-[#f1a63a]">Grow with DigitalSafaris.</em></h1>
						<p className="m-0 text-[12px] leading-[1.55] text-white/90 max-[900px]:text-[11px] max-[680px]:text-[10px]">Join our trusted network and connect<br />your restaurant with travellers<br />across Kenya.</p>
						<div className="mt-[17px] grid gap-[9px] max-[900px]:gap-[7px] max-[680px]:hidden">
							<div className="flex items-center gap-[11px] [&>span]:grid [&>span]:size-9 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[rgba(58,77,42,.72)] [&>span]:text-white [&>div]:grid [&>div]:gap-[2px] [&_strong]:text-[10px] [&_strong]:font-semibold [&_strong]:text-white [&_small]:text-[8px] [&_small]:text-white/75 max-[900px]:[&>span]:size-[31px]"><span><ChefHat size={18} /></span><div><strong>Showcase Your Menu</strong><small>Reach hungry travellers and guests</small></div></div>
							<div className="flex items-center gap-[11px] [&>span]:grid [&>span]:size-9 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[rgba(58,77,42,.72)] [&>span]:text-white [&>div]:grid [&>div]:gap-[2px] [&_strong]:text-[10px] [&_strong]:font-semibold [&_strong]:text-white [&_small]:text-[8px] [&_small]:text-white/75 max-[900px]:[&>span]:size-[31px]"><span><Store size={18} /></span><div><strong>Grow Your Business</strong><small>Get discovered by new customers</small></div></div>
						</div>
					</div>
					<p className="absolute right-0 bottom-0 m-0 -rotate-[5deg] text-right [font-family:'Segoe_Script',Brush_Script_MT,cursive] text-[22px] italic leading-[1.4] text-[#ffd27a] [text-shadow:0_2px_10px_rgba(0,0,0,.85)] max-[680px]:bottom-3 max-[680px]:text-[17px]">Local Flavours.<br />Global Travellers.</p>
				</div>
			</section>
			<section className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-[#faf8f1] px-7 pt-[68px] pb-[42px] [background-image:radial-gradient(ellipse_at_72%_13%,transparent_0_77px,rgba(190,179,150,.1)_78px,transparent_79px_91px,rgba(190,179,150,.08)_92px,transparent_93px_106px,rgba(190,179,150,.07)_107px,transparent_108px),radial-gradient(ellipse_at_92%_45%,transparent_0_115px,rgba(190,179,150,.08)_116px,transparent_117px_132px,rgba(190,179,150,.07)_133px,transparent_134px)] max-[900px]:px-[23px] max-[680px]:min-h-[590px] max-[680px]:px-[22px] max-[680px]:pt-[75px] max-[680px]:pb-[62px] max-[380px]:px-[17px] min-h-screen overflow-visible px-[34px] py-12 max-[680px]:min-h-[720px] max-[680px]:px-[22px] max-[680px]:py-[42px] max-[380px]:px-[17px]">
				<div className="relative z-[1] mx-auto my-auto w-full max-w-[382px] -translate-y-8 max-[680px]:max-w-[390px] max-[680px]:translate-y-0 my-auto w-full max-w-[460px] translate-y-0">
					<div className="w-full border-0 bg-transparent p-0 shadow-none [&_form]:grid [&_form]:gap-3 [&_label>span]:static [&_label>span]:mb-[5px] [&_label>span]:block [&_label>span]:h-auto [&_label>span]:w-auto [&_label>span]:overflow-visible [&_label>span]:text-[10px] [&_label>span]:font-semibold [&_label>span]:text-[#5c6d65] [&_label>span]:[clip:auto] [&_label>span]:[white-space:normal] [&_label>div]:min-h-[43px] [&_form>label>div>input]:text-[11px] [&_form>label>div>select]:text-[11px]">
						{!submitted ? (
							<>
								<div className="inline-flex min-h-8 items-center gap-2 rounded-[18px] bg-[#f8e9cc] px-3 text-[10px] font-semibold text-[#a85e07] [&_svg]:text-[#90621c]"><Utensils size={15} /> Restaurant Partner</div>
								<h2 className="mt-[15px] mb-[7px] [font-family:Georgia,Times_New_Roman,serif] text-[clamp(30px,3vw,38px)] font-bold leading-[1.05] tracking-[-.8px] text-[#152720] max-[380px]:text-[30px]">Create your account</h2>
								<p className="m-0 mb-[23px] text-[12px] leading-[1.55] text-[#617d7b]">Tell us about your restaurant to start your partner application.</p>
								<form onSubmit={(event) => void submit(event)}>
									<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
										<span>Restaurant name</span>
										<div><Store size={16} /><input autoComplete="organization" placeholder="Restaurant name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
									</label>
									<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
										<span>Email address</span>
										<div><Mail size={16} /><input type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
									</label>
									<div className="grid grid-cols-[104px_minmax(0,1fr)] items-end gap-[10px] max-[380px]:grid-cols-[92px_minmax(0,1fr)] max-[380px]:gap-[7px]">
										<label className="grid gap-[5px] text-[10px] font-semibold text-[#5c6d65] [&_select]:min-h-[43px] [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border [&_select]:border-[#e4e1d9] [&_select]:bg-white/60 [&_select]:px-2 [&_select]:text-[11px] [&_select]:text-[#24362e] [&_select:focus]:border-[#c18a3b] [&_select:focus]:shadow-[0_0_0_3px_rgba(193,138,59,.12)]"><span>Country code</span><select aria-label="Country code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}><option value="+254">+254 KE</option><option value="+255">+255 TZ</option><option value="+256">+256 UG</option><option value="+250">+250 RW</option></select></label>
										<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
											<span>Phone number</span>
											<div><Phone size={16} /><input type="tel" autoComplete="tel-national" placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} required /></div>
										</label>
									</div>
									<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
										<span>Service area</span>
										<div><MapPin size={16} /><select value={locationId} onChange={(event) => setLocationId(event.target.value)} required disabled={loadingLocations || locations.length === 0}><option value="">{loadingLocations ? "Loading service areas..." : "Select town or city"}</option>{locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}</select></div>
									</label>
									<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
										<span>Street address</span>
										<div><MapPin size={16} /><input autoComplete="street-address" placeholder="Street address or neighbourhood" value={address} onChange={(event) => setAddress(event.target.value)} required /></div>
									</label>
									<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
										<span>Cuisine type</span>
										<div><ChefHat size={16} /><select value={cuisine} onChange={(event) => setCuisine(event.target.value)}><option value="">Select cuisine (optional)</option>{cuisineOptions.map((option) => <option key={option} value={option.toLowerCase()}>{option}</option>)}</select></div>
									</label>
									<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
										<span>Password</span>
										<div><LockKeyhole size={16} /><input type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
									</label>
									{locationError ? <p className="m-0 rounded-md bg-[#fbefed] p-[9px_10px] text-[10px] leading-[1.4] text-[#984d43]" role="alert">{locationError}</p> : null}
									{error ? <p className="m-0 rounded-md bg-[#fbefed] p-[9px_10px] text-[10px] leading-[1.4] text-[#984d43]" role="alert">{error}</p> : null}
									<button className="mt-px flex min-h-[41px] w-full items-center justify-center gap-[9px] rounded-[9px] border border-[#cf8714] bg-[linear-gradient(100deg,#c27a0b,#cb7807)] px-3 text-[12px] font-bold text-white shadow-[0_2px_4px_rgba(135,81,5,.12)] disabled:cursor-wait disabled:opacity-[.68]" type="submit" disabled={submitting || loadingLocations || locations.length === 0}>{submitting ? "Submitting application..." : <>Create Restaurant Account <ArrowRight size={16} /></>}</button>
								</form>
								<p className="mt-[18px] mb-2 text-center text-[10px] text-[#6a827e]">Already have an account? <Link to="/partner/restaurant/login">Sign in <ArrowRight size={13} /></Link></p>
							</>
						) : (
							<div className="py-[22px] text-center [&>span]:mx-auto [&>span]:mb-[18px] [&>span]:grid [&>span]:size-14 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#e9eedf] [&>span]:text-[#557044] [&_p]:my-3 [&_p]:mb-6 [&_p]:text-[12px] [&_p]:leading-[1.65] [&_p]:text-[#617d7b]" role="status">
								<span><CheckCircle2 size={28} /></span>
								<h2 className="mt-[15px] mb-[7px] [font-family:Georgia,Times_New_Roman,serif] text-[clamp(30px,3vw,38px)] font-bold leading-[1.05] tracking-[-.8px] text-[#152720] max-[380px]:text-[30px]">Application received</h2>
								<p>Thanks for joining DigitalSafaris. Our team will review your restaurant application and notify you when your account is approved.</p>
								<Link className="mt-px flex min-h-[41px] w-full items-center justify-center gap-[9px] rounded-[9px] border border-[#cf8714] bg-[linear-gradient(100deg,#c27a0b,#cb7807)] px-3 text-[12px] font-bold text-white shadow-[0_2px_4px_rgba(135,81,5,.12)]" to="/partner/restaurant/login">Back to sign in <ArrowRight size={16} /></Link>
							</div>
						)}
					</div>
				</div>
			</section>
		</main>
	);
}
