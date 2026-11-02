import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bike,
  Car,
  CarFront,
  Check,
  CheckCircle2,
  Clock,
  Luggage,
  MapPin,
  Navigation,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Alert from "../components/ui/Alert";
import { paymentApi, searchApi, tripApi } from "../api";
import { useToast } from "../context/toastContext";
import { formatCurrency } from "../utils/formatCurrency";
import type { TripQuoteResponse } from "../types";

type ServiceType = "bike" | "car" | "van";
type PaymentMethod = "wallet" | "mpesa" | "stripe";

const SERVICE_OPTIONS = [
  { label: "Car", value: "car", detail: "Comfortable rides", icon: CarFront },
  { label: "Bike", value: "bike", detail: "Quick solo trips", icon: Bike },
  { label: "Van", value: "van", detail: "Groups and extra bags", icon: Truck },
];

function extractError(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return typeof msg === "string" && msg ? msg : fallback;
}

export default function TransportPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [heroImage, setHeroImage] = useState("/hero-bg.jpg");

  const [pickup, setPickup] = useState({
    address: "",
    town: "",
    latitude: -1.286389,
    longitude: 36.817223,
  });
  const [dropoff, setDropoff] = useState({
    address: "",
    town: "",
    latitude: -1.292066,
    longitude: 36.821946,
  });
  const [scheduledAt, setScheduledAt] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>("car");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [quote, setQuote] = useState<TripQuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadHeroImage = async () => {
      const [accommodations, properties, restaurants] =
        await Promise.allSettled([
          searchApi.accommodations({ page: 1, limit: 12 }),
          searchApi.properties({ page: 1, limit: 12 }),
          searchApi.restaurants({ page: 1, limit: 12 }),
        ]);

      if (!active) return;

      const image =
        (accommodations.status === "fulfilled" &&
          accommodations.value.data.find((item) => item.coverImage)
            ?.coverImage) ||
        (properties.status === "fulfilled" &&
          properties.value.data.find((item) => item.images?.[0])?.images?.[0]) ||
        (restaurants.status === "fulfilled" &&
          restaurants.value.data.find((item) => item.coverImage)?.coverImage);

      if (image) setHeroImage(image);
    };

    void loadHeroImage();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setQuote(null);
    setPayError(null);
    setPayMessage(null);
  }, [
    pickup.address,
    pickup.town,
    pickup.latitude,
    pickup.longitude,
    dropoff.address,
    dropoff.town,
    dropoff.latitude,
    dropoff.longitude,
    serviceType,
  ]);

  async function requestQuote() {
    setQuoteError(null);
    setPayError(null);
    setPayMessage(null);
    setQuote(null);

    if (!pickup.address || !dropoff.address) {
      setQuoteError("Enter both pickup and dropoff addresses.");
      return;
    }
    if (!pickup.town || !dropoff.town) {
      setQuoteError("Enter both pickup and dropoff towns.");
      return;
    }

    setQuoting(true);
    try {
      const q = await tripApi.quote({
        pickup: {
          address: pickup.address,
          town: pickup.town,
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        },
        dropoff: {
          address: dropoff.address,
          town: dropoff.town,
          latitude: dropoff.latitude,
          longitude: dropoff.longitude,
        },
        serviceType,
      });
      setQuote(q);
    } catch (err) {
      setQuoteError(extractError(err, "Could not get quote."));
    } finally {
      setQuoting(false);
    }
  }

  async function handlePay(e: FormEvent) {
    e.preventDefault();
    if (!quote) return;

    if (!scheduledAt) {
      setPayError("Choose when you want to travel.");
      return;
    }
    if (paymentMethod === "mpesa" && !phone.trim()) {
      setPayError("Enter your M-Pesa phone number.");
      return;
    }
    if (paymentMethod === "stripe") {
      setPayError(
        "Card payments are being set up. Please choose DS Wallet or M-Pesa for now."
      );
      return;
    }

    setPaying(true);
    setPayError(null);
    setPayMessage(null);

    try {
      const payment = await paymentApi.initiate({
        method: paymentMethod,
        amount: quote.fare,
        currency: quote.currency,
        purpose: "transport",
        phone: paymentMethod === "mpesa" ? phone : undefined,
      });

      if (paymentMethod === "wallet") {
        if (payment.status !== "success") {
          setPayError("Wallet payment failed. Check your balance.");
          return;
        }
      } else if (paymentMethod === "mpesa") {
        setPayMessage("Check your phone and enter your M-Pesa PIN…");
        const result = await pollPayment(payment.reference);
        if (!result.paid) {
          setPayError(result.message ?? "Payment was not completed.");
          return;
        }
      }

      const trip = await tripApi.create({
        quoteId: quote.quoteId,
        paymentReference: payment.reference,
        scheduledAt,
        passengers,
        luggage,
        notes: notes || undefined,
      });

      toastSuccess(
        "Trip confirmed",
        `Reference ${trip.reference} — a driver has been assigned.`
      );

      setQuote(null);
      setNotes("");
    } catch (err) {
      setPayError(extractError(err, "Could not request trip"));
      toastError(extractError(err, "Could not request trip"));
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

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      <header className="relative isolate overflow-hidden rounded-2xl bg-[#382719] px-5 py-7 text-white shadow-[0_12px_35px_rgba(55,38,21,.16)] sm:px-8 sm:py-9">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#24170e]/90 via-[#281b10]/75 to-[#281b10]/35" />
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#ffdfaa]">
            <Navigation className="h-3.5 w-3.5" /> YOUR JOURNEY, YOUR WAY
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Plan your ride
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Choose your route and ride. Get an upfront estimate before you
            request a driver.
          </p>
        </div>
        <div className="absolute bottom-5 right-7 hidden size-24 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#f4bf72] sm:flex">
          <CarFront className="size-11" strokeWidth={1.25} />
        </div>
      </header>

      {quoteError && (
        <Alert variant="danger" title="Check your trip details">
          {quoteError}
        </Alert>
      )}

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card
          className="overflow-hidden rounded-2xl border-[#e9ddcc] shadow-[0_8px_28px_rgba(69,48,28,.06)]"
          padded={false}
          title="Trip details"
          actions={
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <span className="size-2 rounded-full bg-[#be7927]" /> Required fields
            </span>
          }
        >
          <div className="space-y-6 p-4 sm:p-6 lg:p-7">
            <section aria-labelledby="route-heading">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2
                    id="route-heading"
                    className="text-base font-semibold text-text-primary"
                  >
                    Your route
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Where should your driver pick you up and drop you off?
                  </p>
                </div>
                <span className="hidden rounded-full bg-[#f8f0e4] px-3 py-1.5 text-[11px] font-medium text-[#805b35] sm:inline-flex">
                  Pickup <ArrowRight className="mx-1.5 h-3 w-3" /> Drop-off
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-[#e8ddce] bg-[#fffdf9] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f7ead8] text-[#9b6529]">
                      <Navigation className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-text-primary">
                        Pickup location
                      </span>
                      <span className="mt-0.5 block text-xs text-text-muted">
                        Your starting point
                      </span>
                    </span>
                    <span className="ml-auto size-2.5 rounded-full border-2 border-[#b87324]" />
                  </div>
                  <div className="space-y-3">
                    <Input
                      label="Street address or landmark"
                      value={pickup.address}
                      onChange={(e) =>
                        setPickup({ ...pickup, address: e.target.value })
                      }
                      placeholder="e.g. JKIA Terminal 1A"
                    />
                    <Input
                      label="Town or city"
                      value={pickup.town}
                      onChange={(e) =>
                        setPickup({ ...pickup, town: e.target.value })
                      }
                      placeholder="Nairobi"
                    />
                  </div>
                  <details className="group mt-4 border-t border-[#eee5d9] pt-3">
                    <summary className="cursor-pointer list-none text-xs font-medium text-[#8a6b48] marker:hidden hover:text-[#68451e]">
                      Add precise map coordinates{" "}
                      <span className="float-right transition-transform group-open:rotate-180">
                        ⌄
                      </span>
                    </summary>
                    <p className="mb-2 mt-2 text-[11px] leading-relaxed text-text-muted">
                      Coordinates help your driver locate the exact pickup
                      point.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Latitude"
                        type="number"
                        step="any"
                        value={pickup.latitude}
                        onChange={(e) =>
                          setPickup({
                            ...pickup,
                            latitude: Number(e.target.value),
                          })
                        }
                      />
                      <Input
                        label="Longitude"
                        type="number"
                        step="any"
                        value={pickup.longitude}
                        onChange={(e) =>
                          setPickup({
                            ...pickup,
                            longitude: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </details>
                </div>

                <div className="rounded-xl border border-[#e8ddce] bg-[#fffdf9] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e9f1e7] text-[#55764d]">
                      <MapPin className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-text-primary">
                        Drop-off location
                      </span>
                      <span className="mt-0.5 block text-xs text-text-muted">
                        Your destination
                      </span>
                    </span>
                    <span className="ml-auto size-2.5 rounded-full bg-[#6f8c5c]" />
                  </div>
                  <div className="space-y-3">
                    <Input
                      label="Street address or landmark"
                      value={dropoff.address}
                      onChange={(e) =>
                        setDropoff({ ...dropoff, address: e.target.value })
                      }
                      placeholder="e.g. Westlands, Nairobi"
                    />
                    <Input
                      label="Town or city"
                      value={dropoff.town}
                      onChange={(e) =>
                        setDropoff({ ...dropoff, town: e.target.value })
                      }
                      placeholder="Nairobi"
                    />
                  </div>
                  <details className="group mt-4 border-t border-[#eee5d9] pt-3">
                    <summary className="cursor-pointer list-none text-xs font-medium text-[#8a6b48] marker:hidden hover:text-[#68451e]">
                      Add precise map coordinates{" "}
                      <span className="float-right transition-transform group-open:rotate-180">
                        ⌄
                      </span>
                    </summary>
                    <p className="mb-2 mt-2 text-[11px] leading-relaxed text-text-muted">
                      Coordinates help your driver locate the exact
                      destination.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Latitude"
                        type="number"
                        step="any"
                        value={dropoff.latitude}
                        onChange={(e) =>
                          setDropoff({
                            ...dropoff,
                            latitude: Number(e.target.value),
                          })
                        }
                      />
                      <Input
                        label="Longitude"
                        type="number"
                        step="any"
                        value={dropoff.longitude}
                        onChange={(e) =>
                          setDropoff({
                            ...dropoff,
                            longitude: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </details>
                </div>
              </div>
            </section>

            <section
              className="border-t border-[#eee5d9] pt-5"
              aria-labelledby="ride-heading"
            >
              <div className="mb-4">
                <h2
                  id="ride-heading"
                  className="text-base font-semibold text-text-primary"
                >
                  Choose your ride
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Select the vehicle that works best for your journey.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SERVICE_OPTIONS.map(
                  ({ label, value, detail, icon: ServiceIcon }) => {
                    const selected = serviceType === value;
                    return (
                      <label
                        key={value}
                        className={`relative flex min-h-[88px] cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-[#bd781f]/40 ${
                          selected
                            ? "border-[#bd781f] bg-[#fff7eb] shadow-[0_3px_12px_rgba(189,120,31,.1)]"
                            : "border-[#e9e0d4] bg-white hover:border-[#d6bc96] hover:bg-[#fffdf9]"
                        }`}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name="serviceType"
                          value={value}
                          checked={selected}
                          onChange={() => setServiceType(value as ServiceType)}
                        />
                        <span
                          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                            selected
                              ? "bg-[#bd781f] text-white"
                              : "bg-[#f5eee3] text-[#805b35]"
                          }`}
                        >
                          <ServiceIcon className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-text-primary">
                            {label}
                          </span>
                          <span className="mt-1 block text-[11px] leading-snug text-text-muted">
                            {detail}
                          </span>
                        </span>
                        {selected && (
                          <span className="ml-auto grid size-5 shrink-0 place-items-center rounded-full bg-[#bd781f] text-white">
                            <Check className="size-3.5" />
                          </span>
                        )}
                      </label>
                    );
                  }
                )}
              </div>
            </section>

            <section
              className="grid gap-4 border-t border-[#eee5d9] pt-5 sm:grid-cols-2"
              aria-labelledby="schedule-heading"
            >
              <div className="sm:col-span-2">
                <h2
                  id="schedule-heading"
                  className="text-base font-semibold text-text-primary"
                >
                  Schedule &amp; passengers
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Add timing and trip preferences before requesting your
                  estimate.
                </p>
              </div>
              <Input
                label="Travel date and time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <Select
                label="Payment method"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                options={[
                  { label: "DS Wallet", value: "wallet" },
                  { label: "M-Pesa", value: "mpesa" },
                  { label: "Card (Stripe)", value: "stripe" },
                ]}
              />
              <Input
                label="Passengers"
                type="number"
                min={1}
                value={passengers}
                leftIcon={<Users className="h-4 w-4" />}
                onChange={(e) => setPassengers(Number(e.target.value) || 1)}
              />
              <Input
                label="Luggage items"
                type="number"
                min={0}
                value={luggage}
                leftIcon={<Luggage className="h-4 w-4" />}
                onChange={(e) => setLuggage(Number(e.target.value) || 0)}
              />
              {paymentMethod === "mpesa" && (
                <div className="sm:col-span-2">
                  <Input
                    label="M-Pesa phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="254712345678"
                    inputMode="tel"
                  />
                  <p className="mt-1 text-[11px] text-text-muted">
                    Enter the Safaricom number registered with M-Pesa.
                  </p>
                </div>
              )}
              {paymentMethod === "stripe" && (
                <div className="rounded-lg border border-border bg-surface-alt p-3 text-xs text-text-muted sm:col-span-2">
                  Card payments are being set up. Please choose DS Wallet or
                  M-Pesa for now.
                </div>
              )}
              <div className="sm:col-span-2">
                <Input
                  label="Note for your driver (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything your driver should know?"
                />
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5d9] pt-5">
              <p className="m-0 inline-flex items-center gap-2 text-xs text-text-muted">
                <ShieldCheck className="size-4 text-[#6f8c5c]" /> You'll review
                the fare before confirming.
              </p>
              <Button
                variant="secondary"
                loading={quoting}
                onClick={requestQuote}
              >
                <span className="inline-flex items-center gap-2">
                  {quote ? "Refresh fare estimate" : "Get fare estimate"}{" "}
                  <ArrowRight className="size-4" />
                </span>
              </Button>
            </div>
          </div>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-20">
          {quote ? (
            <Card
              className="overflow-hidden rounded-2xl border-[#e8d6bd] shadow-[0_8px_28px_rgba(69,48,28,.08)]"
              padded={false}
            >
              <div className="bg-gradient-to-br from-[#fff7eb] to-[#f4e2c7] p-5">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.1em] text-[#8a5b25]">
                  <Check className="size-4" /> Fare estimate ready
                </span>
                <p className="mb-1 mt-4 text-xs text-[#78644c]">
                  Estimated total
                </p>
                <strong className="block text-3xl font-semibold tracking-tight text-[#382719]">
                  {formatCurrency(quote.fare, quote.currency)}
                </strong>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-[#705638]">
                  <MapPin className="size-3.5" />{" "}
                  {quote.distanceKm.toFixed(1)} km
                </span>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Price locked · expires{" "}
                  {new Date(quote.expiresAt).toLocaleTimeString()}
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-text-muted">Ride type</span>
                  <span className="font-medium capitalize text-text-primary">
                    {serviceType}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-text-muted">Payment</span>
                  <span className="font-medium capitalize text-text-primary">
                    {paymentMethod === "mpesa" ? "M-Pesa" : paymentMethod}
                  </span>
                </div>

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

                <div className="border-t border-[#eee5d9] pt-4">
                  <Button
                    className="w-full justify-center"
                    leftIcon={<Car className="h-4 w-4" />}
                    loading={paying}
                    onClick={() =>
                      handlePay({ preventDefault: () => {} } as FormEvent)
                    }
                  >
                    {paying
                      ? "Processing…"
                      : `Pay ${formatCurrency(quote.fare, quote.currency)}`}
                  </Button>
                </div>
                <p className="m-0 text-center text-[11px] leading-relaxed text-text-muted">
                  A driver will be assigned right after payment.
                </p>
              </div>
            </Card>
          ) : (
            <Card
              className="rounded-2xl border-[#e9ddcc] bg-white/90"
              title="Your fare estimate"
            >
              <div className="py-2 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f7ead8] text-[#9b6529]">
                  <Clock className="size-6" />
                </span>
                <h2 className="mb-0 mt-3 text-sm font-semibold text-text-primary">
                  Know the cost upfront
                </h2>
                <p className="mb-0 mt-1 text-xs leading-relaxed text-text-muted">
                  Enter your pickup and destination, then get an estimate
                  before requesting your ride.
                </p>
              </div>
            </Card>
          )}
          <Card
            className="rounded-2xl border-[#e9ddcc] bg-[#fffaf1]"
            padded={false}
          >
            <div className="flex items-start gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e9f1e7] text-[#55764d]">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <h2 className="m-0 text-sm font-semibold text-text-primary">
                  A smoother trip
                </h2>
                <p className="mb-0 mt-1 text-xs leading-relaxed text-text-muted">
                  Your trip details and preferred payment are shared with the
                  driver who accepts your request.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}