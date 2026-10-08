import { useEffect, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import ratingApi from "../../api/accommodation/ratingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Rating, RatingSummary } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader } from "../../components/layout/Layout";

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyId, setReplyId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      setLoading(true);
      setError("");
      try {
        const [reviewResult, reviewSummary] = await Promise.all([ratingApi.list({ limit: 100 }), ratingApi.summary()]);
        if (!cancelled) {
          setReviews(reviewResult.data);
          setSummary(reviewSummary);
        }
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load guest reviews."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadReviews();
    return () => { cancelled = true; };
  }, [reload]);

  const ratingCounts = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: reviews.filter((review) => review.rating === score).length,
  }));
  const maxRatingCount = Math.max(...ratingCounts.map((rating) => rating.count), 1);

  async function submitReply(event: FormEvent<HTMLFormElement>, reviewId: string) {
    event.preventDefault();
    if (!replyText.trim()) return;
    setSavingReply(true);
    setError("");
    try {
      const updated = await ratingApi.reply(reviewId, replyText.trim());
      setReviews((current) => current.map((review) => review._id === reviewId ? updated : review));
      setReplyId("");
      setReplyText("");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Could not post your review response."));
    } finally {
      setSavingReply(false);
    }
  }

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="Guest Reviews" subtitle="See what your guests are saying about your property." action={<button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)]" disabled={loading} onClick={() => setReload((current) => current + 1)}>Refresh ratings</button>} />

        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] mb-[22px] grid grid-cols-[220px_minmax(0,1fr)] gap-6 p-[22px_20px]">
          <div>
            <div className="text-5xl font-extrabold tracking-[-0.05em]">{(summary?.average ?? 0).toFixed(1)}</div>
            <div className="inline-flex items-center gap-1 text-[var(--gold)]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} />)}</div>
            <p>Based on {summary?.count ?? 0} reviews</p>
          </div>

          <div className="flex flex-col justify-center gap-2.5">
            {ratingCounts.map((rating) => (
              <div key={rating.score} className="grid grid-cols-[18px_minmax(0,1fr)] items-center gap-3">
                <span>{rating.score}</span>
                <div className="h-[10px] overflow-hidden rounded-full bg-[rgba(197,138,42,0.08)] [&>div]:h-full [&>div]:rounded-[inherit] [&>div]:bg-gradient-to-r [&>div]:from-[var(--gold)] [&>div]:to-[#d7a64a]"><div style={{ width: `${(rating.count / maxRatingCount) * 100}%` }} /></div>
                <small>{rating.count}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-[18px]">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-[18px]">
              <div className="mb-3 flex items-center gap-3 [&_img]:h-[38px] [&_img]:w-[38px] [&_img]:rounded-full [&_img]:object-cover [&_strong]:block [&_strong]:text-[0.9rem] [&_span]:block [&_span]:text-[0.7rem] [&_span]:text-[var(--text-soft)]">
                {review.customer?.avatar ? <img src={review.customer.avatar} alt="" /> : <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#f1e1c8] font-bold text-[#80501b]">{review.customer?.firstName?.slice(0, 1) ?? "G"}</span>}
                <div>
                  <strong>{review.customer ? `${review.customer.firstName} ${review.customer.lastName}` : "Guest"}</strong>
                  <div className="flex items-center gap-2 text-[0.78rem] text-[var(--text-soft)]">
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    <span className="inline-flex items-center gap-1 text-[var(--gold)]">{Array.from({ length: review.rating }).map((_, idx) => <Star key={`${review._id}-${idx}`} size={12} />)}</span>
                  </div>
                </div>
              </div>
              {review.title ? <h3 className="font-semibold text-[var(--text)]">{review.title}</h3> : null}
              <p>{review.comment}</p>
              {review.reply?.message ? <div className="mt-4 rounded-lg bg-[var(--surface-soft)] p-3 text-[0.82rem] text-[var(--text-soft)] [&_strong]:text-[var(--text)] [&_p]:mt-1"><strong>Your response</strong><p>{review.reply.message}</p></div> : null}
              {replyId === review._id ? (
                <form className="mt-4 flex flex-col gap-2" onSubmit={(event) => void submitReply(event, review._id)}>
                  <textarea aria-label={`Response to ${review.customer?.firstName ?? "guest"}`} rows={3} value={replyText} onChange={(event) => setReplyText(event.target.value)} required />
                  <div><button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)]" onClick={() => setReplyId("")}>Cancel</button><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]" disabled={savingReply}>{savingReply ? "Sending..." : "Post response"}</button></div>
                </form>
              ) : !review.reply?.message ? <button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)]" onClick={() => { setReplyId(review._id); setReplyText(""); }}>Respond</button> : null}
            </article>
          ))}
          {!loading && reviews.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]"><Star size={22} /><strong>No reviews yet</strong><span>New guest ratings will appear here.</span></div> : null}
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
