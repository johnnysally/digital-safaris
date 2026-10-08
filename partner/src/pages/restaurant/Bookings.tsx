import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import bookingApi from "../../api/restaurant/bookingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { DineInBooking } from "../../types";

const money = (amount: number, currency: string) => {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount); }
	catch { return `${currency} ${amount.toLocaleString()}`; }
};

export function RestaurantBookingsPage() {
	const [bookings, setBookings] = useState<DineInBooking[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState("");
	const [reload, setReload] = useState(0);
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		bookingApi.list({ limit: 100 }).then((result) => { if (!cancelled) setBookings(result.data); })
			.catch((cause: unknown) => { if (!cancelled) setError(getApiErrorMessage(cause, "Could not load bookings.")); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function act(booking: DineInBooking, action: "accept" | "reject" | "complete" | "no-show") {
		setBusy(booking._id);
		setError("");
		try {
			if (action === "accept") await bookingApi.accept(booking._id);
			else if (action === "reject") await bookingApi.reject(booking._id, "Restaurant is unable to accommodate this booking.");
			else if (action === "no-show") await bookingApi.markNoShow(booking._id);
			else await bookingApi.complete(booking._id);
			setReload((value) => value + 1);
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not update this booking.")); }
		finally { setBusy(""); }
	}

	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Bookings</h1><span>Manage dine-in and pickup booking requests.</span></div><button className="restaurant-primary-link" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>Refresh</button></header>
		{error && <div className="restaurant-feedback" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading bookings…</div> : <section className="restaurant-card restaurant-section-card">
			<div className="restaurant-section-toolbar"><h2>Dining bookings</h2><span>{bookings.length} bookings</span></div>
			<div className="restaurant-resource-list">{bookings.map((booking) => <article className="restaurant-resource-row" key={booking._id}>
				<div className="restaurant-resource-icon"><Clock3 size={17} /></div><div className="restaurant-resource-copy"><strong>{booking.reference} · {booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Guest"}</strong><span>{booking.partySize} guests · {new Date(booking.scheduledAt).toLocaleString()}</span><small>{booking.customerNotes || booking.type.replace(/_/g, " ")}</small></div>
				<span className={`restaurant-status ${booking.status}`}>{booking.status.replace(/_/g, " ")}</span><b>{money(booking.estimatedTotal, booking.currency)}</b>
				{booking.status === "pending" && <><button type="button" disabled={busy === booking._id} onClick={() => void act(booking, "accept")}>Accept</button><button type="button" disabled={busy === booking._id} onClick={() => void act(booking, "reject")}>Decline</button></>}
				{booking.status === "accepted" && <><button type="button" disabled={busy === booking._id} onClick={() => void act(booking, "complete")}>Complete</button><button type="button" disabled={busy === booking._id} onClick={() => void act(booking, "no-show")}>No-show</button></>}
			</article>)}{!bookings.length && <div className="restaurant-empty">There are no bookings yet.</div>}</div>
		</section>}
	</div>;
}
