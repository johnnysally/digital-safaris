import { useEffect, useState } from "react";
import { Search as SearchIcon, MapPin, Navigation, Car, Clock } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Select from "../components/ui/Select";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { trackingApi } from "../api";
import { useToast } from "../context/toastContext";
import { formatDateTime, formatRelative } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type {
  TrackBookingResponse,
  TrackTripResponse,
  TrackDeliveryResponse,
} from "../types";

type Kind = "booking" | "trip" | "delivery";

export default function Tracking() {
  const { error: toastError } = useToast();
  const [kind, setKind] = useState<Kind>("booking");
  const [reference, setReference] = useState("");

  const [booking, setBooking] = useState<TrackBookingResponse | null>(null);
  const [trip, setTrip] = useState<TrackTripResponse | null>(null);
  const [delivery, setDelivery] = useState<TrackDeliveryResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearAll = () => {
    setBooking(null);
    setTrip(null);
    setDelivery(null);
  };

  const load = async () => {
    const ref = reference.trim();
    if (!ref) {
      setError("Enter a reference.");
      return;
    }

    setLoading(true);
    setError(null);
    clearAll();

    try {
      if (kind === "booking") {
        const data = await trackingApi.booking(ref);
        setBooking(data);
      } else if (kind === "trip") {
        const data = await trackingApi.trip(ref);
        setTrip(data);
      } else {
        const data = await trackingApi.delivery(ref);
        setDelivery(data);
      }
    } catch {
      setError("Could not find that reference.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!reference.trim()) return;
    const id = window.setInterval(load, 20000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, reference]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Tracking</h1>
        <p className="mt-1 text-sm text-text-muted">
          Enter a reference to follow a booking, trip, or delivery live.
        </p>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
            options={[
              { label: "Booking", value: "booking" },
              { label: "Trip", value: "trip" },
              { label: "Delivery", value: "delivery" },
            ]}
          />
          <div className="md:col-span-2">
            <Input
              placeholder="e.g. BKG-XXXX or ORD-XXXX"
              leftIcon={<SearchIcon className="h-4 w-4" />}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <Button type="submit" fullWidth loading={loading}>
            Track
          </Button>
        </form>
      </Card>

      {error && (
        <Alert variant="danger" title="Not found">
          {error}
        </Alert>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && booking && (
        <Card title="Booking">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono text-text-primary">{booking.reference}</p>
              <Badge variant="info">
                {capitalize(booking.status.replace(/_/g, " "))}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-muted">Check-in</p>
                <p className="text-text-primary">
                  {formatDateTime(booking.checkIn)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Check-out</p>
                <p className="text-text-primary">
                  {formatDateTime(booking.checkOut)}
                </p>
              </div>
            </div>
            {booking.property && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Property</p>
                  <p className="text-text-primary">{booking.property.name}</p>
                  <p className="text-xs text-text-secondary">
                    {booking.property.address}
                  </p>
                </div>
              </div>
            )}
            {booking.qrCode && (
              <div className="rounded-md border border-border bg-surface-alt p-3">
                <p className="text-xs text-text-muted">Check-in code</p>
                <p className="font-mono text-sm text-text-primary">
                  {booking.qrCode}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {!loading && trip && (
        <Card title="Trip">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono text-text-primary">{trip.trip.reference}</p>
              <Badge variant="info">
                {capitalize(trip.trip.status.replace(/_/g, " "))}
              </Badge>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="mt-0.5 h-4 w-4 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Pickup</p>
                <p className="text-text-primary">
                  {trip.trip.pickup?.address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Dropoff</p>
                <p className="text-text-primary">
                  {trip.trip.dropoff?.address}
                </p>
              </div>
            </div>
            {trip.trip.driver && (
              <div className="flex items-start gap-3">
                <Car className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Driver</p>
                  <p className="text-text-primary">
                    {trip.trip.driver.firstName} {trip.trip.driver.lastName}
                  </p>
                  {trip.trip.driver.phone && (
                    <p className="text-xs text-text-secondary">
                      {trip.trip.driver.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
            {trip.location && (
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface-alt p-3">
                <Car className="h-4 w-4 text-secondary-600" />
                <div>
                  <p className="text-xs text-text-muted">Live location</p>
                  <p className="font-mono text-xs text-text-primary">
                    {trip.location.latitude.toFixed(4)},{" "}
                    {trip.location.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Updated {formatRelative(trip.location.lastPingAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {!loading && delivery && (
        <Card title="Delivery">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono text-text-primary">
                {delivery.order.reference}
              </p>
              <Badge variant="info">
                {capitalize(delivery.order.status.replace(/_/g, " "))}
              </Badge>
            </div>
            {delivery.order.restaurant && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Restaurant</p>
                  <p className="text-text-primary">
                    {delivery.order.restaurant.name}
                  </p>
                </div>
              </div>
            )}
            {delivery.delivery?.driver && (
              <div className="flex items-start gap-3">
                <Car className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Driver</p>
                  <p className="text-text-primary">
                    {delivery.delivery.driver.firstName}{" "}
                    {delivery.delivery.driver.lastName}
                  </p>
                  {delivery.delivery.driver.phone && (
                    <p className="text-xs text-text-secondary">
                      {delivery.delivery.driver.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
            {delivery.location && (
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface-alt p-3">
                <Clock className="h-4 w-4 text-secondary-600" />
                <div>
                  <p className="text-xs text-text-muted">Last ping</p>
                  <p className="font-mono text-xs text-text-primary">
                    {delivery.location.latitude.toFixed(4)},{" "}
                    {delivery.location.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatRelative(delivery.location.lastPingAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {!loading && !booking && !trip && !delivery && !error && (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="Nothing to track yet"
          description="Enter a reference to follow it live. Auto-refreshes every 20 seconds."
        />
      )}
    </div>
  );
}