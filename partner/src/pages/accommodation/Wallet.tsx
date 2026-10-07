import { useEffect, useState } from "react";
import walletApi from "../../api/accommodation/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Payout, Wallet } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, KpiCard, PageHeader, StatusBadge } from "../../components/layout/Layout";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function PaymentsPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadWallet() {
      setLoading(true);
      setError("");
      try {
        const [walletData, payoutData] = await Promise.all([walletApi.get(), walletApi.transactions({ limit: 100 })]);
        if (!cancelled) {
          setWallet(walletData);
          setTransactions(payoutData.data);
        }
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load wallet and payout history."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadWallet();
    return () => { cancelled = true; };
  }, [reload]);

  const currency = wallet?.currency ?? "KES";
  const lastPayout = transactions.find((payout) => payout.status === "completed");

  return (
    <AccommodationPartnerLayout>
      <div className="page-shell">
        <PageHeader title="Payments & Payouts" subtitle="Track your earnings and transaction history." />

        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="stats-grid payments-grid">
          <KpiCard label="Total Earnings" value={formatMoney(wallet?.totalEarned ?? 0, currency)} change="Lifetime partner earnings" />
          <KpiCard label="Pending Payouts" value={formatMoney(wallet?.pendingPayout ?? 0, currency)} change="Awaiting processing" />
          <KpiCard label="Last Payout" value={lastPayout ? formatMoney(lastPayout.amount, currency) : formatMoney(0, currency)} change={lastPayout?.processedAt ? new Date(lastPayout.processedAt).toLocaleDateString() : "No completed payout yet"} />
        </div>

        <div className="card section-card">
          <div className="card-header-row">
            <div>
                <p className="eyebrow">Wallet activity</p>
                <h3>Payout history</h3>
            </div>
            <button type="button" className="secondary-button small-button" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((entry) => (
                  <tr key={entry._id}>
                    <td>{new Date(entry.processedAt ?? entry.createdAt).toLocaleDateString()}</td>
                    <td>{entry.reference}</td>
                    <td>{entry.method.toUpperCase()}</td>
                    <td>{formatMoney(entry.amount, currency)}</td>
                    <td><StatusBadge status={entry.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && transactions.length === 0 ? <div className="rooms-empty-state"><strong>No payouts yet</strong><span>Completed and pending payouts will appear here.</span></div> : null}
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
