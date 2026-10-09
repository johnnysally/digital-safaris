import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bed,
  Car,
  ChevronRight,
  CreditCard,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Utensils,
} from "lucide-react";
import {
  bookingApi,
  notificationApi,
  orderApi,
  searchApi,
  tripApi,
  walletApi,
} from "../api";
import { useAuth } from "../context/authContext";
import { ROUTES } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import type {
  Accommodation,
  Booking,
  CustomerWallet,
  Location,
  Notification,
  Order,
  Property,
  Restaurant,
  Room,
  Trip,
} from "../types";

const SERVICES = [
  {
    title: "Accommodation",
    icon: Bed,
    to: ROUTES.ACCOMMODATION,
  },
  {
    title: "Food & Drinks",
    icon: Utensils,
    to: ROUTES.RESTAURANT,
  },
  {
    title: "Transport",
    icon: Car,
    to: ROUTES.TRANSPORT,
  },
  {
    title: "Payments",
    icon: CreditCard,
    to: ROUTES.PAYMENT,
  },
];

interface FeaturedListing {
  id: string;
  title: string;
  location: string;
  category: string;
  rating: number;
  totalRatings: number;
  image?: string | null;
  price?: number;
  currency?: string;
  to: string;
}

const QUICK_ACTIONS = [
  { title: "Book Accommodation", icon: Bed, to: ROUTES.ACCOMMODATION },
  { title: "Order Food", icon: Utensils, to: ROUTES.RESTAURANT },
  { title: "Find Transport", icon: Car, to: ROUTES.TRANSPORT },
];

interface DashboardData {
  accommodations: Accommodation[];
  properties: Property[];
  restaurants: Restaurant[];
  rooms: Room[];
  locations: Location[];
  bookings: Booking[];
  trips: Trip[];
  orders: Order[];
  notifications: Notification[];
  unreadNotifications: number;
  wallet: CustomerWallet | null;
  totals: {
    accommodations: number;
    properties: number;
    restaurants: number;
  };
}

const EMPTY_DASHBOARD: DashboardData = {
  accommodations: [],
  properties: [],
  restaurants: [],
  rooms: [],
  locations: [],
  bookings: [],
  trips: [],
  orders: [],
  notifications: [],
  unreadNotifications: 0,
  wallet: null,
  totals: { accommodations: 0, properties: 0, restaurants: 0 },
};

interface DashboardRequest {
  name: string;
  run: () => Promise<unknown>;
}

function SectionHeading({
  title,
  detail,
  action,
  to,
}: {
  title: string;
  detail?: string;
  action?: string;
  to?: string;
}) {
  return (
    <div className="mb-2 flex items-end justify-between gap-2">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-text-primary sm:text-base">
          {title}
        </h2>
        {detail && <p className="mt-0.5 text-[10px] text-text-muted">{detail}</p>}
      </div>
      {action && to && (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-text-secondary hover:text-secondary-600"
        >
          {action}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [failedSections, setFailedSections] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const requests: DashboardRequest[] = [
      {
        name: "accommodations",
        run: () => searchApi.accommodations({ page: 1, limit: 12 }),
      },
      {
        name: "properties",
        run: () => searchApi.properties({ page: 1, limit: 12 }),
      },
      {
        name: "restaurants",
        run: () => searchApi.restaurants({ page: 1, limit: 12 }),
      },
      { name: "room pricing", run: () => searchApi.rooms({ page: 1, limit: 50 }) },
      { name: "destinations", run: () => searchApi.locations({ limit: 100 }) },
      { name: "bookings", run: () => bookingApi.list({ page: 1, limit: 20 }) },
      { name: "trips", run: () => tripApi.list({ page: 1, limit: 20 }) },
      { name: "orders", run: () => orderApi.list({ page: 1, limit: 10 }) },
      {
        name: "notifications",
        run: () => notificationApi.list({ page: 1, limit: 5 }),
      },
      { name: "unread notifications", run: () => notificationApi.unreadCount() },
      { name: "wallet", run: () => walletApi.get() },
    ];

    const loadDashboard = async () => {
      setLoading(true);
      const results = await Promise.allSettled(requests.map(({ run }) => run()));
      if (!mounted) return;

      const errors = results.flatMap((result, index) =>
        result.status === "rejected" ? [requests[index].name] : []
      );
      const resultData = (index: number) =>
        results[index].status === "fulfilled"
          ? results[index].value
          : undefined;
      const accommodations = resultData(0) as
        | Awaited<ReturnType<typeof searchApi.accommodations>>
        | undefined;
      const properties = resultData(1) as
        | Awaited<ReturnType<typeof searchApi.properties>>
        | undefined;
      const restaurants = resultData(2) as
        | Awaited<ReturnType<typeof searchApi.restaurants>>
        | undefined;
      const rooms = resultData(3) as
        | Awaited<ReturnType<typeof searchApi.rooms>>
        | undefined;
      const locations = resultData(4) as Location[] | undefined;
      const bookings = resultData(5) as
        | Awaited<ReturnType<typeof bookingApi.list>>
        | undefined;
      const trips = resultData(6) as
        | Awaited<ReturnType<typeof tripApi.list>>
        | undefined;
      const orders = resultData(7) as
        | Awaited<ReturnType<typeof orderApi.list>>
        | undefined;
      const notifications = resultData(8) as
        | Awaited<ReturnType<typeof notificationApi.list>>
        | undefined;
      const unreadNotifications = resultData(9) as
        | Awaited<ReturnType<typeof notificationApi.unreadCount>>
        | undefined;
      const wallet = resultData(10) as CustomerWallet | undefined;

      setDashboard({
        accommodations: accommodations?.data ?? [],
        properties: properties?.data ?? [],
        restaurants: restaurants?.data ?? [],
        rooms: rooms?.data ?? [],
        locations: locations ?? [],
        bookings: bookings?.data ?? [],
        trips: trips?.data ?? [],
        orders: orders?.data ?? [],
        notifications: notifications?.data ?? [],
        unreadNotifications: unreadNotifications?.count ?? 0,
        wallet: wallet ?? null,
        totals: {
          accommodations: accommodations?.meta.total ?? 0,
          properties: properties?.meta.total ?? 0,
          restaurants: restaurants?.meta.total ?? 0,
        },
      });
      setFailedSections(errors);
      setLoading(false);
    };

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const featured: FeaturedListing[] = [
    ...dashboard.properties.map((item) => ({
      id: item._id,
      title: item.name,
      location: item.town,
      category: item.type,
      rating: Number(item.rating ?? 0),
      totalRatings: Number(item.totalRatings ?? 0),
      image: item.images?.[0],
      price: dashboard.rooms
        .filter((room) => room.property === item._id)
        .reduce<number | undefined>(
          (lowest, room) =>
            lowest === undefined ? room.basePrice : Math.min(lowest, room.basePrice),
          undefined
        ),
      currency: dashboard.rooms.find((room) => room.property === item._id)?.currency,
      to: ROUTES.ACCOMMODATION,
    })),
    ...dashboard.accommodations.map((item) => ({
      id: item._id,
      title: item.name,
      location: item.town,
      category: item.type,
      rating: Number(item.rating ?? 0),
      totalRatings: Number(item.totalRatings ?? 0),
      image: item.coverImage,
      to: ROUTES.ACCOMMODATION,
    })),
    ...dashboard.restaurants.map((item) => ({
      id: item._id,
      title: item.name,
      location: item.town,
      category: item.cuisineTypes?.[0] || "Restaurant",
      rating: Number(item.rating ?? 0),
      totalRatings: Number(item.totalRatings ?? 0),
      image: item.coverImage,
      to: ROUTES.RESTAURANT,
    })),
  ]
    .sort(
      (left, right) =>
        right.rating - left.rating || right.totalRatings - left.totalRatings
    )
    .slice(0, 8);

  const destinations = dashboard.locations
    .filter(
      (location) =>
        location.isOperational && ["town", "city"].includes(location.type)
    );

  const upcomingActivities = [
    ...dashboard.bookings
      .filter(
        (booking) =>
          !["cancelled", "refunded", "checked_out"].includes(booking.status) &&
          new Date(booking.checkOut).getTime() >= Date.now()
      )
      .map((booking) => ({
        id: booking._id,
        title: booking.propertyName || booking.partnerName || "Accommodation",
        detail: booking.roomName || booking.status.replace(/_/g, " "),
        date: booking.checkIn,
        status: booking.status,
        image: booking.propertyImages?.[0],
        to: ROUTES.BOOKING,
      })),
    ...dashboard.trips
      .filter(
        (trip) =>
          !["cancelled", "completed", "failed"].includes(trip.status) &&
          (new Date(trip.scheduledAt).getTime() >= Date.now() ||
            ["ongoing", "in_progress"].includes(trip.status))
      )
      .map((trip) => ({
        id: trip._id,
        title: `${trip.pickup.town || "Pickup"} to ${trip.dropoff.town || "Destination"}`,
        detail: trip.type,
        date: trip.scheduledAt,
        status: trip.status,
        image: null,
        to: ROUTES.TRIP,
      })),
    ...dashboard.orders
      .filter(
        (order) =>
          !["cancelled", "delivered", "completed", "rejected"].includes(
            order.status
          )
      )
      .map((order) => ({
        id: order._id,
        title: order.restaurantName || "Food order",
        detail: `${order.status.replace(/_/g, " ")} · ${order.type}`,
        date: order.createdAt,
        status: order.status,
        image: order.restaurantLogo,
        to: ROUTES.ORDER,
      })),
  ]
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
    .slice(0, 4);

  const serviceCounts: Record<string, string> = {
    Accommodation: `${dashboard.totals.accommodations + dashboard.totals.properties} listings`,
    "Food & Drinks": `${dashboard.totals.restaurants} restaurants`,
    Transport: "Request a ride",
    Payments: dashboard.wallet
      ? formatCurrency(dashboard.wallet.balance, dashboard.wallet.currency)
      : "Wallet balance unavailable",
  };

  const serviceImage = (title: string): string | undefined => {
    if (title === "Accommodation") {
      return (
        dashboard.accommodations.find((item) => item.coverImage)?.coverImage ??
        dashboard.properties.find((item) => item.images?.[0])?.images?.[0]
      );
    }
    if (title === "Food & Drinks") {
      return dashboard.restaurants.find((item) => item.coverImage)?.coverImage ?? undefined;
    }
    return undefined;
  };

  const latestActivity = dashboard.notifications.slice(0, 3);
  const heroImage =
    dashboard.accommodations.find((item) => item.coverImage)?.coverImage ??
    dashboard.properties.find((item) => item.images?.[0])?.images?.[0] ??
    dashboard.restaurants.find((item) => item.coverImage)?.coverImage;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(
      query
        ? `${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`
        : ROUTES.SEARCH
    );
  };

  return (
    <div className="min-w-0 space-y-5">
      <div className="min-w-0 space-y-5">
        {failedSections.length > 0 && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] text-amber-950 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              Some live dashboard data could not be loaded:{" "}
              <span className="font-semibold">{failedSections.join(", ")}</span>.
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-2"
            >
              Retry
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}

        <section className="relative isolate flex min-h-[290px] items-center overflow-hidden rounded-lg bg-[#302012] px-5 py-7 sm:min-h-[320px] sm:px-8">
          <img
            src={heroImage || "/hero-bg.jpg"}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#24170e]/90 via-[#281b10]/75 to-[#281b10]/35" />
          <div className="w-full max-w-[620px]">
            <p className="text-xs font-semibold text-[#f4a332] sm:text-sm">
              {greeting}
              {customer ? `, ${customer.firstName}` : ""}
            </p>
            <h1 className="mt-2 max-w-[520px] text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-5xl">
              Your Complete
              <br />
              Travel Companion
            </h1>
            <p className="mt-3 flex flex-wrap gap-x-2 text-xs font-medium text-white/95 sm:text-sm">
              <span>Accommodation</span>
              <span>·</span>
              <span>Food</span>
              <span>·</span>
              <span>Transport</span>
              <span>·</span>
              <span>Payments</span>
            </p>
            <form
              onSubmit={submitSearch}
              className="mt-5 flex h-12 max-w-[620px] items-center gap-3 rounded-lg bg-white px-4 shadow-lg"
            >
              <MapPin className="h-5 w-5 shrink-0 text-[#41372e]" />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="destination-search"
                  className="block text-[11px] font-semibold text-[#30271f]"
                >
                  Where to?
                </label>
                <input
                  id="destination-search"
                  list="dashboard-destination-options"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search a town or destination"
                  className="w-full bg-transparent text-xs text-[#30271f] outline-none placeholder:text-[#958c7f]"
                />
                <datalist id="dashboard-destination-options">
                  {destinations.map((location) => (
                    <option key={location._id} value={location.name} />
                  ))}
                </datalist>
              </div>
              <button
                type="submit"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#f58216] px-4 text-xs font-semibold text-white transition hover:bg-[#dd6e0c]"
              >
                <Search className="h-3 w-3" />
                Search
              </button>
            </form>
          </div>
          <p           className="absolute bottom-8 right-8 hidden -rotate-6 font-serif text-2xl italic leading-tight text-white drop-shadow-lg xl:block">
            Explore
            <br />
            Kenya
          </p>
        </section>

        <section>
          <SectionHeading
            title="Explore Our Services"
            detail="Services and availability from our live marketplace."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {SERVICES.map(({ title, icon: Icon, to }) => {
              const image = serviceImage(title);
              return (
              <Link
                key={title}
                to={to}
                className="group overflow-hidden rounded-lg border border-[#eadfce] bg-white/70 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-[112px] overflow-hidden bg-[#f2e9dc] sm:h-[132px]">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#a66b2b]">
                      <Icon className="h-8 w-8" />
                    </div>
                  )}
                  <span className="absolute -bottom-3 left-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-[#3a3730] shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="min-h-[92px] px-3 pb-3 pt-5">
                  <p className="truncate text-xs font-semibold text-text-primary sm:text-sm">
                    {title}
                  </p>
                  <p className="mt-1 min-h-[28px] text-[11px] leading-4 text-text-muted">
                    {loading ? "Loading live data..." : serviceCounts[title]}
                  </p>
                  <span className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#f0ece7] text-[#50483e] transition group-hover:bg-[#fbe2c7]">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            title="Featured Stays & Dining"
            detail="Highly rated stays and restaurants from our partners."
            action="View all"
            to={ROUTES.SEARCH}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((stay) => (
              <Link
                key={`${stay.to}-${stay.id}`}
                to={stay.to}
                className="group overflow-hidden rounded-lg border border-[#eadfce] bg-white/70 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative flex h-[120px] items-center justify-center overflow-hidden bg-[#f2e9dc] sm:h-[150px]">
                  {stay.image ? (
                    <img
                      src={stay.image}
                      alt={stay.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-[#a66b2b]">
                      {stay.to === ROUTES.RESTAURANT ? (
                        <Utensils className="h-6 w-6" />
                      ) : (
                        <Bed className="h-6 w-6" />
                      )}
                    </span>
                  )}
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-[#238451] px-1.5 py-0.5 text-[8px] font-semibold text-white">
                    {stay.category}
                  </span>
                </div>
                <div className="space-y-1 p-3">
                  <p className="truncate text-xs font-semibold text-text-primary sm:text-sm">
                    {stay.title}
                  </p>
                  <p className="flex items-center gap-1 truncate text-[10px] text-text-muted">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {stay.location}
                  </p>
                  <p className="flex items-center gap-1 text-[10px] text-text-secondary">
                    <Star className="h-3 w-3 fill-[#e9a32c] text-[#e9a32c]" />
                    {stay.rating.toFixed(1)}
                    <span className="text-text-muted">
                      ({stay.totalRatings} reviews)
                    </span>
                  </p>
                  {stay.price !== undefined && stay.currency && (
                    <p className="text-[11px] font-semibold text-text-primary">
                      {formatCurrency(stay.price, stay.currency)}
                      <span className="font-normal text-text-muted"> / night</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
            {loading &&
              Array.from({ length: 4 }, (_, index) => (
                <div
                  key={`featured-skeleton-${index}`}
                  className="h-[220px] animate-pulse rounded-lg border border-[#eadfce] bg-white/60"
                />
              ))}
            {!loading && featured.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-[#dfd1bd] bg-white/50 px-4 py-6 text-center text-[10px] text-text-muted">
                New stays and experiences are coming soon. Try exploring all
                destinations.
                <Link
                  to={ROUTES.SEARCH}
                  className="ml-1 font-semibold text-[#a56623] hover:underline"
                >
                  Explore destinations
                </Link>
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionHeading
            title="Explore Destinations"
            detail="Operational locations fetched from the travel network."
            action="Search places"
            to={ROUTES.SEARCH}
          />
          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={`location-skeleton-${index}`}
                  className="h-12 animate-pulse rounded-lg border border-[#eadfce] bg-white/60"
                />
              ))}
            </div>
          ) : destinations.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {destinations.slice(0, 4).map((location) => (
                <Link
                  key={location._id}
                  to={`${ROUTES.SEARCH}?town=${encodeURIComponent(location.name)}`}
                  className="flex min-h-[68px] items-center gap-3 rounded-lg border border-[#eadfce] bg-white/70 px-3 py-3 transition hover:border-[#d9c5a5] hover:shadow-sm"
                >
                  <MapPin className="h-5 w-5 shrink-0 text-[#a66b2b]" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-text-primary">
                      {location.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-text-muted">
                      {location.county || location.type}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[#dfd1bd] bg-white/50 px-3 py-4 text-center text-[10px] text-text-muted">
              No operational destinations are available right now.
            </p>
          )}
        </section>

        <section className="relative flex min-h-[92px] items-center justify-between gap-3 overflow-hidden rounded-lg bg-[#392616] px-5 py-4 text-white sm:min-h-[108px]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#25170e] via-[#593719] to-[#25170e]" />
          <div className="relative grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                icon: Bed,
                title: loading ? "…" : String(dashboard.totals.accommodations + dashboard.totals.properties),
                sub: "Stays & lodges",
              },
              {
                icon: Utensils,
                title: loading ? "…" : String(dashboard.totals.restaurants),
                sub: "Dining partners",
              },
              {
                icon: MapPin,
                title: loading ? "…" : String(destinations.length),
                sub: "Available towns",
              },
              {
                icon: CreditCard,
                title: dashboard.wallet
                  ? formatCurrency(dashboard.wallet.balance, dashboard.wallet.currency)
                  : loading
                    ? "…"
                    : "—",
                sub: "Wallet balance",
              },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0 text-[#f7a12c]" />
                <span className="min-w-0 text-[11px] leading-tight sm:text-xs">
                  <span className="block truncate font-semibold">{title}</span>
                  <span className="mt-1 block text-white/75">{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-xl border border-[#eadfce] bg-white/75 p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(({ title, icon: Icon, to }) => (
              <Link
                key={title}
                to={to}
                className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-lg border border-[#f0e7dc] bg-[#fffdf9] px-2 py-3 text-center transition hover:border-[#e9bd8a] hover:bg-[#fff7ed]"
              >
                <Icon className="h-5 w-5 text-[#f47725]" />
                <span className="max-w-full text-[11px] font-medium leading-tight text-text-primary">
                  {title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#eadfce] bg-white/75 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              Your Trips & Activities
            </h2>
            <Link
              to={ROUTES.BOOKING}
              className="inline-flex shrink-0 items-center gap-1 text-[10px] text-text-secondary hover:text-secondary-600"
            >
              View all <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2 border-t border-[#f0e7dc] py-2">
              {[0, 1].map((item) => (
                <div
                  key={`trip-skeleton-${item}`}
                  className="h-12 animate-pulse rounded-md bg-[#f5efe7]"
                />
              ))}
            </div>
          ) : upcomingActivities.length > 0 ? (
            <div className="divide-y divide-[#f0e7dc]">
              {upcomingActivities.map((activity) => (
                <Link
                  key={`${activity.to}-${activity.id}`}
                  to={activity.to}
                  className="flex gap-3 py-3"
                >
                  {activity.image ? (
                    <img
                      src={activity.image}
                      alt=""
                      className="h-14 w-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-[#f3e8d9] text-[#8e632f]">
                      {activity.to === ROUTES.TRIP ? (
                        <Car className="h-4 w-4" />
                      ) : (
                        <Bed className="h-4 w-4" />
                      )}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-text-primary">
                      {activity.title}
                    </span>
                    <span className="mt-1 block truncate text-[10px] text-text-muted">
                      {new Date(activity.date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {activity.detail ? ` · ${activity.detail}` : ""}
                    </span>
                    <span className="mt-1.5 inline-flex rounded-full bg-[#e4f3e8] px-2 py-0.5 text-[9px] font-medium capitalize text-[#28744b]">
                      {activity.status.replace(/_/g, " ")}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border-t border-[#f0e7dc] py-4">
              <p className="text-[11px] font-medium text-text-primary">
                No upcoming trips yet
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
                Find a stay or experience for your next Kenya adventure.
              </p>
              <Link
                to={ROUTES.SEARCH}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#bd681f]"
              >
                Explore stays <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#eadfce] bg-white/75 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3e5d2] text-[#a66b2b]">
                <CreditCard className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block text-[10px] font-medium text-text-muted">
                  Wallet balance
                </span>
                <span className="block text-sm font-semibold text-text-primary">
                  {loading
                    ? "Loading..."
                    : dashboard.wallet
                      ? formatCurrency(
                          dashboard.wallet.balance,
                          dashboard.wallet.currency
                        )
                      : "Unavailable"}
                </span>
              </span>
            </div>
            <Link
              to={ROUTES.WALLET}
              className="rounded-full border border-[#e9dfd2] px-3 py-1.5 text-[10px] font-medium text-text-secondary hover:bg-[#f8f2e9]"
            >
              Wallet
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-[#eadfce] bg-white/75 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              Recent updates
            </h2>
            <Link
              to={ROUTES.NOTIFICATIONS}
              className="text-[10px] text-text-secondary hover:text-secondary-600"
            >
              {loading ? "Loading" : `${dashboard.unreadNotifications} unread`}
            </Link>
          </div>
          {loading ? (
            <div className="h-12 animate-pulse rounded-md bg-[#f5efe7]" />
          ) : latestActivity.length > 0 ? (
            <div className="space-y-2">
              {latestActivity.map((notification) => (
                <Link
                  key={notification._id}
                  to={ROUTES.NOTIFICATIONS}
                  className="block border-t border-[#f0e7dc] pt-3"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        notification.isRead ? "bg-[#d9d1c5]" : "bg-[#e88822]"
                      }`}
                    />
                    <span className="truncate text-[11px] font-semibold text-text-primary">
                      {notification.title}
                    </span>
                  </span>
                  <span className="mt-1 block line-clamp-2 text-[10px] leading-relaxed text-text-muted">
                    {notification.body}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="border-t border-[#f0e7dc] pt-3 text-[10px] text-text-muted">
              No notifications yet.
            </p>
          )}
        </section>

        <div className="flex min-h-[104px] items-center gap-4 rounded-xl border border-[#eadfce] bg-[#f7efe4] px-5 py-5 text-sm leading-relaxed text-text-secondary sm:col-span-2 xl:col-span-4">
          <ShieldCheck className="h-6 w-6 shrink-0 text-[#a86b27]" />
          Trusted local partners, 24/7 support and secure bookings.
        </div>
      </aside>
    </div>
  );
}
