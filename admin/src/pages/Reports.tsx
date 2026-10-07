import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import { reportApi } from "../api";
import { useToast } from "../context/toastContext";
import { formatCurrency } from "../utils/formatCurrency";
import { formatNumber } from "../utils/formatNumber";
import { formatDate, formatISODate } from "../utils/formatDate";
import { classNames } from "../utils/helpers";
import type {
  RevenueReport,
  PayoutReport,
  PaymentReport,
  PartnerType,
  PaymentMethodName,
} from "../types";

const TABS = [
  { key: "revenue", label: "Revenue" },
  { key: "payouts", label: "Payouts" },
  { key: "payments", label: "Payments" },
];

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return {
    startDate: formatISODate(start),
    endDate: formatISODate(end),
  };
}

type AnyRecord = Record<string, unknown>;

function isObject(v: unknown): v is AnyRecord {
  return typeof v === "object" && v !== null;
}

function pickNumber(obj: AnyRecord, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function pickBucket(
  obj: AnyRecord,
  keys: string[]
): Record<string, number> {
  for (const k of keys) {
    const v = obj[k];
    if (isObject(v)) {
      const out: Record<string, number> = {};
      for (const [bk, bv] of Object.entries(v)) {
        if (typeof bv === "number") out[bk] = bv;
        else if (isObject(bv) && typeof bv.total === "number")
          out[bk] = bv.total;
        else if (isObject(bv) && typeof bv.amount === "number")
          out[bk] = bv.amount;
      }
      return out;
    }
    if (Array.isArray(v)) {
      const out: Record<string, number> = {};
      for (const item of v) {
        if (!isObject(item)) continue;
        const name =
          (item.type as string) ??
          (item.service as string) ??
          (item.method as string) ??
          (item.name as string) ??
          (item.partnerType as string) ??
          "other";
        const amount =
          (item.total as number) ??
          (item.amount as number) ??
          (item.value as number) ??
          0;
        out[name] = (out[name] ?? 0) + amount;
      }
      return out;
    }
  }
  return {};
}

function normalizeRevenue(raw: unknown): RevenueReport {
  const r = isObject(raw) ? raw : {};
  const currency = (r.currency as string) ?? "KES";
  const total = pickNumber(r, ["total", "totalRevenue", "amount", "sum"]);
  const byService = pickBucket(r, [
    "byService",
    "byServices",
    "services",
    "byType",
    "breakdown",
  ]);
  const range =
    (isObject(r.range) ? (r.range as { startDate: string; endDate: string }) : null) ??
    {
      startDate: (r.startDate as string) ?? "",
      endDate: (r.endDate as string) ?? "",
    };
  return { total, currency, byService, range };
}

function normalizePayouts(raw: unknown): PayoutReport {
  const r = isObject(raw) ? raw : {};
  const currency = (r.currency as string) ?? "KES";
  const total = pickNumber(r, ["total", "totalPayouts", "amount", "sum"]);
  const byPartnerTypeRaw = pickBucket(r, [
    "byPartnerType",
    "byType",
    "partnerTypes",
    "breakdown",
  ]);
  const byPartnerType = {
    accommodation: byPartnerTypeRaw.accommodation ?? 0,
    restaurant: byPartnerTypeRaw.restaurant ?? 0,
    transport: byPartnerTypeRaw.transport ?? 0,
  } as Record<PartnerType, number>;
  const range =
    (isObject(r.range) ? (r.range as { startDate: string; endDate: string }) : null) ??
    {
      startDate: (r.startDate as string) ?? "",
      endDate: (r.endDate as string) ?? "",
    };
  return { total, currency, byPartnerType, range };
}

function normalizePayments(raw: unknown): PaymentReport {
  const r = isObject(raw) ? raw : {};
  const currency = (r.currency as string) ?? "KES";
  const total = pickNumber(r, ["total", "totalPayments", "amount", "sum"]);
  const byMethodRaw = pickBucket(r, [
    "byMethod",
    "methods",
    "byPaymentMethod",
    "breakdown",
  ]);
  const byMethod = {
    mpesa: byMethodRaw.mpesa ?? 0,
    stripe: byMethodRaw.stripe ?? 0,
    wallet: byMethodRaw.wallet ?? 0,
  } as Record<PaymentMethodName, number>;
  const range =
    (isObject(r.range) ? (r.range as { startDate: string; endDate: string }) : null) ??
    {
      startDate: (r.startDate as string) ?? "",
      endDate: (r.endDate as string) ?? "",
    };
  return { total, currency, byMethod, range };
}

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  currency?: boolean;
}

function BarRow({ label, value, max, currency = true }: BarRowProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-primary">{label}</span>
        <span className="font-medium text-text-primary">
          {currency ? formatCurrency(value) : formatNumber(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full bg-secondary-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = "text-text-primary",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-alt p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={classNames("mt-1 text-xl font-semibold", accent)}>
        {value}
      </p>
    </div>
  );
}

export default function Reports() {
  const { error: toastError } = useToast();
  const [tab, setTab] = useState("revenue");
  const [range, setRange] = useState(defaultRange());

  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const [payouts, setPayouts] = useState<PayoutReport | null>(null);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);

  const [payments, setPayments] = useState<PaymentReport | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const loadRevenue = async () => {
    setRevenueLoading(true);
    setRevenueError(null);
    try {
      const data = await reportApi.revenue(range);
      setRevenue(normalizeRevenue(data));
    } catch {
      setRevenueError("Could not load revenue report.");
    } finally {
      setRevenueLoading(false);
    }
  };

  const loadPayouts = async () => {
    setPayoutsLoading(true);
    setPayoutsError(null);
    try {
      const data = await reportApi.payouts(range);
      setPayouts(normalizePayouts(data));
    } catch {
      setPayoutsError("Could not load payouts report.");
    } finally {
      setPayoutsLoading(false);
    }
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const data = await reportApi.payments(range);
      setPayments(normalizePayments(data));
    } catch {
      setPaymentsError("Could not load payments report.");
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "revenue" && !revenue) loadRevenue();
    if (tab === "payouts" && !payouts) loadPayouts();
    if (tab === "payments" && !payments) loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleApply = () => {
    if (tab === "revenue") loadRevenue();
    if (tab === "payouts") loadPayouts();
    if (tab === "payments") loadPayments();
  };

  const revenueMax = useMemo(() => {
    if (!revenue) return 0;
    const values = Object.values(revenue.byService ?? {});
    return Math.max(revenue.total, ...values, 0);
  }, [revenue]);

  const payoutsMax = useMemo(() => {
    if (!payouts) return 0;
    const values = Object.values(payouts.byPartnerType ?? {}).map((v) =>
      typeof v === "number" ? v : 0
    );
    return Math.max(payouts.total, ...values, 0);
  }, [payouts]);

  const paymentsMax = useMemo(() => {
    if (!payments) return 0;
    const values = Object.values(payments.byMethod ?? {});
    return Math.max(payments.total, ...values, 0);
  }, [payments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Reports</h1>
        <p className="mt-1 text-sm text-text-muted">
          Financial and operational summaries
        </p>
      </div>

      <Tabs tabs={TABS} activeKey={tab} onChange={setTab} />

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            label="Start date"
            type="date"
            value={range.startDate}
            onChange={(e) => setRange({ ...range, startDate: e.target.value })}
          />
          <Input
            label="End date"
            type="date"
            value={range.endDate}
            onChange={(e) => setRange({ ...range, endDate: e.target.value })}
          />
          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={handleApply} fullWidth>
              Apply
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRange(defaultRange());
                setTimeout(handleApply, 0);
              }}
            >
              Last 30 days
            </Button>
          </div>
        </div>
      </Card>

      {tab === "revenue" && (
        <Card title="Revenue">
          {revenueLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : revenueError ? (
            <Alert variant="danger" title="Failed to load">
              {revenueError}
            </Alert>
          ) : !revenue || revenue.total === 0 ? (
            <EmptyState
              title="No revenue in this range"
              description="Try a wider date range."
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatTile
                  label="Total revenue"
                  value={formatCurrency(revenue.total, revenue.currency)}
                  accent="text-secondary-600"
                />
                <StatTile
                  label="Services"
                  value={String(Object.keys(revenue.byService ?? {}).length)}
                />
                <StatTile
                  label="Range"
                  value={`${formatDate(revenue.range.startDate)} → ${formatDate(
                    revenue.range.endDate
                  )}`}
                />
              </div>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  By service
                </p>
                {Object.entries(revenue.byService ?? {}).length === 0 ? (
                  <p className="text-sm text-text-muted">
                    No service breakdown available.
                  </p>
                ) : (
                  Object.entries(revenue.byService).map(([key, value]) => (
                    <BarRow
                      key={key}
                      label={key[0].toUpperCase() + key.slice(1)}
                      value={value}
                      max={revenueMax}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === "payouts" && (
        <Card title="Payouts">
          {payoutsLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : payoutsError ? (
            <Alert variant="danger" title="Failed to load">
              {payoutsError}
            </Alert>
          ) : !payouts || payouts.total === 0 ? (
            <EmptyState
              title="No payouts in this range"
              description="Try a wider date range."
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatTile
                  label="Total payouts"
                  value={formatCurrency(payouts.total, payouts.currency)}
                  accent="text-secondary-600"
                />
                <StatTile
                  label="Partner types"
                  value={String(
                    Object.keys(payouts.byPartnerType ?? {}).length
                  )}
                />
                <StatTile
                  label="Range"
                  value={`${formatDate(payouts.range.startDate)} → ${formatDate(
                    payouts.range.endDate
                  )}`}
                />
              </div>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  By partner type
                </p>
                {(["accommodation", "restaurant", "transport"] as PartnerType[]).map(
                  (type) => (
                    <BarRow
                      key={type}
                      label={type[0].toUpperCase() + type.slice(1)}
                      value={payouts.byPartnerType?.[type] ?? 0}
                      max={payoutsMax}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === "payments" && (
        <Card title="Payments">
          {paymentsLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : paymentsError ? (
            <Alert variant="danger" title="Failed to load">
              {paymentsError}
            </Alert>
          ) : !payments || payments.total === 0 ? (
            <EmptyState
              title="No payments in this range"
              description="Try a wider date range."
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatTile
                  label="Total payments"
                  value={formatCurrency(payments.total, payments.currency)}
                  accent="text-secondary-600"
                />
                <StatTile
                  label="Methods"
                  value={String(Object.keys(payments.byMethod ?? {}).length)}
                />
                <StatTile
                  label="Range"
                  value={`${formatDate(payments.range.startDate)} → ${formatDate(
                    payments.range.endDate
                  )}`}
                />
              </div>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  By method
                </p>
                {(["mpesa", "stripe", "wallet"] as PaymentMethodName[]).map(
                  (method) => (
                    <BarRow
                      key={method}
                      label={
                        method === "mpesa"
                          ? "M-Pesa"
                          : method[0].toUpperCase() + method.slice(1)
                      }
                      value={payments.byMethod?.[method] ?? 0}
                      max={paymentsMax}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}