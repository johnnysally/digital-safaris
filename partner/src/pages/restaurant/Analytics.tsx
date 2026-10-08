import { useEffect, useState } from "react";
import orderApi from "../../api/restaurant/orderApi";
import ratingApi from "../../api/restaurant/ratingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Order, RatingSummary } from "../../types";
import { formatCurrency } from "../../utils/formatCurrency";

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
	const money = (value: number) => formatCurrency(value, currency, { maximumFractionDigits: 0 });
	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Analytics</h1><span>A quick view of recent order and customer performance.</span></div><button className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" type="button" disabled={loading} onClick={() => setReload((value) => value + 1)}>Refresh</button></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{error}</div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading analytics…</div> : <section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]">
			<div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><h2>Recent performance</h2><span>Based on latest {orders.length} orders</span></div>
			<div className="grid grid-cols-3 gap-[9px] max-[680px]:grid-cols-2 max-[430px]:grid-cols-1"><WalletCard label="Orders" value={String(orders.length)} /><WalletCard label="Completed orders" value={String(completed.length)} /><WalletCard label="Completed revenue" value={money(revenue)} /><WalletCard label="Guest rating" value={`${(rating?.average ?? 0).toFixed(1)} / 5`} /><WalletCard label="Customers represented" value={String(customers)} /><WalletCard label="Guest reviews" value={String(rating?.count ?? 0)} /></div>
			<p className="mt-3 text-[10px] text-[#85877e]">Revenue is calculated from completed orders in the most recent 100 orders.</p>
		</section>}
	</div>;
}
function WalletCard({ label, value }: { label: string; value: string }) {
	return <article className="grid gap-[9px] rounded-[7px] border border-[#ecece7] bg-white p-[13px] [&_small]:text-[9px] [&_small]:text-[#83857b] [&_strong]:text-[19px] [&_strong]:text-[#383c32]"><small>{label}</small><strong>{value}</strong></article>;
}
