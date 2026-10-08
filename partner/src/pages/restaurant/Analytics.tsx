import { useEffect, useState } from "react";
import orderApi from "../../api/restaurant/orderApi";
import ratingApi from "../../api/restaurant/ratingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Order, RatingSummary } from "../../types";

export function RestaurantAnalyticsPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [rating, setRating] = useState<RatingSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		Promise.all([orderApi.list({ limit: 100 }), ratingApi.summary()]).then(([result, summary]) => {
			if (!cancelled) { setOrders(result.data); setRating(summary); }
		}).catch((cause: unknown) => { if (!cancelled) setError(getApiErrorMessage(cause, "Could not load analytics.")); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);
	const completed = orders.filter((order) => ["completed", "delivered"].includes(order.status));
	const revenue = completed.reduce((sum, order) => sum + order.total, 0);
	const customers = new Set(orders.map((order) => order.customer?._id).filter(Boolean)).size;
	const currency = orders[0]?.currency ?? "KES";
	const money = (value: number) => {
		try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
		catch { return `${currency} ${value.toLocaleString()}`; }
	};
	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Analytics</h1><span>A quick view of recent order and customer performance.</span></div><button className="restaurant-primary-link" type="button" disabled={loading} onClick={() => setReload((value) => value + 1)}>Refresh</button></header>
		{error && <div className="restaurant-feedback" role="alert">{error}</div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading analytics…</div> : <section className="restaurant-card restaurant-section-card">
			<div className="restaurant-section-toolbar"><h2>Recent performance</h2><span>Based on latest {orders.length} orders</span></div>
			<div className="restaurant-analytics-grid"><WalletCard label="Orders" value={String(orders.length)} /><WalletCard label="Completed orders" value={String(completed.length)} /><WalletCard label="Completed revenue" value={money(revenue)} /><WalletCard label="Guest rating" value={`${(rating?.average ?? 0).toFixed(1)} / 5`} /><WalletCard label="Customers represented" value={String(customers)} /><WalletCard label="Guest reviews" value={String(rating?.count ?? 0)} /></div>
			<p className="restaurant-analytics-note">Revenue is calculated from completed orders in the most recent 100 orders.</p>
		</section>}
	</div>;
}
function WalletCard({ label, value }: { label: string; value: string }) {
	return <article className="restaurant-wallet-card"><small>{label}</small><strong>{value}</strong></article>;
}
