import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BusFront, CheckCircle2, LockKeyhole, Mail, MapPin, Phone, UserRound } from "lucide-react";
import axios, { getApiErrorMessage, unwrap } from "../../api/axios";
import authApi from "../../api/transport/authApi";
import { TransportAuthLayout } from "./AuthLayout";

interface TransportLocation {
	_id: string;
	name: string;
}

interface PublicSite {
	locations: TransportLocation[];
}

const serviceOptions = [
	{ value: "bike", label: "Motorbike" },
	{ value: "car", label: "Car / Taxi" },
	{ value: "van", label: "Van" },
	{ value: "truck", label: "Truck" },
	{ value: "bus", label: "Bus / Shuttle" },
	{ value: "boat", label: "Boat" },
];

const authFieldClass = "flex min-w-0 flex-col gap-[5px] text-[.68rem] font-semibold text-[#49433d]";
const authInputClass = "flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-[#e5ddd1] bg-white/50 px-2.5 text-[#514a42]";
const authTextInputClass = "h-full min-w-0 w-full border-0 bg-transparent p-0 text-[.72rem] text-[#302b26] shadow-none outline-none";
const authPlainInputClass = "min-h-10 w-full min-w-0 rounded-lg border border-[#e5ddd1] bg-white/50 px-2.5 text-[.72rem] text-[#302b26]";
const authButtonClass = "flex min-h-[44px] items-center justify-center gap-2 rounded-[9px] border-0 bg-[#b87317] px-4 text-[.8rem] font-bold text-white shadow-[0_5px_13px_rgba(156,92,16,.18)] hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60";

export function TransportRegisterPage() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [countryCode, setCountryCode] = useState("+254");
	const [password, setPassword] = useState("");
	const [townId, setTownId] = useState("");
	const [address, setAddress] = useState("");
	const [licenseNumber, setLicenseNumber] = useState("");
	const [serviceTypes, setServiceTypes] = useState<string[]>(["car"]);
	const [locations, setLocations] = useState<TransportLocation[]>([]);
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
					if (availableLocations.length === 0) setLocationError("No service areas are currently available. Please try again later.");
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

	function toggleService(value: string) {
		setServiceTypes((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		if (serviceTypes.length === 0) {
			setError("Choose at least one transport service.");
			return;
		}
		const selectedTown = locations.find((location) => location._id === townId);
		if (!selectedTown) {
			setError("Choose an available service area.");
			return;
		}
		setSubmitting(true);
		try {
			await authApi.register({
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				phone: phone.trim(),
				countryCode,
				password,
				licenseNumber: licenseNumber.trim() || undefined,
				town: selectedTown.name,
				address: address.trim() || undefined,
				locationId: selectedTown._id,
				serviceTypes,
			});
			setSubmitted(true);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Unable to submit your transport partner application."));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<TransportAuthLayout>
			<div className="w-full">
				<div className="mb-3 inline-flex min-h-[34px] items-center gap-[9px] rounded-xl bg-[#f7e5c7] px-[13px] text-[.72rem] font-semibold text-[#99590d]"><BusFront size={17} /> Transport Partner</div>
				{submitted ? (
					<div className="py-[34px] text-center" role="status">
						<CheckCircle2 className="mx-auto mb-[17px] text-[#63845e]" size={38} />
						<h2 className="m-0 font-['Cormorant_Garamond',Georgia,serif] text-[clamp(2.15rem,3.2vw,2.55rem)] font-bold leading-none text-[#252321]">Application received</h2>
						<p className="my-3 mb-[22px] text-[.84rem] leading-[1.6] text-[#66615c]">Thanks for joining DigitalSafaris. Our team will review your application and notify you when your account is approved.</p>
						<Link className={authButtonClass} to="/partner/transport/login">Back to sign in<ArrowRight size={17} /></Link>
					</div>
				) : (
					<>
						<header className="mb-4">
							<h2 className="m-0 font-['Cormorant_Garamond',Georgia,serif] text-[clamp(2.15rem,3.2vw,2.55rem)] font-bold leading-none text-[#252321]">Become a partner</h2>
							<p className="mt-2.5 max-w-[370px] text-[.91rem] leading-[1.55] text-[#66615c]">Set up your transport profile and start growing with DigitalSafaris.</p>
						</header>
						<form className="flex flex-col gap-[11px]" onSubmit={(event) => void handleSubmit(event)}>
							<div className="grid grid-cols-2 gap-x-3 gap-y-2.5 max-[480px]:grid-cols-1">
								<label className={authFieldClass}><span>First name</span><span className={authInputClass}><UserRound className="shrink-0" size={16} /><input className={authTextInputClass} autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></span></label>
								<label className={authFieldClass}><span>Last name</span><span className={authInputClass}><UserRound className="shrink-0" size={16} /><input className={authTextInputClass} autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required /></span></label>
								<label className={`${authFieldClass} col-span-full`}><span>Email address</span><span className={authInputClass}><Mail className="shrink-0" size={16} /><input className={authTextInputClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></span></label>
								<label className={authFieldClass}><span>Country code</span><select className={authPlainInputClass} value={countryCode} onChange={(event) => setCountryCode(event.target.value)}><option value="+254">+254 Kenya</option><option value="+255">+255 Tanzania</option><option value="+256">+256 Uganda</option><option value="+250">+250 Rwanda</option></select></label>
								<label className={authFieldClass}><span>Phone number</span><span className={authInputClass}><Phone className="shrink-0" size={16} /><input className={authTextInputClass} type="tel" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(event.target.value)} required /></span></label>
								<label className={`${authFieldClass} col-span-full`}><span>Service area</span><span className={authInputClass}><MapPin className="shrink-0" size={16} /><select className="min-h-[38px] min-w-0 w-full border-0 bg-transparent pl-0 text-[.72rem] text-[#302b26] shadow-none" value={townId} onChange={(event) => setTownId(event.target.value)} required disabled={loadingLocations || locations.length === 0}><option value="">{loadingLocations ? "Loading service areas..." : "Select your town or city"}</option>{locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}</select></span></label>
								<label className={`${authFieldClass} col-span-full`}><span>License number <small className="text-[.62rem] font-normal text-[#8a837b]">(optional)</small></span><input className={authPlainInputClass} value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} /></label>
								<label className={`${authFieldClass} col-span-full`}><span>Address <small className="text-[.62rem] font-normal text-[#8a837b]">(optional)</small></span><input className={authPlainInputClass} autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} /></label>
								<fieldset className="col-span-full min-w-0 border-0 p-0">
									<legend className="mb-[7px] text-[.68rem] font-semibold text-[#49433d]">Transport services <small className="ml-[5px] !text-[.62rem] font-normal text-[#8a837b]">Select all that apply</small></legend>
									<div className="grid grid-cols-3 gap-[7px] max-[480px]:grid-cols-2">{serviceOptions.map((option) => <label className="flex min-h-8 min-w-0 items-center gap-1.5 rounded-[7px] border border-[#e5ddd1] !px-[7px] !py-[5px] !text-[.62rem] font-normal text-[#57514a]" key={option.value}><input className="h-[14px] w-[14px] shrink-0 accent-[#b87317]" type="checkbox" checked={serviceTypes.includes(option.value)} onChange={() => toggleService(option.value)} />{option.label}</label>)}</div>
								</fieldset>
								<label className={`${authFieldClass} col-span-full`}><span>Password <small className="text-[.62rem] font-normal text-[#8a837b]">(at least 8 characters)</small></span><span className={authInputClass}><LockKeyhole className="shrink-0" size={16} /><input className={authTextInputClass} type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></span></label>
							</div>
							{locationError ? <div className="rounded-[7px] border border-[rgba(168,92,82,.22)] bg-[rgba(168,92,82,.08)] px-3 py-2.5 text-[.73rem] leading-[1.45] text-[#8e453e]" role="alert">{locationError}</div> : null}
							{error ? <div className="rounded-[7px] border border-[rgba(168,92,82,.22)] bg-[rgba(168,92,82,.08)] px-3 py-2.5 text-[.73rem] leading-[1.45] text-[#8e453e]" role="alert">{error}</div> : null}
							<button className={authButtonClass} type="submit" disabled={submitting || loadingLocations || locations.length === 0}>{submitting ? "Submitting application..." : "Create Transport Account"}<ArrowRight size={17} /></button>
						</form>
						<p className="mt-4 text-center text-[.73rem] text-[#5f5952]">Already a partner? <Link className="font-semibold text-[#a9600d] no-underline hover:underline" to="/partner/transport/login">Sign in</Link></p>
						<p className="mt-3 text-center text-[.66rem]"><Link className="inline-flex items-center gap-[5px] text-[#6b6258] no-underline hover:text-[#a9600d]" to="/partner"><ArrowLeft size={14} /> All partner workspaces</Link></p>
					</>
				)}
			</div>
		</TransportAuthLayout>
	);
}
