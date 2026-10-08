import { ArrowLeft, ArrowRight, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchLandingReviews, type LandingReview } from "../../api/landingApi";
import { heroPhoto } from "./data";

export function TravelStories() {
	const [activeReview, setActiveReview] = useState(0);
	const [reviews, setReviews] = useState<LandingReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;
		fetchLandingReviews()
			.then((items) => {
				if (active) setReviews(items);
			})
			.catch(() => {
				if (active) setError("Traveler reviews are temporarily unavailable.");
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);

	const shiftReview = (offset: number) => setActiveReview((current) => (current + offset + reviews.length) % reviews.length);

	return (
		<section className="landing-stories" aria-labelledby="travel-stories-heading">
			<img className="landing-stories-backdrop" src={heroPhoto} alt="" loading="lazy" />
			<div className="landing-stories-shade" aria-hidden="true" />
			<div className="landing-container relative z-10">
				<div className="landing-section-heading text-center">
					<p className="eyebrow !text-[#f0b866]">REAL EXPERIENCES. REAL STORIES.</p>
					<h2 id="travel-stories-heading" className="landing-section-title text-white">What Our Travelers Say</h2>
					<p className="!text-white/75">Real experiences. Real stories. Trusted by happy travelers.</p>
				</div>
				{loading ? <p className="py-10 text-center text-white/80" role="status">Loading traveler reviews…</p> : null}
				{error ? <p className="py-10 text-center text-white/80" role="alert">{error}</p> : null}
				{!loading && !error && reviews.length === 0 ? <p className="py-10 text-center text-white/80">Traveler stories will appear here as reviews are shared.</p> : null}
				{reviews.length > 0 ? (
					<div className="landing-story-grid">
						{reviews.map((_, index) => {
							const person = reviews[(index + activeReview) % reviews.length];
							return (
								<article className="landing-story-card" key={person.id}>
									<div className="flex items-center gap-3">
										{person.image ? (
											<img className="h-12 w-12 rounded-full object-cover" src={person.image} alt="" loading="lazy" />
										) : (
											<span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ead7b8] text-sm font-bold text-[#644421]" aria-hidden="true">
												{person.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}
											</span>
										)}
										<div className="min-w-0">
											<h3 className="truncate text-sm font-bold">{person.name}</h3>
											<p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#7a746c]"><MapPin size={12} />{person.location}</p>
										</div>
									</div>
									<div className="landing-story-rating" aria-label={`${person.rating} out of 5 stars`}>
										{Array.from({ length: 5 }, (_, star) => <Star key={star} size={13} fill={star < person.rating ? "currentColor" : "none"} aria-hidden="true" />)}
									</div>
									<p>“{person.comment}”</p>
								</article>
							);
						})}
					</div>
				) : null}
				{reviews.length > 1 ? (
					<div className="landing-story-controls" aria-label="Testimonial carousel controls">
						<button type="button" aria-label="Previous testimonials" onClick={() => shiftReview(-1)}><ArrowLeft size={17} /></button>
						<div className="landing-story-dots">
							{reviews.map((review, index) => (
								<button
									type="button"
									key={review.id}
									aria-label={`Show testimonials starting with ${review.name}`}
									aria-current={activeReview === index}
									onClick={() => setActiveReview(index)}
								/>
							))}
						</div>
						<button type="button" aria-label="Next testimonials" onClick={() => shiftReview(1)}><ArrowRight size={17} /></button>
					</div>
				) : null}
			</div>
		</section>
	);
}
