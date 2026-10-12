import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CreditCard, MapPin, RefreshCw, Store } from "lucide-react";
import profileApi from "../../api/restaurant/profileApi";
import walletApi from "../../api/restaurant/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { RestaurantPartner, Wallet } from "../../types";

const payoutFrequencyLabels: Record<Wallet["payoutFrequency"], string> = {
	daily: "Daily",
	weekly: "Weekly",
	biweekly: "Every two weeks",
	monthly: "Monthly",
};

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

	return (
		<div className="grid gap-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#777c67]">Restaurant partner</p>
					<h1 className="m-0 text-3xl font-semibold tracking-[-.04em] text-[#282b25]">Settings</h1>
					<p className="mb-0 mt-2 text-sm text-[#74776e]">Manage your restaurant profile and payout preferences.</p>
				</div>
				<button
					className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dedfd6] bg-white px-4 text-sm font-semibold text-[#43483b] transition-colors hover:bg-[#f8f8f4] disabled:cursor-not-allowed disabled:opacity-60"
					type="button"
					disabled={loading}
					onClick={() => setReload((value) => value + 1)}
				>
					<RefreshCw size={16} aria-hidden="true" />
					Refresh
				</button>
			</header>

			{error && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0d9d4] bg-[#fff8f7] px-4 py-3 text-sm text-[#994c43]" role="alert">
					<span>{error}</span>
					<button className="rounded-md border border-[#eed3cf] bg-white px-3 py-2 text-sm font-semibold text-[#914940]" type="button" onClick={() => setReload((value) => value + 1)}>Try again</button>
				</div>
			)}

			{loading ? (
				<div className="rounded-2xl border border-[#e8e9e2] bg-white px-5 py-12 text-center text-sm text-[#74776e]" role="status">
					Loading your settings…
				</div>
			) : (
				<div className="grid items-start gap-5 xl:grid-cols-2">
					<section className="min-w-0 rounded-2xl border border-[#e8e9e2] bg-white p-6 shadow-[0_2px_8px_rgba(34,37,29,.035)] max-[480px]:p-5" aria-labelledby="restaurant-profile-heading">
						<div className="mb-6 flex items-start gap-4">
							<div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f0f2e8] text-[#687746]">
								<Store size={23} aria-hidden="true" />
							</div>
							<div className="min-w-0">
								<h2 className="m-0 text-lg font-semibold text-[#303329]" id="restaurant-profile-heading">Restaurant profile</h2>
								<p className="mb-0 mt-1 text-sm leading-relaxed text-[#777a70]">Your business details and order availability.</p>
							</div>
						</div>

						<div className="mb-5">
							<p className="mb-3 break-words text-2xl font-semibold tracking-[-.03em] text-[#303329]">{profile?.name ?? "Restaurant workspace"}</p>
							<div className="flex flex-wrap gap-2">
								<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${profile ? "bg-[#f0f2e8] text-[#687746]" : "bg-[#f4f4f1] text-[#777a70]"}`}>
									<CheckCircle2 size={14} aria-hidden="true" />
									{profile ? `Account ${profile.status}` : "Profile unavailable"}
								</span>
								{profile && (
									<>
										<span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${profile.isOpen ? "bg-[#edf5e9] text-[#4f7b4c]" : "bg-[#f7f0e7] text-[#916b38]"}`}>
											{profile.isOpen ? "Open" : "Closed"}
										</span>
										<span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${profile.isAcceptingOrders ? "bg-[#edf5e9] text-[#4f7b4c]" : "bg-[#f4f4f1] text-[#777a70]"}`}>
											{profile.isAcceptingOrders ? "Accepting orders" : "Not accepting orders"}
										</span>
									</>
								)}
							</div>
						</div>

						<div className="mb-6 flex items-start gap-3 border-t border-[#eff0ea] pt-4 text-sm text-[#6f7368]">
							<MapPin className="mt-0.5 shrink-0 text-[#828875]" size={17} aria-hidden="true" />
							<p className="m-0 leading-relaxed">{profile ? [profile.address, profile.town].filter(Boolean).join(", ") : "Restaurant location is unavailable."}</p>
						</div>

						<Link className="inline-flex min-h-11 w-full items-center justify-between rounded-lg bg-[#707e48] px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#5e6b3b]" to="/partner/restaurant/profile">
							<span className="inline-flex items-center gap-2"><Store size={17} aria-hidden="true" /> Manage restaurant profile</span>
							<ArrowRight size={17} aria-hidden="true" />
						</Link>
					</section>

					<section className="min-w-0 rounded-2xl border border-[#e8e9e2] bg-white p-6 shadow-[0_2px_8px_rgba(34,37,29,.035)] max-[480px]:p-5" aria-labelledby="payout-preferences-heading">
						<div className="mb-6 flex items-start gap-4">
							<div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f0f2e8] text-[#687746]">
								<CreditCard size={23} aria-hidden="true" />
							</div>
							<div className="min-w-0">
								<h2 className="m-0 text-lg font-semibold text-[#303329]" id="payout-preferences-heading">Payout preferences</h2>
								<p className="mb-0 mt-1 text-sm leading-relaxed text-[#777a70]">How and when your earnings are paid out.</p>
							</div>
						</div>

						{wallet ? (
							<dl className="mb-6 divide-y divide-[#eff0ea] border-y border-[#eff0ea]">
								<div className="flex items-center justify-between gap-4 py-4">
									<dt className="text-sm text-[#777a70]">Payout method</dt>
									<dd className="m-0 text-right text-sm font-semibold text-[#303329]">{wallet.payoutMethod === "mpesa" ? "M-Pesa" : "Bank transfer"}</dd>
								</div>
								<div className="flex items-center justify-between gap-4 py-4">
									<dt className="text-sm text-[#777a70]">Payout schedule</dt>
									<dd className="m-0 text-right text-sm font-semibold text-[#303329]">{payoutFrequencyLabels[wallet.payoutFrequency]}</dd>
								</div>
								<div className="flex items-center justify-between gap-4 py-4">
									<dt className="text-sm text-[#777a70]">Minimum payout</dt>
									<dd className="m-0 text-right text-sm font-semibold text-[#303329]">{wallet.currency} {wallet.minimumPayout.toLocaleString()}</dd>
								</div>
								<div className="flex items-center justify-between gap-4 py-4">
									<dt className="text-sm text-[#777a70]">Wallet status</dt>
									<dd className={`m-0 rounded-full px-3 py-1 text-xs font-semibold ${wallet.status === "active" ? "bg-[#edf5e9] text-[#4f7b4c]" : "bg-[#f9edeb] text-[#a3574d]"}`}>{wallet.status === "active" ? "Active" : "Frozen"}</dd>
								</div>
							</dl>
						) : (
							<p className="mb-6 border-y border-[#eff0ea] py-5 text-sm leading-relaxed text-[#777a70]">Payout details are unavailable. Try refreshing, or visit wallet settings to review your account.</p>
						)}

						<Link className="inline-flex min-h-11 w-full items-center justify-between rounded-lg bg-[#707e48] px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#5e6b3b]" to="/partner/restaurant/wallet">
							<span className="inline-flex items-center gap-2"><CreditCard size={17} aria-hidden="true" /> Manage payout settings</span>
							<ArrowRight size={17} aria-hidden="true" />
						</Link>
					</section>
				</div>
			)}
		</div>
	);
}
