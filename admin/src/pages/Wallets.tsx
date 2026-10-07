import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Tabs from "../components/ui/Tabs";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { walletApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type {
  Wallet,
  WalletTransaction,
  PartnerType,
  PaginationMeta,
} from "../types";

type PartnerTab = "restaurant" | "transport" | "accommodation";

const TABS: { key: PartnerTab; label: string }[] = [
  { key: "restaurant", label: "Restaurants" },
  { key: "transport", label: "Transport" },
  { key: "accommodation", label: "Accommodation" },
];

function transactionVariant(type: WalletTransaction["type"]) {
  switch (type) {
    case "credit":
      return "success" as const;
    case "debit":
      return "danger" as const;
    case "commission":
      return "info" as const;
    case "payout":
      return "secondary" as const;
    case "refund":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default function Wallets() {
  const { type, id } = useParams<{ type?: string; id?: string }>();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const isDetail = Boolean(type && id);

  return isDetail ? (
    <WalletDetail
      type={type as PartnerType}
      id={id as string}
      onBack={() => navigate("/wallets")}
      onError={() => toastError("Could not load wallet")}
    />
  ) : (
    <WalletList />
  );
}

/* -------------------------------------------------------------------------- */
/* List                                                                        */
/* -------------------------------------------------------------------------- */

function WalletList() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [tab, setTab] = useState<PartnerTab>("restaurant");
  const [rows, setRows] = useState<Wallet[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await walletApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        type: tab,
        search: search || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load wallets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const columns = useMemo<Column<Wallet>[]>(
    () => [
      {
        key: "partnerName",
        header: "Partner",
        render: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/wallets/${row.partnerType}/${row.partnerId}`)}
            className="text-left"
          >
            <p className="text-sm font-medium text-text-primary hover:text-secondary-600">
              {row.partnerName}
            </p>
            <p className="text-xs text-text-muted">{capitalize(row.partnerType)}</p>
          </button>
        ),
      },
      {
        key: "balance",
        header: "Balance",
        render: (row) => (
          <span className="text-sm font-medium text-text-primary">
            {formatCurrency(row.balance, row.currency)}
          </span>
        ),
      },
      {
        key: "totalEarned",
        header: "Total earned",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {formatCurrency(row.totalEarned, row.currency)}
          </span>
        ),
      },
      {
        key: "commissionOwed",
        header: "Commission owed",
        render: (row) => (
          <span className="text-sm text-danger">
            {formatCurrency(row.commissionOwed, row.currency)}
          </span>
        ),
      },
      {
        key: "lastPayoutAt",
        header: "Last payout",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {row.lastPayoutAt ? formatDateTime(row.lastPayoutAt) : "—"}
          </span>
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
              onClick={() =>
                navigate(`/wallets/${row.partnerType}/${row.partnerId}`)
              }
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
        <h1 className="text-2xl font-semibold text-text-primary">Wallets</h1>
        <p className="mt-1 text-sm text-text-muted">
          Partner balances and commission owed
        </p>
      </div>

      <Tabs
        tabs={TABS}
        activeKey={tab}
        onChange={(k) => {
          setTab(k as PartnerTab);
          setPage(1);
        }}
      />

      <Card padded={false}>
        <form
          onSubmit={handleSearch}
          className="flex gap-2 border-b border-border p-4"
        >
          <div className="flex-1">
            <Input
              placeholder="Search partner…"
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                      */
/* -------------------------------------------------------------------------- */

interface DetailProps {
  type: PartnerType;
  id: string;
  onBack: () => void;
  onError: () => void;
}

function WalletDetail({ type, id, onBack, onError }: DetailProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(true);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const data = await walletApi.details(type, id);
      setWallet(data);
    } catch {
      onError();
    } finally {
      setLoading(false);
    }
  };

  const fetchTxns = async () => {
    setTxnLoading(true);
    try {
      const res = await walletApi.transactions(type, id, {
        page,
        limit: DEFAULT_PAGE_SIZE,
      });
      setTxns(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      /* keep empty */
    } finally {
      setTxnLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  useEffect(() => {
    fetchTxns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id, page]);

  const txnColumns = useMemo<Column<WalletTransaction>[]>(
    () => [
      {
        key: "type",
        header: "Type",
        render: (row) => (
          <Badge variant={transactionVariant(row.type)}>
            {capitalize(row.type)}
          </Badge>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        render: (row) => (
          <span
            className={
              row.type === "credit" || row.type === "commission"
                ? "text-sm font-medium text-success"
                : "text-sm font-medium text-danger"
            }
          >
            {row.type === "credit" || row.type === "commission" ? "+" : "−"}
            {formatCurrency(row.amount, row.currency)}
          </span>
        ),
      },
      {
        key: "balanceAfter",
        header: "Balance after",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {formatCurrency(row.balanceAfter, row.currency)}
          </span>
        ),
      },
      {
        key: "description",
        header: "Description",
        render: (row) => (
          <span className="text-sm text-text-primary">
            {row.description ?? row.reference ?? "—"}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Date",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {formatDateTime(row.createdAt)}
          </span>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <EmptyState
        title="Wallet not found"
        description="The partner wallet may have been removed."
        action={
          <Button variant="ghost" onClick={onBack}>
            Back to wallets
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {wallet.partnerName}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {capitalize(wallet.partnerType)} wallet
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="Balance"
          value={formatCurrency(wallet.balance, wallet.currency)}
          accent="text-secondary-600"
        />
        <StatTile
          label="Total earned"
          value={formatCurrency(wallet.totalEarned, wallet.currency)}
        />
        <StatTile
          label="Commission owed"
          value={formatCurrency(wallet.commissionOwed, wallet.currency)}
          accent="text-danger"
        />
        <StatTile
          label="Last payout"
          value={
            wallet.lastPayoutAt ? formatDateTime(wallet.lastPayoutAt) : "Never"
          }
        />
      </div>

      <Card title="Transactions" padded={false}>
        <Table
          columns={txnColumns}
          data={txns}
          loading={txnLoading}
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
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}