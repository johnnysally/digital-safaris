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
			<div className="transport-auth-form transport-register-form">
				<div className="transport-auth-role"><BusFront size={17} /> Transport Partner</div>
				{submitted ? (
					<div className="transport-register-success" role="status">
						<CheckCircle2 size={38} />
						<h2>Application received</h2>
						<p>Thanks for joining DigitalSafaris. Our team will review your application and notify you when your account is approved.</p>
						<Link className="transport-auth-submit" to="/partner/transport/login">Back to sign in<ArrowRight size={17} /></Link>
					</div>
				) : (
					<>
						<header className="transport-auth-heading">
							<h2>Become a partner</h2>
							<p>Set up your transport profile and start growing with DigitalSafaris.</p>
						</header>
						<form onSubmit={(event) => void handleSubmit(event)}>
							<div className="transport-register-grid">
								<label className="transport-auth-field"><span>First name</span><span className="transport-auth-input"><UserRound size={16} /><input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></span></label>
								<label className="transport-auth-field"><span>Last name</span><span className="transport-auth-input"><UserRound size={16} /><input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required /></span></label>
								<label className="transport-auth-field transport-register-span"><span>Email address</span><span className="transport-auth-input"><Mail size={16} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></span></label>
								<label className="transport-auth-field"><span>Country code</span><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}><option value="+254">+254 Kenya</option><option value="+255">+255 Tanzania</option><option value="+256">+256 Uganda</option><option value="+250">+250 Rwanda</option></select></label>
								<label className="transport-auth-field"><span>Phone number</span><span className="transport-auth-input"><Phone size={16} /><input type="tel" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(event.target.value)} required /></span></label>
								<label className="transport-auth-field transport-register-span"><span>Service area</span><span className="transport-auth-select"><MapPin size={16} /><select value={townId} onChange={(event) => setTownId(event.target.value)} required disabled={loadingLocations || locations.length === 0}><option value="">{loadingLocations ? "Loading service areas..." : "Select your town or city"}</option>{locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}</select></span></label>
								<label className="transport-auth-field transport-register-span"><span>License number <small>(optional)</small></span><input value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} /></label>
								<label className="transport-auth-field transport-register-span"><span>Address <small>(optional)</small></span><input autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} /></label>
								<fieldset className="transport-auth-services transport-register-span">
									<legend>Transport services <small>Select all that apply</small></legend>
									<div>{serviceOptions.map((option) => <label key={option.value}><input type="checkbox" checked={serviceTypes.includes(option.value)} onChange={() => toggleService(option.value)} />{option.label}</label>)}</div>
								</fieldset>
								<label className="transport-auth-field transport-register-span"><span>Password <small>(at least 8 characters)</small></span><span className="transport-auth-input"><LockKeyhole size={16} /><input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></span></label>
							</div>
							{locationError ? <div className="transport-auth-error" role="alert">{locationError}</div> : null}
							{error ? <div className="transport-auth-error" role="alert">{error}</div> : null}
							<button className="transport-auth-submit" type="submit" disabled={submitting || loadingLocations || locations.length === 0}>{submitting ? "Submitting application..." : "Create Transport Account"}<ArrowRight size={17} /></button>
						</form>
						<p className="transport-auth-switch">Already a partner? <Link to="/partner/transport/login">Sign in</Link></p>
						<p className="transport-auth-back"><Link to="/partner"><ArrowLeft size={14} /> All partner workspaces</Link></p>
					</>
				)}
			</div>
		</TransportAuthLayout>
	);
}
