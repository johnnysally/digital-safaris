import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Drawer from "../components/ui/Drawer";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import { paymentApi, walletApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE, PAYMENT_METHOD_LABELS } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type { CustomerPayment, PaginationMeta } from "../types";

type Variant = "success" | "warning" | "danger" | "neutral";

function statusVariant(status: string): Variant {
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

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

export default function Payment() {
  const { error: toastError, success: toastSuccess } = useToast();

  const [rows, setRows] = useState<CustomerPayment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<CustomerPayment | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [retryOpen, setRetryOpen] = useState(false);
  const [retryPhone, setRetryPhone] = useState("");
  const [retryLoading, setRetryLoading] = useState(false);
  const [editPhone, setEditPhone] = useState(false);

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<{ stop: boolean; attempts: number }>({
    stop: false,
    attempts: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
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

  useEffect(() => {
    const handler = () => {
      fetchData();
    };
    window.addEventListener("payment:updated", handler);
    return () => window.removeEventListener("payment:updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, method]);

  useEffect(() => {
    const handler = () => {
      if (!document.hidden) fetchData();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, method]);

  useEffect(() => {
    return () => {
      pollRef.current.stop = true;
    };
  }, []);

  const openDetails = async (id: string) => {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    setEditPhone(false);
    try {
      const data = await paymentApi.details(id);
      setDetails(data);
      const phone =
        (data as { meta?: { phone?: string } }).meta?.phone || "";
      setRetryPhone(phone);
    } catch {
      toastError("Could not load payment");
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const applyUpdated = (updated: CustomerPayment) => {
    setDetails(updated);
    setRows((prev) =>
      prev.map((r) =>
        r._id === updated._id
          ? { ...r, status: updated.status, failureReason: updated.failureReason }
          : r
      )
    );
    window.dispatchEvent(
      new CustomEvent("payment:updated", {
        detail: {
          id: updated._id,
          reference: updated.reference,
          status: updated.status,
          purpose: updated.purpose,
        },
      })
    );
  };

  const creditWalletIfTopup = async (p: CustomerPayment) => {
    if (p.status === "success" && p.purpose === "topup") {
      try {
        await walletApi.confirmTopUp({ reference: p.reference });
      } catch {
        /* silent */
      }
    }
  };

  const stopPolling = () => {
    pollRef.current.stop = true;
    setPolling(false);
  };

  const startPolling = (id: string) => {
    pollRef.current = { stop: false, attempts: 0 };
    setPolling(true);

    const tick = async () => {
      if (pollRef.current.stop) return;

      pollRef.current.attempts += 1;

      try {
        const updated = await paymentApi.confirm(id);
        applyUpdated(updated);
        await creditWalletIfTopup(updated);

        if (updated.status === "success") {
          toastSuccess("Payment received");
          stopPolling();
          return;
        }
        if (updated.status === "failed") {
          toastError(
            "Payment failed",
            updated.failureReason || "Try again if needed."
          );
          stopPolling();
          return;
        }
      } catch {
        /* keep polling */
      }

      if (pollRef.current.attempts >= POLL_MAX_ATTEMPTS) {
        toastError("Still pending", "If you entered your PIN, try again soon.");
        stopPolling();
        return;
      }

      setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();
  };

  const handleRetry = async () => {
    if (!details) return;
    setRetryLoading(true);
    try {
      const phoneChanged =
        editPhone &&
        retryPhone.trim() &&
        retryPhone.trim() !==
          ((details as { meta?: { phone?: string } }).meta?.phone || "");

      const payload = phoneChanged ? { phone: retryPhone.trim() } : {};

      const res = await paymentApi.retry(details._id, payload);
      toastSuccess("STK sent", "Enter your M-Pesa PIN on your phone.");

      const updatedDetails = {
        ...details,
        reference: res.reference,
        status: "pending",
      } as CustomerPayment;
      applyUpdated(updatedDetails);
      setRetryOpen(false);
      setEditPhone(false);

      startPolling(details._id);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not resend STK";
      toastError("Retry failed", msg);
    } finally {
      setRetryLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!details) return;
    setConfirmLoading(true);
    try {
      const updated = await paymentApi.confirm(details._id);
      applyUpdated(updated);
      await creditWalletIfTopup(updated);

      if (updated.status === "success") {
        toastSuccess("Payment received");
      } else if (updated.status === "failed") {
        toastError("Payment failed", updated.failureReason || "Try again");
      } else {
        toastError(
          "Still pending",
          "If you entered your PIN, try again in a moment."
        );
        startPolling(details._id);
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not check status";
      toastError("Check failed", msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns = useMemo<Column<CustomerPayment>[]>(
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
        key: "purpose",
        header: "Type",
        render: (row) => (
          <Badge variant="neutral">
            {capitalize(String(row.purpose).replace(/_/g, " "))}
          </Badge>
        ),
      },
      {
        key: "method",
        header: "Method",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {PAYMENT_METHOD_LABELS[row.method] ?? row.method}
          </span>
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
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Payments</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your payment history on Digital Safaris.
        </p>
      </div>

      <Card padded={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchData();
          }}
          className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
        >
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
              { label: "Card", value: "stripe" },
              { label: "Wallet", value: "wallet" },
            ]}
          />
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" variant="secondary" fullWidth>
              Filter
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStatus("");
                setMethod("");
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

      <Drawer
        isOpen={!!detailsId}
        onClose={() => {
          stopPolling();
          setDetailsId(null);
        }}
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
              <Badge variant={statusVariant(details.status)}>
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
                <dt className="text-xs text-text-muted">Type</dt>
                <dd className="text-text-primary">
                  {capitalize(String(details.purpose).replace(/_/g, " "))}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-text-muted">Date</dt>
                <dd className="text-text-primary">
                  {formatDateTime(details.createdAt)}
                </dd>
              </div>
              {(details as { meta?: { phone?: string } }).meta?.phone && (
                <div className="col-span-2">
                  <dt className="text-xs text-text-muted">Phone</dt>
                  <dd className="font-mono text-xs text-text-primary">
                    {(details as { meta?: { phone?: string } }).meta?.phone}
                  </dd>
                </div>
              )}
              {details.receiptNumber && (
                <div className="col-span-2">
                  <dt className="text-xs text-text-muted">Receipt</dt>
                  <dd className="font-mono text-xs text-text-primary">
                    {details.receiptNumber}
                  </dd>
                </div>
              )}
              {details.failureReason && (
                <div className="col-span-2">
                  <dt className="text-xs text-text-muted">Failure reason</dt>
                  <dd className="text-danger">{details.failureReason}</dd>
                </div>
              )}
            </dl>

            {polling && (
              <Alert variant="info" title="Waiting for M-Pesa…">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Checking every 3 seconds. Do not close this panel.</span>
                </div>
              </Alert>
            )}

            {details.status === "pending" && details.method === "mpesa" && (
              <div className="space-y-3 rounded-md border border-secondary-500/30 bg-secondary-50/60 p-3">
                <p className="text-xs text-text-secondary">
                  This payment is still pending. Re-send the M-Pesa prompt or
                  check status if you already paid.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={polling}
                    onClick={() => setRetryOpen(true)}
                  >
                    Resend STK
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={confirmLoading}
                    disabled={polling}
                    onClick={handleConfirm}
                  >
                    I've paid — check status
                  </Button>
                </div>
              </div>
            )}

            {details.status === "failed" && details.method === "mpesa" && (
              <div className="space-y-3 rounded-md border border-danger/30 bg-danger/5 p-3">
                <p className="text-xs text-text-secondary">
                  This payment failed. You can try again with a fresh STK.
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={polling}
                  onClick={() => setRetryOpen(true)}
                >
                  Try again
                </Button>
              </div>
            )}

            {details.status === "pending" && details.method !== "mpesa" && (
              <p className="text-xs text-text-muted">
                This payment type cannot be retried from here.
              </p>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={retryOpen}
        onClose={() => {
          setRetryOpen(false);
          setEditPhone(false);
        }}
        title="Send M-Pesa prompt"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setRetryOpen(false);
                setEditPhone(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRetry} loading={retryLoading}>
              Send STK
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            We'll send the M-Pesa prompt to this number.
          </p>

          {!editPhone ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-alt px-3 py-2.5">
              <span className="font-mono text-sm text-text-primary">
                {retryPhone || "—"}
              </span>
              <button
                type="button"
                onClick={() => setEditPhone(true)}
                className="text-xs font-medium text-secondary-600 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <Input
              label="M-Pesa phone"
              type="tel"
              placeholder="254712345678"
              value={retryPhone}
              onChange={(e) => setRetryPhone(e.target.value)}
              helper="Format 254712345678 or 0712345678"
              autoFocus
            />
          )}
        </div>
      </Modal>
    </div>
  );
}