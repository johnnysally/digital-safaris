import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import { bookingApi, reviewApi } from "../api";
import { getApiErrorMessage } from "../api/axios";
import type { Booking } from "../types";

function StarInput({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (next: number) => void;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} out of 5`}
          aria-pressed={value === n}
          className="bg-transparent p-0.5 transition hover:scale-110"
        >
          <Star
            className={`${dim} ${
              n <= value
                ? "fill-secondary-500 text-secondary-500"
                : "text-stone-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function NewReviewPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking");
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [cleanliness, setCleanliness] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [service, setService] = useState(0);
  const [value, setValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError("No booking specified.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    bookingApi
      .details(bookingId)
      .then((data) => {
        if (!cancelled) {
          const b =
            (data as unknown as { booking?: Booking }).booking ??
            (data as unknown as Booking);
          setBooking(b);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load booking.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!booking) return;
    if (rating < 1) {
      setSubmitError("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 10) {
      setSubmitError("Please write at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const partnerId =
        typeof booking.partner === "object"
          ? booking.partner._id
          : booking.partner;
      const propertyId =
        typeof booking.property === "object"
          ? booking.property._id
          : booking.property;

      await reviewApi.create({
        targetType: "accommodation",
        targetId: partnerId,
        booking: booking._id,
        property: propertyId,
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
        cleanliness: cleanliness || null,
        comfort: comfort || null,
        service: service || null,
        value: value || null,
      });
      navigate("/reviews", { replace: true });
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err, "Could not submit your review."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Cannot open review">
          {error ?? "Booking not found."}
        </Alert>
        <Link
          to="/booking"
          className="inline-flex items-center gap-1 text-sm text-secondary-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to bookings
        </Link>
      </div>
    );
  }

  if (booking.status !== "checked_out") {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Review not available">
          You can only review stays after checkout.
        </Alert>
        <Link
          to="/booking"
          className="inline-flex items-center gap-1 text-sm text-secondary-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to bookings
        </Link>
      </div>
    );
  }

  const propertyName =
    typeof booking.property === "object"
      ? booking.property?.name
      : booking.propertyName || "your stay";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/booking"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          How was your stay?
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Reviewing <strong>{propertyName}</strong> · {booking.reference}
        </p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary">
              Overall rating
            </label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              Title (optional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Amazing view and friendly staff"
              maxLength={120}
              className="min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-secondary-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              Your review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other travelers about your stay…"
              minLength={10}
              maxLength={2000}
              required
              className="min-h-32 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-secondary-500"
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-surface-alt p-4">
            <p className="m-0 text-xs font-semibold text-text-secondary">
              Rate specific aspects (optional)
            </p>
            {[
              { label: "Cleanliness", value: cleanliness, set: setCleanliness },
              { label: "Comfort", value: comfort, set: setComfort },
              { label: "Service", value: service, set: setService },
              { label: "Value", value: value, set: setValue },
            ].map(({ label, value: v, set }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-xs text-text-secondary">{label}</span>
                <StarInput value={v} onChange={set} size="sm" />
              </div>
            ))}
          </div>

          {submitError && (
            <Alert variant="danger" title="Could not submit">
              {submitError}
            </Alert>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/booking")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || rating < 1}>
              {submitting ? "Submitting…" : "Post review"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}