import { useEffect, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import ratingApi from "../../api/restaurant/ratingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Rating, RatingSummary } from "../../types";

export function RestaurantRatingsPage() {
	const [reviews, setReviews] = useState<Rating[]>([]);
	const [summary, setSummary] = useState<RatingSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState("");
	const [reload, setReload] = useState(0);
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		Promise.all([ratingApi.list({ limit: 100 }), ratingApi.summary()]).then(([list, stats]) => {
			if (!cancelled) { setReviews(list.data); setSummary(stats); }
		}).catch((cause: unknown) => { if (!cancelled) setError(getApiErrorMessage(cause, "Could not load restaurant reviews.")); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function reply(event: FormEvent<HTMLFormElement>, review: Rating) {
		event.preventDefault();
		const message = String(new FormData(event.currentTarget).get("message") ?? "").trim();
		if (!message) { setError("Write a reply before submitting."); return; }
		setBusy(review._id);
		setError("");
		try {
			await ratingApi.reply(review._id, message);
			setReload((value) => value + 1);
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not post your reply.")); }
		finally { setBusy(""); }
	}

	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Guest Reviews</h1><span>See what guests are saying about your restaurant.</span></div><button className="restaurant-primary-link" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>Refresh</button></header>
		{error && <div className="restaurant-feedback" role="alert">{error}</div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading reviews…</div> : <>
			<section className="restaurant-card restaurant-section-card restaurant-review-summary"><strong>{(summary?.average ?? 0).toFixed(1)}</strong><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill={index < Math.round(summary?.average ?? 0) ? "currentColor" : "none"} />)}<small>{summary?.count ?? 0} guest reviews</small></span></section>
			<section className="restaurant-card restaurant-section-card"><div className="restaurant-section-toolbar"><h2>Guest feedback</h2><span>{reviews.length} reviews</span></div>
				<div className="restaurant-resource-list">{reviews.map((review) => <article className="restaurant-review-entry" key={review._id}>
					<div className="restaurant-review-entry-main"><div className="restaurant-resource-icon restaurant-review-score">{review.rating}★</div><div className="restaurant-resource-copy"><strong>{review.customer ? `${review.customer.firstName} ${review.customer.lastName}` : "Guest"} · {review.title || "Guest review"}</strong><span>{review.comment || "Guest left a rating without a comment."}</span><small>{new Date(review.createdAt).toLocaleDateString()}</small></div></div>
					<form className="restaurant-review-reply" onSubmit={(event) => void reply(event, review)}><label htmlFor={`reply-${review._id}`}>{review.reply?.message ? "Your reply" : "Reply to this review"}</label><textarea id={`reply-${review._id}`} name="message" rows={2} maxLength={1000} defaultValue={review.reply?.message ?? ""} placeholder="Thank your guest or respond to their feedback…" required /><button type="submit" disabled={busy === review._id}>{busy === review._id ? "Posting…" : review.reply?.message ? "Update reply" : "Post reply"}</button></form>
				</article>)}{!reviews.length && <div className="restaurant-empty">Guest reviews will appear here.</div>}</div>
			</section>
		</>}
	</div>;
}
