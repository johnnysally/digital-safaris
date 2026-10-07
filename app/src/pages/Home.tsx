import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Bed,
  Utensils,
  Car,
  Compass,
  Sparkles,
  Wallet,
  MapPin,
  Star,
  ArrowRight,
  TrendingUp,
  Flame,
  Calendar,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../context/authContext";
import { searchApi, bookingApi } from "../api";
import { ROUTES } from "../utils/constants";
import type {
  Restaurant,
  Accommodation,
  Property,
  Booking,
} from "../types";

const CATEGORIES = [
  {
    key: "stays",
    label: "Stays",
    sub: "Hotels & Lodges",
    icon: Bed,
    to: ROUTES.ACCOMMODATION,
  },
  {
    key: "food",
    label: "Food",
    sub: "Restaurants",
    icon: Utensils,
    to: ROUTES.RESTAURANT,
  },
  {
    key: "transport",
    label: "Transport",
    sub: "Rides & Transfers",
    icon: Car,
    to: ROUTES.TRANSPORT,
  },
  {
    key: "concierge",
    label: "Concierge",
    sub: "Ask anything",
    icon: Sparkles,
    to: ROUTES.AI_CONCIERGE,
  },
];

export default function Home() {
  const { customer } = useAuth();

  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [upcoming, setUpcoming] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [r, a, p, b] = await Promise.allSettled([
          searchApi.restaurants({ page: 1, limit: 2 }),
          searchApi.accommodations({ page: 1, limit: 2 }),
          searchApi.properties({ page: 1, limit: 2 }),
          bookingApi.list({ page: 1, limit: 1, status: "confirmed" }),
        ]);

        if (r.status === "fulfilled") setRestaurants(r.value.data ?? []);
        if (a.status === "fulfilled") setAccommodations(a.value.data ?? []);
        if (p.status === "fulfilled") setProperties(p.value.data ?? []);
        if (b.status === "fulfilled") {
          const first = (b.value.data ?? [])[0];
          if (first) setUpcoming(first);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-primary-800 px-6 py-10 sm:px-10 sm:py-14">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url(/hero-bg.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/70 to-primary-800/30" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-300 backdrop-blur">
            <Compass className="h-3.5 w-3.5" />
            Digital Safaris
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            {greeting}
            {customer ? `, ${customer.firstName}` : ""}.
            <br />
            <span className="text-secondary-400">Where next?</span>
          </h1>

          <p className="mt-3 max-w-lg text-sm text-primary-100/90 sm:text-base">
            Discover stays, food, and transport across Kenya — all in one
            platform.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="mt-6 flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
          >
            <Search className="ml-3 h-4 w-4 shrink-0 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations, restaurants, or services..."
              className="min-w-0 flex-1 bg-transparent px-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <Link to={ROUTES.SEARCH}>
              <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Search
              </Button>
            </Link>
          </form>
        </div>
      </section>

      {/* Category grid */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.key} to={cat.to}>
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {cat.label}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {cat.sub}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Upcoming trip */}
      {upcoming && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary-600">
                Upcoming
              </p>
              <h2 className="text-lg font-semibold text-text-primary">
                Your next stay
              </h2>
            </div>
            <Link
              to={ROUTES.BOOKING}
              className="text-xs font-semibold text-secondary-600 hover:underline"
            >
              View all
            </Link>
          </div>

          <Card padded={false} className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div
                className="h-40 bg-secondary-100 bg-cover bg-center md:h-full"
                style={{
                  backgroundImage: upcoming.propertyImages?.[0]
                    ? `url(${upcoming.propertyImages[0]})`
                    : undefined,
                }}
              />
              <div className="col-span-2 space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-text-primary">
                      {upcoming.propertyName || "Your stay"}
                    </p>
                    {upcoming.partnerName && (
                      <p className="text-xs text-text-muted">
                        {upcoming.partnerName}
                      </p>
                    )}
                  </div>
                  <Badge variant="success">
                    {upcoming.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-secondary-600" />
                    {new Date(upcoming.checkIn).toDateString()} →{" "}
                    {new Date(upcoming.checkOut).toDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-secondary-600" />
                    {upcoming.roomName || "Room"}
                  </span>
                </div>

                <Link to={ROUTES.BOOKING}>
                  <Button
                    size="sm"
                    variant="secondary"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    View booking
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Popular stays */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary-600">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              Stays
            </p>
            <h2 className="text-lg font-semibold text-text-primary">
              Trending accommodations
            </h2>
          </div>
          <Link
            to={ROUTES.ACCOMMODATION}
            className="text-xs font-semibold text-secondary-600 hover:underline"
          >
            See all
          </Link>
        </div>

        {loading && accommodations.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : accommodations.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-text-muted">
              No stays listed yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {accommodations.slice(0, 2).map((a) => (
              <Link key={a._id} to={ROUTES.ACCOMMODATION}>
                <Card
                  padded={false}
                  className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="h-44 bg-secondary-100 bg-cover bg-center"
                    style={{
                      backgroundImage: a.coverImage
                        ? `url(${a.coverImage})`
                        : undefined,
                    }}
                  />
                  <div className="space-y-2 p-4">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {a.name}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {a.town}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{a.type}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                        <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                        {a.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular restaurants */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary-600">
              <Flame className="mr-1 inline h-3 w-3" />
              Food
            </p>
            <h2 className="text-lg font-semibold text-text-primary">
              Restaurants near you
            </h2>
          </div>
          <Link
            to={ROUTES.RESTAURANT}
            className="text-xs font-semibold text-secondary-600 hover:underline"
          >
            See all
          </Link>
        </div>

        {loading && restaurants.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : restaurants.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-text-muted">
              No restaurants listed yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {restaurants.slice(0, 2).map((r) => (
              <Link key={r._id} to={ROUTES.RESTAURANT}>
                <Card
                  padded={false}
                  className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="h-44 bg-secondary-100 bg-cover bg-center"
                    style={{
                      backgroundImage: r.coverImage
                        ? `url(${r.coverImage})`
                        : undefined,
                    }}
                  />
                  <div className="space-y-2 p-4">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {r.name}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {r.town}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(r.cuisineTypes || []).slice(0, 2).map((c) => (
                          <Badge key={c} variant="neutral">
                            {c}
                          </Badge>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                        <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                        {r.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Transport / properties */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary-600">
              <Car className="mr-1 inline h-3 w-3" />
              Transport & properties
            </p>
            <h2 className="text-lg font-semibold text-text-primary">
              Get there, stay there
            </h2>
          </div>
          <Link
            to={ROUTES.TRANSPORT}
            className="text-xs font-semibold text-secondary-600 hover:underline"
          >
            See all
          </Link>
        </div>

        {loading && properties.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-text-muted">
              Nothing listed yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {properties.slice(0, 2).map((p) => (
              <Link key={p._id} to={ROUTES.ACCOMMODATION}>
                <Card
                  padded={false}
                  className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="h-44 bg-secondary-100 bg-cover bg-center"
                    style={{
                      backgroundImage: p.images?.[0]
                        ? `url(${p.images[0]})`
                        : undefined,
                    }}
                  />
                  <div className="space-y-2 p-4">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {p.name}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {p.town}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral">{p.type}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                        <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                        {p.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Concierge + wallet strip */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                Ask the Digital Safaris Concierge
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Tell us what you want to eat, where to stay, or how to get
                around. We'll handle it.
              </p>
              <Link to={ROUTES.AI_CONCIERGE} className="mt-3 inline-block">
                <Button
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Start chatting
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-800 text-white">
              <Wallet className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                Wallet & payments
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Top up via M-Pesa, pay in one tap, and track your receipts.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={ROUTES.WALLET}>
                  <Button size="sm" variant="secondary">
                    Open wallet
                  </Button>
                </Link>
                <Link to={ROUTES.PAYMENT}>
                  <Button size="sm" variant="ghost">
                    Payments
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Support strip */}
      <section className="rounded-2xl border border-border bg-surface px-6 py-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Need help?
            </p>
            <p className="text-xs text-text-muted">
              Reach out via chat, email, or phone. We are available 24/7.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.NOTIFICATIONS}>
              <Button size="sm" variant="ghost">
                Notifications
              </Button>
            </Link>
            <Link to={ROUTES.PROFILE}>
              <Button size="sm" variant="secondary">
                Profile & settings
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}