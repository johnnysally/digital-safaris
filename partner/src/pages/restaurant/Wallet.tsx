import { useEffect, useState, type FormEvent } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import walletApi from "../../api/restaurant/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Payout, Wallet } from "../../types";
import { formatCurrency as money } from "../../utils/formatCurrency";
import { formatLabel as label } from "../../utils/helpers";

const statusColor = (status: string) => ["accepted", "preparing", "ready", "confirmed"].includes(status) ? "!bg-[#f0f2e8] !text-[#6f7c43]" : ["delivered", "completed"].includes(status) ? "!bg-[#edf5e9] !text-[#4f7b4c]" : status === "out_for_delivery" ? "!bg-[#eaf2f8] !text-[#4a779e]" : ["cancelled", "rejected"].includes(status) ? "!bg-[#f9edeb] !text-[#a3574d]" : "";

export function RestaurantWalletPage() {
	const [wallet, setWallet] = useState<Wallet | null>(null);
	const [payouts, setPayouts] = useState<Payout[]>([]);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [reload, setReload] = useState(0);
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		Promise.all([walletApi.get(), walletApi.transactions({ limit: 100 })]).then(([balance, history]) => {
			if (!cancelled) { setWallet(balance); setPayouts(history.data); }
		}).catch((cause: unknown) => { if (!cancelled) setError(getApiErrorMessage(cause, "Could not load wallet details.")); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function savePreferences(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const method = String(form.get("payoutMethod") ?? "mpesa") as Wallet["payoutMethod"];
		const details = method === "mpesa"
			? { phone: String(form.get("phone") ?? "").trim() }
			: { bankName: String(form.get("bankName") ?? "").trim(), accountNumber: String(form.get("accountNumber") ?? "").trim(), accountName: String(form.get("accountName") ?? "").trim() };
		if (method === "mpesa" && !details.phone || method === "bank" && (!details.bankName || !details.accountNumber || !details.accountName)) {
			setError("Complete the payout account details for your selected method.");
			return;
		}
		setBusy(true);
		setError("");
		setMessage("");
		try {
			const updated = await walletApi.updatePayoutDetails({
				payoutMethod: method,
				payoutDetails: details,
				payoutFrequency: String(form.get("payoutFrequency") ?? "weekly") as Wallet["payoutFrequency"],
				minimumPayout: Number(form.get("minimumPayout")) || 0,
			});
			setWallet(updated);
			setMessage("Payout preferences saved.");
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not save payout preferences.")); }
		finally { setBusy(false); }
	}

	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Wallet & Payments</h1><span>Review your balance, payout preferences and history.</span></div><button className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>Refresh</button></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{error}</div>}{message && <div className="mb-[10px] flex items-center justify-start gap-[10px] rounded-md border border-[#dfe7d3] bg-[#f5f7f0] px-[11px] py-[9px] text-[9px] text-[#64753e] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:text-inherit" role="status">{message}</div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading wallet…</div> : wallet && <>
			<div className="grid grid-cols-3 gap-[9px] max-[680px]:grid-cols-1"><WalletCard label="Available balance" amount={wallet.balance} currency={wallet.currency} /><WalletCard label="Total earned" amount={wallet.totalEarned} currency={wallet.currency} /><WalletCard label="Pending payout" amount={wallet.pendingPayout} currency={wallet.currency} /></div>
			<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]"><div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><div><h2>Payout preferences</h2><span>Choose where and how often you receive payouts.</span></div></div>
				<form className="grid grid-cols-2 gap-[11px] [&>label]:grid [&>label]:gap-[5px] [&>label]:text-[9px] [&>label]:font-semibold [&>label]:text-[#64675e] [&_input]:w-full [&_input]:rounded-[5px] [&_input]:border [&_input]:border-[#e8e9e3] [&_input]:bg-white [&_input]:p-[9px_10px] [&_input]:text-[10px] [&_select]:w-full [&_select]:rounded-[5px] [&_select]:border [&_select]:border-[#e8e9e3] [&_select]:bg-white [&_select]:p-[9px_10px] [&_select]:text-[10px] max-[680px]:grid-cols-1" onSubmit={(event) => void savePreferences(event)} key={`${wallet.payoutMethod}-${wallet.payoutFrequency}`}>
					<label>Payout method<select name="payoutMethod" defaultValue={wallet.payoutMethod}><option value="mpesa">M-Pesa</option><option value="bank">Bank transfer</option></select></label>
					<label>M-Pesa number<input name="phone" type="tel" defaultValue={wallet.payoutDetails.phone ?? ""} /></label>
					<div className="grid grid-cols-2 gap-[11px] [&_label]:grid [&_label]:gap-[5px] [&_label]:text-[9px] [&_label]:font-semibold [&_label]:text-[#64675e] [&_input]:w-full [&_input]:rounded-[5px] [&_input]:border [&_input]:border-[#e8e9e3] [&_input]:bg-white [&_input]:p-[9px_10px] [&_input]:text-[10px] [&_select]:w-full [&_select]:rounded-[5px] [&_select]:border [&_select]:border-[#e8e9e3] [&_select]:bg-white [&_select]:p-[9px_10px] [&_select]:text-[10px] [&_textarea]:w-full [&_textarea]:rounded-[5px] [&_textarea]:border [&_textarea]:border-[#e8e9e3] [&_textarea]:bg-white [&_textarea]:p-[9px_10px] [&_textarea]:text-[10px] max-[680px]:grid-cols-1"><label>Bank name<input name="bankName" defaultValue={wallet.payoutDetails.bankName ?? ""} /></label><label>Account name<input name="accountName" defaultValue={wallet.payoutDetails.accountName ?? ""} /></label></div>
					<label>Account number<input name="accountNumber" defaultValue={wallet.payoutDetails.accountNumber ?? ""} /></label>
					<div className="grid grid-cols-2 gap-[11px] [&_label]:grid [&_label]:gap-[5px] [&_label]:text-[9px] [&_label]:font-semibold [&_label]:text-[#64675e] [&_input]:w-full [&_input]:rounded-[5px] [&_input]:border [&_input]:border-[#e8e9e3] [&_input]:bg-white [&_input]:p-[9px_10px] [&_input]:text-[10px] [&_select]:w-full [&_select]:rounded-[5px] [&_select]:border [&_select]:border-[#e8e9e3] [&_select]:bg-white [&_select]:p-[9px_10px] [&_select]:text-[10px] [&_textarea]:w-full [&_textarea]:rounded-[5px] [&_textarea]:border [&_textarea]:border-[#e8e9e3] [&_textarea]:bg-white [&_textarea]:p-[9px_10px] [&_textarea]:text-[10px] max-[680px]:grid-cols-1"><label>Payout frequency<select name="payoutFrequency" defaultValue={wallet.payoutFrequency}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option></select></label><label>Minimum payout ({wallet.currency})<input name="minimumPayout" type="number" min="0" defaultValue={wallet.minimumPayout} /></label></div>
					<button type="submit" className="justify-self-start rounded-[5px] bg-[#707e48] px-[13px] py-[9px] text-[10px] font-semibold text-white disabled:opacity-60" disabled={busy}>{busy ? "Saving…" : "Save preferences"}</button>
				</form>
			</section>
			<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]"><div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><h2>Payout history</h2><span>{payouts.length} records</span></div><div className="grid">{payouts.map((payout) => <article className="flex min-w-0 items-center gap-3 border-b border-[#f0f0ed] py-[10px] px-[2px] last:border-0 max-[480px]:gap-2 max-[480px]:[&_button]:p-[5px] max-[480px]:[&_button]:text-[8px] [&>button]:rounded-[5px] [&>button]:border [&>button]:border-[#e8eadf] [&>button]:bg-[#fafbf7] [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[9px] [&>button]:font-semibold [&>button]:text-[#657246] [&>button]:disabled:opacity-50 [&>button]:disabled:cursor-wait [&>b]:text-[10px] [&>b]:text-[#464b39]" key={payout._id}><div className="grid size-10 shrink-0 place-items-center rounded-[7px] bg-[#f0f2e9] text-[#76814d]"><WalletIcon size={17} /></div><div className="grid min-w-0 flex-1 gap-1 [&_strong]:truncate [&_strong]:text-[10px] [&_strong]:text-[#393c34] [&>span]:truncate [&>span]:text-[9px] [&>span]:text-[#85877f] [&_small]:truncate [&_small]:text-[9px] [&_small]:text-[#85877f]"><strong>{payout.reference}</strong><span>{payout.method.toUpperCase()} · {new Date(payout.createdAt).toLocaleDateString()}</span><small>{payout.failureReason || label(payout.status)}</small></div><span className={`inline-flex min-h-[18px] items-center rounded-full bg-[#fbf3e2] px-[6px] py-[2px] text-[7px] font-semibold text-[#9a742a] ${statusColor(payout.status)}`}>{label(payout.status)}</span><b>{money(payout.amount, wallet.currency)}</b></article>)}{!payouts.length && <div className="px-[14px] py-[22px] text-center text-[10px] text-[#898b82]">Payout history will appear here.</div>}</div></section>
		</>}
	</div>;
}

function WalletCard({ label: title, amount, currency }: { label: string; amount: number; currency: string }) {
	return <article className="grid gap-[9px] rounded-[7px] border border-[#ecece7] bg-white p-[13px] [&_small]:text-[9px] [&_small]:text-[#83857b] [&_strong]:text-[19px] [&_strong]:text-[#383c32]"><small>{title}</small><strong>{money(amount, currency)}</strong></article>;
}
