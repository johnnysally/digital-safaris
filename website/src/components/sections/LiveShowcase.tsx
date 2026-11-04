import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BedDouble,
  Utensils,
  Car,
  Star,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import searchApi, { type WebProperty, type WebRestaurant } from "../../api/searchApi";
import { SHOWCASE_FALLBACK } from "../../utils/constants";

const MONGO_ID = /^[a-f0-9]{24}$/i;
const isRealTown = (town?: string | null): town is string =>
  Boolean(town) && !MONGO_ID.test(town as string);

const ROTATE_MS = 5_000;
const APP_BASE = "https://app.digitalsafaris.co.ke";

function slotIndex(length: number, primeSalt: number): number {
  if (length <= 1) return 0;
  const slot = Math.floor(Date.now() / ROTATE_MS);
  return (slot * primeSalt) % length;
}

interface StayCard {
  name: string;
  town: string;
  type: string;
  image?: string | null;
  rating: number;
  totalRatings: number;
  minPrice: number | null;
  currency: string;
}

interface FoodCard {
  name: string;
  town: string;
  cuisine: string;
  rating: number;
  totalRatings: number;
}

function toStayCard(p: WebProperty): StayCard | null {
  if (!isRealTown(p.town)) return null;
  return {
    name: p.name,
    town: p.town,
    type: (p.type || "stay").replace(/_/g, " "),
    image: p.coverImage ?? p.images?.[0] ?? null,
    rating: p.rating ?? 0,
    totalRatings: p.totalRatings ?? 0,
    minPrice: typeof p.minPrice === "number" && p.minPrice >= 100 ? p.minPrice : null,
    currency: p.currency || "KES",
  };
}

function toFoodCard(r: WebRestaurant): FoodCard | null {
  if (!isRealTown(r.town)) return null;
  const cuisine = r.cuisineTypes?.[0]
    ? r.cuisineTypes[0].replace(/_/g, " ")
    : "Local";
  return {
    name: r.name,
    town: r.town,
    cuisine: cuisine.charAt(0).toUpperCase() + cuisine.slice(1),
    rating: r.rating ?? 0,
    totalRatings: r.totalRatings ?? 0,
  };
}

function RotationBar({ color }: { color: string }) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setKey((k) => k + 1), ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden bg-white/10">
      <div
        key={key}
        className={`h-full ${color} origin-left`}
        style={{ animation: `growBar ${ROTATE_MS}ms linear forwards` }}
      />
    </div>
  );
}

export const LiveShowcase: React.FC = () => {
  const [stayCandidates, setStayCandidates] = useState<StayCard[]>(
    SHOWCASE_FALLBACK.stays.map((s) => ({
      name: s.name,
      town: s.town,
      type: s.type,
      image: s.image ?? null,
      rating: s.rating ?? 0,
      totalRatings: s.totalRatings ?? 0,
      minPrice: s.minPrice ?? null,
      currency: s.currency || "KES",
    }))
  );

  const [foodCandidates, setFoodCandidates] = useState<FoodCard[]>(
    SHOWCASE_FALLBACK.food.map((f) => ({
      name: f.name,
      town: f.town,
      cuisine: f.cuisine,
      rating: f.rating ?? 0,
      totalRatings: f.totalRatings ?? 0,
    }))
  );

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      searchApi.accommodations({ limit: 6 }).catch(() => null),
      searchApi.restaurants({ limit: 6 }).catch(() => null),
    ]).then(([accom, rest]) => {
      if (cancelled) return;

      if (accom?.data?.length) {
        const mapped = accom.data
          .map(toStayCard)
          .filter((c): c is StayCard => Boolean(c));
        if (mapped.length) setStayCandidates(mapped);
      }

      if (rest?.data?.length) {
        const mapped = rest.data
          .map(toFoodCard)
          .filter((c): c is FoodCard => Boolean(c));
        if (mapped.length) setFoodCandidates(mapped);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredStay = useMemo(
    () => stayCandidates[slotIndex(stayCandidates.length, 3)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stayCandidates, tick]
  );

  const featuredFood = useMemo(
    () => foodCandidates[slotIndex(foodCandidates.length, 5)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [foodCandidates, tick]
  );

  const stayUrl = `${APP_BASE}/accommodation`;
  const foodUrl = `${APP_BASE}/restaurant`;
  const rideUrl = `${APP_BASE}/transport`;

  return (
    <section className="py-20 bg-[#f9f7f4] border-t border-[#e6dfd5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#eae3d9] text-[#855016] text-xs font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5f7d5d] animate-pulse" />
            Live on DigitalSafaris
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Real partners. <span className="text-[#c47c2b]">Real services.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5e5950] max-w-xl mx-auto leading-relaxed">
            Live stays, kitchens, and rides — all bookable through the
            DigitalSafaris app.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {/* FEATURED STAY */}
          <div className="relative bg-white rounded-3xl border border-[#e6dfd5] shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
            <div className="relative h-44 bg-[#f4efe8] overflow-hidden">
              {featuredStay.image ? (
                <img
                  key={featuredStay.image}
                  src={featuredStay.image}
                  alt={featuredStay.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover animate-[fadeIn_.35s_ease]"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#fff7eb] to-[#f4e2c7]">
                  <BedDouble className="h-12 w-12 text-[#c47c2b]/60" />
                </div>
              )}
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#8a5b25] backdrop-blur">
                <BedDouble className="h-3 w-3" /> Featured Stay
              </span>
            </div>

            <div className="flex-1 flex flex-col p-5 space-y-3 min-h-[10.5rem]">
              <div>
                <h3 className="text-lg font-bold text-[#191816] truncate">
                  {featuredStay.name}
                </h3>
                <p className="text-xs text-[#5e5950] capitalize mt-0.5">
                  {featuredStay.town} · {featuredStay.type}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#5e5950] min-h-[1.125rem]">
                {featuredStay.rating > 0 ? (
                  <>
                    <Star className="h-3.5 w-3.5 fill-[#c47c2b] text-[#c47c2b]" />
                    {featuredStay.rating.toFixed(1)}
                    <span className="text-[#9e978e]">
                      ({featuredStay.totalRatings})
                    </span>
                  </>
                ) : (
                  <span className="text-[#9e978e]">New on DigitalSafaris</span>
                )}
              </div>

              <div className="text-sm text-[#191816] min-h-[1.25rem]">
                {featuredStay.minPrice !== null ? (
                  <>
                    From{" "}
                    <span className="font-bold">
                      {featuredStay.currency}{" "}
                      {featuredStay.minPrice.toLocaleString()}
                    </span>{" "}
                    <span className="text-xs text-[#9e978e]">/ night</span>
                  </>
                ) : (
                  <span className="text-xs text-[#9e978e]">
                    Open app to view details and pricing
                  </span>
                )}
              </div>

              <a
                href={stayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c47c2b] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#b06d20]"
              >
                Book a stay
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <RotationBar color="bg-[#c47c2b]" />
          </div>

          {/* FEATURED FOOD */}
          <div className="relative bg-white rounded-3xl border border-[#e6dfd5] shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
            <div className="relative h-44 bg-[#f4efe8]">
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#fdf0e9] to-[#f6dccd]">
                <Utensils className="h-12 w-12 text-[#a8501f]/60" />
              </div>
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#8a3e1c] backdrop-blur">
                <Utensils className="h-3 w-3" /> Featured Kitchen
              </span>
            </div>

            <div className="flex-1 flex flex-col p-5 space-y-3 min-h-[10.5rem]">
              <div>
                <h3 className="text-lg font-bold text-[#191816] truncate">
                  {featuredFood.name}
                </h3>
                <p className="text-xs text-[#5e5950] capitalize mt-0.5">
                  {featuredFood.town} · {featuredFood.cuisine}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#5e5950] min-h-[1.125rem]">
                {featuredFood.rating > 0 ? (
                  <>
                    <Star className="h-3.5 w-3.5 fill-[#c47c2b] text-[#c47c2b]" />
                    {featuredFood.rating.toFixed(1)}
                    <span className="text-[#9e978e]">
                      ({featuredFood.totalRatings})
                    </span>
                  </>
                ) : (
                  <span className="text-[#9e978e]">
                    {featuredFood.cuisine} · now delivering
                  </span>
                )}
              </div>

              <div className="text-sm min-h-[1.25rem]">
                <span className="text-xs text-[#9e978e]">
                  Open app to view the menu
                </span>
              </div>

              <a
                href={foodUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#a8501f] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#8e421a]"
              >
                Order food
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <RotationBar color="bg-[#a8501f]" />
          </div>

          {/* FEATURED RIDE */}
          <div className="relative bg-[#191816] rounded-3xl shadow-lg overflow-hidden flex flex-col text-white">
            <div className="relative h-44 bg-gradient-to-br from-[#2a2825] to-[#191816] grid place-items-center">
              <Car className="h-16 w-16 text-[#f0aa56]/50" strokeWidth={1.25} />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#f0aa56] backdrop-blur">
                <Car className="h-3 w-3" /> Live Rides
              </span>
            </div>

            <div className="flex-1 flex flex-col p-5 space-y-3 min-h-[10.5rem]">
              <div>
                <h3 className="text-lg font-bold">Book a ride in seconds</h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Verified drivers · Live tracking
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {SHOWCASE_FALLBACK.rideTowns.map((town) => (
                  <span
                    key={town}
                    className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/85"
                  >
                    <CheckCircle2 className="h-3 w-3 text-[#5f7d5d]" />
                    {town}
                  </span>
                ))}
              </div>

              <a
                href={rideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c47c2b] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#b06d20]"
              >
                Book a ride
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/get-started"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#855016] underline-offset-4 hover:underline"
          >
            See everything DigitalSafaris offers
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};