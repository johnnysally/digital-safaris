import { useEffect, useState } from "react";
import walletApi from "../../api/accommodation/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Payout, Wallet } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, KpiCard, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { formatCurrency as formatMoney } from "../../utils/formatCurrency";

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
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="Payments & Payouts" subtitle="Track your earnings and transaction history." />

        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="mb-[26px] grid grid-cols-3 gap-[18px]">
          <KpiCard label="Total Earnings" value={formatMoney(wallet?.totalEarned ?? 0, currency)} change="Lifetime partner earnings" />
          <KpiCard label="Pending Payouts" value={formatMoney(wallet?.pendingPayout ?? 0, currency)} change="Awaiting processing" />
          <KpiCard label="Last Payout" value={lastPayout ? formatMoney(lastPayout.amount, currency) : formatMoney(0, currency)} change={lastPayout?.processedAt ? new Date(lastPayout.processedAt).toLocaleDateString() : "No completed payout yet"} />
        </div>

        <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] p-[18px_20px_10px]">
          <div className="mb-[18px] flex items-center justify-between gap-3.5">
            <div>
                <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">Wallet activity</p>
                <h3>Payout history</h3>
            </div>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)] px-[0.9rem] py-[0.7rem] text-[0.82rem]" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh</button>
          </div>

          <div className="w-full overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-[0.8rem] [&_th]:py-[0.9rem] [&_th]:text-left [&_th]:text-[0.76rem] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-[0.8rem] [&_td]:py-[0.9rem] [&_td]:text-left [&_td]:text-[var(--text)]">
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
            {!loading && transactions.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]"><strong>No payouts yet</strong><span>Completed and pending payouts will appear here.</span></div> : null}
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
