import { useEffect, useState } from "react";
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import { walletApi, paymentApi } from "../api";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateTime } from "../utils/formatDate";
import type { CustomerWallet, CustomerPayment } from "../types";

export default function Wallet() {
  const { customer } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [transactions, setTransactions] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, t] = await Promise.all([
        walletApi.get(),
        paymentApi.list({ page: 1, limit: 20 }),
      ]);
      setWallet(w);
      setTransactions(t.data ?? []);
    } catch {
      setError("Could not load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopUp = async () => {
    const value = Number(amount);
    if (!value || value < 1) {
      toastError("Invalid amount", "Enter at least KSh 1.");
      return;
    }
    if (!phone || phone.length < 9) {
      toastError("Invalid phone", "Enter a valid M-Pesa number.");
      return;
    }

    setTopUpLoading(true);
    try {
      const res = await walletApi.topUp({ amount: value, phone });
      setPendingReference(res.reference);
      toastSuccess("STK sent", "Enter your M-Pesa PIN on your phone.");
      setTopUpOpen(false);
    } catch {
      toastError("Top-up failed", "Check your number and try again.");
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingReference) return;
    setConfirmLoading(true);
    try {
      const res = await walletApi.confirmTopUp({ reference: pendingReference });
      toastSuccess("Wallet topped up", `New balance: KSh ${res.balance}`);
      setPendingReference(null);
      load();
    } catch {
      toastError("Not yet received", "If you entered your PIN, try again shortly.");
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Wallet</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your balance and top up via M-Pesa.
        </p>
      </div>

      {error && (
        <Alert variant="danger" title="Failed to load">
          {error}
        </Alert>
      )}

      {pendingReference && (
        <Alert variant="info" title="Awaiting M-Pesa confirmation">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Ref <span className="font-mono">{pendingReference}</span>. Enter
              your PIN, then confirm.
            </span>
            <Button size="sm" loading={confirmLoading} onClick={handleConfirm}>
              I've paid
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
              <WalletIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Available balance
              </p>
              <p className="text-2xl font-semibold text-text-primary">
                {formatCurrency(wallet?.balance ?? 0, wallet?.currency || "KES")}
              </p>
            </div>
          </div>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setTopUpOpen(true)}
          >
            Top up
          </Button>
        </div>
      </Card>

      <Card title="Recent transactions" padded={false}>
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Top up your wallet to see activity here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => {
              const isCredit =
                t.method === "wallet" || t.purpose === "topup";
              return (
                <li
                  key={t._id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={
                        "flex h-9 w-9 items-center justify-center rounded-full " +
                        (isCredit
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger")
                      }
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {t.purpose === "topup"
                          ? "M-Pesa top up"
                          : t.purpose === "booking"
                            ? "Accommodation booking"
                            : t.purpose === "food_order"
                              ? "Food order"
                              : t.purpose === "transport"
                                ? "Transport trip"
                                : "Payment"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatDateTime(t.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        t.status === "success"
                          ? "success"
                          : t.status === "pending"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {t.status}
                    </Badge>
                    <span className="text-sm font-medium text-text-primary">
                      {isCredit ? "+" : "−"}
                      {formatCurrency(t.amount, t.currency)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        title="Top up wallet"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTopUpOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTopUp} loading={topUpLoading}>
              {topUpLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending
                </>
              ) : (
                "Send STK"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Amount (KES)"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="M-Pesa phone"
            type="tel"
            placeholder="254712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            helper="Format 254712345678 or 0712345678"
          />
        </div>
      </Modal>
    </div>
  );
}