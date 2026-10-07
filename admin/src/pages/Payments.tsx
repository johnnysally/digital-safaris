import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Drawer from "../components/ui/Drawer";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { paymentApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE, PAYMENT_METHOD_LABELS } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type {
  Payment,
  Commission,
  Payout,
  PayoutSettings,
  PaymentStatus,
  PayoutStatus,
  PaginationMeta,
} from "../types";

const TABS = [
  { key: "list", label: "Payments" },
  { key: "commissions", label: "Commissions" },
  { key: "payouts", label: "Payouts" },
];

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

function paymentStatusVariant(status: PaymentStatus): StatusVariant {
  switch (status) {
    case "success":
      return "success";
    case "pending":
    case "processing":
      return "warning";
    case "failed":
    case "refunded":
      return "danger";
    default:
      return "neutral";
  }
}

function payoutStatusVariant(status: PayoutStatus): StatusVariant {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
    case "processing":
      return "warning";
    case "rejected":
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export default function Payments() {
  const [tab, setTab] = useState("list");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Payments</h1>
        <p className="mt-1 text-sm text-text-muted">
          All money movement — payments, commissions, and payouts
        </p>
      </div>

      <Tabs tabs={TABS} activeKey={tab} onChange={setTab} />

      {tab === "list" && <PaymentsList />}
      {tab === "commissions" && <CommissionsList />}
      {tab === "payouts" && <PayoutsList />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Payments list                                                               */
/* -------------------------------------------------------------------------- */

function PaymentsList() {
  const { error: toastError } = useToast();
  const [rows, setRows] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<Payment | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        method: method || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, method]);

  const openDetails = async (id: string) => {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const data = await paymentApi.details(id);
      setDetails(data);
    } catch {
      toastError("Could not load payment");
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const columns = useMemo<Column<Payment>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <button
            type="button"
            onClick={() => openDetails(row._id)}
            className="text-left"
          >
            <p className="font-mono text-xs text-text-primary hover:text-secondary-600">
              {row.reference}
            </p>
            <p className="text-xs text-text-muted">
              {formatDateTime(row.createdAt)}
            </p>
          </button>
        ),
      },
      {
        key: "customerName",
        header: "Customer",
        render: (row) => (
          <span className="text-sm text-text-primary">
            {row.customerName ?? "—"}
          </span>
        ),
      },
      {
        key: "partnerName",
        header: "Partner",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.partnerName ?? "—"}
          </span>
        ),
      },
      {
        key: "method",
        header: "Method",
        render: (row) => (
          <Badge variant="neutral">
            {PAYMENT_METHOD_LABELS[row.method] ?? row.method}
          </Badge>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        render: (row) => (
          <span className="text-sm font-medium text-text-primary">
            {formatCurrency(row.amount, row.currency)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={paymentStatusVariant(row.status)}>
            {capitalize(row.status)}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        render: (row) => (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openDetails(row._id)}
            >
              View
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <Card padded={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchData();
          }}
          className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
        >
          <Input
            placeholder="Search reference, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="All statuses"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "Success", value: "success" },
              { label: "Pending", value: "pending" },
              { label: "Processing", value: "processing" },
              { label: "Failed", value: "failed" },
              { label: "Refunded", value: "refunded" },
            ]}
          />
          <Select
            placeholder="All methods"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "M-Pesa", value: "mpesa" },
              { label: "Stripe", value: "stripe" },
              { label: "Wallet", value: "wallet" },
            ]}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" fullWidth>
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatus("");
                setMethod("");
                setPage(1);
                setTimeout(fetchData, 0);
              }}
            >
              Reset
            </Button>
          </div>
        </form>

        {error && (
          <div className="p-4">
            <Alert variant="danger" title="Failed to load">
              {error}
            </Alert>
          </div>
        )}

        <Table
          columns={columns}
          data={rows}
          loading={loading}
          rowKey={(r) => r._id}
        />

        {meta && meta.totalPages > 1 && (
          <div className="border-t border-border px-4">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onChange={setPage}
            />
          </div>
        )}
      </Card>

      <Drawer
        isOpen={!!detailsId}
        onClose={() => setDetailsId(null)}
        title="Payment details"
        width="w-full max-w-md"
      >
        {detailsLoading || !details ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm text-text-primary">
                {details.reference}
              </p>
              <Badge variant={paymentStatusVariant(details.status)}>
                {capitalize(details.status)}
              </Badge>
            </div>

            <div className="rounded-md border border-border bg-surface-alt p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Amount
              </p>
              <p className="mt-1 text-2xl font-semibold text-secondary-600">
                {formatCurrency(details.amount, details.currency)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-text-muted">Method</dt>
                <dd className="text-text-primary">
                  {PAYMENT_METHOD_LABELS[details.method] ?? details.method}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Service</dt>
                <dd className="text-text-primary capitalize">
                  {details.serviceType ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Customer</dt>
                <dd className="text-text-primary">
                  {details.customerName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Partner</dt>
                <dd className="text-text-primary">
                  {details.partnerName ?? "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-text-muted">Date</dt>
                <dd className="text-text-primary">
                  {formatDateTime(details.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Commissions list                                                            */
/* -------------------------------------------------------------------------- */

function CommissionsList() {
  const [rows, setRows] = useState<Commission[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.commissions({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load commissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const columns = useMemo<Column<Commission>[]>(
    () => [
      {
        key: "partnerName",
        header: "Partner",
        render: (row) => (
          <div>
            <p className="text-sm text-text-primary">{row.partnerName}</p>
            <p className="text-xs text-text-muted capitalize">
              {row.partnerType}
            </p>
          </div>
        ),
      },
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <span className="font-mono text-xs text-text-secondary">
            {row.reference}
          </span>
        ),
      },
      {
        key: "serviceType",
        header: "Service",
        render: (row) => (
          <Badge variant="neutral">{capitalize(row.serviceType)}</Badge>
        ),
      },
      {
        key: "baseAmount",
        header: "Base",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {formatCurrency(row.baseAmount, row.currency)}
          </span>
        ),
      },
      {
        key: "rate",
        header: "Rate",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {(row.rate * 100).toFixed(1)}%
          </span>
        ),
      },
      {
        key: "amount",
        header: "Commission",
        render: (row) => (
          <span className="text-sm font-medium text-secondary-600">
            {formatCurrency(row.amount, row.currency)}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Date",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <Card padded={false}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          fetchData();
        }}
        className="flex gap-2 border-b border-border p-4"
      >
        <div className="flex-1">
          <Input
            placeholder="Search partner, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {error && (
        <div className="p-4">
          <Alert variant="danger" title="Failed to load">
            {error}
          </Alert>
        </div>
      )}

      <Table
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={(r) => r._id}
      />

      {meta && meta.totalPages > 1 && (
        <div className="border-t border-border px-4">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onChange={setPage}
          />
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Payouts list                                                                */
/* -------------------------------------------------------------------------- */

function PayoutsList() {
  const { success, error: toastError } = useToast();

  const [rows, setRows] = useState<Payout[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [approveTarget, setApproveTarget] = useState<Payout | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<Payout | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.payouts({
        page,
        limit: DEFAULT_PAGE_SIZE,
        status: status || undefined,
        search: search || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load payouts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await paymentApi.payoutSettings();
      setSettings(data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproveLoading(true);
    try {
      await paymentApi.approvePayout(approveTarget._id);
      success("Payout approved");
      setApproveTarget(null);
      fetchData();
    } catch {
      toastError("Could not approve payout");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toastError("Reason required");
      return;
    }
    setRejectLoading(true);
    try {
      await paymentApi.rejectPayout(rejectTarget._id, rejectReason.trim());
      success("Payout rejected");
      setRejectTarget(null);
      setRejectReason("");
      fetchData();
    } catch {
      toastError("Could not reject payout");
    } finally {
      setRejectLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      await paymentApi.updatePayoutSettings(settings);
      success("Payout settings saved");
      setSettingsOpen(false);
    } catch {
      toastError("Could not save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  const columns = useMemo<Column<Payout>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <span className="font-mono text-xs text-text-primary">
            {row.reference}
          </span>
        ),
      },
      {
        key: "partnerName",
        header: "Partner",
        render: (row) => (
          <div>
            <p className="text-sm text-text-primary">{row.partnerName}</p>
            <p className="text-xs text-text-muted capitalize">
              {row.partnerType}
            </p>
          </div>
        ),
      },
      {
        key: "method",
        header: "Method",
        render: (row) => (
          <Badge variant="neutral">
            {PAYMENT_METHOD_LABELS[row.method] ?? row.method}
          </Badge>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        render: (row) => (
          <span className="text-sm font-medium text-text-primary">
            {formatCurrency(row.amount, row.currency)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={payoutStatusVariant(row.status)}>
            {capitalize(row.status)}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-32 text-right",
        render: (row) => {
          if (row.status !== "pending") return null;
          return (
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                onClick={() => setApproveTarget(row)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRejectTarget(row)}
              >
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <Card padded={false}>
        <div className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4">
          <Input
            placeholder="Search partner, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="All statuses"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "Pending", value: "pending" },
              { label: "Processing", value: "processing" },
              { label: "Completed", value: "completed" },
              { label: "Rejected", value: "rejected" },
              { label: "Failed", value: "failed" },
            ]}
          />
          <div className="flex gap-2 md:col-span-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPage(1);
                fetchData();
              }}
            >
              Search
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSettingsOpen(true)}
            >
              Payout settings
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4">
            <Alert variant="danger" title="Failed to load">
              {error}
            </Alert>
          </div>
        )}

        <Table
          columns={columns}
          data={rows}
          loading={loading}
          rowKey={(r) => r._id}
        />

        {meta && meta.totalPages > 1 && (
          <div className="border-t border-border px-4">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onChange={setPage}
            />
          </div>
        )}
      </Card>

      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Payout settings"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button loading={settingsSaving} onClick={saveSettings}>
              Save
            </Button>
          </>
        }
      >
        {settings ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Minimum amount"
              type="number"
              value={settings.minAmount}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minAmount: Number(e.target.value) || 0,
                })
              }
            />
            <Select
              label="Schedule"
              value={settings.schedule}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule: e.target.value as PayoutSettings["schedule"],
                })
              }
              options={[
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
              ]}
            />
            <Input
              label="Commission rate (%)"
              type="number"
              step="0.1"
              value={settings.commissionRate * 100}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  commissionRate: (Number(e.target.value) || 0) / 100,
                })
              }
            />
            <Input
              label="Currency"
              value={settings.currency}
              onChange={(e) =>
                setSettings({ ...settings, currency: e.target.value })
              }
            />
            <div className="col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={settings.autoApprove}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoApprove: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-border text-secondary-500 focus:ring-secondary-500/40"
                />
                Auto-approve payouts under threshold
              </label>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve payout?"
        description={
          approveTarget
            ? `${formatCurrency(
                approveTarget.amount,
                approveTarget.currency
              )} will be sent to ${approveTarget.partnerName}.`
            : ""
        }
        confirmText="Approve"
        variant="primary"
        loading={approveLoading}
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject payout"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={rejectLoading}
              onClick={handleReject}
            >
              Reject
            </Button>
          </>
        }
      >
        <Input
          label="Reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Why is this payout being rejected?"
        />
      </Modal>
    </>
  );
}