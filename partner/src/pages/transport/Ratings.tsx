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

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Driver Reviews" subtitle="Review feedback from customers after completed trips." action={<button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh ratings</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] mb-[14px] flex items-center gap-7 p-[18px] [&>div:first-child]:grid [&>div:first-child]:grid-cols-[auto_1fr] [&>div:first-child]:items-center [&>div:first-child]:gap-x-3 [&>div:first-child>strong]:row-span-2 [&>div:first-child>strong]:font-[Cormorant_Garamond,Georgia,serif] [&>div:first-child>strong]:text-[2.4rem] [&_small]:text-[.72rem] [&_small]:text-[var(--text-muted)] max-[760px]:flex-col"><div><strong>{(summary?.average ?? 0).toFixed(1)}</strong><span className="inline-flex gap-0.5 text-[#de9c2b]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} fill={index < Math.round(summary?.average ?? 0) ? "currentColor" : "none"} />)}</span><small>Based on {summary?.count ?? 0} ratings</small></div><div className="text-[.78rem] text-[var(--text-soft)]">Your average rating is calculated from verified customer feedback.</div></section>
		<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3">{reviews.map((review) => <article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] p-[14px] [&_p]:text-[.8rem] [&_p]:leading-[1.5] [&_p]:text-[var(--text-soft)] [&>strong]:text-[.76rem] [&>strong]:text-[var(--text)]" key={review._id}><div className="flex justify-between gap-2.5 [&_time]:text-[.68rem] [&_time]:text-[var(--text-muted)]"><span className="inline-flex gap-0.5 text-[#de9c2b]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill={index < review.rating ? "currentColor" : "none"} />)}</span><time>{new Date(review.createdAt).toLocaleDateString()}</time></div><p>{review.comment || review.title || "Customer left a rating without a written comment."}</p><strong>{review.customer ? `${review.customer.firstName} ${review.customer.lastName}` : "Customer"}</strong></article>)}</div>
		{!loading && reviews.length === 0 ? <div className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-[var(--text-muted)] [&_svg]:text-[var(--gold)] [&_strong]:text-[var(--text)] [&_span]:text-[.76rem]"><Star size={24} /><strong>No reviews yet</strong><span>New customer ratings will appear here.</span></div> : null}
	</div></TransportLayout>;
}
