import { useEffect, useMemo, useState } from "react";
import { Radio, Plus, Clock, Wallet, Utensils } from "lucide-react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Drawer from "../components/ui/Drawer";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { broadcastApi, searchApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateTime, formatRelative } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type {
  BroadcastRequest,
  Location,
  PaginationMeta,
} from "../types";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

function statusVariant(status: string): Variant {
  switch (status) {
    case "accepted":
      return "success";
    case "broadcasting":
      return "info";
    case "cancelled":
      return "danger";
    case "expired":
      return "neutral";
    default:
      return "neutral";
  }
}

export default function Broadcast() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [rows, setRows] = useState<BroadcastRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<BroadcastRequest | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    foodType: "",
    preparation: "",
    timeNeeded: "",
    budget: 500,
    address: "",
    town: "",
    locationId: "",
    notes: "",
  });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    searchApi
      .locations({ limit: 100 })
      .then(setLocations)
      .catch(() => {
        /* optional */
      });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await broadcastApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load broadcasts.");
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
      const data = await broadcastApi.details(id);
      setDetails(data);
    } catch {
      toastError("Could not load broadcast");
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const submit = async () => {
    if (!form.foodType.trim()) {
      toastError("Missing food type");
      return;
    }
    if (!form.preparation.trim()) {
      toastError("Missing preparation notes");
      return;
    }
    if (!form.timeNeeded) {
      toastError("Choose when you need it");
      return;
    }
    if (!form.town.trim()) {
      toastError("Town is required");
      return;
    }
    if (!form.locationId) {
      toastError("Pick a location");
      return;
    }
    if (!form.address.trim()) {
      toastError("Address is required");
      return;
    }

    setCreateLoading(true);
    try {
      await broadcastApi.create({
        foodType: form.foodType.trim(),
        preparation: form.preparation.trim(),
        timeNeeded: form.timeNeeded,
        budget: Number(form.budget),
        deliveryAddress: {
          address: form.address.trim(),
          town: form.town.trim(),
          latitude: -1.286389,
          longitude: 36.817223,
        },
        locationId: form.locationId,
        notes: form.notes.trim() || undefined,
      });
      toastSuccess("Broadcast sent", "Restaurants nearby will respond.");
      setCreateOpen(false);
      setForm({
        foodType: "",
        preparation: "",
        timeNeeded: "",
        budget: 500,
        address: "",
        town: "",
        locationId: "",
        notes: "",
      });
      fetchData();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not send broadcast";
      toastError("Failed", msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!details) return;
    setCancelLoading(true);
    try {
      const updated = await broadcastApi.cancel(details._id);
      setDetails(updated);
      setRows((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      toastSuccess("Broadcast cancelled");
      setCancelOpen(false);
    } catch {
      toastError("Could not cancel broadcast");
    } finally {
      setCancelLoading(false);
    }
  };

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({
        label: l.county ? `${l.name} · ${l.county}` : l.name,
        value: l._id,
      })),
    [locations]
  );

  const columns = useMemo<Column<BroadcastRequest>[]>(
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
              {formatRelative(row.createdAt)}
            </p>
          </button>
        ),
      },
      {
        key: "foodType",
        header: "Request",
        render: (row) => (
          <span className="text-sm text-text-primary">{row.foodType}</span>
        ),
      },
      {
        key: "budget",
        header: "Budget",
        render: (row) => (
          <span className="text-sm font-medium text-text-primary">
            {formatCurrency(row.budget, row.currency)}
          </span>
        ),
      },
      {
        key: "timeNeeded",
        header: "Time needed",
        render: (row) => (
          <span className="text-xs text-text-secondary">
            {formatDateTime(row.timeNeeded)}
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Broadcasts
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Post a food request and let nearby restaurants respond.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
        >
          New request
        </Button>
      </div>

      <Card padded={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchData();
          }}
          className="flex flex-wrap gap-3 border-b border-border p-4"
        >
          <div className="min-w-[200px] flex-1">
            <Select
              placeholder="All statuses"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { label: "Broadcasting", value: "broadcasting" },
                { label: "Accepted", value: "accepted" },
                { label: "Expired", value: "expired" },
                { label: "Cancelled", value: "cancelled" },
              ]}
            />
          </div>
          <Button type="submit" variant="secondary">
            Filter
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

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New broadcast request"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={createLoading}>
              Send request
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="What do you want?"
            leftIcon={<Utensils className="h-4 w-4" />}
            value={form.foodType}
            onChange={(e) => setForm({ ...form, foodType: e.target.value })}
            placeholder="e.g. Nyama Choma with Ugali"
          />
          <Textarea
            label="How to prepare it"
            rows={2}
            value={form.preparation}
            onChange={(e) => setForm({ ...form, preparation: e.target.value })}
            placeholder="e.g. well-done, no chili, extra kachumbari"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="When do you need it?"
              type="datetime-local"
              leftIcon={<Clock className="h-4 w-4" />}
              value={form.timeNeeded}
              onChange={(e) =>
                setForm({ ...form, timeNeeded: e.target.value })
              }
            />
            <Input
              label="Budget (KES)"
              type="number"
              min={50}
              leftIcon={<Wallet className="h-4 w-4" />}
              value={form.budget}
              onChange={(e) =>
                setForm({ ...form, budget: Number(e.target.value) || 0 })
              }
            />
          </div>
          <Select
            label="Location"
            placeholder="Choose a town"
            value={form.locationId}
            onChange={(e) => {
              const id = e.target.value;
              const loc = locations.find((l) => l._id === id);
              setForm({
                ...form,
                locationId: id,
                town: loc?.name || "",
              });
            }}
            options={locationOptions}
          />
          <Input
            label="Delivery address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g. The Savannah Lodge, Room 4"
          />
          <Textarea
            label="Notes (optional)"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Anything else restaurants should know"
          />
        </div>
      </Modal>

      <Drawer
        isOpen={!!detailsId}
        onClose={() => setDetailsId(null)}
        title="Broadcast details"
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
              <Badge variant={statusVariant(details.status)}>
                {capitalize(details.status)}
              </Badge>
            </div>

            <div className="rounded-md border border-border bg-surface-alt p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Budget
              </p>
              <p className="mt-1 text-2xl font-semibold text-secondary-600">
                {formatCurrency(details.budget, details.currency)}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-muted">Food</p>
                <p className="text-text-primary">{details.foodType}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Preparation</p>
                <p className="text-text-primary">{details.preparation}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Time needed</p>
                <p className="text-text-primary">
                  {formatDateTime(details.timeNeeded)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Delivery</p>
                <p className="text-text-primary">
                  {details.deliveryAddress?.address},{" "}
                  {details.deliveryAddress?.town}
                </p>
              </div>
              {details.acceptedByName && (
                <div>
                  <p className="text-xs text-text-muted">Accepted by</p>
                  <p className="text-text-primary">
                    {details.acceptedByName}
                  </p>
                </div>
              )}
            </div>

            {details.status === "broadcasting" && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => setCancelOpen(true)}
              >
                Cancel broadcast
              </Button>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel broadcast?"
        description="Restaurants will no longer see this request."
        confirmText="Cancel"
        variant="danger"
        loading={cancelLoading}
      />
    </div>
  );
}