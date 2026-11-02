import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Users,
  Wallet as WalletIcon,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import searchApi from "../api/searchApi";
import bookingApi, { type QuoteResponse } from "../api/bookingApi";
import paymentApi from "../api/paymentApi";
import { formatCurrency } from "../utils/formatCurrency";
import type { PropertyDetails } from "../types";

const PAYMENT_METHODS: Array<{
  label: string;
  value: "wallet" | "mpesa" | "stripe";
}> = [
  { label: "DS Wallet", value: "wallet" },
  { label: "M-Pesa", value: "mpesa" },
  { label: "Card (Stripe)", value: "stripe" },
];

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.round(diff));
}

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message || e?.message || fallback;
}

export default function AccommodationBookingPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get("room");

  const [data, setData] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [roomsBooked, setRoomsBooked] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<"wallet" | "mpesa" | "stripe">("wallet");
  const [phone, setPhone] = useState("");

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    let cancelled = false;
    setLoading(true);
    searchApi
      .propertyDetails(idOrSlug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const d = new Date();
        d.setDate(d.getDate() + 2);
        setCheckIn(toISODate(t));
        setCheckOut(toISODate(d));
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load this property.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Booking unavailable">
          {loadError ?? "Property not found."}
        </Alert>
        <Link
          to="/accommodation"
          className="inline-flex items-center gap-1 text-sm text-secondary-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to stays
        </Link>
      </div>
    );
  }

  const { property } = data;
  const room = property.rooms.find((r) => r._id === roomId);

  if (!room) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Room not available">
          The selected room could not be found.
        </Alert>
        <Link
          to={`/accommodation/${idOrSlug}`}
          className="inline-flex items-center gap-1 text-sm text-secondary-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to property
        </Link>
      </div>
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const cover =
    room.images?.[0] ?? property.coverImage ?? property.images?.[0] ?? null;

  async function handleQuote(e: FormEvent) {
    e.preventDefault();
    if (!room) return;
    if (nights <= 0) {
      setQuoteError("Check-out must be after check-in.");
      return;
    }
    if (paymentMethod === "mpesa" && !phone.trim()) {
      setQuoteError("Enter your M-Pesa phone number to continue.");
      return;
    }
    setQuoting(true);
    setQuoteError(null);
    setQuote(null);
    setPayError(null);
    setPayMessage(null);
    try {
      const q = await bookingApi.quote({
        roomId: room._id,
        checkIn,
        checkOut,
        roomsBooked,
        guests: { adults, children },
      });
      setQuote(q);
    } catch (err) {
      setQuoteError(getErrorMessage(err, "Could not get a quote"));
    } finally {
      setQuoting(false);
    }
  }

  async function handlePayAndBook(e: FormEvent) {
    e.preventDefault();
    if (!quote) return;

    if (paymentMethod === "mpesa" && !phone.trim()) {
      setPayError("Enter your M-Pesa phone number.");
      return;
    }

    setPaying(true);
    setPayError(null);
    setPayMessage(null);

    try {
      const payment = await paymentApi.initiate({
        method: paymentMethod,
        amount: quote.total,
        currency: quote.currency,
        purpose: "booking",
        quoteId: quote.quoteId,
        phone: paymentMethod === "mpesa" ? phone : undefined,
      });

      if (paymentMethod === "wallet" && payment.status === "success") {
        const booking = await bookingApi.create({
          quoteId: quote.quoteId,
          paymentReference: payment.reference,
          specialRequests: specialRequests.trim() || undefined,
        });
        navigate(
          `/booking?created=${encodeURIComponent(booking.reference)}`,
          { replace: true },
        );
        return;
      }

      if (paymentMethod === "mpesa") {
        setPayMessage("Check your phone and enter your M-Pesa PIN…");
        const result = await pollPayment(payment.reference);
        if (!result.paid) {
          setPayError(result.message ?? "Payment was not completed.");
          return;
        }
        const booking = await bookingApi.create({
          quoteId: quote.quoteId,
          paymentReference: payment.reference,
          specialRequests: specialRequests.trim() || undefined,
        });
        navigate(
          `/booking?created=${encodeURIComponent(booking.reference)}`,
          { replace: true },
        );
        return;
      }

      if (paymentMethod === "stripe") {
        setPayError(
          "Card payments are being set up. Please choose M-Pesa or DS Wallet for now.",
        );
        return;
      }
    } catch (err) {
      setPayError(getErrorMessage(err, "Payment failed"));
    } finally {
      setPaying(false);
    }
  }

  async function pollPayment(reference: string, timeoutMs = 120_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const status = await paymentApi.status(reference);
        if (status.status === "success") return { paid: true };
        if (["failed", "cancelled", "refunded"].includes(status.status)) {
          return {
            paid: false,
            message: status.failureReason ?? "Payment failed",
          };
        }
      } catch {
        /* keep polling */
      }
    }
    return { paid: false, message: "Payment timed out. Try again." };
  }

  function resetQuote() {
    setQuote(null);
    setPayError(null);
    setPayMessage(null);
  }

  return (
    <div className="space-y-6">
      <Link
        to={`/accommodation/${idOrSlug}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to property
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          {quote ? "Pay to confirm" : "Complete your booking"}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {quote
            ? "Your quote is locked for 15 minutes. Complete payment to confirm."
            : "Review dates, guests, and how you'd like to pay."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!quote ? (
            <Card>
              <form onSubmit={handleQuote} className="space-y-5">
                <div className="flex items-start gap-4 border-b border-border pb-4">
                  {cover ? (
                    <img
                      src={cover}
                      alt={room.name}
                      className="h-20 w-24 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {room.name}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {property.name} · {property.town}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {room.capacity} guests
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" />{" "}
                        {room.beds
                          .map((b) => `${b.count}× ${b.type}`)
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      Check-in
                    </label>
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      leftIcon={<CalendarDays className="h-4 w-4" />}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      Check-out
                    </label>
                    <Input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      leftIcon={<CalendarDays className="h-4 w-4" />}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      Adults
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      Children
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      Rooms
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={room.totalUnits}
                      value={roomsBooked}
                      onChange={(e) => setRoomsBooked(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      Nights
                    </label>
                    <div className="flex min-h-10 items-center rounded-lg border border-border bg-surface-alt px-3 text-sm text-text-primary">
                      {nights || "—"}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="payment-method-step1"
                    className="mb-1 block text-xs font-medium text-text-secondary"
                  >
                    How would you like to pay?
                  </label>
                  <select
                    id="payment-method-step1"
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as "wallet" | "mpesa" | "stripe",
                      )
                    }
                    className="min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-secondary-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {paymentMethod === "mpesa" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      M-Pesa phone number
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="254712345678"
                      inputMode="tel"
                      required
                    />
                    <p className="mt-1 text-[11px] text-text-muted">
                      Enter the Safaricom number registered with M-Pesa.
                    </p>
                  </div>
                )}

                {paymentMethod === "stripe" && (
                  <div className="rounded-lg border border-border bg-surface-alt p-3 text-xs text-text-muted">
                    Card payments open a secure Stripe window when you
                    continue. If you don&apos;t see it, use M-Pesa or DS Wallet.
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Special requests (optional)
                  </label>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-secondary-500"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Late check-in, dietary needs, room preference…"
                  />
                </div>

                {quoteError && (
                  <Alert variant="danger" title="Cannot continue">
                    {quoteError}
                  </Alert>
                )}

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(`/accommodation/${idOrSlug}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={quoting || nights <= 0}>
                    {quoting ? "Checking availability…" : "Continue to payment"}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card>
              <form onSubmit={handlePayAndBook} className="space-y-5">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Price locked · expires{" "}
                  {new Date(quote.expiresAt).toLocaleTimeString()}
                </div>

                <div className="rounded-lg border border-border bg-surface-alt p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-text-muted">Payment method</p>
                      <p className="mt-0.5 text-sm font-medium text-text-primary">
                        {PAYMENT_METHODS.find((m) => m.value === paymentMethod)
                          ?.label ?? "—"}
                      </p>
                      {paymentMethod === "mpesa" && phone ? (
                        <p className="mt-0.5 text-xs text-text-muted">
                          To: {phone}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={resetQuote}
                      className="text-xs font-medium text-secondary-500 underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {paymentMethod === "stripe" && (
                  <div className="rounded-lg border border-border bg-surface-alt p-3 text-xs text-text-muted">
                    Card payments open a secure Stripe window. If you don&apos;t
                    see it, use M-Pesa or DS Wallet.
                  </div>
                )}

                {payMessage && (
                  <Alert variant="info" title="Processing">
                    {payMessage}
                  </Alert>
                )}
                {payError && (
                  <Alert variant="danger" title="Payment failed">
                    {payError}
                  </Alert>
                )}

                <div className="flex justify-between gap-2 border-t border-border pt-4">
                  <Button type="button" variant="ghost" onClick={resetQuote}>
                    Back
                  </Button>
                  <Button type="submit" disabled={paying}>
                    {paying
                      ? "Processing…"
                      : `Pay ${formatCurrency(quote.total, quote.currency)}`}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <h2 className="text-sm font-semibold text-text-primary">
              {quote ? "Order summary" : "Stay summary"}
            </h2>
            <p className="mt-2 text-sm font-medium text-text-primary">
              {room.name}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
              <MapPin className="h-3.5 w-3.5" />
              {property.name} · {property.town}
            </p>

            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Check-in</span>
                <span>{checkIn}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Check-out</span>
                <span>{checkOut}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Guests</span>
                <span>
                  {adults} adult{adults === 1 ? "" : "s"}
                  {children > 0
                    ? `, ${children} child${children === 1 ? "" : "ren"}`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Rooms</span>
                <span>{roomsBooked}</span>
              </div>
            </div>

            {quote && (
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>
                    {formatCurrency(quote.pricePerNight, quote.currency)} ×{" "}
                    {quote.nights} night{quote.nights === 1 ? "" : "s"} ×{" "}
                    {quote.roomsBooked}
                  </span>
                  <span>{formatCurrency(quote.subtotal, quote.currency)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-text-primary">
                  <span>Total</span>
                  <span>{formatCurrency(quote.total, quote.currency)}</span>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-text-muted/10 px-3 py-2 text-xs text-text-muted">
              <WalletIcon className="h-4 w-4" />
              You pay with{" "}
              {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}