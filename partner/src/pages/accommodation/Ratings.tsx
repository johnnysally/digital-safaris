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
      <div className="page-shell">
        <PageHeader title="Guest Reviews" subtitle="See what your guests are saying about your property." action={<button type="button" className="secondary-button" disabled={loading} onClick={() => setReload((current) => current + 1)}>Refresh ratings</button>} />

        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="card reviews-summary">
          <div>
            <div className="rating-score">{(summary?.average ?? 0).toFixed(1)}</div>
            <div className="star-row">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} />)}</div>
            <p>Based on {summary?.count ?? 0} reviews</p>
          </div>

          <div className="rating-breakdown">
            {ratingCounts.map((rating) => (
              <div key={rating.score} className="rating-line">
                <span>{rating.score}</span>
                <div className="bar-track"><div style={{ width: `${(rating.count / maxRatingCount) * 100}%` }} /></div>
                <small>{rating.count}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="review-list">
          {reviews.map((review) => (
            <article key={review._id} className="card review-card">
              <div className="review-header">
                {review.customer?.avatar ? <img src={review.customer.avatar} alt="" /> : <span className="avatar-placeholder">{review.customer?.firstName?.slice(0, 1) ?? "G"}</span>}
                <div>
                  <strong>{review.customer ? `${review.customer.firstName} ${review.customer.lastName}` : "Guest"}</strong>
                  <div className="review-meta">
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    <span className="star-inline">{Array.from({ length: review.rating }).map((_, idx) => <Star key={`${review._id}-${idx}`} size={12} />)}</span>
                  </div>
                </div>
              </div>
              {review.title ? <h3 className="review-title">{review.title}</h3> : null}
              <p>{review.comment}</p>
              {review.reply?.message ? <div className="review-response"><strong>Your response</strong><p>{review.reply.message}</p></div> : null}
              {replyId === review._id ? (
                <form className="review-reply-form" onSubmit={(event) => void submitReply(event, review._id)}>
                  <textarea aria-label={`Response to ${review.customer?.firstName ?? "guest"}`} rows={3} value={replyText} onChange={(event) => setReplyText(event.target.value)} required />
                  <div><button type="button" className="secondary-button" onClick={() => setReplyId("")}>Cancel</button><button type="submit" className="primary-button" disabled={savingReply}>{savingReply ? "Sending..." : "Post response"}</button></div>
                </form>
              ) : !review.reply?.message ? <button type="button" className="secondary-button" onClick={() => { setReplyId(review._id); setReplyText(""); }}>Respond</button> : null}
            </article>
          ))}
          {!loading && reviews.length === 0 ? <div className="rooms-empty-state"><Star size={22} /><strong>No reviews yet</strong><span>New guest ratings will appear here.</span></div> : null}
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
