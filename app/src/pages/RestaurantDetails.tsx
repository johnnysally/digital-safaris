import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  Utensils,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import Drawer from "../components/ui/Drawer";
import { orderApi, paymentApi, searchApi } from "../api";
import { useToast } from "../context/toastContext";
import { formatCurrency } from "../utils/formatCurrency";
import type {
  RestaurantDetails,
  MenuItem,
  OrderQuoteResponse,
} from "../types";

type CartLine = {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
};

type PaymentMethod = "wallet" | "mpesa" | "stripe";

const PAYMENT_METHODS: Array<{ label: string; value: PaymentMethod }> = [
  { label: "DS Wallet", value: "wallet" },
  { label: "M-Pesa", value: "mpesa" },
  { label: "Card (Stripe)", value: "stripe" },
];

function extractError(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return typeof msg === "string" && msg ? msg : fallback;
}

function groupByCategory(menu: MenuItem[]): Array<[string, MenuItem[]]> {
  const map = new Map<string, MenuItem[]>();
  for (const item of menu) {
    const cat = item.category?.trim() || "Menu";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return Array.from(map.entries());
}

export default function RestaurantDetailsPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  const [data, setData] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [town, setTown] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [quote, setQuote] = useState<OrderQuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    searchApi
      .restaurantDetails(idOrSlug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setTown(res.restaurant.town ?? "");
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(extractError(err, "Could not load this restaurant."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  const lines = useMemo(() => Object.values(cart), [cart]);

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) =>
          sum + (l.menuItem.discountPrice ?? l.menuItem.price) * l.quantity,
        0
      ),
    [lines]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Restaurant unavailable">
          {loadError ?? "Not found."}
        </Alert>
        <Link
          to="/restaurant"
          className="inline-flex items-center gap-1 text-sm text-secondary-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to restaurants
        </Link>
      </div>
    );
  }

  const { restaurant, menu } = data;
  const grouped = groupByCategory(menu);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev[item._id];
      return {
        ...prev,
        [item._id]: {
          menuItem: item,
          quantity: (existing?.quantity ?? 0) + 1,
          notes: existing?.notes,
        },
      };
    });
  }

  function decrement(itemId: string) {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const qty = existing.quantity - 1;
      const next = { ...prev };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = { ...existing, quantity: qty };
      return next;
    });
  }

  function removeLine(itemId: string) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  function clearCart() {
    setCart({});
    setQuote(null);
    setPayError(null);
    setPayMessage(null);
  }

  function resetQuote() {
    setQuote(null);
    setPayError(null);
    setPayMessage(null);
  }

  async function handleQuote() {
    setQuoteError(null);
    setPayError(null);
    setPayMessage(null);

    if (lines.length === 0) {
      setQuoteError("Add at least one item.");
      return;
    }
    if (orderType === "delivery" && (!address.trim() || !town.trim())) {
      setQuoteError("Add a delivery address and town.");
      return;
    }
    if (paymentMethod === "mpesa" && !phone.trim()) {
      setQuoteError("Enter your M-Pesa phone number to continue.");
      return;
    }

    setQuoting(true);
    try {
      const q = await orderApi.quote({
        restaurantId: restaurant._id,
        items: lines.map((l) => ({
          menuItem: l.menuItem._id,
          quantity: l.quantity,
          notes: l.notes,
        })),
        type: orderType,
        deliveryAddress:
          orderType === "delivery"
            ? { address: address.trim(), town: town.trim() }
            : null,
      });
      setQuote(q);
    } catch (err) {
      setQuoteError(extractError(err, "Could not get a quote"));
    } finally {
      setQuoting(false);
    }
  }

  async function handlePayAndPlace() {
    if (!quote) return;

    if (paymentMethod === "mpesa" && !phone.trim()) {
      setPayError("Enter your M-Pesa phone number.");
      return;
    }
    if (paymentMethod === "stripe") {
      setPayError(
        "Card payments are being set up. Please choose DS Wallet or M-Pesa for now."
      );
      return;
    }

    setPaying(true);
    setPayError(null);
    setPayMessage(null);

    try {
      const payment = await paymentApi.initiate({
        method: paymentMethod,
        amount: quote.total,
        currency: quote.currency,
        purpose: "food_order",
        phone: paymentMethod === "mpesa" ? phone : undefined,
      });

      if (paymentMethod === "wallet") {
        if (payment.status !== "success") {
          setPayError("Wallet payment failed. Check your balance.");
          return;
        }
      } else if (paymentMethod === "mpesa") {
        setPayMessage("Check your phone and enter your M-Pesa PIN…");
        const result = await pollPayment(payment.reference);
        if (!result.paid) {
          setPayError(result.message ?? "Payment was not completed.");
          return;
        }
      }

      const order = await orderApi.create({
        quoteId: quote.quoteId,
        paymentReference: payment.reference,
        notes: notes.trim() || undefined,
      });

      toastSuccess("Order placed", `Reference ${order.reference}`);
      setCart({});
      setCartOpen(false);
      setQuote(null);
      setAddress("");
      setNotes("");
      navigate("/order");
    } catch (err) {
      setPayError(extractError(err, "Could not place order"));
      toastError(extractError(err, "Could not place order"));
    } finally {
      setPaying(false);
    }
  }

  async function pollPayment(reference: string, timeoutMs = 120_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const status = await paymentApi.status(reference);
        if (status.status === "success") return { paid: true };
        if (["failed", "cancelled", "refunded"].includes(status.status)) {
          return {
            paid: false,
            message: status.failureReason ?? "Payment failed",
          };
        }
      } catch {
        /* keep polling */
      }
    }
    return { paid: false, message: "Payment timed out. Try again." };
  }

  return (
    <div className="space-y-6">
      <Link
        to="/restaurant"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to restaurants
      </Link>

      <Card padded={false} className="overflow-hidden">
        <div
          className="h-48 bg-secondary-100 bg-cover bg-center"
          style={{
            backgroundImage: restaurant.coverImage
              ? `url(${restaurant.coverImage})`
              : undefined,
          }}
        />
        <div className="space-y-2 p-5">
          <h1 className="text-2xl font-semibold text-text-primary">
            {restaurant.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {restaurant.town}
            </span>
            {restaurant.rating ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-secondary-500 text-secondary-500" />
                {restaurant.rating.toFixed(1)}
                {restaurant.totalRatings
                  ? ` (${restaurant.totalRatings})`
                  : ""}
              </span>
            ) : null}
            {!restaurant.isAcceptingOrders && (
              <Badge variant="danger">Not accepting orders</Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {menu.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Utensils className="h-6 w-6 text-text-muted" />
                <p className="text-sm text-text-muted">
                  This restaurant hasn't added any menu items yet.
                </p>
              </div>
            </Card>
          ) : (
            grouped.map(([category, items]) => (
              <Card key={category} title={category}>
                <div className="divide-y divide-border">
                  {items.map((item) => {
                    const qty = cart[item._id]?.quantity ?? 0;
                    const price = item.discountPrice ?? item.price;
                    return (
                      <div
                        key={item._id}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-24 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-20 w-24 shrink-0 rounded-lg bg-surface-alt" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                              {item.description}
                            </p>
                          )}
                          <p className="mt-2 text-sm font-medium text-text-primary">
                            {formatCurrency(price, "KES")}
                            {item.discountPrice && (
                              <span className="ml-2 text-xs text-text-muted line-through">
                                {formatCurrency(item.price, "KES")}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          {qty === 0 ? (
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                              disabled={!restaurant.isAcceptingOrders}
                            >
                              Add
                            </Button>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-md border border-border">
                              <button
                                type="button"
                                onClick={() => decrement(item._id)}
                                className="grid h-8 w-8 place-items-center text-text-primary hover:bg-surface-alt"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-[1.5rem] text-center text-sm font-medium">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="grid h-8 w-8 place-items-center text-text-primary hover:bg-surface-alt"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Your cart
              </h2>
              <Badge variant="neutral">
                <ShoppingBag className="mr-1 inline h-3 w-3" />
                {itemCount}
              </Badge>
            </div>

            {lines.length === 0 ? (
              <p className="mt-4 text-xs text-text-muted">
                Add items from the menu to start an order.
              </p>
            ) : (
              <>
                <ul className="mt-4 divide-y divide-border">
                  {lines.map((l) => {
                    const price = l.menuItem.discountPrice ?? l.menuItem.price;
                    return (
                      <li
                        key={l.menuItem._id}
                        className="flex items-start justify-between gap-2 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-text-primary">
                            {l.quantity}× {l.menuItem.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {formatCurrency(price * l.quantity, "KES")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(l.menuItem._id)}
                          className="text-text-muted hover:text-danger"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span className="text-text-primary">Estimated subtotal</span>
                    <span className="text-secondary-600">
                      {formatCurrency(subtotal, "KES")}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Final total (including delivery) is confirmed on the next step.
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <Button
                    fullWidth
                    onClick={() => setCartOpen(true)}
                    disabled={!restaurant.isAcceptingOrders}
                  >
                    Checkout
                  </Button>
                  <Button
                    fullWidth
                    variant="ghost"
                    onClick={clearCart}
                    disabled={paying || quoting}
                  >
                    Clear cart
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <Drawer
        isOpen={cartOpen}
        onClose={() => {
          if (paying) return;
          setCartOpen(false);
          if (!quote) resetQuote();
        }}
        title={quote ? "Confirm payment" : "Checkout"}
        width="w-full max-w-md"
      >
        {!quote ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Order type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("delivery")}
                  className={
                    "rounded-md border px-3 py-2 text-sm font-medium transition " +
                    (orderType === "delivery"
                      ? "border-secondary-500 bg-secondary-50 text-secondary-700"
                      : "border-border text-text-primary hover:bg-surface-alt")
                  }
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("pickup")}
                  className={
                    "rounded-md border px-3 py-2 text-sm font-medium transition " +
                    (orderType === "pickup"
                      ? "border-secondary-500 bg-secondary-50 text-secondary-700"
                      : "border-border text-text-primary hover:bg-surface-alt")
                  }
                >
                  Pickup
                </button>
              </div>
            </div>

            {orderType === "delivery" && (
              <div className="space-y-2">
                <Input
                  label="Delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Kilimani, Wood Ave 12"
                />
                <Input
                  label="Town"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="Nairobi"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Payment method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-secondary-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {paymentMethod === "mpesa" && (
              <div>
                <Input
                  label="M-Pesa phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="254712345678"
                  inputMode="tel"
                />
                <p className="mt-1 text-[11px] text-text-muted">
                  Enter the Safaricom number registered with M-Pesa.
                </p>
              </div>
            )}

            {paymentMethod === "stripe" && (
              <div className="rounded-lg border border-border bg-surface-alt p-3 text-xs text-text-muted">
                Card payments are being set up. Please choose DS Wallet or
                M-Pesa for now.
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-secondary-500"
                placeholder="Anything the kitchen should know?"
              />
            </div>

            {quoteError && (
              <Alert variant="danger" title="Cannot continue">
                {quoteError}
              </Alert>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCartOpen(false)}
                disabled={quoting}
              >
                Cancel
              </Button>
              <Button onClick={handleQuote} loading={quoting}>
                Continue to payment
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Price locked · expires{" "}
              {new Date(quote.expiresAt).toLocaleTimeString()}
            </div>

            <div className="rounded-lg border border-border bg-surface-alt p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-text-muted">Payment method</p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary">
                    {PAYMENT_METHODS.find((m) => m.value === paymentMethod)
                      ?.label ?? "—"}
                  </p>
                  {paymentMethod === "mpesa" && phone ? (
                    <p className="mt-0.5 text-xs text-text-muted">
                      To: {phone}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={resetQuote}
                  className="text-xs font-medium text-secondary-500 underline"
                  disabled={paying}
                >
                  Change
                </button>
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-alt p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-primary">
                  {formatCurrency(quote.subtotal, quote.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Delivery</span>
                <span className="text-text-primary">
                  {formatCurrency(quote.deliveryFee, quote.currency)}
                </span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold">
                <span className="text-text-primary">Total</span>
                <span className="text-secondary-600">
                  {formatCurrency(quote.total, quote.currency)}
                </span>
              </div>
            </div>

            {payMessage && (
              <Alert variant="info" title="Processing">
                {payMessage}
              </Alert>
            )}
            {payError && (
              <Alert variant="danger" title="Payment failed">
                {payError}
              </Alert>
            )}

            <div className="flex justify-between gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={resetQuote}
                disabled={paying}
              >
                Back
              </Button>
              <Button onClick={handlePayAndPlace} loading={paying}>
                {paying
                  ? "Processing…"
                  : `Pay ${formatCurrency(quote.total, quote.currency)}`}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}