import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import tripApi from "../../api/transport/tripApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Trip, Vehicle } from "../../types";
import vehicleApi from "../../api/transport/vehicleApi";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";
import { formatCurrency as amount } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDate";
import { formatAddress, formatLabel } from "../../utils/helpers";

function placeLabel(value: { line1?: string; town?: string; county?: string }) {
	return formatAddress(value);
}

export function TripsPage() {
	const [trips, setTrips] = useState<Trip[]>([]);
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [status, setStatus] = useState("all");
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busyId, setBusyId] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function loadTrips() {
			setLoading(true);
			setError("");
			try {
				const [tripResult, vehicleResult] = await Promise.all([
					tripApi.list({ limit: 100, status: status === "all" ? undefined : status }),
					vehicleApi.list(),
				]);
				if (!cancelled) { setTrips(tripResult.data); setVehicles(vehicleResult); }
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load transport bookings."));
			} finally { if (!cancelled) setLoading(false); }
		}
		void loadTrips();
		return () => { cancelled = true; };
	}, [status, reload]);

	const filteredTrips = trips.filter((trip) => `${trip.reference} ${trip.customer?.firstName ?? ""} ${trip.customer?.lastName ?? ""} ${placeLabel(trip.pickup)} ${placeLabel(trip.dropoff)}`.toLowerCase().includes(search.toLowerCase()));

	async function updateTrip(trip: Trip, action: "start" | "complete" | "cancel") {
		setBusyId(trip._id);
		setError("");
		try {
			if (action === "start") await tripApi.start(trip._id);
			else if (action === "complete") await tripApi.complete(trip._id);
			else await tripApi.cancel(trip._id, "Cancelled by transport partner");
			setReload((current) => current + 1);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not update this trip."));
		} finally { setBusyId(""); }
	}

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Transport Bookings" subtitle="Review trips and keep customers informed of each service stage." />
		<div className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] overflow-hidden">
			<div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-3 max-[760px]:items-stretch max-[760px]:flex-col"><div className="flex min-w-0 items-center gap-[9px] [&_select]:w-auto [&_select]:min-w-[145px] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.75rem] max-[760px]:items-stretch max-[760px]:flex-col max-[760px]:[&_select]:w-full max-[760px]:[&_select]:min-w-0"><select aria-label="Filter trips by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="requested">Requested</option><option value="accepted">Accepted</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><label className="flex h-[34px] w-[min(470px,56%)] items-center rounded-[20px] border border-[#eee7dc] bg-[#faf7f1] px-[11px] max-[760px]:w-[46%] [&_input]:h-full [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:pl-[9px] [&_input]:text-[.67rem] [&_input]:shadow-none"><Search size={15} /><input aria-label="Search bookings" placeholder="Search customer, route, or reference" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" type="button" onClick={() => setReload((current) => current + 1)}>Refresh</button></div>
			<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
			<div className="w-full overflow-x-auto"><table className="w-full min-w-[850px] border-collapse [&_th]:bg-[rgba(247,241,232,.65)] [&_th]:text-[.63rem] [&_th]:font-semibold [&_th]:text-[#302a24] [&_td]:text-[#514940] [&_th]:text-left [&_td]:text-left [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_th]:border-b [&_td]:border-b [&_th]:border-[rgba(130,110,92,.09)] [&_td]:border-[rgba(130,110,92,.09)] [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-3 [&_td]:py-3 [&_th]:text-[.69rem] [&_td]:text-[.69rem] [&_td_small]:mt-[3px] [&_td_small]:block [&_td_small]:text-[.48rem] [&_td_small]:text-[#91887e]"><thead><tr><th>Guest</th><th>Pickup</th><th>Drop-off</th><th>Date &amp; time</th><th>Vehicle</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead><tbody>
				{filteredTrips.map((trip) => {
					const vehicle = vehicles.find((item) => item._id === trip.vehicle);
					return <tr key={trip._id}><td>{trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : "Guest"}<small>{trip.reference}</small></td><td>{placeLabel(trip.pickup)}</td><td>{placeLabel(trip.dropoff)}</td><td>{formatDateTime(trip.scheduledAt)}</td><td>{vehicle ? `${vehicle.make} ${vehicle.model}` : "Not assigned"}</td><td><StatusBadge status={formatLabel(trip.status)} /></td><td>{amount(trip.fare, trip.currency)}</td><td><div className="flex flex-wrap gap-[5px] ">{trip.status === "accepted" ? <button type="button" className="min-h-7 !px-[7px] !py-[5px] !text-[.62rem] inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 bg-[#b87317] px-4 py-2 text-[.8rem] font-semibold text-white hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60" disabled={busyId === trip._id} onClick={() => void updateTrip(trip, "start")}>Start</button> : null}{trip.status === "ongoing" ? <button type="button" className="min-h-7 !px-[7px] !py-[5px] !text-[.62rem] inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 bg-[#b87317] px-4 py-2 text-[.8rem] font-semibold text-white hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60" disabled={busyId === trip._id} onClick={() => void updateTrip(trip, "complete")}>Complete</button> : null}{["requested", "accepted", "ongoing"].includes(trip.status) ? <button type="button" className="min-h-7 !px-[7px] !py-[5px] !text-[.62rem] inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60" disabled={busyId === trip._id} onClick={() => void updateTrip(trip, "cancel")}>Cancel</button> : null}</div></td></tr>;
				})}
			</tbody></table>{!loading && filteredTrips.length === 0 ? <div className="p-[18px] text-center text-[.78rem] text-[var(--text-muted)]">No trips match these filters.</div> : null}</div>
		</div>
	</div></TransportLayout>;
}
