import { useEffect, useState } from "react";
import { Car, MapPin, Clock, Users, Luggage, Navigation } from "lucide-react";
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
  { label: "Car", value: "car" },
  { label: "Bike", value: "bike" },
  { label: "Van", value: "van" },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Transport</h1>
        <p className="mt-1 text-sm text-text-muted">
          Request a car, bike, or van anywhere in Kenya.
        </p>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      <Card title="Trip details">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <Navigation className="h-3.5 w-3.5" /> Pickup
            </div>
            <Input
              label="Address"
              value={pickup.address}
              onChange={(e) =>
                setPickup({ ...pickup, address: e.target.value })
              }
              placeholder="e.g. JKIA Terminal 1A"
            />
            <Input
              label="Town"
              value={pickup.town}
              onChange={(e) => setPickup({ ...pickup, town: e.target.value })}
              placeholder="Nairobi"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={pickup.latitude}
                onChange={(e) =>
                  setPickup({ ...pickup, latitude: Number(e.target.value) })
                }
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={pickup.longitude}
                onChange={(e) =>
                  setPickup({ ...pickup, longitude: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <MapPin className="h-3.5 w-3.5" /> Dropoff
            </div>
            <Input
              label="Address"
              value={dropoff.address}
              onChange={(e) =>
                setDropoff({ ...dropoff, address: e.target.value })
              }
              placeholder="e.g. Westlands, Nairobi"
            />
            <Input
              label="Town"
              value={dropoff.town}
              onChange={(e) => setDropoff({ ...dropoff, town: e.target.value })}
              placeholder="Nairobi"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={dropoff.latitude}
                onChange={(e) =>
                  setDropoff({ ...dropoff, latitude: Number(e.target.value) })
                }
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={dropoff.longitude}
                onChange={(e) =>
                  setDropoff({ ...dropoff, longitude: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <Clock className="h-3.5 w-3.5" /> When
            </div>
            <Input
              label="Scheduled at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <Select
              label="Service"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              options={SERVICE_OPTIONS}
            />
            <Select
              label="Payment"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as typeof paymentMethod)
              }
              options={[
                { label: "M-Pesa", value: "mpesa" },
                { label: "Wallet", value: "wallet" },
                { label: "Card", value: "stripe" },
              ]}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <Users className="h-3.5 w-3.5" /> Passengers
            </div>
            <Input
              label="Passengers"
              type="number"
              min={1}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value) || 1)}
            />
            <Input
              label="Luggage"
              type="number"
              min={0}
              leftIcon={<Luggage className="h-4 w-4" />}
              value={luggage}
              onChange={(e) => setLuggage(Number(e.target.value) || 0)}
            />
            <Input
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the driver should know"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" loading={quoting} onClick={requestQuote}>
            {quote ? "Re-quote" : "Get quote"}
          </Button>
          {quote && (
            <span className="text-sm text-text-secondary">
              {quote.distanceKm.toFixed(1)} km ·{" "}
              <span className="font-semibold text-secondary-600">
                {formatCurrency(quote.fare, quote.currency)}
              </span>
            </span>
          )}
        </div>
      </Card>

      {quote && (
        <Card title="Confirm">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Distance</span>
              <span className="text-text-primary">
                {quote.distanceKm.toFixed(1)} km
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Fare</span>
              <span className="font-semibold text-secondary-600">
                {formatCurrency(quote.fare, quote.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Payment</span>
              <span className="text-text-primary">{paymentMethod}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              leftIcon={<Car className="h-4 w-4" />}
              loading={submitting}
              onClick={submit}
            >
              Request trip
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}