import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Switch from "../components/ui/Switch";
import Checkbox from "../components/ui/Checkbox";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import { settingApi } from "../api";
import { useToast } from "../context/toastContext";
import { capitalize } from "../utils/helpers";
import type {
  PaymentMethodConfig,
  PaymentMethodName,
  PartnerType,
} from "../types";

const METHOD_LABELS: Record<PaymentMethodName, string> = {
  mpesa: "M-Pesa",
  stripe: "Stripe",
  wallet: "Wallet",
};

const METHOD_DESCRIPTIONS: Record<PaymentMethodName, string> = {
  mpesa: "Mobile money payments via Safaricom.",
  stripe: "Card and international payments.",
  wallet: "In-app wallet balance.",
};

const SERVICES: Array<{ key: PartnerType | "dinein"; label: string }> = [
  { key: "accommodation", label: "Accommodation" },
  { key: "restaurant", label: "Food" },
  { key: "transport", label: "Transport" },
  { key: "dinein", label: "Dine-In" },
];

const FALLBACK: PaymentMethodConfig[] = [
  { name: "mpesa", enabled: true, usedFor: [], config: {} },
  { name: "stripe", enabled: false, usedFor: [], config: {} },
  { name: "wallet", enabled: true, usedFor: [], config: {} },
];

function normalizeMethods(raw: unknown): PaymentMethodConfig[] {
  const data = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown })?.data)
      ? ((raw as { data: unknown[] }).data as unknown[])
      : [];

  if (!data.length) return FALLBACK;

  return (data as Array<Partial<PaymentMethodConfig>>).map((m) => ({
    name: (m.name ?? "mpesa") as PaymentMethodName,
    enabled: Boolean(m.enabled),
    usedFor: Array.isArray(m.usedFor) ? (m.usedFor as Array<PartnerType | "dinein">) : [],
    config: (m.config as Record<string, unknown>) ?? {},
  }));
}

export default function PaymentMethods() {
  const { success, error: toastError } = useToast();

  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyName, setBusyName] = useState<PaymentMethodName | null>(null);

  const [configDrafts, setConfigDrafts] = useState<
    Record<string, string>
  >({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settingApi.paymentMethods();
      setMethods(normalizeMethods(data));
    } catch {
      setMethods(FALLBACK);
      setError("Could not load payment methods. Showing defaults.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleEnabled = async (
    name: PaymentMethodName,
    enabled: boolean
  ) => {
    setBusyName(name);
    try {
      const updated = await settingApi.togglePaymentMethod(name, enabled);
      setMethods((prev) =>
        prev.map((m) =>
          m.name === name ? { ...m, enabled: updated.enabled } : m
        )
      );
      success(`${METHOD_LABELS[name]} ${enabled ? "enabled" : "disabled"}`);
    } catch {
      toastError("Could not update method");
    } finally {
      setBusyName(null);
    }
  };

  const toggleUsedFor = async (
    name: PaymentMethodName,
    service: PartnerType | "dinein",
    on: boolean
  ) => {
    const current = methods.find((m) => m.name === name);
    if (!current) return;
    const nextUsedFor = on
      ? Array.from(new Set([...current.usedFor, service]))
      : current.usedFor.filter((s) => s !== service);

    setBusyName(name);
    try {
      await settingApi.updatePaymentMethodUsedFor(name, nextUsedFor);
      setMethods((prev) =>
        prev.map((m) =>
          m.name === name ? { ...m, usedFor: nextUsedFor } : m
        )
      );
    } catch {
      toastError("Could not update services");
    } finally {
      setBusyName(null);
    }
  };

  const saveConfig = async (name: PaymentMethodName) => {
    const draft = configDrafts[name];
    if (draft === undefined) return;
    setBusyName(name);
    try {
      const parsed: Record<string, unknown> = {};
      draft
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          const [k, ...rest] = line.split(":");
          if (!k) return;
          parsed[k.trim()] = rest.join(":").trim();
        });
      await settingApi.updatePaymentMethodConfig(name, parsed);
      setMethods((prev) =>
        prev.map((m) => (m.name === name ? { ...m, config: parsed } : m))
      );
      success(`${METHOD_LABELS[name]} config saved`);
    } catch {
      toastError("Could not save config");
    } finally {
      setBusyName(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Payment Methods
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Toggle methods on/off, choose which services they apply to, and
          configure credentials
        </p>
      </div>

      {error && (
        <Alert variant="warning" title="Using defaults">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {methods.map((method) => (
          <Card key={method.name} title={METHOD_LABELS[method.name]}>
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-text-muted">
                    {METHOD_DESCRIPTIONS[method.name]}
                  </p>
                  <div className="mt-2">
                    <Badge variant={method.enabled ? "success" : "neutral"}>
                      {method.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={method.enabled}
                  onChange={(v) => toggleEnabled(method.name, v)}
                  disabled={busyName === method.name}
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                  Used for
                </p>
                <div className="space-y-2">
                  {SERVICES.map((svc) => {
                    const checked = method.usedFor.includes(svc.key);
                    return (
                      <Checkbox
                        key={svc.key}
                        label={svc.label}
                        checked={checked}
                        disabled={!method.enabled || busyName === method.name}
                        onChange={(e) =>
                          toggleUsedFor(method.name, svc.key, e.target.checked)
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                  Config
                </p>
                <textarea
                  rows={4}
                  placeholder={"key: value\nkey2: value2"}
                  value={
                    configDrafts[method.name] ??
                    Object.entries(method.config)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join("\n")
                  }
                  onChange={(e) =>
                    setConfigDrafts((prev) => ({
                      ...prev,
                      [method.name]: e.target.value,
                    }))
                  }
                  disabled={!method.enabled}
                  className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/40 disabled:cursor-not-allowed disabled:bg-surface-alt"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => saveConfig(method.name)}
                    loading={busyName === method.name}
                    disabled={configDrafts[method.name] === undefined}
                  >
                    Save config
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="How this works">
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
          <li>
            <strong className="text-text-primary">Enabled</strong> determines if
            the method appears at checkout.
          </li>
          <li>
            <strong className="text-text-primary">Used for</strong> limits the
            method to specific services. Empty = all services.
          </li>
          <li>
            <strong className="text-text-primary">Config</strong> is free-form
            key/value — one per line. Matches whatever your backend expects
            (e.g. <code className="font-mono">shortCode</code>,{" "}
            <code className="font-mono">publicKey</code>).
          </li>
          <li>
            Changes apply immediately on the customer side after save.
          </li>
        </ul>
      </Card>
    </div>
  );
}