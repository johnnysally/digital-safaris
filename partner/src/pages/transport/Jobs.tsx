import { useEffect, useState } from "react";
import { MapPin, PackageCheck, RefreshCw } from "lucide-react";
import jobApi from "../../api/transport/jobApi";
import { getApiErrorMessage } from "../../api/axios";
import type { DeliveryJob } from "../../types";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";

type JobRow = Omit<DeliveryJob, "restaurant"> & { restaurant: string | { name: string; town?: string } };

function money(value: number, currency: string) {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value); }
	catch { return `${currency} ${value.toLocaleString()}`; }
}

function locationName(value: { line1?: string; town?: string; county?: string }) {
	return [value.line1, value.town, value.county].filter(Boolean).join(", ") || "Location pending";
}

export function JobsPage() {
	const [tab, setTab] = useState<"available" | "mine">("available");
	const [availableJobs, setAvailableJobs] = useState<DeliveryJob[]>([]);
	const [myJobs, setMyJobs] = useState<JobRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busyId, setBusyId] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function loadJobs() {
			setLoading(true);
			setError("");
			try {
				const [available, mine] = await Promise.all([jobApi.available(), jobApi.mine({ limit: 100 })]);
				if (!cancelled) { setAvailableJobs(available); setMyJobs(mine.data as JobRow[]); }
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load delivery jobs."));
			} finally { if (!cancelled) setLoading(false); }
		}
		void loadJobs();
		return () => { cancelled = true; };
	}, [reload]);

	async function updateJob(jobId: string, action: "accept" | "pickedUp" | "delivered" | "cancel") {
		setBusyId(jobId);
		setError("");
		try {
			if (action === "accept") await jobApi.accept(jobId);
			else if (action === "pickedUp") await jobApi.pickedUp(jobId);
			else if (action === "delivered") await jobApi.delivered(jobId);
			else await jobApi.cancel(jobId, "Cancelled by transport partner");
			setReload((current) => current + 1);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not update delivery job."));
		} finally { setBusyId(""); }
	}

	const rows = tab === "available" ? availableJobs : myJobs;

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Delivery Jobs" subtitle="Accept and progress delivery requests assigned to your fleet." />
		<div className="transport-panel transport-table-panel">
			<div className="transport-filterbar"><div className="transport-tabs"><button type="button" className={tab === "available" ? "active" : ""} onClick={() => setTab("available")}>Available <span>{availableJobs.length}</span></button><button type="button" className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>My Jobs <span>{myJobs.length}</span></button></div><button type="button" className="secondary-button small-button" onClick={() => setReload((current) => current + 1)} disabled={loading}><RefreshCw size={13} /> Refresh</button></div>
			<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
			<div className="transport-job-list">{rows.map((job) => {
				const restaurant = typeof job.restaurant === "string" ? "Restaurant" : job.restaurant.name;
				const actions = tab === "available" ? ["accept"] as const : job.status === "accepted" ? ["pickedUp", "cancel"] as const : job.status === "picked_up" ? ["delivered", "cancel"] as const : [];
				return <article key={job._id} className="transport-job-card"><div className="transport-job-route"><span className="transport-route-pin"><MapPin size={14} /></span><div><strong>{locationName(job.pickup)}</strong><small>Pickup · {restaurant}</small><strong>{locationName(job.dropoff)}</strong><small>Drop-off · {job.distanceKm.toFixed(1)} km</small></div></div><div className="transport-job-meta"><span>{job.reference}</span><StatusBadge status={job.status.replace(/_/g, " ")} /><strong>{money(job.partnerEarnings, job.currency)}</strong><small>Expires {new Date(job.broadcastExpiresAt).toLocaleString()}</small><div className="transport-row-actions">{actions.map((action) => <button key={action} type="button" className={action === "cancel" ? "secondary-button small-button" : "primary-button small-button"} disabled={busyId === job._id} onClick={() => void updateJob(job._id, action)}>{action === "accept" ? "Accept job" : action === "pickedUp" ? "Mark picked up" : action === "delivered" ? <><PackageCheck size={14} /> Delivered</> : "Cancel"}</button>)}</div></div></article>;
			})}{!loading && rows.length === 0 ? <div className="transport-empty-large"><PackageCheck size={24} /><strong>{tab === "available" ? "No delivery jobs available" : "No jobs assigned"}</strong><span>New requests will appear here.</span></div> : null}</div>
		</div>
	</div></TransportLayout>;
}
