import { useEffect, useState } from "react";
import { ArrowRight, Radio, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import broadcastApi from "../../api/restaurant/broadcastApi";
import { getApiErrorMessage } from "../../api/axios";
import type { BroadcastRequest } from "../../types";
import { formatCurrency as formatMoney } from "../../utils/formatCurrency";

const statusColor = (status: string) => ["accepted", "preparing", "ready", "confirmed"].includes(status) ? "!bg-[#f0f2e8] !text-[#6f7c43]" : ["delivered", "completed"].includes(status) ? "!bg-[#edf5e9] !text-[#4f7b4c]" : status === "out_for_delivery" ? "!bg-[#eaf2f8] !text-[#4a779e]" : ["cancelled", "rejected"].includes(status) ? "!bg-[#f9edeb] !text-[#a3574d]" : "";

export function RestaurantBroadcastsPage() {
	const [requests, setRequests] = useState<BroadcastRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [busyId, setBusyId] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		broadcastApi.list({ limit: 100 }).then((result) => {
			if (!cancelled) setRequests(result.data);
		}).catch((requestError: unknown) => {
			if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load food requests."));
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => { cancelled = true; };
	}, [reload]);

	async function acceptRequest(request: BroadcastRequest) {
		setBusyId(request._id);
		setError("");
		setMessage("");
		try {
			const result = await broadcastApi.accept(request._id);
			setMessage(`Request accepted. Order ${result.order.reference} is ready to manage.`);
			setReload((current) => current + 1);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not accept this food request."));
		} finally {
			setBusyId("");
		}
	}

	return (
		<div className="grid gap-[11px]">
			<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Food Requests</h1><span>Find nearby customer requests and turn them into orders.</span></div><button className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" type="button" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh requests</button></header>
			{error ? <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert"><span>{error}</span><button type="button" onClick={() => setReload((current) => current + 1)}>Retry</button></div> : null}
			{message ? <div className="mb-[10px] flex items-center justify-start gap-[10px] rounded-md border border-[#dfe7d3] bg-[#f5f7f0] px-[11px] py-[9px] text-[9px] text-[#64753e] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:text-inherit" role="status">{message} <Link to="/partner/restaurant/orders">View orders <ArrowRight size={13} /></Link></div> : null}
			{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading food requests…</div> : null}
			{!loading && !error ? <section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]">
				<div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><div><h2>Requests for your restaurant</h2><span>{requests.length} recent requests</span></div></div>
				<div className="grid">
					{requests.map((request) => {
						const isAvailable = request.status === "broadcasting" && new Date(request.broadcastExpiresAt) > new Date();
						return <article className="flex min-w-0 items-center gap-3 border-b border-[#f0f0ed] py-[10px] px-[2px] last:border-0 max-[480px]:gap-2 max-[480px]:[&_button]:p-[5px] max-[480px]:[&_button]:text-[8px] [&>button]:rounded-[5px] [&>button]:border [&>button]:border-[#e8eadf] [&>button]:bg-[#fafbf7] [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[9px] [&>button]:font-semibold [&>button]:text-[#657246] [&>button]:disabled:opacity-50 [&>button]:disabled:cursor-wait [&>b]:text-[10px] [&>b]:text-[#464b39] " key={request._id}>
							<div className="grid size-10 shrink-0 place-items-center rounded-[7px] bg-[#f0f2e9] text-[#76814d]"><Radio size={17} /></div>
							<div className="grid min-w-0 flex-1 gap-1 [&_strong]:truncate [&_strong]:text-[10px] [&_strong]:text-[#393c34] [&>span]:truncate [&>span]:text-[9px] [&>span]:text-[#85877f] [&_small]:truncate [&_small]:text-[9px] [&_small]:text-[#85877f]">
								<strong>{request.foodType} · {request.preparation}</strong>
								<span>{request.deliveryAddress.town || request.deliveryAddress.line1 || "Delivery location not specified"} · needed {new Date(request.timeNeeded).toLocaleString()}</span>
								<small>{request.notes || "No additional notes"} · expires {new Date(request.broadcastExpiresAt).toLocaleTimeString()}</small>
							</div>
							<span className={`inline-flex min-h-[18px] items-center rounded-full bg-[#fbf3e2] px-[6px] py-[2px] text-[7px] font-semibold text-[#9a742a] ${statusColor(request.status)}`}>{request.status.replace(/_/g, " ")}</span>
							<b>{formatMoney(request.budget, request.currency)}</b>
							{isAvailable ? <button type="button" onClick={() => void acceptRequest(request)} disabled={busyId === request._id}>{busyId === request._id ? "Accepting…" : <><Utensils size={13} /> Accept request</>}</button> : null}
						</article>;
					})}
					{requests.length === 0 ? <div className="px-[14px] py-[22px] text-center text-[10px] text-[#898b82]"><Radio size={22} /><p>No food requests right now. Requests targeted to your restaurant will appear here.</p></div> : null}
				</div>
			</section> : null}
		</div>
	);
}