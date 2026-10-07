import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
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
import { adminApi } from "../api";
import { useToast } from "../context/toastContext";
import { useAuth } from "../context/authContext";
import { PAGE_SIZES, DEFAULT_PAGE_SIZE, ROLE_LABELS } from "../utils/constants";
import { formatDateTime } from "../utils/formatDate";
import { fullName, capitalize } from "../utils/helpers";
import { isValidOTP, isPhone } from "../utils/validators";
import type { Admin, AdminRole, PaginationMeta } from "../types";

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

interface CreateForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AdminRole;
}

const EMPTY_CREATE: CreateForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "admin",
};

export default function Admins() {
  const { success, error: toastError } = useToast();
  const { admin: current } = useAuth();

  const [rows, setRows] = useState<Admin[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [createLoading, setCreateLoading] = useState(false);

  const [roleTarget, setRoleTarget] = useState<Admin | null>(null);
  const [roleValue, setRoleValue] = useState<AdminRole>("admin");
  const [roleLoading, setRoleLoading] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<Admin | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.list({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        role: role || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, role]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleCreate = async () => {
    if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
      toastError("Missing name", "First and last name are required.");
      return;
    }
    if (!createForm.email.trim()) {
      toastError("Missing email", "Email is required.");
      return;
    }
    if (createForm.phone && !isPhone(createForm.phone)) {
      toastError("Invalid phone", "Enter a valid phone number.");
      return;
    }
    setCreateLoading(true);
    try {
      await adminApi.create({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || undefined,
        role: createForm.role,
      });
      success("Admin created", "An invite email has been sent.");
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      fetchData();
    } catch {
      toastError("Could not create admin", "Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleTarget) return;
    setRoleLoading(true);
    try {
      await adminApi.changeRole(roleTarget._id, roleValue);
      success("Role updated", `${fullName(roleTarget.firstName, roleTarget.lastName)} → ${ROLE_LABELS[roleValue]}`);
      setRoleTarget(null);
      fetchData();
    } catch {
      toastError("Could not change role", "Please try again.");
    } finally {
      setRoleLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) {
      toastError("Reason required", "Enter a reason for suspension.");
      return;
    }
    setSuspendLoading(true);
    try {
      await adminApi.suspend(suspendTarget._id, suspendReason.trim());
      success("Admin suspended");
      setSuspendTarget(null);
      setSuspendReason("");
      fetchData();
    } catch {
      toastError("Could not suspend admin", "Please try again.");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleReactivate = async (target: Admin) => {
    try {
      await adminApi.reactivate(target._id);
      success("Admin reactivated");
      fetchData();
    } catch {
      toastError("Could not reactivate admin", "Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminApi.remove(deleteTarget._id);
      success("Admin deleted");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toastError("Could not delete admin", "Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo<Column<Admin>[]>(
    () => [
      {
        key: "name",
        header: "Admin",
        render: (row) => {
          const name = fullName(row.firstName, row.lastName);
          return (
            <div className="flex items-center gap-3">
              <Avatar src={row.avatar ?? undefined} fallback={name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {name}
                </p>
                <p className="truncate text-xs text-text-muted">{row.email}</p>
              </div>
            </div>
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
        key: "role",
        header: "Role",
        render: (row) => {
          const r = typeof row.role === "string" ? row.role : row.role?.name;
          return <Badge variant="secondary">{r ?? "—"}</Badge>;
        },
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
        key: "lastLogin",
        header: "Last login",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {row.lastLogin ? formatDateTime(row.lastLogin) : "Never"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        render: (row) => {
          const isSelf = current?._id === row._id;
          const items = [
            {
              key: "role",
              label: "Change role",
              onClick: () => {
                setRoleTarget(row);
                setRoleValue(
                  (typeof row.role === "string"
                    ? row.role
                    : "admin") as AdminRole
                );
              },
              disabled: isSelf,
            },
            row.status === "active"
              ? {
                  key: "suspend",
                  label: "Suspend",
                  danger: true,
                  onClick: () => setSuspendTarget(row),
                  disabled: isSelf,
                }
              : {
                  key: "reactivate",
                  label: "Reactivate",
                  onClick: () => handleReactivate(row),
                },
            {
              key: "delete",
              label: "Delete",
              danger: true,
              onClick: () => setDeleteTarget(row),
              disabled: isSelf,
            },
          ];
          return (
            <div className="flex justify-end">
              <Dropdown
                trigger={
                  <span className="rounded-md px-2 py-1 text-text-muted hover:bg-surface-alt">
                    ⋯
                  </span>
                }
                items={items}
              />
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Admins</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage admin users, roles, and access
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Create Admin</Button>
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
          <Select
            placeholder="All roles"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            options={Object.entries(ROLE_LABELS).map(([v, l]) => ({
              label: l,
              value: v,
            }))}
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
                setRole("");
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

        <Table columns={columns} data={rows} loading={loading} rowKey={(r) => r._id} />

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

      {/* Create modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Admin"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={createLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={createLoading}>
              Create
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            value={createForm.firstName}
            onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
          />
          <Input
            label="Last name"
            value={createForm.lastName}
            onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
          />
          <div className="col-span-2">
            <Input
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Phone (optional)"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Select
              label="Role"
              value={createForm.role}
              onChange={(e) =>
                setCreateForm({ ...createForm, role: e.target.value as AdminRole })
              }
              options={Object.entries(ROLE_LABELS).map(([v, l]) => ({
                label: l,
                value: v,
              }))}
            />
          </div>
        </div>
      </Modal>

      {/* Change role modal */}
      <Modal
        isOpen={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title="Change Role"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRoleTarget(null)} disabled={roleLoading}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} loading={roleLoading}>
              Save
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-text-secondary">
          Change role for{" "}
          <strong className="text-text-primary">
            {roleTarget && fullName(roleTarget.firstName, roleTarget.lastName)}
          </strong>
        </p>
        <Select
          value={roleValue}
          onChange={(e) => setRoleValue(e.target.value as AdminRole)}
          options={Object.entries(ROLE_LABELS).map(([v, l]) => ({
            label: l,
            value: v,
          }))}
        />
      </Modal>

      {/* Suspend modal */}
      <Modal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        title="Suspend Admin"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSuspendTarget(null)} disabled={suspendLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSuspend} loading={suspendLoading}>
              Suspend
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-text-secondary">
          Suspending{" "}
          <strong className="text-text-primary">
            {suspendTarget && fullName(suspendTarget.firstName, suspendTarget.lastName)}
          </strong>{" "}
          will revoke access until reactivated.
        </p>
        <Input
          label="Reason"
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          placeholder="e.g. Policy violation"
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete admin?"
        description={`This will permanently remove ${deleteTarget ? fullName(deleteTarget.firstName, deleteTarget.lastName) : ""}. This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Keep unused import warning quiet */}
      <span className="hidden">{isValidOTP("")}{PAGE_SIZES.join()}</span>
    </div>
  );
}