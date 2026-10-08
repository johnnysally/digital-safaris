import { useEffect, useState } from "react";
import { ArrowRight, Radio, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import broadcastApi from "../../api/restaurant/broadcastApi";
import { getApiErrorMessage } from "../../api/axios";
import type { BroadcastRequest } from "../../types";

function formatMoney(amount: number, currency: string) {
	try {
		return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
	} catch {
		return `${currency} ${amount.toLocaleString()}`;
	}
}

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
		<div className="restaurant-section-page">
			<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Food Requests</h1><span>Find nearby customer requests and turn them into orders.</span></div><button className="restaurant-primary-link" type="button" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh requests</button></header>
			{error ? <div className="restaurant-feedback" role="alert"><span>{error}</span><button type="button" onClick={() => setReload((current) => current + 1)}>Retry</button></div> : null}
			{message ? <div className="restaurant-success" role="status">{message} <Link to="/partner/restaurant/orders">View orders <ArrowRight size={13} /></Link></div> : null}
			{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading food requests…</div> : null}
			{!loading && !error ? <section className="restaurant-card restaurant-section-card">
				<div className="restaurant-section-toolbar"><div><h2>Requests for your restaurant</h2><span>{requests.length} recent requests</span></div></div>
				<div className="restaurant-resource-list">
					{requests.map((request) => {
						const isAvailable = request.status === "broadcasting" && new Date(request.broadcastExpiresAt) > new Date();
						return <article className="restaurant-resource-row restaurant-broadcast-row" key={request._id}>
							<div className="restaurant-resource-icon"><Radio size={17} /></div>
							<div className="restaurant-resource-copy">
								<strong>{request.foodType} · {request.preparation}</strong>
								<span>{request.deliveryAddress.town || request.deliveryAddress.line1 || "Delivery location not specified"} · needed {new Date(request.timeNeeded).toLocaleString()}</span>
								<small>{request.notes || "No additional notes"} · expires {new Date(request.broadcastExpiresAt).toLocaleTimeString()}</small>
							</div>
							<span className={`restaurant-status ${request.status}`}>{request.status.replace(/_/g, " ")}</span>
							<b>{formatMoney(request.budget, request.currency)}</b>
							{isAvailable ? <button type="button" onClick={() => void acceptRequest(request)} disabled={busyId === request._id}>{busyId === request._id ? "Accepting…" : <><Utensils size={13} /> Accept request</>}</button> : null}
						</article>;
					})}
					{requests.length === 0 ? <div className="restaurant-empty"><Radio size={22} /><p>No food requests right now. Requests targeted to your restaurant will appear here.</p></div> : null}
				</div>
			</section> : null}
		</div>
	);
}