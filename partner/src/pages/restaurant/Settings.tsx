import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Store } from "lucide-react";
import profileApi from "../../api/restaurant/profileApi";
import walletApi from "../../api/restaurant/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { RestaurantPartner, Wallet } from "../../types";

export function RestaurantSettingsPage() {
	const [profile, setProfile] = useState<RestaurantPartner | null>(null);
	const [wallet, setWallet] = useState<Wallet | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		Promise.all([profileApi.get(), walletApi.get()]).then(([profileResult, walletResult]) => {
			if (!cancelled) {
				setProfile(profileResult.partner);
				setWallet(walletResult);
			}
		}).catch((cause: unknown) => {
			if (!cancelled) setError(getApiErrorMessage(cause, "Could not load restaurant settings."));
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => { cancelled = true; };
	}, [reload]);

	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Settings</h1><span>Manage restaurant details and payout preferences.</span></div><button className="restaurant-primary-link" type="button" disabled={loading} onClick={() => setReload((value) => value + 1)}>Refresh</button></header>
		{error && <div className="restaurant-feedback" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading settings…</div> : <>
			<section className="restaurant-card restaurant-empty-state"><Store size={25} /><h2>{profile?.name ?? "Restaurant workspace"}</h2><p>{profile ? `Account status: ${profile.status}. Restaurant is ${profile.isOpen ? "open" : "closed"} and ${profile.isAcceptingOrders ? "accepting" : "not accepting"} orders.` : "Restaurant profile is unavailable."}<br />Update your business details and availability from the restaurant profile.</p><div><Link to="/partner/restaurant/profile"><Store size={14} /> Restaurant profile</Link></div></section>
			<section className="restaurant-card restaurant-empty-state"><CreditCard size={25} /><h2>Payout preferences</h2><p>{wallet ? `${wallet.payoutMethod === "mpesa" ? "M-Pesa" : "Bank transfer"} · ${wallet.payoutFrequency} payouts · minimum ${wallet.currency} ${wallet.minimumPayout.toLocaleString()}` : "Payout details are unavailable."}<br />Change your payout method and schedule from wallet settings.</p><div><Link to="/partner/restaurant/wallet"><CreditCard size={14} /> Payout settings</Link></div></section>
		</>}
	</div>;
}
