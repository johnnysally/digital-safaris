import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Headphones, Mail, MapPin } from "lucide-react";
import axios, { getApiErrorMessage } from "../../api/axios";
import { isNonEmpty, isValidEmail, isValidPhoneNumber } from "../../utils/validators";
import { partnerImages } from "../../config/partnerImages";

const initialForm = { name: "", email: "", phone: "", subject: "general", message: "" };
const fieldClass = "my-0 min-h-[47px] w-full rounded-lg border border-[#e5dfd4] bg-white px-[13px] py-[11px] text-[13px] font-normal text-[#302d27] shadow-none placeholder:text-[#a39c91]";

export function LandingContact() {
	const [formData, setFormData] = useState(initialForm);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);

	async function submitContact(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!isNonEmpty(formData.name) || !isNonEmpty(formData.message)) {
			setError("Please provide your name and message.");
			return;
		}
		if (!isValidEmail(formData.email)) {
			setError("Enter a valid email address.");
			return;
		}
		if (formData.phone && !isValidPhoneNumber(formData.phone)) {
			setError("Enter a valid phone number or leave the phone field blank.");
			return;
		}
		setSubmitting(true);
		setError("");
		try {
			await axios.post("/web/contact", {
				...formData,
				name: formData.name.trim(),
				email: formData.email.trim(),
				phone: formData.phone.trim(),
				message: formData.message.trim(),
			});
			setSent(true);
			setFormData(initialForm);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "We could not send your message. Please try again."));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section className="scroll-mt-6 bg-[radial-gradient(ellipse_at_15%_0%,rgb(226_177_99_/.23),transparent_40%),linear-gradient(135deg,#f3e2c1,#fbf2df_48%,#ead5ae)] py-24 max-[767px]:py-[58px]" id="contact" aria-labelledby="landing-contact-heading">
			<div className="mx-auto grid w-[min(1280px,calc(100%_-_64px))] grid-cols-[.9fr_1.1fr] items-stretch gap-[34px] max-[1023px]:grid-cols-[.85fr_1.15fr] max-[1023px]:gap-5 max-[767px]:w-[min(calc(100%_-_36px),560px)] max-[767px]:grid-cols-1 max-[767px]:gap-4">
				<div className="relative flex min-h-[590px] items-end overflow-hidden rounded-[18px] bg-[#2a2118] text-white shadow-[0_22px_54px_rgb(43_34_22_/.12)] max-[1023px]:min-h-[560px] max-[767px]:min-h-[480px]">
					<img className="absolute inset-0 h-full w-full object-cover object-[60%_center]" src={partnerImages.landing.hero} alt="" loading="lazy" />
					<div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(25_18_12_/.1)_0%,rgb(27_20_14_/.46)_42%,rgb(25_18_12_/.93)_100%)]" aria-hidden="true" />
					<div className="relative z-[1] p-[42px] max-[1023px]:p-7 max-[767px]:px-[21px] max-[767px]:py-[25px]">
						<p className="text-[11px] font-bold tracking-[.2em] text-[#f0c16f]">WE’RE HERE TO HELP</p>
						<h2 id="landing-contact-heading" className="mt-3 max-w-[430px] font-['Cormorant_Garamond',Georgia,'Times_New_Roman',serif] text-[clamp(37px,4vw,52px)] leading-[.98] font-bold">Let’s plan something unforgettable.</h2>
						<p className="mt-[17px] max-w-[440px] text-sm leading-[1.75] text-white/[.82]">Whether you’re planning a Kenyan escape or growing your business, our team is ready to help you take the next step.</p>
						<div className="mt-[30px] grid gap-[17px]">
							<div className="flex items-center gap-3"><span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[#f1c06c]/[.48] bg-[#f1c06c]/[.12] text-[#f0c16f]"><Headphones size={17} /></span><p className="grid gap-0.5"><strong className="text-xs">Personal support</strong><small className="text-[11px] text-white/[.68]">Real people, here when you need us.</small></p></div>
							<div className="flex items-center gap-3"><span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[#f1c06c]/[.48] bg-[#f1c06c]/[.12] text-[#f0c16f]"><Mail size={17} /></span><p className="grid gap-0.5"><strong className="text-xs">One simple message</strong><small className="text-[11px] text-white/[.68]">Tell us what you have in mind.</small></p></div>
							<div className="flex items-center gap-3"><span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[#f1c06c]/[.48] bg-[#f1c06c]/[.12] text-[#f0c16f]"><MapPin size={17} /></span><p className="grid gap-0.5"><strong className="text-xs">Rooted in Kenya</strong><small className="text-[11px] text-white/[.68]">Local knowledge, unforgettable journeys.</small></p></div>
						</div>
					</div>
					<span className="absolute top-[25px] right-[25px] text-[9px] font-semibold tracking-[.15em] text-white/[.73] [writing-mode:vertical-rl] uppercase" aria-hidden="true">Travel · Explore · Experience</span>
				</div>

				<div className="relative overflow-hidden rounded-[18px] border border-[#996f33]/[.16] bg-[linear-gradient(150deg,#fffaf0,#f8ecd5)] p-[42px] shadow-[0_22px_54px_rgb(43_34_22_/.12)] max-[1023px]:p-7 max-[767px]:rounded-[14px] max-[767px]:px-[21px] max-[767px]:py-[25px]">
					<div>
						<p className="text-[11px] font-bold tracking-[.2em] text-[#a96f2b]">GET IN TOUCH</p>
						<h3 className="mt-[7px] font-['Cormorant_Garamond',Georgia,'Times_New_Roman',serif] text-[35px] leading-[1.1] font-bold text-[#2b261f] max-[767px]:text-[31px]">How can we help?</h3>
						<p className="mt-2 max-w-[440px] text-[13px] leading-[1.65] text-[#766f65]">Share a few details and we’ll make sure your message reaches the right team.</p>
					</div>

					{sent ? (
						<div className="mt-7 flex items-start gap-[13px] rounded-[10px] border border-[#d9e4d4] bg-[#f1f6ee] p-5 text-[#34523a]" role="status">
							<CheckCircle2 className="shrink-0" size={27} />
							<div className="grid gap-[5px] text-[13px]"><strong>Message received</strong><span className="text-xs">Thank you. Our team will be in touch.</span></div>
							<button className="ml-auto text-[11px] underline" type="button" onClick={() => setSent(false)}>Send another message</button>
						</div>
					) : (
						<form className="mt-[27px] grid grid-cols-2 gap-x-[15px] gap-y-[18px] max-[767px]:gap-x-[10px] max-[767px]:gap-y-[14px]" onSubmit={submitContact}>
							<label className="grid content-start gap-[7px] text-xs font-semibold text-[#454037]">Your name<input className={fieldClass} autoComplete="name" name="name" placeholder="e.g. Amina Wanjiku" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></label>
							<label className="grid content-start gap-[7px] text-xs font-semibold text-[#454037]">Email address<input className={fieldClass} autoComplete="email" name="email" placeholder="you@example.com" required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></label>
							<label className="grid content-start gap-[7px] text-xs font-semibold text-[#454037]">Phone (optional)<input className={fieldClass} autoComplete="tel" name="phone" placeholder="+254" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></label>
							<label className="grid content-start gap-[7px] text-xs font-semibold text-[#454037]">What can we help with?<select className={fieldClass} name="subject" value={formData.subject} onChange={(event) => setFormData({ ...formData, subject: event.target.value })}><option value="general">General question</option><option value="partnership">Partner application</option><option value="portal">Partner portal support</option><option value="other">Other</option></select></label>
							<label className="col-span-full grid content-start gap-[7px] text-xs font-semibold text-[#454037]">Your message<textarea className={`${fieldClass} min-h-[116px] resize-y leading-[1.55]`} name="message" placeholder="Tell us a little about what you’re looking for..." required rows={4} value={formData.message} onChange={(event) => setFormData({ ...formData, message: event.target.value })} /></label>
							{error ? <p className="col-span-full text-xs text-[#a7352a]" role="alert">{error}</p> : null}
							<button className="inline-flex min-h-12 items-center justify-self-start gap-[9px] whitespace-nowrap rounded-lg bg-[#b66a20] px-5 text-[13px] font-bold text-white hover:-translate-y-px hover:bg-[#985617] disabled:cursor-wait disabled:opacity-[.65]" disabled={submitting} type="submit">{submitting ? "Sending..." : "Send a message"} <ArrowRight size={16} /></button>
							<p className="self-center text-[10px] leading-[1.5] text-[#898276] max-[767px]:col-span-full">Your details are only used to respond to your enquiry.</p>
						</form>
					)}
				</div>
			</div>
		</section>
	);
}
