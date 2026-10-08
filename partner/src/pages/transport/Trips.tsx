import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import tripApi from "../../api/transport/tripApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Trip, Vehicle } from "../../types";
import vehicleApi from "../../api/transport/vehicleApi";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";

function placeLabel(value: { line1?: string; town?: string; county?: string }) {
	return [value.line1, value.town, value.county].filter(Boolean).join(", ") || "Location pending";
}

function amount(value: number, currency: string) {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value); }
	catch { return `${currency} ${value.toLocaleString()}`; }
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

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Transport Bookings" subtitle="Review trips and keep customers informed of each service stage." />
		<div className="transport-panel transport-table-panel">
			<div className="transport-filterbar"><div className="transport-filter-controls"><select aria-label="Filter trips by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="requested">Requested</option><option value="accepted">Accepted</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><label className="transport-search inline"><Search size={15} /><input aria-label="Search bookings" placeholder="Search customer, route, or reference" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><button className="secondary-button small-button" type="button" onClick={() => setReload((current) => current + 1)}>Refresh</button></div>
			<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
			<div className="transport-table-scroll"><table className="transport-data-table"><thead><tr><th>Guest</th><th>Pickup</th><th>Drop-off</th><th>Date &amp; time</th><th>Vehicle</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead><tbody>
				{filteredTrips.map((trip) => {
					const vehicle = vehicles.find((item) => item._id === trip.vehicle);
					return <tr key={trip._id}><td>{trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : "Guest"}<small>{trip.reference}</small></td><td>{placeLabel(trip.pickup)}</td><td>{placeLabel(trip.dropoff)}</td><td>{new Date(trip.scheduledAt).toLocaleString()}</td><td>{vehicle ? `${vehicle.make} ${vehicle.model}` : "Not assigned"}</td><td><StatusBadge status={trip.status.replace(/_/g, " ")} /></td><td>{amount(trip.fare, trip.currency)}</td><td><div className="transport-row-actions">{trip.status === "accepted" ? <button type="button" className="small-button primary-button" disabled={busyId === trip._id} onClick={() => void updateTrip(trip, "start")}>Start</button> : null}{trip.status === "ongoing" ? <button type="button" className="small-button primary-button" disabled={busyId === trip._id} onClick={() => void updateTrip(trip, "complete")}>Complete</button> : null}{["requested", "accepted", "ongoing"].includes(trip.status) ? <button type="button" className="small-button secondary-button" disabled={busyId === trip._id} onClick={() => void updateTrip(trip, "cancel")}>Cancel</button> : null}</div></td></tr>;
				})}
			</tbody></table>{!loading && filteredTrips.length === 0 ? <div className="transport-empty">No trips match these filters.</div> : null}</div>
		</div>
	</div></TransportLayout>;
}
