import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import bookingApi from "../../api/restaurant/bookingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { DineInBooking } from "../../types";
import { formatCurrency as money } from "../../utils/formatCurrency";

const statusColor = (status: string) => ["accepted", "preparing", "ready", "confirmed"].includes(status) ? "!bg-[#f0f2e8] !text-[#6f7c43]" : ["delivered", "completed"].includes(status) ? "!bg-[#edf5e9] !text-[#4f7b4c]" : status === "out_for_delivery" ? "!bg-[#eaf2f8] !text-[#4a779e]" : ["cancelled", "rejected"].includes(status) ? "!bg-[#f9edeb] !text-[#a3574d]" : "";

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

	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Bookings</h1><span>Manage dine-in and pickup booking requests.</span></div><button className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>Refresh</button></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading bookings…</div> : <section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]">
			<div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><h2>Dining bookings</h2><span>{bookings.length} bookings</span></div>
			<div className="grid">{bookings.map((booking) => <article className="flex min-w-0 items-center gap-3 border-b border-[#f0f0ed] py-[10px] px-[2px] last:border-0 max-[480px]:gap-2 max-[480px]:[&_button]:p-[5px] max-[480px]:[&_button]:text-[8px] [&>button]:rounded-[5px] [&>button]:border [&>button]:border-[#e8eadf] [&>button]:bg-[#fafbf7] [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[9px] [&>button]:font-semibold [&>button]:text-[#657246] [&>button]:disabled:opacity-50 [&>button]:disabled:cursor-wait [&>b]:text-[10px] [&>b]:text-[#464b39]" key={booking._id}>
				<div className="grid size-10 shrink-0 place-items-center rounded-[7px] bg-[#f0f2e9] text-[#76814d]"><Clock3 size={17} /></div><div className="grid min-w-0 flex-1 gap-1 [&_strong]:truncate [&_strong]:text-[10px] [&_strong]:text-[#393c34] [&>span]:truncate [&>span]:text-[9px] [&>span]:text-[#85877f] [&_small]:truncate [&_small]:text-[9px] [&_small]:text-[#85877f]"><strong>{booking.reference} · {booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Guest"}</strong><span>{booking.partySize} guests · {new Date(booking.scheduledAt).toLocaleString()}</span><small>{booking.customerNotes || booking.type.replace(/_/g, " ")}</small></div>
				<span className={`inline-flex min-h-[18px] items-center rounded-full bg-[#fbf3e2] px-[6px] py-[2px] text-[7px] font-semibold text-[#9a742a] ${statusColor(booking.status)}`}>{booking.status.replace(/_/g, " ")}</span><b>{money(booking.estimatedTotal, booking.currency)}</b>
				{booking.status === "pending" && <><button type="button" disabled={busy === booking._id} onClick={() => void act(booking, "accept")}>Accept</button><button type="button" disabled={busy === booking._id} onClick={() => void act(booking, "reject")}>Decline</button></>}
				{booking.status === "accepted" && <><button type="button" disabled={busy === booking._id} onClick={() => void act(booking, "complete")}>Complete</button><button type="button" disabled={busy === booking._id} onClick={() => void act(booking, "no-show")}>No-show</button></>}
			</article>)}{!bookings.length && <div className="px-[14px] py-[22px] text-center text-[10px] text-[#898b82]">There are no bookings yet.</div>}</div>
		</section>}
	</div>;
}
