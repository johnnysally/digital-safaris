import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Drawer from "../components/ui/Drawer";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Dropdown from "../components/ui/Dropdown";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import axiosInstance, { unwrap, unwrapList } from "../api/axios";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatDateTime } from "../utils/formatDate";
import { truncate } from "../utils/helpers";
import type { Contact, ContactStatus, PaginationMeta } from "../types";

type StatusVariant = "success" | "warning" | "info" | "neutral";

function statusVariant(status: ContactStatus): StatusVariant {
  switch (status) {
    case "resolved":
      return "success";
    case "in_progress":
      return "warning";
    case "new":
      return "info";
    default:
      return "neutral";
  }
}

function statusLabel(status: ContactStatus): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    default:
      return status[0].toUpperCase() + status.slice(1);
  }
}

async function fetchContacts(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}): Promise<{ data: Contact[]; meta: PaginationMeta | null }> {
  const res = await axiosInstance.get("/admin/contacts", { params });
  const { data, meta } = unwrapList<Contact>(res.data);
  return { data, meta };
}

async function fetchContact(id: string): Promise<Contact> {
  const res = await axiosInstance.get(`/admin/contacts/${id}`);
  const body = unwrap<{ contact: Contact } | Contact>(res.data);
  if (body && typeof body === "object" && "contact" in body) {
    return (body as { contact: Contact }).contact;
  }
  return body as Contact;
}

async function updateContactStatus(
  id: string,
  status: ContactStatus
): Promise<void> {
  await axiosInstance.post(`/admin/contacts/${id}/status`, { status });
}

async function deleteContact(id: string): Promise<void> {
  await axiosInstance.delete(`/admin/contacts/${id}`);
}

export default function Contacts() {
  const { success, error: toastError } = useToast();

  const [rows, setRows] = useState<Contact[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<Contact | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await fetchContacts({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      });
      setRows(data);
      setMeta(meta);
    } catch {
      setError("Could not load contacts.");
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

  const openDetails = async (id: string) => {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const data = await fetchContact(id);
      setDetails(data);
    } catch {
      toastError("Could not load contact");
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const setStatusOnContact = async (
    target: Contact,
    next: ContactStatus
  ) => {
    setStatusUpdating(true);
    try {
      await updateContactStatus(target._id, next);
      success(`Marked as ${statusLabel(next)}`);
      setDetails((prev) => (prev ? { ...prev, status: next } : prev));
      fetchData();
    } catch {
      toastError("Could not update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteContact(deleteTarget._id);
      success("Contact deleted");
      setDeleteTarget(null);
      if (detailsId === deleteTarget._id) setDetailsId(null);
      fetchData();
    } catch {
      toastError("Could not delete contact");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo<Column<Contact>[]>(
    () => [
      {
        key: "name",
        header: "From",
        render: (row) => (
          <button
            type="button"
            onClick={() => openDetails(row._id)}
            className="text-left"
          >
            <p className="text-sm font-medium text-text-primary hover:text-secondary-600">
              {row.name}
            </p>
            <p className="text-xs text-text-muted">{row.email}</p>
          </button>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.phone ?? "—"}
          </span>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        render: (row) => (
          <span className="text-sm text-text-primary">
            {truncate(row.subject, 40)}
          </span>
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
        key: "createdAt",
        header: "Received",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {formatDateTime(row.createdAt)}
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
                {
                  key: "view",
                  label: "View",
                  onClick: () => openDetails(row._id),
                },
                ...(row.status !== "in_progress"
                  ? [
                      {
                        key: "progress",
                        label: "Mark in progress",
                        onClick: () => setStatusOnContact(row, "in_progress"),
                      },
                    ]
                  : []),
                ...(row.status !== "resolved"
                  ? [
                      {
                        key: "resolve",
                        label: "Mark resolved",
                        onClick: () => setStatusOnContact(row, "resolved"),
                      },
                    ]
                  : []),
                {
                  key: "delete",
                  label: "Delete",
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
        <h1 className="text-2xl font-semibold text-text-primary">Contacts</h1>
        <p className="mt-1 text-sm text-text-muted">
          Messages from the public "Contact Us" form
        </p>
      </div>

      <Card padded={false}>
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
        >
          <Input
            placeholder="Search name, email, subject…"
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
              { label: "New", value: "new" },
              { label: "In Progress", value: "in_progress" },
              { label: "Resolved", value: "resolved" },
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
              total={meta.total}
              limit={meta.limit}
              onChange={setPage}
            />
          </div>
        )}
      </Card>

      <Drawer
        isOpen={!!detailsId}
        onClose={() => setDetailsId(null)}
        title="Message"
        width="w-full max-w-md"
      >
        {detailsLoading || !details ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-medium text-text-primary">
                  {details.name}
                </p>
                <Badge variant={statusVariant(details.status)}>
                  {statusLabel(details.status)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {details.email}
                {details.phone ? ` · ${details.phone}` : ""}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {formatDateTime(details.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Subject
              </p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                {details.subject}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Message
              </p>
              <div className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-surface-alt p-3 text-sm text-text-primary">
                {details.message}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={`mailto:${details.email}?subject=Re: ${encodeURIComponent(
                  details.subject
                )}`}
                className="inline-flex"
              >
                <Button size="sm" variant="primary">
                  Reply by email
                </Button>
              </a>
              {details.status !== "in_progress" && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={statusUpdating}
                  onClick={() => setStatusOnContact(details, "in_progress")}
                >
                  Mark in progress
                </Button>
              )}
              {details.status !== "resolved" && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={statusUpdating}
                  onClick={() => setStatusOnContact(details, "resolved")}
                >
                  Mark resolved
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDeleteTarget(details);
                  setDetailsId(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete message?"
        description={`This will permanently remove the message from ${
          deleteTarget?.name ?? "this contact"
        }.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}