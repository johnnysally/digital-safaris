import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Headphones, Mail, MapPin } from "lucide-react";
import axios, { getApiErrorMessage } from "../../api/axios";
import { heroPhoto } from "./data";

const initialForm = { name: "", email: "", phone: "", subject: "general", message: "" };

export function LandingContact() {
	const [formData, setFormData] = useState(initialForm);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);

	async function submitContact(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError("");
		try {
			await axios.post("/web/contact", formData);
			setSent(true);
			setFormData(initialForm);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "We could not send your message. Please try again."));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section className="landing-contact" id="contact" aria-labelledby="landing-contact-heading">
			<div className="landing-container landing-contact-layout">
				<div className="landing-contact-intro">
					<img src={heroPhoto} alt="" loading="lazy" />
					<div className="landing-contact-intro-shade" aria-hidden="true" />
					<div className="landing-contact-intro-copy">
						<p className="landing-contact-eyebrow">WE’RE HERE TO HELP</p>
						<h2 id="landing-contact-heading" className="landing-section-title">Let’s plan something unforgettable.</h2>
						<p>Whether you’re planning a Kenyan escape or growing your business, our team is ready to help you take the next step.</p>
						<div className="landing-contact-points">
							<div><span><Headphones size={17} /></span><p><strong>Personal support</strong><small>Real people, here when you need us.</small></p></div>
							<div><span><Mail size={17} /></span><p><strong>One simple message</strong><small>Tell us what you have in mind.</small></p></div>
							<div><span><MapPin size={17} /></span><p><strong>Rooted in Kenya</strong><small>Local knowledge, unforgettable journeys.</small></p></div>
						</div>
					</div>
					<span className="landing-contact-mark" aria-hidden="true">Travel · Explore · Experience</span>
				</div>

				<div className="landing-contact-form-card">
					<div className="landing-contact-form-heading">
						<p className="landing-contact-eyebrow">GET IN TOUCH</p>
						<h3>How can we help?</h3>
						<p>Share a few details and we’ll make sure your message reaches the right team.</p>
					</div>

					{sent ? (
						<div className="landing-contact-success" role="status">
							<CheckCircle2 size={27} />
							<div><strong>Message received</strong><span>Thank you. Our team will be in touch.</span></div>
							<button type="button" onClick={() => setSent(false)}>Send another message</button>
						</div>
					) : (
						<form className="landing-contact-form" onSubmit={submitContact}>
							<label>Your name<input autoComplete="name" name="name" placeholder="e.g. Amina Wanjiku" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></label>
							<label>Email address<input autoComplete="email" name="email" placeholder="you@example.com" required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></label>
							<label>Phone (optional)<input autoComplete="tel" name="phone" placeholder="+254" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></label>
							<label>What can we help with?<select name="subject" value={formData.subject} onChange={(event) => setFormData({ ...formData, subject: event.target.value })}><option value="general">General question</option><option value="partnership">Partner application</option><option value="portal">Partner portal support</option><option value="other">Other</option></select></label>
							<label className="landing-contact-message">Your message<textarea name="message" placeholder="Tell us a little about what you’re looking for..." required rows={4} value={formData.message} onChange={(event) => setFormData({ ...formData, message: event.target.value })} /></label>
							{error ? <p className="landing-contact-error" role="alert">{error}</p> : null}
							<button className="landing-contact-submit" disabled={submitting} type="submit">{submitting ? "Sending..." : "Send a message"} <ArrowRight size={16} /></button>
							<p className="landing-contact-privacy">Your details are only used to respond to your enquiry.</p>
						</form>
					)}
				</div>
			</div>
		</section>
	);
}
