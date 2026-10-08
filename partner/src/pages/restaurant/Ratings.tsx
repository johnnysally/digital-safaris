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

	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Guest Reviews</h1><span>See what guests are saying about your restaurant.</span></div><button className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>Refresh</button></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{error}</div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading reviews…</div> : <>
			<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px] flex items-center gap-3 [&>strong]:text-3xl [&>strong]:text-[#393c34] [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:text-[#bf9742] [&_small]:ml-2 [&_small]:text-[10px] [&_small]:text-[#85877e]"><strong>{(summary?.average ?? 0).toFixed(1)}</strong><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill={index < Math.round(summary?.average ?? 0) ? "currentColor" : "none"} />)}<small>{summary?.count ?? 0} guest reviews</small></span></section>
			<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]"><div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><h2>Guest feedback</h2><span>{reviews.length} reviews</span></div>
				<div className="grid">{reviews.map((review) => <article className="grid gap-3 border-b border-[#f0f0ed] py-3 last:border-0 max-[680px]:grid-cols-1" key={review._id}>
					<div className="flex min-w-0 items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-[7px] bg-[#f0f2e9] text-[#76814d] size-[34px] text-sm font-bold">{review.rating}★</div><div className="grid min-w-0 flex-1 gap-1 [&_strong]:truncate [&_strong]:text-[10px] [&_strong]:text-[#393c34] [&>span]:truncate [&>span]:text-[9px] [&>span]:text-[#85877f] [&_small]:truncate [&_small]:text-[9px] [&_small]:text-[#85877f]"><strong>{review.customer ? `${review.customer.firstName} ${review.customer.lastName}` : "Guest"} · {review.title || "Guest review"}</strong><span>{review.comment || "Guest left a rating without a comment."}</span><small>{new Date(review.createdAt).toLocaleDateString()}</small></div></div>
					<form className="grid gap-[5px] text-[9px] text-[#64675e] [&_textarea]:w-full [&_textarea]:rounded-[5px] [&_textarea]:border [&_textarea]:border-[#e8e9e3] [&_textarea]:bg-white [&_textarea]:p-2 [&_textarea]:text-[10px] [&_button]:justify-self-start [&_button]:rounded-[5px] [&_button]:bg-[#707e48] [&_button]:px-2 [&_button]:py-[6px] [&_button]:text-[9px] [&_button]:text-white" onSubmit={(event) => void reply(event, review)}><label htmlFor={`reply-${review._id}`}>{review.reply?.message ? "Your reply" : "Reply to this review"}</label><textarea id={`reply-${review._id}`} name="message" rows={2} maxLength={1000} defaultValue={review.reply?.message ?? ""} placeholder="Thank your guest or respond to their feedback…" required /><button type="submit" disabled={busy === review._id}>{busy === review._id ? "Posting…" : review.reply?.message ? "Update reply" : "Post reply"}</button></form>
				</article>)}{!reviews.length && <div className="px-[14px] py-[22px] text-center text-[10px] text-[#898b82]">Guest reviews will appear here.</div>}</div>
			</section>
		</>}
	</div>;
}
