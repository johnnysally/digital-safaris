import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bed, MapPin, Search as SearchIcon, Star } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import Pagination from "../components/ui/Pagination";
import searchApi from "../api/searchApi";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import type { Location, PaginationMeta, Property } from "../types";

const PROPERTY_TYPES = [
  { label: "Hotel", value: "hotel" },
  { label: "Lodge", value: "lodge" },
  { label: "Camp", value: "camp" },
  { label: "Resort", value: "resort" },
  { label: "BnB", value: "bnb" },
  { label: "Guesthouse", value: "guesthouse" },
  { label: "Villa", value: "villa" },
  { label: "Apartment", value: "apartment" },
];

function coverFor(property: Property): string | null {
  return (
    property.coverImage ||
    property.images?.[0] ||
    property.partner?.logo ||
    null
  );
}

function priceLabel(property: Property): string | null {
  if (property.minPrice == null) return null;
  return formatCurrency(property.minPrice, property.currency || "KES");
}

export default function AccommodationPage() {
  const [rows, setRows] = useState<Property[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [town, setTown] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    searchApi
      .locations({ limit: 100 })
      .then(setLocations)
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchApi.accommodations({
        page,
        limit: DEFAULT_PAGE_SIZE,
        q: q || undefined,
        town: town || undefined,
        type: type || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load stays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, town, type]);

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({
        label: l.county ? `${l.name} · ${l.county}` : l.name,
        value: l.name,
      })),
    [locations]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Accommodation
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Browse verified stays across Kenya.
        </p>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            void fetchData();
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name or description…"
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
            placeholder="Any type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            options={PROPERTY_TYPES}
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
                setType("");
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
          icon={<Bed className="h-6 w-6" />}
          title="No stays found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((property) => {
            const detailHref = `/accommodation/${property.slug || property._id}`;
            const cover = coverFor(property);
            const price = priceLabel(property);
            const roomLabel =
              property.roomTypes > 0
                ? `${property.roomTypes} room type${
                    property.roomTypes === 1 ? "" : "s"
                  }`
                : null;

            return (
              <Card
                key={property._id}
                padded={false}
                className="flex flex-col overflow-hidden transition hover:shadow-md"
              >
                <div
                  className="relative h-44 bg-secondary-100 bg-cover bg-center"
                  style={{
                    backgroundImage: cover ? `url(${cover})` : undefined,
                  }}
                >
                  {!cover && (
                    <div className="absolute inset-0 grid place-items-center text-xs text-text-muted">
                      No photo
                    </div>
                  )}

                  {property.isFeatured && (
                    <span className="absolute left-3 top-3 rounded-full bg-secondary-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Featured
                    </span>
                  )}

                  <span className="absolute right-3 top-3 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white capitalize shadow-sm backdrop-blur">
                    {property.type}
                  </span>
                </div>

                <div className="flex flex-1 flex-col space-y-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {property.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {property.town}
                      {property.address ? ` · ${property.address}` : ""}
                    </p>
                    {property.partner?.name ? (
                      <p className="mt-1 truncate text-[11px] text-text-muted">
                        by {property.partner.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                      <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                      {property.rating.toFixed(1)}
                      {property.totalRatings > 0 ? (
                        <span className="text-text-muted">
                          ({property.totalRatings})
                        </span>
                      ) : (
                        <span className="text-text-muted">(new)</span>
                      )}
                    </span>
                    {roomLabel ? (
                      <span className="rounded-full bg-text-muted/10 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                        {roomLabel}
                      </span>
                    ) : (
                      <span className="rounded-full bg-text-muted/10 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                        No rooms yet
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <div className="min-w-0">
                      {price ? (
                        <>
                          <p className="text-[11px] text-text-muted">From</p>
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {price}
                            <span className="ml-1 text-[11px] font-normal text-text-muted">
                              / night
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-text-muted">
                          Contact for price
                        </p>
                      )}
                    </div>
                    <Button fullWidth>
                      <Link to={detailHref} className="w-full text-center">
                        View details
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
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