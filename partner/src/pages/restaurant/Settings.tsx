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

	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Settings</h1><span>Manage restaurant details and payout preferences.</span></div><button className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" type="button" disabled={loading} onClick={() => setReload((value) => value + 1)}>Refresh</button></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading settings…</div> : <>
			<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] grid justify-items-center gap-3 p-6 text-center [&>svg]:text-[#718044] [&_h2]:m-0 [&_h2]:text-base [&_p]:m-0 [&_p]:max-w-2xl [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#85877e] [&>div]:flex [&>div]:flex-wrap [&>div]:justify-center [&>div]:gap-2 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:rounded [&_a]:bg-[#707e48] [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:text-white [&_a]:no-underline"><Store size={25} /><h2>{profile?.name ?? "Restaurant workspace"}</h2><p>{profile ? `Account status: ${profile.status}. Restaurant is ${profile.isOpen ? "open" : "closed"} and ${profile.isAcceptingOrders ? "accepting" : "not accepting"} orders.` : "Restaurant profile is unavailable."}<br />Update your business details and availability from the restaurant profile.</p><div><Link to="/partner/restaurant/profile"><Store size={14} /> Restaurant profile</Link></div></section>
			<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] grid justify-items-center gap-3 p-6 text-center [&>svg]:text-[#718044] [&_h2]:m-0 [&_h2]:text-base [&_p]:m-0 [&_p]:max-w-2xl [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#85877e] [&>div]:flex [&>div]:flex-wrap [&>div]:justify-center [&>div]:gap-2 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:rounded [&_a]:bg-[#707e48] [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:text-white [&_a]:no-underline"><CreditCard size={25} /><h2>Payout preferences</h2><p>{wallet ? `${wallet.payoutMethod === "mpesa" ? "M-Pesa" : "Bank transfer"} · ${wallet.payoutFrequency} payouts · minimum ${wallet.currency} ${wallet.minimumPayout.toLocaleString()}` : "Payout details are unavailable."}<br />Change your payout method and schedule from wallet settings.</p><div><Link to="/partner/restaurant/wallet"><CreditCard size={14} /> Payout settings</Link></div></section>
		</>}
	</div>;
}
