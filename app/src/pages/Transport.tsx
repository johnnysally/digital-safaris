import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bike,
  Car,
  CarFront,
  Check,
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
import { tripApi } from "../api";
import { useToast } from "../context/toastContext";
import { formatCurrency } from "../utils/formatCurrency";

type ServiceType = "bike" | "car" | "van";

const SERVICE_OPTIONS = [
  { label: "Car", value: "car", detail: "Comfortable rides", icon: CarFront },
  { label: "Bike", value: "bike", detail: "Quick solo trips", icon: Bike },
  { label: "Van", value: "van", detail: "Groups and extra bags", icon: Truck },
];

export default function TransportPage() {
  const { error: toastError, success: toastSuccess } = useToast();

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
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "wallet" | "stripe">("mpesa");
  const [notes, setNotes] = useState("");

  const [quote, setQuote] = useState<{ distanceKm: number; fare: number; currency: string } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuote(null);
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

  const requestQuote = async () => {
    setError(null);
    setQuote(null);

    if (!pickup.address || !dropoff.address) {
      setError("Enter both pickup and dropoff addresses.");
      return;
    }

    setQuoting(true);
    try {
      const res = await tripApi.quote({ pickup, dropoff, serviceType });
      setQuote(res);
    } catch {
      setError("Could not get quote.");
    } finally {
      setQuoting(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!quote) {
      setError("Request a quote first.");
      return;
    }
    if (!scheduledAt) {
      setError("Choose when you want to travel.");
      return;
    }

    setSubmitting(true);
    try {
      await tripApi.create({
        pickup,
        dropoff,
        scheduledAt,
        passengers,
        luggage,
        serviceType,
        paymentMethod,
        notes: notes || undefined,
      });
      toastSuccess("Trip requested", "A driver will accept shortly.");
      setQuote(null);
      setNotes("");
    } catch {
      toastError("Could not request trip");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      <header className="relative isolate overflow-hidden rounded-2xl bg-[#382719] px-5 py-7 text-white shadow-[0_12px_35px_rgba(55,38,21,.16)] sm:px-8 sm:py-9">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_88%_10%,rgba(231,164,75,.38),transparent_34%),linear-gradient(115deg,#2d2118_0%,#513822_58%,#8a5d32_100%)]" />
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#ffdfaa]">
            <Navigation className="h-3.5 w-3.5" /> YOUR JOURNEY, YOUR WAY
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Plan your ride
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Choose your route and ride. Get an upfront estimate before you request a driver.
          </p>
        </div>
        <div className="absolute bottom-5 right-7 hidden size-24 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#f4bf72] sm:flex">
          <CarFront className="size-11" strokeWidth={1.25} />
        </div>
      </header>

      {error && (
        <Alert variant="danger" title="Check your trip details">
          {error}
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
                  <h2 id="route-heading" className="text-base font-semibold text-text-primary">Your route</h2>
                  <p className="mt-1 text-xs text-text-muted">Where should your driver pick you up and drop you off?</p>
                </div>
                <span className="hidden rounded-full bg-[#f8f0e4] px-3 py-1.5 text-[11px] font-medium text-[#805b35] sm:inline-flex">Pickup <ArrowRight className="mx-1.5 h-3 w-3" /> Drop-off</span>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-[#e8ddce] bg-[#fffdf9] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f7ead8] text-[#9b6529]"><Navigation className="size-5" /></span>
                    <span><span className="block text-sm font-semibold text-text-primary">Pickup location</span><span className="mt-0.5 block text-xs text-text-muted">Your starting point</span></span>
                    <span className="ml-auto size-2.5 rounded-full border-2 border-[#b87324]" />
                  </div>
                  <div className="space-y-3">
                    <Input label="Street address or landmark" value={pickup.address} onChange={(e) => setPickup({ ...pickup, address: e.target.value })} placeholder="e.g. JKIA Terminal 1A" />
                    <Input label="Town or city" value={pickup.town} onChange={(e) => setPickup({ ...pickup, town: e.target.value })} placeholder="Nairobi" />
                  </div>
                  <details className="group mt-4 border-t border-[#eee5d9] pt-3">
                    <summary className="cursor-pointer list-none text-xs font-medium text-[#8a6b48] marker:hidden hover:text-[#68451e]">Add precise map coordinates <span className="float-right transition-transform group-open:rotate-180">⌄</span></summary>
                    <p className="mb-2 mt-2 text-[11px] leading-relaxed text-text-muted">Coordinates help your driver locate the exact pickup point. Defaults are set near central Nairobi.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Latitude" type="number" step="any" value={pickup.latitude} onChange={(e) => setPickup({ ...pickup, latitude: Number(e.target.value) })} />
                      <Input label="Longitude" type="number" step="any" value={pickup.longitude} onChange={(e) => setPickup({ ...pickup, longitude: Number(e.target.value) })} />
                    </div>
                  </details>
                </div>

                <div className="rounded-xl border border-[#e8ddce] bg-[#fffdf9] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e9f1e7] text-[#55764d]"><MapPin className="size-5" /></span>
                    <span><span className="block text-sm font-semibold text-text-primary">Drop-off location</span><span className="mt-0.5 block text-xs text-text-muted">Your destination</span></span>
                    <span className="ml-auto size-2.5 rounded-full bg-[#6f8c5c]" />
                  </div>
                  <div className="space-y-3">
                    <Input label="Street address or landmark" value={dropoff.address} onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })} placeholder="e.g. Westlands, Nairobi" />
                    <Input label="Town or city" value={dropoff.town} onChange={(e) => setDropoff({ ...dropoff, town: e.target.value })} placeholder="Nairobi" />
                  </div>
                  <details className="group mt-4 border-t border-[#eee5d9] pt-3">
                    <summary className="cursor-pointer list-none text-xs font-medium text-[#8a6b48] marker:hidden hover:text-[#68451e]">Add precise map coordinates <span className="float-right transition-transform group-open:rotate-180">⌄</span></summary>
                    <p className="mb-2 mt-2 text-[11px] leading-relaxed text-text-muted">Coordinates help your driver locate the exact destination. Defaults are set near central Nairobi.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Latitude" type="number" step="any" value={dropoff.latitude} onChange={(e) => setDropoff({ ...dropoff, latitude: Number(e.target.value) })} />
                      <Input label="Longitude" type="number" step="any" value={dropoff.longitude} onChange={(e) => setDropoff({ ...dropoff, longitude: Number(e.target.value) })} />
                    </div>
                  </details>
                </div>
              </div>
            </section>

            <section className="border-t border-[#eee5d9] pt-5" aria-labelledby="ride-heading">
              <div className="mb-4">
                <h2 id="ride-heading" className="text-base font-semibold text-text-primary">Choose your ride</h2>
                <p className="mt-1 text-xs text-text-muted">Select the vehicle that works best for your journey.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SERVICE_OPTIONS.map(({ label, value, detail, icon: ServiceIcon }) => {
                  const selected = serviceType === value;
                  return (
                    <label key={value} className={`relative flex min-h-[88px] cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-[#bd781f]/40 ${selected ? "border-[#bd781f] bg-[#fff7eb] shadow-[0_3px_12px_rgba(189,120,31,.1)]" : "border-[#e9e0d4] bg-white hover:border-[#d6bc96] hover:bg-[#fffdf9]"}`}>
                      <input className="sr-only" type="radio" name="serviceType" value={value} checked={selected} onChange={() => setServiceType(value as ServiceType)} />
                      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-[#bd781f] text-white" : "bg-[#f5eee3] text-[#805b35]"}`}><ServiceIcon className="size-5" /></span>
                      <span className="min-w-0"><span className="block text-sm font-semibold text-text-primary">{label}</span><span className="mt-1 block text-[11px] leading-snug text-text-muted">{detail}</span></span>
                      {selected && <span className="ml-auto grid size-5 shrink-0 place-items-center rounded-full bg-[#bd781f] text-white"><Check className="size-3.5" /></span>}
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 border-t border-[#eee5d9] pt-5 sm:grid-cols-2" aria-labelledby="schedule-heading">
              <div className="sm:col-span-2">
                <h2 id="schedule-heading" className="text-base font-semibold text-text-primary">Schedule &amp; passengers</h2>
                <p className="mt-1 text-xs text-text-muted">Add timing and trip preferences before requesting your estimate.</p>
              </div>
              <Input label="Travel date and time" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              <Select label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)} options={[{ label: "M-Pesa", value: "mpesa" }, { label: "Wallet", value: "wallet" }, { label: "Card", value: "stripe" }]} />
              <Input label="Passengers" type="number" min={1} value={passengers} leftIcon={<Users className="h-4 w-4" />} onChange={(e) => setPassengers(Number(e.target.value) || 1)} />
              <Input label="Luggage items" type="number" min={0} value={luggage} leftIcon={<Luggage className="h-4 w-4" />} onChange={(e) => setLuggage(Number(e.target.value) || 0)} />
              <div className="sm:col-span-2"><Input label="Note for your driver (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything your driver should know?" /></div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5d9] pt-5">
              <p className="m-0 inline-flex items-center gap-2 text-xs text-text-muted"><ShieldCheck className="size-4 text-[#6f8c5c]" /> You’ll review the fare before confirming.</p>
              <Button variant="secondary" loading={quoting} onClick={requestQuote}>
                <span className="inline-flex items-center gap-2">{quote ? "Refresh fare estimate" : "Get fare estimate"} <ArrowRight className="size-4" /></span>
              </Button>
            </div>
          </div>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-20">
          {quote ? (
            <Card className="overflow-hidden rounded-2xl border-[#e8d6bd] shadow-[0_8px_28px_rgba(69,48,28,.08)]" padded={false}>
              <div className="bg-gradient-to-br from-[#fff7eb] to-[#f4e2c7] p-5">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.1em] text-[#8a5b25]"><Check className="size-4" /> Fare estimate ready</span>
                <p className="mb-1 mt-4 text-xs text-[#78644c]">Estimated total</p>
                <strong className="block text-3xl font-semibold tracking-tight text-[#382719]">{formatCurrency(quote.fare, quote.currency)}</strong>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-[#705638]"><MapPin className="size-3.5" /> {quote.distanceKm.toFixed(1)} km</span>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3 text-sm"><span className="text-text-muted">Ride type</span><span className="font-medium capitalize text-text-primary">{serviceType}</span></div>
                <div className="flex items-center justify-between gap-3 text-sm"><span className="text-text-muted">Payment</span><span className="font-medium capitalize text-text-primary">{paymentMethod === "mpesa" ? "M-Pesa" : paymentMethod}</span></div>
                <div className="border-t border-[#eee5d9] pt-4">
                  <Button className="w-full justify-center" leftIcon={<Car className="h-4 w-4" />} loading={submitting} onClick={submit}>Request this trip</Button>
                </div>
                <p className="m-0 text-center text-[11px] leading-relaxed text-text-muted">The fare is an estimate and may be confirmed by your driver.</p>
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl border-[#e9ddcc] bg-white/90" title="Your fare estimate">
              <div className="py-2 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f7ead8] text-[#9b6529]"><Clock className="size-6" /></span>
                <h2 className="mb-0 mt-3 text-sm font-semibold text-text-primary">Know the cost upfront</h2>
                <p className="mb-0 mt-1 text-xs leading-relaxed text-text-muted">Enter your pickup and destination, then get an estimate before requesting your ride.</p>
              </div>
            </Card>
          )}
          <Card className="rounded-2xl border-[#e9ddcc] bg-[#fffaf1]" padded={false}>
            <div className="flex items-start gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e9f1e7] text-[#55764d]"><ShieldCheck className="size-4" /></span>
              <div><h2 className="m-0 text-sm font-semibold text-text-primary">A smoother trip</h2><p className="mb-0 mt-1 text-xs leading-relaxed text-text-muted">Your trip details and preferred payment are shared with the driver who accepts your request.</p></div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}