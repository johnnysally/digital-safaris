import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, ChefHat, CircleHelp, Eye, EyeOff, Globe2, LockKeyhole, LogIn, Mail, ShoppingBag, Truck, Utensils, Wallet } from "lucide-react";
import authApi from "../../api/restaurant/authApi";
import { getApiErrorMessage } from "../../api/axios";
import storage from "../../utils/storage";
import loginPhoto from "../../../../website/public/Catering.jpg";

const benefits = [
	{ icon: ChefHat, title: "Manage Your Menu", detail: "Update offerings and availability" },
	{ icon: ShoppingBag, title: "Receive Orders", detail: "From nearby travellers and guests" },
	{ icon: Truck, title: "Track & Deliver", detail: "Keep your customers happy" },
	{ icon: Wallet, title: "Get Paid", detail: "Secure and hassle-free payments" },
];

export function RestaurantLoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(true);
	const [visible, setVisible] = useState(false);
	const [error, setError] = useState("");
	const [helpOpen, setHelpOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const location = useLocation();
	const navigate = useNavigate();
	const returnTo = (location.state as { from?: string } | null)?.from ?? "/partner/restaurant/dashboard";

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError("");
		try {
			const result = await authApi.login({ email: email.trim(), password });
			storage.setAccessToken("restaurant", result.accessToken, remember);
			storage.setRefreshToken("restaurant", result.refreshToken, remember);
			navigate(returnTo, { replace: true });
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Unable to sign in. Check your restaurant partner credentials."));
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="restaurant-login-page">
			<section className="restaurant-login-photo" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 22, 17, .79), rgba(15, 24, 19, .25) 72%, rgba(15, 24, 19, .08)), url("${loginPhoto}")` }}>
				<div className="restaurant-login-left-content">
					<Link to="/partner" className="restaurant-login-brand">
						<svg viewBox="0 0 194 47" aria-hidden="true">
							<path d="M8 22 34 8l12 11 16-15 18 18M24 18l10-6 6 6M48 17l14-13 15 18" fill="none" stroke="#eaa331" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
							<path d="M89 21c-2-9 0-15 2-19m-1 10-8-7m8 7 8-8m-8 8-9 1m9-1 9 2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
							<text x="0" y="42" fill="#fff" fontFamily="Georgia, serif" fontSize="23" fontWeight="bold">Digital<tspan fill="#eaa331">Safaris</tspan></text>
						</svg>
						<span>Travel <i /> Explore <i /> Experience</span>
					</Link>
					<div className="restaurant-login-left-message">
						<div className="restaurant-login-partner-badge"><Utensils size={15} /> Restaurant Partner Portal</div>
						<h1>Great Food.<br />More Journeys.<br /><em>Grow with DigitalSafaris.</em></h1>
						<p className="restaurant-login-left-intro">Manage your menu, receive orders,<br />track deliveries and get paid — all<br />from one platform.</p>
						<div className="restaurant-login-benefits">
							{benefits.map(({ icon: Icon, title, detail }) => (
								<div className="restaurant-login-benefit" key={title}>
									<span><Icon size={18} /></span>
									<div><strong>{title}</strong><small>{detail}</small></div>
								</div>
							))}
						</div>
					</div>
					<p className="restaurant-login-signoff">Local Flavours.<br />Global Travellers.</p>
				</div>
			</section>
			<section className="restaurant-login-side">
				<div className="restaurant-login-top-actions">
					<span className="restaurant-login-language"><Globe2 size={14} /> English <span>⌄</span></span>
					<button type="button" aria-label="Sign-in help" title="Sign-in help" onClick={() => setHelpOpen((open) => !open)}><CircleHelp size={18} /></button>
				</div>
				<div className="restaurant-login-form-wrap">
					<div className="restaurant-login-card">
						<div className="restaurant-login-form-badge"><Utensils size={15} /> Restaurant Partner</div>
						<h2>Welcome back</h2>
						<p className="restaurant-login-intro">Sign in to manage your restaurant, receive orders,<br className="restaurant-login-desktop-break" /> track deliveries and grow your business.</p>
						<form onSubmit={(event) => void submit(event)}>
							<label className="restaurant-login-field">
								<span>Email address</span>
								<div><Mail size={16} /><input type="email" autoComplete="username" placeholder="Email address" aria-label="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
							</label>
							<label className="restaurant-login-field">
								<span>Password</span>
								<div><LockKeyhole size={16} /><input type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Password" aria-label="Password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((value) => !value)}>{visible ? <Eye size={16} /> : <EyeOff size={16} />}</button></div>
							</label>
							<div className="restaurant-login-form-options">
								<label className="restaurant-login-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember me</label>
								<button type="button" className="restaurant-login-forgot" onClick={() => setHelpOpen(true)}>Forgot password?</button>
							</div>
							{error ? <p className="restaurant-login-error" role="alert">{error}</p> : null}
							{helpOpen ? <p className="restaurant-login-help" role="status">For password or account assistance, please contact your DigitalSafaris partner representative.</p> : null}
							<button className="restaurant-login-submit" type="submit" disabled={busy}>{busy ? "Signing in..." : <><LogInIcon /> Sign In</>}</button>
						</form>
						<div className="restaurant-login-divider"><span />or<span /></div>
						<div className="restaurant-login-credential-note"><Check size={15} /> Sign in with your registered restaurant account</div>
						<p className="restaurant-login-register">New to DigitalSafaris? <Link to="/partner">Visit the partner portal <ArrowRight size={13} /></Link></p>
					</div>
				</div>
				<div className="restaurant-login-landscape" aria-hidden="true">
					<svg viewBox="0 0 700 135" preserveAspectRatio="xMidYMax slice">
						<path d="M0 90 80 72l55 19 60-33 62 24 57-36 85 38 62-21 58 22 68-35 113 33v52H0z" />
						<path d="M0 110 87 92l91 20 74-29 83 25 80-35 87 34 83-23 115 24v27H0z" />
						<path d="M554 101c-2-21 1-39 4-52-10 5-19 10-27 14 7-11 17-19 27-24-4-8-11-14-19-17 13 0 24 6 31 16 8-10 20-15 34-16-10 5-16 11-20 19 12 2 24 8 34 17-13-4-25-8-38-9 4 14 7 31 7 52z" />
						<path d="M547 102h31v4h-31z" />
					</svg>
				</div>
			</section>
		</main>
	);
}

function LogInIcon() {
	return <span className="restaurant-login-submit-icon"><LogIn size={15} /></span>;
}
