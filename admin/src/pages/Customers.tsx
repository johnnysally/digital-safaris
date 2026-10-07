import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Drawer from "../components/ui/Drawer";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Dropdown from "../components/ui/Dropdown";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import { customerApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateTime } from "../utils/formatDate";
import { fullName, capitalize } from "../utils/helpers";
import type {
  Customer,
  CustomerDetails,
  PaginationMeta,
} from "../types";

type StatusVariant = "success" | "warning" | "danger" | "neutral";

function statusVariant(status: string): StatusVariant {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "suspended":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export default function Customers() {
  const { success, error: toastError } = useToast();

  const [rows, setRows] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<Customer | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const openDetails = async (id: string) => {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const data = await customerApi.details(id);
      setDetails(data);
    } catch {
      toastError("Could not load customer", "Please try again.");
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) {
      toastError("Reason required", "Enter a reason for suspension.");
      return;
    }
    setSuspendLoading(true);
    try {
      await customerApi.suspend(suspendTarget._id, suspendReason.trim());
      success("Customer suspended");
      setSuspendTarget(null);
      setSuspendReason("");
      fetchData();
    } catch {
      toastError("Could not suspend customer", "Please try again.");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleReactivate = async (target: Customer) => {
    try {
      await customerApi.reactivate(target._id);
      success("Customer reactivated");
      fetchData();
    } catch {
      toastError("Could not reactivate customer", "Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await customerApi.hardDelete(deleteTarget._id);
      success("Customer deleted", "All related records removed.");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toastError("Could not delete customer", "Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo<Column<Customer>[]>(
    () => [
      {
        key: "name",
        header: "Customer",
        render: (row) => {
          const name = fullName(row.firstName, row.lastName);
          return (
            <button
              type="button"
              onClick={() => openDetails(row._id)}
              className="flex items-center gap-3 text-left"
            >
              <Avatar src={row.avatar ?? undefined} fallback={name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary hover:text-secondary-600">
                  {name}
                </p>
                <p className="truncate text-xs text-text-muted">{row.email}</p>
              </div>
            </button>
          );
        },
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
        key: "walletBalance",
        header: "Wallet",
        render: (row) => (
          <span className="text-sm font-medium text-text-primary">
            {formatCurrency(row.walletBalance ?? 0)}
          </span>
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
        render: (row) => (
          <div className="flex justify-end">
            <Dropdown
              trigger={
                <span className="rounded-md px-2 py-1 text-text-muted hover:bg-surface-alt">
                  ⋯
                </span>
              }
              items={[
                { key: "view", label: "View details", onClick: () => openDetails(row._id) },
                row.status === "active"
                  ? {
                      key: "suspend",
                      label: "Suspend",
                      danger: true,
                      onClick: () => setSuspendTarget(row),
                    }
                  : {
                      key: "reactivate",
                      label: "Reactivate",
                      onClick: () => handleReactivate(row),
                    },
                {
                  key: "delete",
                  label: "Delete permanently",
                  danger: true,
                  onClick: () => setDeleteTarget(row),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Customers</h1>
        <p className="mt-1 text-sm text-text-muted">
          View and manage customer accounts
        </p>
      </div>

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
              { label: "Active", value: "active" },
              { label: "Suspended", value: "suspended" },
              { label: "Pending", value: "pending" },
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

      {/* Details drawer */}
      <Drawer
        isOpen={!!detailsId}
        onClose={() => setDetailsId(null)}
        title="Customer details"
        width="w-full max-w-md"
      >
        {detailsLoading || !details ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar
                src={details.avatar ?? undefined}
                fallback={fullName(details.firstName, details.lastName)}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-text-primary">
                  {fullName(details.firstName, details.lastName)}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {details.email}
                </p>
                <div className="mt-1">
                  <Badge variant={statusVariant(details.status)}>
                    {capitalize(details.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-text-muted">Phone</dt>
                <dd className="text-text-primary">{details.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Town</dt>
                <dd className="text-text-primary">{details.town ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Wallet</dt>
                <dd className="text-text-primary">
                  {formatCurrency(details.walletBalance ?? 0)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Joined</dt>
                <dd className="text-text-primary">
                  {formatDate(details.createdAt)}
                </dd>
              </div>
              {details.lastLogin && (
                <div className="col-span-2">
                  <dt className="text-xs text-text-muted">Last login</dt>
                  <dd className="text-text-primary">
                    {formatDateTime(details.lastLogin)}
                  </dd>
                </div>
              )}
            </dl>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-surface-alt p-3">
                <p className="text-xs text-text-muted">Bookings</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {details.totalBookings ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface-alt p-3">
                <p className="text-xs text-text-muted">Orders</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {details.totalOrders ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface-alt p-3">
                <p className="text-xs text-text-muted">Trips</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {details.totalTrips ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface-alt p-3">
                <p className="text-xs text-text-muted">Total spent</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {formatCurrency(details.totalSpent ?? 0)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {details.status === "active" ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setSuspendTarget(details);
                    setDetailsId(null);
                  }}
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleReactivate(details);
                    setDetailsId(null);
                  }}
                >
                  Reactivate
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDeleteTarget(details);
                  setDetailsId(null);
                }}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Suspend modal */}
      <ModalishSuspend
        target={suspendTarget}
        reason={suspendReason}
        setReason={setSuspendReason}
        onClose={() => {
          setSuspendTarget(null);
          setSuspendReason("");
        }}
        onConfirm={handleSuspend}
        loading={suspendLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete customer permanently?"
        description={`This removes ${deleteTarget ? fullName(deleteTarget.firstName, deleteTarget.lastName) : ""} and all related records (bookings, orders, wallet, reviews, sessions). This cannot be undone.`}
        confirmText="Delete permanently"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small local modal to keep the main file readable                            */
/* -------------------------------------------------------------------------- */

import Modal from "../components/ui/Modal";

interface SuspendModalProps {
  target: Customer | null;
  reason: string;
  setReason: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ModalishSuspend({
  target,
  reason,
  setReason,
  onClose,
  onConfirm,
  loading,
}: SuspendModalProps) {
  return (
    <Modal
      isOpen={!!target}
      onClose={onClose}
      title="Suspend Customer"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Suspend
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-text-secondary">
        Suspending{" "}
        <strong className="text-text-primary">
          {target && fullName(target.firstName, target.lastName)}
        </strong>{" "}
        will block them from signing in until reactivated.
      </p>
      <Input
        label="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Fraudulent activity"
      />
    </Modal>
  );
}