import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Utensils, MapPin, Star, Search as SearchIcon } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import Pagination from "../components/ui/Pagination";
import { searchApi } from "../api";
import { DEFAULT_PAGE_SIZE, ROUTES } from "../utils/constants";
import type { Restaurant, Location, PaginationMeta } from "../types";

export default function RestaurantPage() {
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [town, setTown] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    searchApi
      .locations({ limit: 100 })
      .then(setLocations)
      .catch(() => {
        /* optional */
      });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchApi.restaurants({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: q || undefined,
        town: town || undefined,
        cuisine: cuisine || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, town, cuisine]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Restaurants
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Discover menus and order from local kitchens.
        </p>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchData();
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <Input
              placeholder="Search restaurants…"
              leftIcon={<SearchIcon className="h-4 w-4" />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select
            placeholder="Any town"
            value={town}
            onChange={(e) => {
              setTown(e.target.value);
              setPage(1);
            }}
            options={locationOptions}
          />
          <Select
            placeholder="Any cuisine"
            value={cuisine}
            onChange={(e) => {
              setCuisine(e.target.value);
              setPage(1);
            }}
            options={cuisineOptions}
          />
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" variant="secondary" fullWidth>
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setQ("");
                setTown("");
                setCuisine("");
                setPage(1);
                setTimeout(fetchData, 0);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <Alert variant="danger" title="Failed to load">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Utensils className="h-6 w-6" />}
          title="No restaurants found"
          description="Try a different town or cuisine."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Card key={r._id} padded={false} className="overflow-hidden">
              <div
                className="h-40 bg-secondary-100 bg-cover bg-center"
                style={{
                  backgroundImage: r.coverImage
                    ? `url(${r.coverImage})`
                    : undefined,
                }}
              />
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {r.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-muted">
                    <MapPin className="h-3.5 w-3.5" /> {r.town}
                  </p>
                </div>

                {r.cuisineTypes && r.cuisineTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.cuisineTypes.slice(0, 3).map((c) => (
                      <Badge key={c} variant="neutral">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                    <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                    {r.rating.toFixed(1)}
                    <span className="text-text-muted">
                      ({r.totalRatings})
                    </span>
                  </span>
                  <Link to={ROUTES.RESTAURANT}>
                    <Button size="sm">View menu</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}