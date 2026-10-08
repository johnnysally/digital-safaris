import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, ChefHat, CircleHelp, Eye, EyeOff, Globe2, LockKeyhole, LogIn, Mail, ShoppingBag, Truck, Utensils, Wallet } from "lucide-react";
import authApi from "../../api/restaurant/authApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { PartnerLogo } from "../../components/brand/PartnerLogo";
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
	const { signIn } = useAuth();
	const returnTo = (location.state as { from?: string } | null)?.from ?? "/partner/restaurant/dashboard";

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError("");
		try {
			const result = await authApi.login({ email: email.trim(), password });
			signIn("restaurant", result.accessToken, result.refreshToken, remember);
			navigate(returnTo, { replace: true });
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Unable to sign in. Check your restaurant partner credentials."));
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="relative grid min-h-screen w-full grid-cols-[minmax(0,55%)_minmax(0,45%)] overflow-hidden bg-[#f9f7f0] text-[#17251f] [font-family:Inter,Segoe_UI,sans-serif] max-[900px]:grid-cols-[minmax(0,48%)_minmax(0,52%)] max-[680px]:grid-cols-1 max-[680px]:overflow-auto">
			<section className="relative min-h-screen w-full overflow-hidden bg-cover bg-center bg-[#322819] after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgba(5,20,15,.62),rgba(9,20,15,.18)_72%,rgba(12,23,17,.1)),linear-gradient(0deg,rgba(9,17,12,.5),transparent_50%)] after:content-[''] max-[680px]:min-h-[320px] max-[380px]:min-h-[300px]" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 22, 17, .79), rgba(15, 24, 19, .25) 72%, rgba(15, 24, 19, .08)), url("${loginPhoto}")` }}>
				<div className="absolute inset-[32px_clamp(26px,5.1vw,60px)_28px] z-[1] flex flex-col items-start text-white max-[900px]:right-6 max-[900px]:left-[27px] max-[680px]:inset-[20px_24px]">
					<Link to="/partner" className="grid no-underline">
						<PartnerLogo variant="restaurant-auth" />
					</Link>
					<div className="mt-[clamp(24px,4.4vh,42px)] w-full max-[680px]:mt-[17px]">
						<div className="inline-flex min-h-8 items-center gap-2 rounded-[18px] bg-[rgba(134,131,76,.42)] px-3 text-[10px] font-semibold text-white [&_svg]:text-[#f2a935] max-[380px]:min-h-7 max-[380px]:text-[9px]"><Utensils size={15} /> Restaurant Partner Portal</div>
						<h1 className="my-4 mb-2 [font-family:Georgia,Times_New_Roman,serif] text-[clamp(27px,3vw,38px)] font-bold leading-[1.08] tracking-[-.8px] text-white max-[900px]:text-[clamp(25px,3.2vw,34px)] max-[680px]:my-[10px] max-[680px]:mb-[6px] max-[680px]:text-[26px] max-[380px]:text-[23px]">Great Food.<br />More Journeys.<br /><em className="text-[.76em] not-italic text-[#f1a63a]">Grow with DigitalSafaris.</em></h1>
						<p className="m-0 text-[12px] leading-[1.55] text-white/90 max-[900px]:text-[11px] max-[680px]:text-[10px]">Manage your menu, receive orders,<br />track deliveries and get paid — all<br />from one platform.</p>
						<div className="mt-[17px] grid gap-[9px] max-[900px]:gap-[7px] max-[680px]:hidden">
							{benefits.map(({ icon: Icon, title, detail }) => (
								<div className="flex items-center gap-[11px] [&>span]:grid [&>span]:size-9 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[rgba(58,77,42,.72)] [&>span]:text-white [&>div]:grid [&>div]:gap-[2px] [&_strong]:text-[10px] [&_strong]:font-semibold [&_strong]:text-white [&_small]:text-[8px] [&_small]:text-white/75 max-[900px]:[&>span]:size-[31px]" key={title}>
									<span><Icon size={18} /></span>
									<div><strong>{title}</strong><small>{detail}</small></div>
								</div>
							))}
						</div>
					</div>
					<p className="absolute right-0 bottom-0 m-0 -rotate-[5deg] text-right [font-family:'Segoe_Script',Brush_Script_MT,cursive] text-[22px] italic leading-[1.4] text-[#ffd27a] [text-shadow:0_2px_10px_rgba(0,0,0,.85)] max-[680px]:bottom-3 max-[680px]:text-[17px]">Local Flavours.<br />Global Travellers.</p>
				</div>
			</section>
			<section className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-[#faf8f1] px-7 pt-[68px] pb-[42px] [background-image:radial-gradient(ellipse_at_72%_13%,transparent_0_77px,rgba(190,179,150,.1)_78px,transparent_79px_91px,rgba(190,179,150,.08)_92px,transparent_93px_106px,rgba(190,179,150,.07)_107px,transparent_108px),radial-gradient(ellipse_at_92%_45%,transparent_0_115px,rgba(190,179,150,.08)_116px,transparent_117px_132px,rgba(190,179,150,.07)_133px,transparent_134px)] max-[900px]:px-[23px] max-[680px]:min-h-[590px] max-[680px]:px-[22px] max-[680px]:pt-[75px] max-[680px]:pb-[62px] max-[380px]:px-[17px]">
				<div className="absolute top-[23px] right-[30px] z-[2] flex items-center gap-[14px] [&>button]:grid [&>button]:size-6 [&>button]:place-items-center [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-[#26352f] max-[680px]:top-[17px] max-[680px]:right-5">
					<span className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-[#e9e6dd] bg-white/55 px-3 text-[10px] text-[#34443e] [&_svg]:text-[#70837a] [&>span]:ml-[3px] [&>span]:text-[15px] [&>span]:text-[#536259]"><Globe2 size={14} /> English <span>⌄</span></span>
					<button type="button" aria-label="Sign-in help" title="Sign-in help" onClick={() => setHelpOpen((open) => !open)}><CircleHelp size={18} /></button>
				</div>
				<div className="relative z-[1] mx-auto my-auto w-full max-w-[382px] -translate-y-8 max-[680px]:max-w-[390px] max-[680px]:translate-y-0">
					<div className="w-full border-0 bg-transparent p-0 shadow-none [&_form]:grid [&_form]:gap-[15px]">
						<div className="inline-flex min-h-8 items-center gap-2 rounded-[18px] bg-[#f8e9cc] px-3 text-[10px] font-semibold text-[#a85e07] [&_svg]:text-[#90621c]"><Utensils size={15} /> Restaurant Partner</div>
						<h2 className="mt-[15px] mb-[7px] [font-family:Georgia,Times_New_Roman,serif] text-[clamp(30px,3vw,38px)] font-bold leading-[1.05] tracking-[-.8px] text-[#152720] max-[380px]:text-[30px]">Welcome back</h2>
						<p className="m-0 mb-[23px] text-[12px] leading-[1.55] text-[#617d7b]">Sign in to manage your restaurant, receive orders,<br className="max-[680px]:hidden" /> track deliveries and grow your business.</p>
						<form onSubmit={(event) => void submit(event)}>
							<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
								<span>Email address</span>
								<div><Mail size={16} /><input type="email" autoComplete="username" placeholder="Email address" aria-label="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
							</label>
							<label className="block text-[0] text-[#62716a] [&>span]:sr-only [&>div]:flex [&>div]:min-h-[46px] [&>div]:items-center [&>div]:gap-[10px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#e4e1d9] [&>div]:bg-white/60 [&>div]:px-3 [&>div]:text-[#34453d] [&>div]:transition [&>div:focus-within]:border-[#c18a3b] [&>div:focus-within]:shadow-[0_0_0_3px_rgba(193,138,59,.12)] [&>div>svg]:shrink-0 [&>div>svg]:text-[#263b33] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[11px] [&_input]:text-[#24362e] [&_input]:outline-none [&_input::placeholder]:text-[#8c9a9e] [&_button]:grid [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[3px] [&_button]:text-[#9ba7a5] [&_select]:min-w-0 [&_select]:flex-1 [&_select]:border-0 [&_select]:bg-transparent [&_select]:p-0 [&_select]:text-[11px] [&_select]:text-[#24362e]">
								<span>Password</span>
								<div><LockKeyhole size={16} /><input type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Password" aria-label="Password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((value) => !value)}>{visible ? <Eye size={16} /> : <EyeOff size={16} />}</button></div>
							</label>
							<div className="-mt-px flex items-center justify-between gap-2">
								<label className="inline-flex items-center gap-2 text-[9px] text-[#6a827e] [&_input]:m-0 [&_input]:size-[15px] [&_input]:accent-[#be760d]"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember me</label>
								<button type="button" className="border-0 bg-transparent p-0 text-[9px] text-[#b86b08]" onClick={() => setHelpOpen(true)}>Forgot password?</button>
							</div>
							{error ? <p className="m-0 rounded-md bg-[#fbefed] p-[9px_10px] text-[10px] leading-[1.4] text-[#984d43]" role="alert">{error}</p> : null}
							{helpOpen ? <p className="m-0 rounded-md bg-[#f3eddd] p-[9px_10px] text-[10px] leading-[1.4] text-[#6d654f]" role="status">For password or account assistance, please contact your DigitalSafaris partner representative.</p> : null}
							<button className="mt-px flex min-h-[41px] w-full items-center justify-center gap-[9px] rounded-[9px] border border-[#cf8714] bg-[linear-gradient(100deg,#c27a0b,#cb7807)] px-3 text-[12px] font-bold text-white shadow-[0_2px_4px_rgba(135,81,5,.12)] disabled:cursor-wait disabled:opacity-[.68]" type="submit" disabled={busy}>{busy ? "Signing in..." : <><LogInIcon /> Sign In</>}</button>
						</form>
						<div className="my-4 flex items-center gap-3 text-[10px] text-[#85877e] [&_span]:h-px [&_span]:flex-1 [&_span]:bg-[#e5e1d7]"><span />or<span /></div>
						<div className="flex items-center gap-2 text-[10px] text-[#6a827e]"><Check size={15} /> Sign in with your registered restaurant account</div>
						<p className="mt-[18px] mb-2 text-center text-[10px] text-[#6a827e]">Don’t have an account?</p>
						<Link className="mt-3 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[9px] border border-[#c4821e] bg-white/50 text-[12px] font-bold text-[#9a5d09] no-underline transition-colors hover:border-[#bd760e] hover:bg-[#bd760e] hover:text-white" to="/partner/restaurant/register">Create Account <ArrowRight size={15} /></Link>
					</div>
				</div>
				<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-[118px] opacity-[.26]" aria-hidden="true">
					<svg className="h-full w-full" viewBox="0 0 700 135" preserveAspectRatio="xMidYMax slice">
						<path className="fill-[#b9b49d]" d="M0 90 80 72l55 19 60-33 62 24 57-36 85 38 62-21 58 22 68-35 113 33v52H0z" />
						<path className="fill-[#d0c9af]" d="M0 110 87 92l91 20 74-29 83 25 80-35 87 34 83-23 115 24v27H0z" />
						<path className="fill-[#98967e]" d="M554 101c-2-21 1-39 4-52-10 5-19 10-27 14 7-11 17-19 27-24-4-8-11-14-19-17 13 0 24 6 31 16 8-10 20-15 34-16-10 5-16 11-20 19 12 2 24 8 34 17-13-4-25-8-38-9 4 14 7 31 7 52z" />
						<path className="fill-[#98967e]" d="M547 102h31v4h-31z" />
					</svg>
				</div>
			</section>
		</main>
	);
}

function LogInIcon() {
	return <span className="inline-flex"><LogIn size={15} /></span>;
}
