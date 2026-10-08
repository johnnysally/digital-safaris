import { useEffect, useState } from "react";
import { ArrowDownToLine, CreditCard, Wallet } from "lucide-react";
import walletApi from "../../api/transport/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Payout, Wallet as PartnerWallet } from "../../types";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";

function formatMoney(amount: number, currency: string) {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount); }
	catch { return `${currency} ${amount.toLocaleString()}`; }
}

export function TransportPaymentsPage() {
	const [wallet, setWallet] = useState<PartnerWallet | null>(null);
	const [payouts, setPayouts] = useState<Payout[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function loadWallet() {
			setLoading(true);
			setError("");
			try {
				const [walletResult, payoutResult] = await Promise.all([walletApi.get(), walletApi.transactions({ limit: 100 })]);
				if (!cancelled) { setWallet(walletResult); setPayouts(payoutResult.data); }
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load transport wallet."));
			} finally { if (!cancelled) setLoading(false); }
		}
		void loadWallet();
		return () => { cancelled = true; };
	}, [reload]);

	const currency = wallet?.currency ?? "KES";

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Payments & Payouts" subtitle="Track transport earnings and payout activity." action={<button className="secondary-button small-button" type="button" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		<div className="transport-money-grid"><article className="transport-panel"><span><Wallet size={18} /></span><small>Total Earnings</small><strong>{formatMoney(wallet?.totalEarned ?? 0, currency)}</strong><em>Lifetime transport earnings</em></article><article className="transport-panel"><span><CreditCard size={18} /></span><small>Pending Payout</small><strong>{formatMoney(wallet?.pendingPayout ?? 0, currency)}</strong><em>Awaiting processing</em></article><article className="transport-panel"><span><ArrowDownToLine size={18} /></span><small>Available Balance</small><strong>{formatMoney(wallet?.balance ?? 0, currency)}</strong><em>{wallet?.payoutFrequency ?? "Schedule not set"}</em></article></div>
		<section className="transport-panel transport-table-panel"><div className="transport-panel-heading"><h2>Payout History</h2></div><div className="transport-table-scroll"><table className="transport-data-table"><thead><tr><th>Date</th><th>Reference</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payouts.map((payout) => <tr key={payout._id}><td>{new Date(payout.processedAt ?? payout.createdAt).toLocaleDateString()}</td><td>{payout.reference}</td><td>{payout.method.toUpperCase()}</td><td>{formatMoney(payout.amount, currency)}</td><td><StatusBadge status={payout.status} /></td></tr>)}</tbody></table>{!loading && payouts.length === 0 ? <div className="transport-empty">No payouts have been recorded yet.</div> : null}</div></section>
	</div></TransportLayout>;
}
