import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import orderApi from "../../api/restaurant/orderApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Order } from "../../types";
import { formatCurrency as money } from "../../utils/formatCurrency";
import { formatLabel as label } from "../../utils/helpers";

const statusColor = (status: string) => ["accepted", "preparing", "ready", "confirmed"].includes(status) ? "!bg-[#f0f2e8] !text-[#6f7c43]" : ["delivered", "completed"].includes(status) ? "!bg-[#edf5e9] !text-[#4f7b4c]" : status === "out_for_delivery" ? "!bg-[#eaf2f8] !text-[#4a779e]" : ["cancelled", "rejected"].includes(status) ? "!bg-[#f9edeb] !text-[#a3574d]" : "";

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
	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Orders</h1><span>Review incoming orders and keep customers updated.</span></div><button className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>Refresh</button></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{message && <div className="mb-[10px] flex items-center justify-start gap-[10px] rounded-md border border-[#dfe7d3] bg-[#f5f7f0] px-[11px] py-[9px] text-[9px] text-[#64753e] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:text-inherit" role="status">{message}</div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading orders…</div> : <section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]">
			<div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><h2>{search ? `Search results for “${params.get("search")}”` : "All orders"}</h2><span>{filtered.length} orders</span></div>
			<div className="grid">{filtered.map((order) => <article className="flex min-w-0 items-center gap-3 border-b border-[#f0f0ed] py-[10px] px-[2px] last:border-0 max-[480px]:gap-2 max-[480px]:[&_button]:p-[5px] max-[480px]:[&_button]:text-[8px] [&>button]:rounded-[5px] [&>button]:border [&>button]:border-[#e8eadf] [&>button]:bg-[#fafbf7] [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[9px] [&>button]:font-semibold [&>button]:text-[#657246] [&>button]:disabled:opacity-50 [&>button]:disabled:cursor-wait [&>b]:text-[10px] [&>b]:text-[#464b39]" key={order._id}>
				<div className="grid size-10 shrink-0 place-items-center rounded-[7px] bg-[#f0f2e9] text-[#76814d]"><Store size={17} /></div>
				<div className="grid min-w-0 flex-1 gap-1 [&_strong]:truncate [&_strong]:text-[10px] [&_strong]:text-[#393c34] [&>span]:truncate [&>span]:text-[9px] [&>span]:text-[#85877f] [&_small]:truncate [&_small]:text-[9px] [&_small]:text-[#85877f]"><strong>{order.reference} · {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Guest"}</strong><span>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")}</span><small>{new Date(order.createdAt).toLocaleString()}</small></div>
				<span className={`inline-flex min-h-[18px] items-center rounded-full bg-[#fbf3e2] px-[6px] py-[2px] text-[7px] font-semibold text-[#9a742a] ${statusColor(order.status)}`}>{label(order.status)}</span><b>{money(order.total, order.currency)}</b>
				{order.status === "pending" ? <><button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order)}>Accept</button><button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order, "reject")}>Reject</button></> :
					order.status === "accepted" || order.status === "preparing" || order.status === "out_for_delivery" || order.status === "ready" && order.type === "pickup" ? <button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order)}>{busyId === order._id ? "Updating…" : order.status === "accepted" ? "Start preparing" : order.status === "preparing" ? "Mark ready" : order.status === "ready" ? "Complete pickup" : "Mark delivered"}</button> :
					order.status === "ready" && order.type === "delivery" && !order.deliveryJob ? <><button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order, "transport")}>Request driver</button><button type="button" disabled={busyId === order._id} onClick={() => void updateOrder(order, "manual")}>Manual delivery</button></> : null}
			</article>)}{!filtered.length && <div className="px-[14px] py-[22px] text-center text-[10px] text-[#898b82]">{search ? "No orders matched your search." : "No orders have arrived yet."}</div>}</div>
		</section>}
	</div>;
}
