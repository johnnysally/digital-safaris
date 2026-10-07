import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Textarea from "../components/ui/Textarea";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Dropdown from "../components/ui/Dropdown";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { disputeApi } from "../api";
import { useToast } from "../context/toastContext";
import { useAuth } from "../context/authContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatDateTime, formatRelative } from "../utils/formatDate";
import { capitalize, fullName } from "../utils/helpers";
import type {
  Dispute,
  DisputeDetails,
  DisputeStatus,
  PaginationMeta,
} from "../types";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

function statusVariant(status: DisputeStatus): StatusVariant {
  switch (status) {
    case "open":
      return "warning";
    case "investigating":
      return "info";
    case "resolved":
      return "success";
    case "rejected":
      return "danger";
    case "closed":
      return "neutral";
    default:
      return "neutral";
  }
}

function statusLabel(s: DisputeStatus): string {
  return capitalize(s.replace(/_/g, " "));
}

export default function Disputes() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  return id ? (
    <DisputeDetail id={id} onBack={() => navigate("/disputes")} />
  ) : (
    <DisputeList onOpen={(dId) => navigate(`/disputes/${dId}`)} />
  );
}

/* -------------------------------------------------------------------------- */
/* List                                                                        */
/* -------------------------------------------------------------------------- */

function DisputeList({ onOpen }: { onOpen: (id: string) => void }) {
  const { error: toastError } = useToast();

  const [rows, setRows] = useState<Dispute[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await disputeApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load disputes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const columns = useMemo<Column<Dispute>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <button
            type="button"
            onClick={() => onOpen(row._id)}
            className="text-left"
          >
            <p className="font-mono text-xs text-text-primary hover:text-secondary-600">
              {row.reference}
            </p>
            <p className="text-xs text-text-muted">
              {formatRelative(row.createdAt)}
            </p>
          </button>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        render: (row) => (
          <span className="text-sm text-text-primary">{row.subject}</span>
        ),
      },
      {
        key: "raisedBy",
        header: "Raised by",
        render: (row) => (
          <div>
            <p className="text-sm text-text-primary">{row.raisedByName}</p>
            <p className="text-xs text-text-muted capitalize">
              {row.raisedByRole}
            </p>
          </div>
        ),
      },
      {
        key: "against",
        header: "Against",
        render: (row) => (
          <div>
            <p className="text-sm text-text-primary">{row.againstName}</p>
            <p className="text-xs text-text-muted capitalize">
              {row.againstRole}
            </p>
          </div>
        ),
      },
      {
        key: "category",
        header: "Category",
        render: (row) => (
          <Badge variant="neutral">{capitalize(row.category)}</Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={statusVariant(row.status)}>
            {statusLabel(row.status)}
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
              onClick={() => onOpen(row._id)}
            >
              Open
            </Button>
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
        <h1 className="text-2xl font-semibold text-text-primary">Disputes</h1>
        <p className="mt-1 text-sm text-text-muted">
          Resolve disputes raised by customers or partners
        </p>
      </div>

      <Card padded={false}>
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
        >
          <Input
            placeholder="Search reference, subject, parties…"
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
              { label: "Open", value: "open" },
              { label: "Investigating", value: "investigating" },
              { label: "Resolved", value: "resolved" },
              { label: "Rejected", value: "rejected" },
              { label: "Closed", value: "closed" },
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                      */
/* -------------------------------------------------------------------------- */

function DisputeDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { admin } = useAuth();
  const { success, error: toastError } = useToast();

  const [dispute, setDispute] = useState<DisputeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [closeOpen, setCloseOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await disputeApi.details(id);
      setDispute(data);
    } catch {
      toastError("Could not load dispute");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAssign = async () => {
    if (!admin?._id) return;
    setAssignLoading(true);
    try {
      await disputeApi.assign(id, admin._id);
      success("Assigned to you");
      setAssignOpen(false);
      fetchData();
    } catch {
      toastError("Could not assign");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toastError("Resolution required", "Enter the resolution.");
      return;
    }
    setResolveLoading(true);
    try {
      await disputeApi.resolve(id, { resolution: resolution.trim() });
      success("Dispute resolved");
      setResolveOpen(false);
      setResolution("");
      fetchData();
    } catch {
      toastError("Could not resolve dispute");
    } finally {
      setResolveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toastError("Reason required");
      return;
    }
    setRejectLoading(true);
    try {
      await disputeApi.reject(id, rejectReason.trim());
      success("Dispute rejected");
      setRejectOpen(false);
      setRejectReason("");
      fetchData();
    } catch {
      toastError("Could not reject dispute");
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <EmptyState
        title="Dispute not found"
        action={
          <Button variant="ghost" onClick={onBack}>
            Back to disputes
          </Button>
        }
      />
    );
  }

  const canAct =
    dispute.status === "open" || dispute.status === "investigating";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              {dispute.subject}
            </h1>
            <p className="mt-1 font-mono text-xs text-text-muted">
              {dispute.reference} · {formatDateTime(dispute.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={statusVariant(dispute.status)}>
            {statusLabel(dispute.status)}
          </Badge>
          <Badge variant="neutral">{capitalize(dispute.category)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Description">
            <p className="whitespace-pre-wrap text-sm text-text-primary">
              {dispute.description}
            </p>
          </Card>

          <Card title="Thread" padded={false}>
            {dispute.messages.length === 0 ? (
              <EmptyState
                title="No messages"
                description="No thread activity yet."
              />
            ) : (
              <ul className="divide-y divide-border">
                {dispute.messages.map((m) => (
                  <li key={m._id} className="flex gap-3 px-4 py-3">
                    <Avatar
                      fallback={m.authorName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {m.authorName}
                          <span className="ml-2 text-xs font-normal capitalize text-text-muted">
                            {m.authorRole}
                          </span>
                        </p>
                        <span className="shrink-0 text-xs text-text-muted">
                          {formatRelative(m.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                        {m.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">
                  Raised by
                </dt>
                <dd className="mt-0.5 text-text-primary">
                  {dispute.raisedByName}{" "}
                  <span className="text-xs capitalize text-text-muted">
                    ({dispute.raisedByRole})
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">
                  Against
                </dt>
                <dd className="mt-0.5 text-text-primary">
                  {dispute.againstName}{" "}
                  <span className="text-xs capitalize text-text-muted">
                    ({dispute.againstRole})
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">
                  Assigned to
                </dt>
                <dd className="mt-0.5 text-text-primary">
                  {dispute.assignedToName ?? "Unassigned"}
                </dd>
              </div>
              {dispute.resolvedAt && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-text-muted">
                    Resolved
                  </dt>
                  <dd className="mt-0.5 text-text-primary">
                    {formatDateTime(dispute.resolvedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {dispute.resolution && (
            <Card title="Resolution">
              <p className="whitespace-pre-wrap text-sm text-text-primary">
                {dispute.resolution}
              </p>
            </Card>
          )}

          {canAct && (
            <Card title="Actions">
              <div className="space-y-2">
                {!dispute.assignedTo && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setAssignOpen(true)}
                  >
                    Assign to me
                  </Button>
                )}
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setResolveOpen(true)}
                >
                  Resolve
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setCloseOpen(true)}
                >
                  Close without action
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Assign */}
      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign dispute"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button loading={assignLoading} onClick={handleAssign}>
              Assign
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Assign this dispute to {fullName(admin?.firstName, admin?.lastName)}?
        </p>
      </Modal>

      {/* Resolve */}
      <Modal
        isOpen={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve dispute"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button loading={resolveLoading} onClick={handleResolve}>
              Mark resolved
            </Button>
          </>
        }
      >
        <Textarea
          label="Resolution"
          rows={5}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Summarize the outcome and any compensation…"
        />
      </Modal>

      {/* Reject */}
      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject dispute"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
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
          placeholder="Why is this being rejected?"
        />
      </Modal>

      <ConfirmDialog
        isOpen={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={async () => {
          setCloseOpen(false);
          // Same endpoint as reject, but as a neutral close
          try {
            await disputeApi.reject(id, "Closed without action");
            success("Dispute closed");
            fetchData();
          } catch {
            toastError("Could not close dispute");
          }
        }}
        title="Close without action?"
        description="This will close the dispute without a resolution. The user will be notified."
        confirmText="Close"
        variant="primary"
      />
    </div>
  );
}