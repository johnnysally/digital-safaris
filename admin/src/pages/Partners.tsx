import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Dropdown from "../components/ui/Dropdown";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { partnerApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE, PARTNER_TYPE_LABELS } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type {
  Partner,
  PartnerDetails,
  PartnerType,
  PartnerStatus,
  PaginationMeta,
} from "../types";

type StatusVariant = "success" | "warning" | "danger" | "neutral";

function statusVariant(status: PartnerStatus): StatusVariant {
  switch (status) {
    case "approved":
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
    case "suspended":
    case "closed":
      return "danger";
    default:
      return "neutral";
  }
}

const TABS: { key: PartnerType; label: string }[] = [
  { key: "accommodation", label: "Accommodation" },
  { key: "restaurant", label: "Restaurant" },
  { key: "transport", label: "Transport" },
];

const VALID_TABS = TABS.map((t) => t.key);

export default function Partners() {
  const { type, id } = useParams<{ type?: string; id?: string }>();
  const navigate = useNavigate();

  const initialTab: PartnerType =
    type && VALID_TABS.includes(type as PartnerType)
      ? (type as PartnerType)
      : "accommodation";

  const [tab, setTab] = useState<PartnerType>(initialTab);
  const [rows, setRows] = useState<Partner[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<Partner | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<Partner | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const detailOpen = Boolean(id);

  useEffect(() => {
    if (detailOpen) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await partnerApi.list(tab, {
          page,
          limit: DEFAULT_PAGE_SIZE,
          search: search || undefined,
          status: status || undefined,
        });
        if (!cancelled) {
          setRows(res.data ?? []);
          setMeta(res.meta ?? null);
        }
      } catch {
        if (!cancelled) setError("Could not load partners.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [tab, page, status, detailOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setError(null);
    partnerApi
      .list(tab, {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      })
      .then((res) => {
        setRows(res.data ?? []);
        setMeta(res.meta ?? null);
      })
      .catch(() => setError("Could not load partners."))
      .finally(() => setLoading(false));
  };

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await partnerApi.list(tab, {
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load partners.");
    } finally {
      setLoading(false);
    }
  };

  const refetchSilent = async () => {
    try {
      const res = await partnerApi.list(tab, {
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load partners.");
    }
  };

  const handleApprove = async (target: Partner) => {
    if (busyId) return;
    setBusyId(target._id);
    try {
      await partnerApi.approve(target.type, target._id);
      await refetchSilent();
    } catch {
      /* interceptor surfaces toast */
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) return;
    setRejectLoading(true);
    try {
      await partnerApi.reject(rejectTarget.type, rejectTarget._id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason("");
      await refetchSilent();
    } catch {
      /* interceptor */
    } finally {
      setRejectLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) return;
    setSuspendLoading(true);
    try {
      await partnerApi.suspend(suspendTarget.type, suspendTarget._id, suspendReason.trim());
      setSuspendTarget(null);
      setSuspendReason("");
      await refetchSilent();
    } catch {
      /* interceptor */
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleReactivate = async (target: Partner) => {
    if (busyId) return;
    setBusyId(target._id);
    try {
      await partnerApi.reactivate(target.type, target._id);
      await refetchSilent();
    } catch {
      /* interceptor */
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await partnerApi.hardDelete(deleteTarget.type, deleteTarget._id);
      setDeleteTarget(null);
      await refetchSilent();
    } catch {
      /* interceptor */
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo<Column<Partner>[]>(
    () => [
      {
        key: "name",
        header: "Partner",
        render: (row) => (
          <button
            type="button"
            onClick={() =>
              navigate(`/partners/${row.category ?? row.type}/${row._id}`)
            }
            className="flex items-center gap-3 text-left"
          >
            <Avatar src={row.logo ?? undefined} fallback={row.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary hover:text-secondary-600">
                {row.name}
              </p>
              <p className="truncate text-xs text-text-muted">{row.email}</p>
            </div>
          </button>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.phone ?? "—"}</span>
        ),
      },
      {
        key: "town",
        header: "Town",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.town ?? "—"}</span>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        render: (row) =>
          row.rating ? (
            <span className="text-sm text-text-primary">
              ★ {row.rating.toFixed(1)}
              {row.totalRatings ? (
                <span className="ml-1 text-xs text-text-muted">
                  ({row.totalRatings})
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-sm text-text-muted">—</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={statusVariant(row.status)}>
            {capitalize(row.status)}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Joined",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        render: (row) => {
          const isBusy = busyId === row._id;
          return (
            <div className="flex items-center justify-end gap-2">
              {isBusy && <Spinner size="sm" />}
              <Dropdown
                trigger={
                  <span
                    className={`rounded-md px-2 py-1 text-text-muted hover:bg-surface-alt ${
                      isBusy ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    ⋯
                  </span>
                }
                items={[
                  {
                    key: "view",
                    label: "View",
                    onClick: () =>
                      navigate(`/partners/${row.category ?? row.type}/${row._id}`),
                  },
                  ...(row.status === "pending"
                    ? [
                        {
                          key: "approve",
                          label: "Approve",
                          onClick: () => handleApprove(row),
                        },
                        {
                          key: "reject",
                          label: "Reject",
                          danger: true,
                          onClick: () => setRejectTarget(row),
                        },
                      ]
                    : []),
                  ...(row.status === "approved" || row.status === "active"
                    ? [
                        {
                          key: "suspend",
                          label: "Suspend",
                          danger: true,
                          onClick: () => setSuspendTarget(row),
                        },
                      ]
                    : []),
                  ...(row.status === "suspended" || row.status === "rejected"
                    ? [
                        {
                          key: "reactivate",
                          label: "Reactivate",
                          onClick: () => handleReactivate(row),
                        },
                      ]
                    : []),
                  {
                    key: "delete",
                    label: "Delete permanently",
                    danger: true,
                    onClick: () => setDeleteTarget(row),
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busyId]
  );

  if (detailOpen && type && id) {
    return (
      <PartnerDetail
        type={type as PartnerType}
        id={id}
        onBack={() => navigate("/partners")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Partners</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage accommodation, restaurant, and transport partners
        </p>
      </div>

      <Tabs
        tabs={TABS}
        activeKey={tab}
        onChange={(k) => {
          const next = (VALID_TABS.includes(k as PartnerType)
            ? k
            : "accommodation") as PartnerType;
          setTab(next);
          setPage(1);
          setSearch("");
          setStatus("");
        }}
      />

      <Card padded={false}>
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
        >
          <Input
            placeholder="Search name, email, phone…"
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
              { label: "Approved", value: "approved" },
              { label: "Active", value: "active" },
              { label: "Rejected", value: "rejected" },
              { label: "Suspended", value: "suspended" },
            ]}
          />
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" variant="secondary" fullWidth>
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatus("");
                setPage(1);
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

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject partner"
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
        <p className="mb-3 text-sm text-text-secondary">
          Reject <strong className="text-text-primary">{rejectTarget?.name}</strong>?
          They'll receive an email explaining the decision.
        </p>
        <Input
          label="Reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Missing business documents"
        />
      </Modal>

      <Modal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        title="Suspend partner"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={suspendLoading}
              onClick={handleSuspend}
            >
              Suspend
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-text-secondary">
          Suspend <strong className="text-text-primary">{suspendTarget?.name}</strong>?
          Their listings will be hidden from customers.
        </p>
        <Input
          label="Reason"
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          placeholder="e.g. Repeated service complaints"
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete partner permanently?"
        description={`This removes ${deleteTarget?.name ?? "this partner"} and all related records — listings, bookings, trips, orders, wallet, payouts. This cannot be undone.`}
        confirmText="Delete permanently"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

function PartnerDetail({
  type,
  id,
  onBack,
}: {
  type: PartnerType;
  id: string;
  onBack: () => void;
}) {
  const { error: toastError } = useToast();
  const [details, setDetails] = useState<PartnerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await partnerApi.details(type, id);
        if (!cancelled) setDetails(data);
      } catch {
        if (!cancelled) toastError("Could not load partner");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!details) {
    return (
      <EmptyState
        title="Partner not found"
        action={
          <Button variant="ghost" onClick={onBack}>
            Back to partners
          </Button>
        }
      />
    );
  }

  const detailTabs = [
    { key: "info", label: "Partner Info" },
    { key: "business", label: "Business Info" },
    { key: "wallet", label: "Wallet Info" },
    { key: "payout", label: "Payout Info" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <Avatar
            src={details.logo ?? undefined}
            fallback={details.name}
            size="md"
          />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              {details.name}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              {PARTNER_TYPE_LABELS[details.type]} · {details.town ?? "No town"}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant(details.status)}>
          {capitalize(details.status)}
        </Badge>
      </div>

      <Tabs tabs={detailTabs} activeKey={tab} onChange={setTab} />

      {tab === "info" && (
        <Card>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name" value={details.name} />
            <Field label="Type" value={PARTNER_TYPE_LABELS[details.type]} />
            <Field label="Email" value={details.email} />
            <Field label="Phone" value={details.phone ?? "—"} />
            <Field label="Town" value={details.town ?? "—"} />
            <Field
              label="Rating"
              value={
                details.rating
                  ? `★ ${details.rating.toFixed(1)} (${details.totalRatings ?? 0})`
                  : "—"
              }
            />
            <Field label="Joined" value={formatDate(details.createdAt)} />
            <Field
              label="Last updated"
              value={formatDateTime(details.updatedAt)}
            />
          </dl>
        </Card>
      )}

      {tab === "business" && (
        <Card>
          {!details.business ? (
            <EmptyState title="No business information on file" />
          ) : (
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Registration number"
                value={details.business.registrationNumber ?? "—"}
              />
              <Field label="Tax PIN" value={details.business.taxPin ?? "—"} />
              <Field label="Website" value={details.business.website ?? "—"} />
              <div className="md:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-text-muted">
                  Description
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                  {details.business.description ?? "—"}
                </dd>
              </div>
              {details.business.address && (
                <div className="md:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-text-muted">
                    Address
                  </dt>
                  <dd className="mt-1 text-sm text-text-primary">
                    {[
                      details.business.address.line1,
                      details.business.address.line2,
                      details.business.address.town,
                      details.business.address.county,
                      details.business.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </Card>
      )}

      {tab === "wallet" && (
        <Card>
          {!details.wallet ? (
            <EmptyState title="No wallet on file" />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat
                label="Balance"
                value={formatCurrency(details.wallet.balance)}
                accent="text-secondary-600"
              />
              <Stat
                label="Total earned"
                value={formatCurrency(details.wallet.totalEarned)}
              />
              <Stat
                label="Commission owed"
                value={formatCurrency(details.wallet.commissionOwed)}
                accent="text-danger"
              />
              <Stat
                label="Last payout"
                value={
                  details.wallet.lastPayoutAt
                    ? formatDateTime(details.wallet.lastPayoutAt)
                    : "Never"
                }
              />
            </div>
          )}
        </Card>
      )}

      {tab === "payout" && (
        <Card>
          {!details.payout ? (
            <EmptyState title="No payout information on file" />
          ) : (
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Method" value={details.payout.method ?? "—"} />
              <Field
                label="Account name"
                value={details.payout.accountName ?? "—"}
              />
              <Field
                label="Account number"
                value={details.payout.accountNumber ?? "—"}
              />
              <Field label="Bank" value={details.payout.bankName ?? "—"} />
              <Field
                label="M-Pesa number"
                value={details.payout.mpesaNumber ?? "—"}
              />
              <Field
                label="Stripe account"
                value={details.payout.stripeAccountId ?? "—"}
              />
            </dl>
          )}
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-text-primary">{value}</dd>
    </div>
  );
}

function Stat({
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
      <p className={`mt-1 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}