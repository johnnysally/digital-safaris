import { useEffect, useState, type FormEvent } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import walletApi from "../../api/restaurant/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Payout, Wallet } from "../../types";

const money = (amount: number, currency: string) => {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount); }
	catch { return `${currency} ${amount.toLocaleString()}`; }
};
const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

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

	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Wallet & Payments</h1><span>Review your balance, payout preferences and history.</span></div><button className="restaurant-primary-link" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>Refresh</button></header>
		{error && <div className="restaurant-feedback" role="alert">{error}</div>}{message && <div className="restaurant-success" role="status">{message}</div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading wallet…</div> : wallet && <>
			<div className="restaurant-wallet-cards"><WalletCard label="Available balance" amount={wallet.balance} currency={wallet.currency} /><WalletCard label="Total earned" amount={wallet.totalEarned} currency={wallet.currency} /><WalletCard label="Pending payout" amount={wallet.pendingPayout} currency={wallet.currency} /></div>
			<section className="restaurant-card restaurant-section-card"><div className="restaurant-section-toolbar"><div><h2>Payout preferences</h2><span>Choose where and how often you receive payouts.</span></div></div>
				<form className="restaurant-payout-form" onSubmit={(event) => void savePreferences(event)} key={`${wallet.payoutMethod}-${wallet.payoutFrequency}`}>
					<label>Payout method<select name="payoutMethod" defaultValue={wallet.payoutMethod}><option value="mpesa">M-Pesa</option><option value="bank">Bank transfer</option></select></label>
					<label>M-Pesa number<input name="phone" type="tel" defaultValue={wallet.payoutDetails.phone ?? ""} /></label>
					<div className="restaurant-form-grid"><label>Bank name<input name="bankName" defaultValue={wallet.payoutDetails.bankName ?? ""} /></label><label>Account name<input name="accountName" defaultValue={wallet.payoutDetails.accountName ?? ""} /></label></div>
					<label>Account number<input name="accountNumber" defaultValue={wallet.payoutDetails.accountNumber ?? ""} /></label>
					<div className="restaurant-form-grid"><label>Payout frequency<select name="payoutFrequency" defaultValue={wallet.payoutFrequency}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option></select></label><label>Minimum payout ({wallet.currency})<input name="minimumPayout" type="number" min="0" defaultValue={wallet.minimumPayout} /></label></div>
					<button type="submit" className="restaurant-primary-button" disabled={busy}>{busy ? "Saving…" : "Save preferences"}</button>
				</form>
			</section>
			<section className="restaurant-card restaurant-section-card"><div className="restaurant-section-toolbar"><h2>Payout history</h2><span>{payouts.length} records</span></div><div className="restaurant-resource-list">{payouts.map((payout) => <article className="restaurant-resource-row" key={payout._id}><div className="restaurant-resource-icon"><WalletIcon size={17} /></div><div className="restaurant-resource-copy"><strong>{payout.reference}</strong><span>{payout.method.toUpperCase()} · {new Date(payout.createdAt).toLocaleDateString()}</span><small>{payout.failureReason || label(payout.status)}</small></div><span className={`restaurant-status ${payout.status}`}>{label(payout.status)}</span><b>{money(payout.amount, wallet.currency)}</b></article>)}{!payouts.length && <div className="restaurant-empty">Payout history will appear here.</div>}</div></section>
		</>}
	</div>;
}

function WalletCard({ label: title, amount, currency }: { label: string; amount: number; currency: string }) {
	return <article className="restaurant-wallet-card"><small>{title}</small><strong>{money(amount, currency)}</strong></article>;
}
