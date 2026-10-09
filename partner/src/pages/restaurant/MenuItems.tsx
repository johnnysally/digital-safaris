import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import menuItemApi from "../../api/restaurant/menuItemApi";
import { getApiErrorMessage } from "../../api/axios";
import type { MenuItem } from "../../types";
import { partnerImages } from "../../config/partnerImages";
import { formatCurrency as money } from "../../utils/formatCurrency";

export function RestaurantMenuItemsPage() {
	const [items, setItems] = useState<MenuItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busyId, setBusyId] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		menuItemApi.list().then((result) => { if (!cancelled) setItems(result); })
			.catch((cause: unknown) => { if (!cancelled) setError(getApiErrorMessage(cause, "Could not load menu items.")); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function toggle(item: MenuItem) {
		setBusyId(item._id);
		setError("");
		try {
			const result = await menuItemApi.toggleAvailability(item._id);
			setItems((current) => current.map((currentItem) => currentItem._id === item._id ? { ...currentItem, isAvailable: result.isAvailable } : currentItem));
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not update item availability.")); }
		finally { setBusyId(""); }
	}

	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Menu Items</h1><span>Quickly manage availability for your dishes.</span></div><Link className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" to="/partner/restaurant/menu"><Pencil size={13} /> Edit menu</Link></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading menu items…</div> : <section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]">
			<div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><h2>All menu items</h2><span>{items.length} items</span></div>
			<div className="grid">{items.map((item) => <article className="flex min-w-0 items-center gap-3 border-b border-[#f0f0ed] py-[10px] px-[2px] last:border-0 max-[480px]:gap-2 max-[480px]:[&_button]:p-[5px] max-[480px]:[&_button]:text-[8px] [&>button]:rounded-[5px] [&>button]:border [&>button]:border-[#e8eadf] [&>button]:bg-[#fafbf7] [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[9px] [&>button]:font-semibold [&>button]:text-[#657246] [&>button]:disabled:opacity-50 [&>button]:disabled:cursor-wait [&>b]:text-[10px] [&>b]:text-[#464b39]" key={item._id}>
				<img className="h-11 w-12 shrink-0 rounded-md bg-[#eeece4] object-cover max-[480px]:size-[38px]" src={item.image || partnerImages.restaurant.menuItemFallback} alt="" />
				<div className="grid min-w-0 flex-1 gap-1 [&_strong]:truncate [&_strong]:text-[10px] [&_strong]:text-[#393c34] [&>span]:truncate [&>span]:text-[9px] [&>span]:text-[#85877f] [&_small]:truncate [&_small]:text-[9px] [&_small]:text-[#85877f]"><strong>{item.name}</strong><span>{item.description || "Menu item"}</span><small>{item.isFeatured ? "Featured · " : ""}{item.isAvailable ? "Available to order" : "Currently unavailable"}</small></div>
				<b>{money(item.price, item.currency)}</b>
				<button type="button" disabled={busyId === item._id} onClick={() => void toggle(item)}>{busyId === item._id ? "Updating…" : item.isAvailable ? "Pause item" : "Make available"}</button>
			</article>)}{!items.length && <div className="px-[14px] py-[22px] text-center text-[10px] text-[#898b82]">No menu items have been added yet.</div>}</div>
		</section>}
	</div>;
}
