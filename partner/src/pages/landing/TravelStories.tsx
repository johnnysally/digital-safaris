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
		<section className="relative min-h-[490px] overflow-hidden bg-[#26170e] text-white max-[767px]:min-h-[640px]" aria-labelledby="travel-stories-heading">
			<img className="absolute inset-0 h-full w-full object-cover object-[center_56%] opacity-[.82]" src={heroPhoto} alt="" loading="lazy" />
			<div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(31_22_15_/.52)_0%,rgb(35_25_17_/.35)_52%,rgb(25_20_15_/.48)_100%)]" aria-hidden="true" />
			<div className="relative z-10 mx-auto w-[min(1280px,calc(100%_-_64px))] py-[76px] pb-[70px] max-[767px]:w-[min(calc(100%_-_36px),560px)] max-[767px]:py-[62px]">
				<div className="mb-8 text-center">
					<p className="mb-2 text-[11px] font-bold tracking-[.2em] text-[#f0b866]">REAL EXPERIENCES. REAL STORIES.</p>
					<h2 id="travel-stories-heading" className="font-['Cormorant_Garamond',Georgia,'Times_New_Roman',serif] text-[clamp(30px,3vw,42px)] leading-[1.12] font-bold tracking-[-.02em] text-white max-[767px]:text-[32px]">What Our Travelers Say</h2>
					<p className="mt-[9px] text-[15px] text-white/75">Real experiences. Real stories. Trusted by happy travelers.</p>
				</div>
				{loading ? <p className="py-10 text-center text-white/80" role="status">Loading traveler reviews…</p> : null}
				{error ? <p className="py-10 text-center text-white/80" role="alert">{error}</p> : null}
				{!loading && !error && reviews.length === 0 ? <p className="py-10 text-center text-white/80">Traveler stories will appear here as reviews are shared.</p> : null}
				{reviews.length > 0 ? (
					<div className="grid grid-cols-4 gap-[18px] max-[767px]:grid-cols-1 max-[767px]:gap-3">
						{reviews.map((_, index) => {
							const person = reviews[(index + activeReview) % reviews.length];
							return (
								<article className="relative flex min-h-[220px] flex-col rounded-[14px] border border-[#eddab9]/[.19] bg-[linear-gradient(145deg,rgb(51_41_31_/.91),rgb(37_31_26_/.90))] p-[23px] text-[#f7f1e7] shadow-[0_14px_32px_rgb(0_0_0_/.18)] backdrop-blur-[12px] transition-[transform,border-color,background-color] duration-[250ms] ease-[ease] hover:-translate-y-1 hover:border-[#edbe6d]/[.42] hover:bg-[linear-gradient(145deg,rgb(61_47_33_/.95),rgb(41_33_26_/.94))] max-[767px]:min-h-[175px] max-[767px]:p-[18px]" key={person.id}>
									<div className="flex items-center gap-3">
										{person.image ? (
											<img className="h-12 w-12 rounded-full border-2 border-[#edbe6d]/[.55] object-cover" src={person.image} alt="" loading="lazy" />
										) : (
											<span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ead7b8] text-sm font-bold text-[#644421]" aria-hidden="true">
												{person.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}
											</span>
										)}
										<div className="min-w-0">
											<h3 className="truncate text-sm font-bold">{person.name}</h3>
											<p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#f7f1e7]/[.62]"><MapPin size={12} />{person.location}</p>
										</div>
									</div>
									<div className="mt-[3px] text-xs tracking-[.12em] text-[#ba7620]" aria-label={`${person.rating} out of 5 stars`}>
										{Array.from({ length: 5 }, (_, star) => <Star key={star} size={13} fill={star < person.rating ? "currentColor" : "none"} aria-hidden="true" />)}
									</div>
									<p className="mt-[18px] flex-1 text-[13px] leading-[1.7] text-[#f7f1e7]/[.79] max-[767px]:mt-[11px] max-[767px]:text-xs">“{person.comment}”</p>
								</article>
							);
						})}
					</div>
				) : null}
				{reviews.length > 1 ? (
					<div className="mt-[29px] flex items-center justify-center gap-4" aria-label="Testimonial carousel controls">
						<button className="grid h-[38px] w-[38px] place-items-center rounded-full border border-white/[.35] bg-white/[.08] text-white" type="button" aria-label="Previous testimonials" onClick={() => shiftReview(-1)}><ArrowLeft size={17} /></button>
						<div className="flex gap-2">
							{reviews.map((review, index) => (
								<button
									className={`h-2 w-2 border-0 bg-white/40 ${activeReview === index ? "w-[23px] rounded-lg bg-[#e2a84d]" : ""}`}
									type="button"
									key={review.id}
									aria-label={`Show testimonials starting with ${review.name}`}
									aria-current={activeReview === index}
									onClick={() => setActiveReview(index)}
								/>
							))}
						</div>
						<button className="grid h-[38px] w-[38px] place-items-center rounded-full border border-white/[.35] bg-white/[.08] text-white" type="button" aria-label="Next testimonials" onClick={() => shiftReview(1)}><ArrowRight size={17} /></button>
					</div>
				) : null}
			</div>
		</section>
	);
}
