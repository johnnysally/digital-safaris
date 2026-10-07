import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import { healthApi, type HealthResponse, type MetricsResponse } from "../api";
import { useToast } from "../context/toastContext";
import { formatDateTime, formatRelative } from "../utils/formatDate";
import { formatNumber } from "../utils/formatNumber";
import { fileSize } from "../utils/helpers";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

function statusVariant(status: string): Variant {
  switch (status) {
    case "up":
    case "enabled":
    case "connected":
    case "healthy":
      return "success";
    case "degraded":
    case "connecting":
      return "warning";
    case "down":
    case "error":
    case "unhealthy":
      return "danger";
    case "disabled":
    case "disconnected":
      return "neutral";
    default:
      return "neutral";
  }
}

function StatusRow({
  label,
  status,
  children,
}: {
  label: string;
  status: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <Badge variant={statusVariant(status)}>{status}</Badge>
        </div>
        {children && (
          <div className="mt-1.5 text-xs text-text-secondary">{children}</div>
        )}
      </div>
    </div>
  );
}

function Kv({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="text-text-muted">{label}</span>
      <span className="truncate text-right text-text-primary">{value}</span>
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
    <div className="rounded-lg border border-border bg-surface-alt p-3">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

export default function Health() {
  const { error: toastError } = useToast();

  const [data, setData] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [h, m] = await Promise.all([healthApi.get(), healthApi.metrics()]);
      setData(h);
      setMetrics(m);
    } catch {
      setError("Could not load health data.");
      toastError("Health check failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = window.setInterval(() => load(true), 30000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallVariant = useMemo<Variant>(() => {
    if (!data) return "neutral";
    return statusVariant(data.status);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Failed to load">
          {error}
        </Alert>
        <Button onClick={() => load()}>Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Health</h1>
          <p className="mt-1 text-sm text-text-muted">
            Live status of every Digital Safaris subsystem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={overallVariant} dot>
            {data.status} · {data.overall.up}/{data.overall.total}
          </Badge>
          <Button variant="ghost" size="sm" loading={refreshing} onClick={() => load(true)}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="warning" title="Last refresh failed">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Uptime"
          value={data.server.uptimeHuman}
          accent="text-secondary-600"
        />
        <StatTile label="Node" value={data.server.node} />
        <StatTile
          label="Memory RSS"
          value={`${data.server.memoryRssMb} MB`}
        />
        <StatTile
          label="Heap used"
          value={`${data.server.memoryHeapUsedMb} MB`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Server">
          <StatusRow label="Process" status={data.server.status}>
            <div className="space-y-0.5">
              <Kv label="Hostname" value={data.server.hostname} />
              <Kv label="Platform" value={data.server.platform} />
              <Kv label="API URL" value={data.server.url ?? "—"} />
              <Kv label="PID" value={data.server.pid} />
              <Kv label="CPU cores" value={data.server.cpuCores} />
              <Kv label="Version" value={data.server.version} />
            </div>
          </StatusRow>
        </Card>

        <Card title="Database">
          <StatusRow label={data.database.type} status={data.database.status}>
            <div className="space-y-0.5">
              <Kv label="Host" value={data.database.host} />
              <Kv label="Database" value={data.database.database ?? "—"} />
              <Kv
                label="Collections"
                value={formatNumber(data.database.collections)}
              />
              <Kv
                label="Documents"
                value={formatNumber(data.database.documents)}
              />
            </div>
          </StatusRow>
        </Card>

        <Card title="Cache">
          <StatusRow label="Redis" status={data.redis.status}>
            <div className="space-y-0.5">
              <Kv label="Host" value={data.redis.host ?? "—"} />
              {data.redis.memoryUsed && (
                <Kv label="Memory" value={data.redis.memoryUsed} />
              )}
              {data.redis.message && (
                <Kv label="Note" value={data.redis.message} />
              )}
              {data.redis.error && <Kv label="Error" value={data.redis.error} />}
            </div>
          </StatusRow>
        </Card>

        <Card title="Messaging">
          <StatusRow label={`Email · ${data.email.provider}`} status={data.email.status}>
            <div className="space-y-0.5">
              <Kv label="From" value={data.email.fromMasked ?? "—"} />
              <Kv label="Sender name" value={data.email.sender ?? "—"} />
            </div>
          </StatusRow>
          <StatusRow label={`SMS · ${data.sms.provider}`} status={data.sms.status}>
            <div className="space-y-0.5">
              <Kv label="Sender" value={data.sms.sender ?? "—"} />
            </div>
          </StatusRow>
        </Card>

        <Card title="AI">
          <StatusRow label={`Concierge · ${data.ai.provider}`} status={data.ai.status}>
            <div className="space-y-0.5">
              <Kv label="Base URL" value={data.ai.baseUrl ?? "—"} />
              <Kv label="Model" value={data.ai.model ?? "—"} />
            </div>
          </StatusRow>
        </Card>

        <Card title="Payments">
          <StatusRow label="M-Pesa" status={data.mpesa.status}>
            <div className="space-y-0.5">
              <Kv label="Mode" value={data.mpesa.mode ?? "—"} />
              <Kv
                label="Transaction type"
                value={data.mpesa.transactionType ?? "—"}
              />
              <Kv label="Shortcode" value={data.mpesa.shortcode ?? "—"} />
            </div>
          </StatusRow>
          <StatusRow label="Stripe" status={data.stripe.status}>
            <div className="space-y-0.5">
              <Kv label="Currency" value={data.stripe.currency ?? "—"} />
            </div>
          </StatusRow>
        </Card>

        <Card title="Storage">
          <StatusRow label={data.storage.type} status={data.storage.status}>
            <div className="space-y-0.5">
              {data.storage.cloud && (
                <Kv label="Cloud" value={data.storage.cloud} />
              )}
              {data.storage.path && (
                <Kv label="Local path" value={data.storage.path} />
              )}
            </div>
          </StatusRow>
        </Card>

        <Card title="Firebase">
          <StatusRow label="Push notifications" status={data.firebase.status}>
            <div className="space-y-0.5">
              <Kv label="Project" value={data.firebase.project ?? "—"} />
            </div>
          </StatusRow>
        </Card>

        <Card title="Backups">
          <StatusRow label={data.backups.type} status={data.backups.status}>
            <div className="space-y-0.5">
              <Kv label="Successful backups" value={formatNumber(data.backups.count)} />
              <Kv
                label="Last backup"
                value={
                  data.backups.lastBackupAt
                    ? `${formatDateTime(data.backups.lastBackupAt)} · ${formatRelative(
                        data.backups.lastBackupAt
                      )}`
                    : "Never"
                }
              />
              {data.backups.lastBackupSize && (
                <Kv
                  label="Last size"
                  value={fileSize(data.backups.lastBackupSize)}
                />
              )}
              {data.backups.lastBackupFile && (
                <Kv label="Last file" value={data.backups.lastBackupFile} />
              )}
            </div>
          </StatusRow>
        </Card>

        <Card title="CORS · Allowed origins">
          <div className="space-y-1">
            <Kv label="Client" value={data.cors.client ?? "—"} />
            <Kv label="Admin" value={data.cors.admin ?? "—"} />
            <Kv label="Partner" value={data.cors.partner ?? "—"} />
            <Kv label="Website" value={data.cors.website ?? "—"} />
          </div>
        </Card>

        <Card title="Platform info">
          <div className="space-y-1">
            <Kv label="App name" value={data.platform.appName} />
            <Kv label="Timezone" value={data.platform.timezone} />
            <Kv label="Currency" value={data.platform.currency} />
            <Kv label="Support email" value={data.platform.supportEmail ?? "—"} />
            <Kv label="Support phone" value={data.platform.supportPhone ?? "—"} />
            <Kv label="Logo" value={data.platform.logoUrl ?? "—"} />
          </div>
        </Card>

        {metrics && (
          <Card title="Runtime metrics">
            <div className="space-y-1">
              <Kv label="Uptime" value={metrics.uptimeHuman} />
              <Kv label="RSS" value={`${metrics.memory.rssMb} MB`} />
              <Kv label="Heap total" value={`${metrics.memory.heapTotalMb} MB`} />
              <Kv label="Heap used" value={`${metrics.memory.heapUsedMb} MB`} />
              <Kv label="External" value={`${metrics.memory.externalMb} MB`} />
              <Kv label="CPU cores" value={metrics.cpu.cores} />
              <Kv
                label="Load avg"
                value={metrics.cpu.loadAvg.map((l) => l.toFixed(2)).join(" · ")}
              />
              <Kv label="CPU model" value={metrics.cpu.model ?? "—"} />
              <Kv label="PID" value={metrics.pid} />
            </div>
          </Card>
        )}
      </div>

      <p className="text-center text-xs text-text-muted">
        Last updated {formatRelative(data.timestamp)} · auto-refreshes every 30s
      </p>
    </div>
  );
}