import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BusFront, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import authApi from "../../api/transport/authApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";
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
	const { signIn } = useAuth();
	const returnTo = (location.state as { from?: string } | null)?.from ?? "/partner/transport/dashboard";

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError("");
		setNotice("");
		try {
			const result = await authApi.login({ email, password });
			signIn("transport", result.accessToken, result.refreshToken, remember);
			navigate(returnTo, { replace: true });
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Unable to sign in. Check your transport partner credentials."));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<TransportAuthLayout>
			<div className="w-full">
				<div className="mb-[18px] inline-flex min-h-[34px] items-center gap-[9px] rounded-xl bg-[#f7e5c7] px-[13px] text-[.72rem] font-semibold text-[#99590d]"><BusFront size={17} /> Transport Partner</div>
				<header className="mb-[22px]">
					<h2 className="m-0 font-['Cormorant_Garamond',Georgia,serif] text-[clamp(2.15rem,3.2vw,2.55rem)] font-bold leading-none text-[#252321]">Welcome back</h2>
					<p className="mt-2.5 max-w-[370px] text-[.91rem] leading-[1.55] text-[#66615c]">Sign in to manage your transport services, fleet and bookings.</p>
				</header>
				<form className="flex flex-col gap-[13px]" onSubmit={handleSubmit}>
					<label className="flex min-h-12 min-w-0 items-center gap-[11px] rounded-[9px] border border-[#e5ddd1] bg-white/45 px-3 text-[#514a42] focus-within:border-[rgba(190,119,25,.7)] focus-within:shadow-[0_0_0_3px_rgba(190,119,25,.1)]">
						<span className="flex shrink-0 items-center"><Mail size={16} /></span>
						<input className="h-full min-w-0 w-full rounded-none border-0 bg-transparent p-0 text-[.76rem] text-[#302b26] shadow-none outline-none placeholder:text-[#8a847d]" aria-label="Email or phone number" type="text" autoComplete="username" placeholder="Email or phone number" value={email} onChange={(event) => setEmail(event.target.value)} required />
					</label>
					<label className="flex min-h-12 min-w-0 items-center gap-[11px] rounded-[9px] border border-[#e5ddd1] bg-white/45 px-3 text-[#514a42] focus-within:border-[rgba(190,119,25,.7)] focus-within:shadow-[0_0_0_3px_rgba(190,119,25,.1)]">
						<span className="flex shrink-0 items-center"><LockKeyhole size={16} /></span>
						<input className="h-full min-w-0 w-full rounded-none border-0 bg-transparent p-0 text-[.76rem] text-[#302b26] shadow-none outline-none placeholder:text-[#8a847d]" aria-label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
						<button className="grid h-7 w-7 shrink-0 place-items-center border-0 bg-transparent p-0 text-[#817a72]" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <Eye size={16} /> : <EyeOff size={16} />}</button>
					</label>
					<div className="flex items-center justify-between gap-3 text-[.7rem]">
						<label className="flex items-center gap-1.5 text-[#66615c]"><input className="accent-[#b87317]" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember me</label>
						<button className="border-0 bg-transparent p-0 text-[#8d5714]" type="button" onClick={() => setNotice("Password reset is not available in this portal yet. Please contact your DigitalSafaris administrator.")}>Forgot password?</button>
					</div>
					{error ? <div className="rounded-md border border-[#e6bdb4] bg-[#fff1ed] px-3 py-2.5 text-[.74rem] text-[#a33f2e]" role="alert">{error}</div> : null}
					{notice ? <div className="rounded-md border border-[#e8d8bb] bg-[#fff9ee] px-3 py-2.5 text-[.74rem] text-[#80501b]" role="status">{notice}</div> : null}
					<button className="flex min-h-[48px] items-center justify-center gap-2 rounded-[9px] border-0 bg-[#b87317] px-4 text-[.8rem] font-bold text-white shadow-[0_5px_13px_rgba(156,92,16,.18)] hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign In"}<ArrowRight size={17} /></button>
				</form>
				<div className="my-[17px] flex items-center gap-3 text-[.67rem] text-[#89827a] before:h-px before:flex-1 before:bg-[#e9e1d5] after:h-px after:flex-1 after:bg-[#e9e1d5]"><span>or</span></div>
				<button className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[9px] border border-[#e4ddd3] bg-white/55 text-[.75rem] font-semibold text-[#514a42] hover:bg-white" type="button" onClick={() => setNotice("Google sign-in is not enabled for transport partners yet. Please sign in with your email or phone.")}>
					<strong className="font-bold text-[#4285f4]" aria-hidden="true">G</strong> Continue with Google
				</button>
				<p className="mt-[18px] text-center text-[.72rem] text-[#706a62]">New to DigitalSafaris? <Link className="font-semibold text-[#99590d] no-underline hover:underline" to="/partner/transport/register">Become a Transport Partner</Link></p>
				<p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[.68rem] leading-normal text-[#847d74]"><ShieldCheck className="text-[#6c8c5d]" size={14} /> Sign in with your registered email or phone number.</p>
			</div>
		</TransportAuthLayout>
	);
}
