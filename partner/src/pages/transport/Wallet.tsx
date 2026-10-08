import { useEffect, useState } from "react";
import { ArrowDownToLine, CreditCard, Wallet } from "lucide-react";
import walletApi from "../../api/transport/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Payout, Wallet as PartnerWallet } from "../../types";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";
import { formatCurrency as formatMoney } from "../../utils/formatCurrency";

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

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Payments & Payouts" subtitle="Track transport earnings and payout activity." action={<button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" type="button" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		<div className="mb-[14px] grid grid-cols-3 gap-3 max-[760px]:grid-cols-1 [&>article]:flex [&>article]:flex-col [&>article]:gap-[7px] [&>article]:p-[14px] [&>article>span]:grid [&>article>span]:h-[34px] [&>article>span]:w-[34px] [&>article>span]:place-items-center [&>article>span]:rounded-full [&>article>span]:bg-[#faecd5] [&>article>span]:text-[#925719] [&_small]:text-[.74rem] [&_small]:text-[var(--text-soft)] [&_em]:text-[.74rem] [&_em]:not-italic [&_em]:text-[var(--text-soft)] [&_strong]:font-[Cormorant_Garamond,Georgia,serif] [&_strong]:text-[1.6rem]"><article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><span><Wallet size={18} /></span><small>Total Earnings</small><strong>{formatMoney(wallet?.totalEarned ?? 0, currency)}</strong><em>Lifetime transport earnings</em></article><article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><span><CreditCard size={18} /></span><small>Pending Payout</small><strong>{formatMoney(wallet?.pendingPayout ?? 0, currency)}</strong><em>Awaiting processing</em></article><article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><span><ArrowDownToLine size={18} /></span><small>Available Balance</small><strong>{formatMoney(wallet?.balance ?? 0, currency)}</strong><em>{wallet?.payoutFrequency ?? "Schedule not set"}</em></article></div>
		<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] overflow-hidden"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Payout History</h2></div><div className="w-full overflow-x-auto"><table className="w-full min-w-[850px] border-collapse [&_th]:bg-[rgba(247,241,232,.65)] [&_th]:text-[.63rem] [&_th]:font-semibold [&_th]:text-[#302a24] [&_td]:text-[#514940] [&_th]:text-left [&_td]:text-left [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_th]:border-b [&_td]:border-b [&_th]:border-[rgba(130,110,92,.09)] [&_td]:border-[rgba(130,110,92,.09)] [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-3 [&_td]:py-3 [&_th]:text-[.69rem] [&_td]:text-[.69rem] [&_td_small]:mt-[3px] [&_td_small]:block [&_td_small]:text-[.48rem] [&_td_small]:text-[#91887e]"><thead><tr><th>Date</th><th>Reference</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payouts.map((payout) => <tr key={payout._id}><td>{new Date(payout.processedAt ?? payout.createdAt).toLocaleDateString()}</td><td>{payout.reference}</td><td>{payout.method.toUpperCase()}</td><td>{formatMoney(payout.amount, currency)}</td><td><StatusBadge status={payout.status} /></td></tr>)}</tbody></table>{!loading && payouts.length === 0 ? <div className="p-[18px] text-center text-[.78rem] text-[var(--text-muted)]">No payouts have been recorded yet.</div> : null}</div></section>
	</div></TransportLayout>;
}
