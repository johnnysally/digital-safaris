import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import orderApi from "../../api/restaurant/orderApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Order } from "../../types";

const money = (amount: number, currency: string) => {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount); }
	catch { return `${currency} ${amount.toLocaleString()}`; }
};
const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function RestaurantOrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [busyId, setBusyId] = useState("");
	const [reload, setReload] = useState(0);
	const [params] = useSearchParams();
	const search = (params.get("search") ?? "").trim().toLowerCase();

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		orderApi.list({ limit: 100 }).then((result) => { if (!cancelled) setOrders(result.data); })
			.catch((cause: unknown) => { if (!cancelled) setError(getApiErrorMessage(cause, "Could not load orders.")); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function updateOrder(order: Order, action = "") {
		setBusyId(order._id);
		setError("");
		setMessage("");
		try {
			if (action === "reject") await orderApi.reject(order._id, "Restaurant is unable to fulfil this order.");
			else if (action === "transport") await orderApi.requestTransport(order._id);
			else if (action === "manual") await orderApi.markManualDelivery(order._id);
			else if (order.status === "pending") await orderApi.accept(order._id);
			else if (order.status === "accepted") await orderApi.markPreparing(order._id);
			else if (order.status === "preparing") await orderApi.markReady(order._id);
			else await orderApi.markDelivered(order._id);
			setMessage(`Order ${order.reference} updated.`);
			setReload((value) => value + 1);
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not update this order.")); }
		finally { setBusyId(""); }
	}

	const filtered = orders.filter((order) => `${order.reference} ${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""} ${order.items.map((item) => item.name).join(" ")}`.toLowerCase().includes(search));
	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Orders</h1><span>Review incoming orders and keep customers updated.</span></div><button className="restaurant-primary-link" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>Refresh</button></header>
		{error && <div className="restaurant-feedback" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{message && <div className="restaurant-success" role="status">{message}</div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading orders…</div> : <section className="restaurant-card restaurant-section-card">
			<div className="restaurant-section-toolbar"><h2>{search ? `Search results for “${params.get("search")}”` : "All orders"}</h2><span>{filtered.length} orders</span></div>
			<div className="restaurant-resource-list">{filtered.map((order) => <article className="restaurant-resource-row" key={order._id}>
				<div className="restaurant-resource-icon"><Store size={17} /></div>
				<div className="restaurant-resource-copy"><strong>{order.reference} · {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Guest"}</strong><span>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")}</span><small>{new Date(order.createdAt).toLocaleString()}</small></div>
				<span className={`restaurant-status ${order.status}`}>{label(order.status)}</span><b>{money(order.total, order.currency)}</b>
				{order.status === "pending" ? <><button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order)}>Accept</button><button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order, "reject")}>Reject</button></> :
					order.status === "accepted" || order.status === "preparing" || order.status === "out_for_delivery" || order.status === "ready" && order.type === "pickup" ? <button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order)}>{busyId === order._id ? "Updating…" : order.status === "accepted" ? "Start preparing" : order.status === "preparing" ? "Mark ready" : order.status === "ready" ? "Complete pickup" : "Mark delivered"}</button> :
					order.status === "ready" && order.type === "delivery" && !order.deliveryJob ? <><button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order, "transport")}>Request driver</button><button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order, "manual")}>Manual delivery</button></> : null}
			</article>)}{!filtered.length && <div className="restaurant-empty">{search ? "No orders matched your search." : "No orders have arrived yet."}</div>}</div>
		</section>}
	</div>;
}
