import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Clock3,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import searchApi from "../api/searchApi";
import { formatCurrency } from "../utils/formatCurrency";
import type { PropertyDetails, PropertyRoom } from "../types";

function bedsLabel(room: PropertyRoom): string {
  if (!room.beds?.length) return "";
  return room.beds.map((bed) => `${bed.count}× ${bed.type}`).join(", ");
}

function RoomImageCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = total > 0 ? images[Math.min(index, total - 1)] : null;

  function go(delta: number) {
    if (total === 0) return;
    setIndex((prev) => (prev + delta + total) % total);
  }

  return (
    <div className="relative h-36 w-full overflow-hidden bg-secondary-100">
      {current ? (
        <img
          src={current}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-xs text-text-muted">
          No photo
        </div>
      )}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
          >
            ›
          </button>

          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
            {Math.min(index + 1, total)}/{total}
          </span>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AccommodationDetailPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [data, setData] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    searchApi
      .propertyDetails(idOrSlug)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this property.");
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

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Property not available">
          {error ?? "This property could not be found."}
        </Alert>
        <Link
          to="/accommodation"
          className="inline-flex items-center gap-1 text-sm text-secondary-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to stays
        </Link>
      </div>
    );
  }

  const { property } = data;
  const cover =
    property.coverImage ||
    property.images?.[0] ||
    property.partner?.logo ||
    null;
  const reviewLabel =
    property.totalRatings > 0
      ? `${property.totalRatings} review${property.totalRatings === 1 ? "" : "s"}`
      : "No reviews yet";

  return (
    <div className="space-y-6">
      <Link
        to="/accommodation"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to stays
      </Link>

      <Card padded={false} className="overflow-hidden">
        <div
          className="relative h-64 bg-secondary-100 bg-cover bg-center md:h-80"
          style={{
            backgroundImage: cover ? `url(${cover})` : undefined,
          }}
        >
          {!cover && (
            <div className="absolute inset-0 grid place-items-center text-sm text-text-muted">
              No photo
            </div>
          )}

          {property.isFeatured && (
            <span className="absolute left-4 top-4 rounded-full bg-secondary-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              Featured
            </span>
          )}

          <span className="absolute right-4 top-4 rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white capitalize shadow-sm backdrop-blur">
            {property.type}
          </span>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-text-primary">
                {property.name}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-text-muted">
                <MapPin className="h-4 w-4 shrink-0" />
                {property.address ? `${property.address}, ` : ""}
                {property.town}
              </p>
              {property.partner?.name ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-text-muted">
                  <Building2 className="h-3.5 w-3.5" />
                  Managed by {property.partner.name}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-secondary-500 text-secondary-500" />
                {property.rating.toFixed(1)}
                <span className="text-text-muted">({reviewLabel})</span>
              </span>
            </div>
          </div>

          {property.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
              {property.description}
            </p>
          ) : null}

          {property.amenities?.length ? (
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-text-muted/10 px-2.5 py-1 text-[11px] font-medium text-text-muted"
                >
                  {amenity}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" /> Check-in from{" "}
              {property.checkInTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" /> Check-out by{" "}
              {property.checkOutTime}
            </span>
            {property.roomTypes > 0 ? (
              <span className="inline-flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" /> {property.roomTypes} room
                type{property.roomTypes === 1 ? "" : "s"} ·{" "}
                {property.roomUnits} unit{property.roomUnits === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          Available rooms
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Choose a room type to start your booking.
        </p>
      </div>

      {property.rooms.length === 0 ? (
        <Alert variant="info" title="No rooms published yet">
          This property has not published any rooms. Check back soon.
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {property.rooms.map((room) => {
            const beds = bedsLabel(room);
            const bookHref = `/accommodation/${
              property.slug || property._id
            }/book?room=${room._id}`;
            const roomImages = room.images?.length
              ? room.images
              : cover
                ? [cover]
                : [];

            return (
              <Card
                key={room._id}
                padded={false}
                className="flex flex-col overflow-hidden transition hover:shadow-md"
              >
                <RoomImageCarousel images={roomImages} alt={room.name} />

                <div className="flex flex-1 flex-col space-y-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {room.name}
                    </p>
                    {room.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                        {room.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {room.capacity} guest
                      {room.capacity === 1 ? "" : "s"}
                    </span>
                    {beds ? (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" /> {beds}
                      </span>
                    ) : null}
                    <span>
                      {room.totalUnits} unit
                      {room.totalUnits === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-text-muted">From</p>
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {formatCurrency(room.basePrice, room.currency)}
                        <span className="ml-1 text-[11px] font-normal text-text-muted">
                          / night
                        </span>
                      </p>
                    </div>
                    <Button>
                      <Link to={bookHref} className="w-full text-center">
                        Book
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}