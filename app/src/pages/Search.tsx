import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, MapPin, Star, Bed, Utensils } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Tabs from "../components/ui/Tabs";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import Avatar from "../components/ui/Avatar";
import { searchApi } from "../api";
import { useToast } from "../context/toastContext";
import { ROUTES, DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import type {
  Restaurant,
  Accommodation,
  Property,
  Location,
} from "../types";

const TABS = [
  { key: "all", label: "All" },
  { key: "restaurants", label: "Restaurants" },
  { key: "accommodations", label: "Accommodations" },
  { key: "properties", label: "Properties" },
];

export default function Search() {
  const { error: toastError } = useToast();

  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [town, setTown] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    searchApi
      .locations({ limit: 100 })
      .then((res) => setLocations(res))
      .catch(() => {
        /* optional */
      });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        search: q || undefined,
        town: town || undefined,
        cuisine: cuisine || undefined,
      };

      const tasks: Array<Promise<void>> = [];

      if (tab === "all" || tab === "restaurants") {
        tasks.push(
          searchApi
            .restaurants(params)
            .then((res) => setRestaurants(res.data ?? []))
        );
      } else {
        setRestaurants([]);
      }

      if (tab === "all" || tab === "accommodations") {
        tasks.push(
          searchApi
            .accommodations(params)
            .then((res) => setAccommodations(res.data ?? []))
        );
      } else {
        setAccommodations([]);
      }

      if (tab === "all" || tab === "properties") {
        tasks.push(
          searchApi
            .properties(params)
            .then((res) => setProperties(res.data ?? []))
        );
      } else {
        setProperties([]);
      }

      await Promise.all(tasks);
    } catch {
      setError("Could not load results.");
      toastError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({
        label: l.county ? `${l.name} · ${l.county}` : l.name,
        value: l.name,
      })),
    [locations]
  );

  const cuisineOptions = [
    { label: "African", value: "african" },
    { label: "Italian", value: "italian" },
    { label: "Chinese", value: "chinese" },
    { label: "Indian", value: "indian" },
    { label: "Fast food", value: "fast_food" },
    { label: "Seafood", value: "seafood" },
    { label: "Other", value: "other" },
  ];

  const total =
    restaurants.length + accommodations.length + properties.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Explore</h1>
        <p className="mt-1 text-sm text-text-muted">
          Discover stays, restaurants, and properties across Kenya.
        </p>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchData();
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <Input
              placeholder="Search destinations, experiences..."
              leftIcon={<SearchIcon className="h-4 w-4" />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select
            placeholder="Any town"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            options={locationOptions}
          />
          <div className="flex gap-2">
            <Button type="submit" fullWidth>
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setQ("");
                setTown("");
                setCuisine("");
                setTimeout(fetchData, 0);
              }}
            >
              Reset
            </Button>
          </div>

          {(tab === "all" || tab === "restaurants") && (
            <div className="md:col-span-4">
              <Select
                placeholder="Any cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                options={cuisineOptions}
              />
            </div>
          )}
        </form>
      </Card>

      <Tabs tabs={TABS} activeKey={tab} onChange={setTab} />

      {error && (
        <Alert variant="danger" title="Failed to load">
          {error}
        </Alert>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && total === 0 && (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="No results"
          description="Try a different search term or town."
        />
      )}

      {!loading && restaurants.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Restaurants
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <Card key={r._id} padded={false} className="overflow-hidden">
                <div
                  className="h-32 bg-secondary-100 bg-cover bg-center"
                  style={{
                    backgroundImage: r.coverImage
                      ? `url(${r.coverImage})`
                      : undefined,
                  }}
                />
                <div className="space-y-2 p-4">
                  <div className="flex items-start gap-2">
                    <Avatar
                      src={r.logo ?? undefined}
                      fallback={r.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {r.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {r.town}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                    {r.rating.toFixed(1)}
                    <span className="text-text-muted">
                      ({r.totalRatings})
                    </span>
                  </div>
                  <Link to={ROUTES.RESTAURANT}>
                    <Button size="sm" fullWidth>
                      View menu
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && accommodations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Accommodations
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accommodations.map((a) => (
              <Card key={a._id} padded={false} className="overflow-hidden">
                <div
                  className="h-32 bg-secondary-100 bg-cover bg-center"
                  style={{
                    backgroundImage: a.coverImage
                      ? `url(${a.coverImage})`
                      : undefined,
                  }}
                />
                <div className="space-y-2 p-4">
                  <div className="flex items-start gap-2">
                    <Avatar
                      src={a.logo ?? undefined}
                      fallback={a.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {a.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {a.town}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Bed className="h-3.5 w-3.5 text-secondary-600" />
                    {a.type}
                    <span className="ml-auto inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                      {a.rating.toFixed(1)}
                    </span>
                  </div>
                  <Link to={ROUTES.ACCOMMODATION}>
                    <Button size="sm" fullWidth>
                      Book now
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && properties.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Properties
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <Card key={p._id} padded={false} className="overflow-hidden">
                <div
                  className="h-32 bg-secondary-100 bg-cover bg-center"
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
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                    {p.rating.toFixed(1)}
                    <Badge variant="neutral">{p.type}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}