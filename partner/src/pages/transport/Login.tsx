import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BusFront, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import authApi from "../../api/transport/authApi";
import { getApiErrorMessage } from "../../api/axios";
import storage from "../../utils/storage";
import { TransportAuthLayout } from "./AuthLayout";

export function TransportLoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const location = useLocation();
	const navigate = useNavigate();
	const returnTo = (location.state as { from?: string } | null)?.from ?? "/partner/transport/dashboard";

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError("");
		setNotice("");
		try {
			const result = await authApi.login({ email, password });
			storage.setAccessToken("transport", result.accessToken, remember);
			storage.setRefreshToken("transport", result.refreshToken, remember);
			navigate(returnTo, { replace: true });
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Unable to sign in. Check your transport partner credentials."));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<TransportAuthLayout>
			<div className="transport-auth-form">
				<div className="transport-auth-role"><BusFront size={17} /> Transport Partner</div>
				<header className="transport-auth-heading">
					<h2>Welcome back</h2>
					<p>Sign in to manage your transport services, fleet and bookings.</p>
				</header>
				<form onSubmit={handleSubmit}>
					<label className="transport-auth-input">
						<span><Mail size={16} /></span>
						<input aria-label="Email or phone number" type="text" autoComplete="username" placeholder="Email or phone number" value={email} onChange={(event) => setEmail(event.target.value)} required />
					</label>
					<label className="transport-auth-input">
						<span><LockKeyhole size={16} /></span>
						<input aria-label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
						<button className="transport-auth-visibility" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <Eye size={16} /> : <EyeOff size={16} />}</button>
					</label>
					<div className="transport-auth-options">
						<label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember me</label>
						<button type="button" onClick={() => setNotice("Password reset is not available in this portal yet. Please contact your DigitalSafaris administrator.")}>Forgot password?</button>
					</div>
					{error ? <div className="transport-auth-error" role="alert">{error}</div> : null}
					{notice ? <div className="transport-auth-notice" role="status">{notice}</div> : null}
					<button className="transport-auth-submit" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign In"}<ArrowRight size={17} /></button>
				</form>
				<div className="transport-auth-divider"><span>or</span></div>
				<button className="transport-auth-google" type="button" onClick={() => setNotice("Google sign-in is not enabled for transport partners yet. Please sign in with your email or phone.")}>
					<strong aria-hidden="true">G</strong> Continue with Google
				</button>
				<p className="transport-auth-switch">New to DigitalSafaris? <Link to="/partner/transport/register">Become a Transport Partner</Link></p>
				<p className="transport-auth-note"><ShieldCheck size={14} /> Sign in with your registered email or phone number.</p>
			</div>
		</TransportAuthLayout>
	);
}
