import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import ratingApi from "../../api/transport/ratingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Rating, RatingSummary } from "../../types";
import { ApiFeedback, PageHeader } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";

export function TransportReviewsPage() {
	const [reviews, setReviews] = useState<Rating[]>([]);
	const [summary, setSummary] = useState<RatingSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function loadReviews() {
			setLoading(true);
			setError("");
			try {
				const [ratingList, ratingSummary] = await Promise.all([ratingApi.list({ limit: 100 }), ratingApi.summary()]);
				if (!cancelled) { setReviews(ratingList.data); setSummary(ratingSummary); }
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load driver reviews."));
			} finally { if (!cancelled) setLoading(false); }
		}
		void loadReviews();
		return () => { cancelled = true; };
	}, [reload]);

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Driver Reviews" subtitle="Review feedback from customers after completed trips." action={<button type="button" className="secondary-button" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh ratings</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		<section className="transport-panel transport-rating-summary"><div><strong>{(summary?.average ?? 0).toFixed(1)}</strong><span className="transport-rating-stars">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} fill={index < Math.round(summary?.average ?? 0) ? "currentColor" : "none"} />)}</span><small>Based on {summary?.count ?? 0} ratings</small></div><div className="transport-rating-note">Your average rating is calculated from verified customer feedback.</div></section>
		<div className="transport-review-grid">{reviews.map((review) => <article className="transport-panel transport-review-card" key={review._id}><div className="transport-review-head"><span className="transport-rating-stars">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill={index < review.rating ? "currentColor" : "none"} />)}</span><time>{new Date(review.createdAt).toLocaleDateString()}</time></div><p>{review.comment || review.title || "Customer left a rating without a written comment."}</p><strong>{review.customer ? `${review.customer.firstName} ${review.customer.lastName}` : "Customer"}</strong></article>)}</div>
		{!loading && reviews.length === 0 ? <div className="transport-panel transport-empty-large"><Star size={24} /><strong>No reviews yet</strong><span>New customer ratings will appear here.</span></div> : null}
	</div></TransportLayout>;
}
