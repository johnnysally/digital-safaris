import { useEffect, useState } from "react";
import { MapPin, PackageCheck, RefreshCw } from "lucide-react";
import jobApi from "../../api/transport/jobApi";
import { getApiErrorMessage } from "../../api/axios";
import type { DeliveryJob } from "../../types";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";
import { formatCurrency as money } from "../../utils/formatCurrency";
import { formatAddress } from "../../utils/helpers";

type JobRow = Omit<DeliveryJob, "restaurant"> & { restaurant: string | { name: string; town?: string } };

function locationName(value: { line1?: string; town?: string; county?: string }) {
	return formatAddress(value);
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

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Delivery Jobs" subtitle="Accept and progress delivery requests assigned to your fleet." />
		<div className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] overflow-hidden">
			<div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-3 max-[760px]:items-stretch max-[760px]:flex-col"><div className="flex gap-[5px] [&_button]:rounded-[5px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-[9px] [&_button]:py-[7px] [&_button]:text-[.74rem] [&_button]:text-[var(--text-soft)] [&_button]:cursor-pointer [&_button_span]:ml-[5px] [&_button_span]:opacity-75"><button type="button" className={tab === "available" ? "bg-[rgba(197,138,42,.12)] text-[#80501b]" : ""} onClick={() => setTab("available")}>Available <span>{availableJobs.length}</span></button><button type="button" className={tab === "mine" ? "bg-[rgba(197,138,42,.12)] text-[#80501b]" : ""} onClick={() => setTab("mine")}>My Jobs <span>{myJobs.length}</span></button></div><button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" onClick={() => setReload((current) => current + 1)} disabled={loading}><RefreshCw size={13} /> Refresh</button></div>
			<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
			<div className="flex flex-col">{rows.map((job) => {
				const restaurant = typeof job.restaurant === "string" ? "Restaurant" : job.restaurant.name;
				const actions = tab === "available" ? ["accept"] as const : job.status === "accepted" ? ["pickedUp", "cancel"] as const : job.status === "picked_up" ? ["delivered", "cancel"] as const : [];
				return <article key={job._id} className="grid grid-cols-[minmax(0,1fr)_minmax(190px,.62fr)] gap-[18px] border-b border-[var(--border)] p-[14px] max-[760px]:grid-cols-1"><div className="flex gap-2.5 [&>div]:flex [&>div]:flex-col [&>div]:gap-[6px] [&_strong]:text-[.82rem] [&_small]:text-[.69rem]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#faecd5] text-[#925719]"><MapPin size={14} /></span><div><strong>{locationName(job.pickup)}</strong><small>Pickup · {restaurant}</small><strong>{locationName(job.dropoff)}</strong><small>Drop-off · {job.distanceKm.toFixed(1)} km</small></div></div><div className="flex flex-wrap items-center justify-end gap-2 text-[.7rem] text-[var(--text-soft)] [&>strong]:text-[.9rem] max-[760px]:justify-start"><span>{job.reference}</span><StatusBadge status={job.status.replace(/_/g, " ")} /><strong>{money(job.partnerEarnings, job.currency)}</strong><small>Expires {new Date(job.broadcastExpiresAt).toLocaleString()}</small><div className="flex flex-wrap gap-[5px] ">{actions.map((action) => <button key={action} type="button" className={action === "cancel" ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" : "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 bg-[#b87317] px-4 py-2 text-[.8rem] font-semibold text-white hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]"} disabled={busyId === job._id} onClick={() => void updateJob(job._id, action)}>{action === "accept" ? "Accept job" : action === "pickedUp" ? "Mark picked up" : action === "delivered" ? <><PackageCheck size={14} /> Delivered</> : "Cancel"}</button>)}</div></div></article>;
			})}{!loading && rows.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-[var(--text-muted)] [&_svg]:text-[var(--gold)] [&_strong]:text-[var(--text)] [&_span]:text-[.76rem]"><PackageCheck size={24} /><strong>{tab === "available" ? "No delivery jobs available" : "No jobs assigned"}</strong><span>New requests will appear here.</span></div> : null}</div>
		</div>
	</div></TransportLayout>;
}
