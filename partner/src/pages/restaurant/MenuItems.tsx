import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import menuItemApi from "../../api/restaurant/menuItemApi";
import { getApiErrorMessage } from "../../api/axios";
import type { MenuItem } from "../../types";
import foodImage from "../../../../website/public/food and dinning.jpg";

function money(value: number, currency: string) {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value); }
	catch { return `${currency} ${value.toLocaleString()}`; }
}

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

	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Menu Items</h1><span>Quickly manage availability for your dishes.</span></div><Link className="restaurant-primary-link" to="/partner/restaurant/menu"><Pencil size={13} /> Edit menu</Link></header>
		{error && <div className="restaurant-feedback" role="alert"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading menu items…</div> : <section className="restaurant-card restaurant-section-card">
			<div className="restaurant-section-toolbar"><h2>All menu items</h2><span>{items.length} items</span></div>
			<div className="restaurant-resource-list">{items.map((item) => <article className="restaurant-resource-row" key={item._id}>
				<img className="restaurant-resource-photo" src={item.image || foodImage} alt="" />
				<div className="restaurant-resource-copy"><strong>{item.name}</strong><span>{item.description || "Menu item"}</span><small>{item.isFeatured ? "Featured · " : ""}{item.isAvailable ? "Available to order" : "Currently unavailable"}</small></div>
				<b>{money(item.price, item.currency)}</b>
				<button type="button" disabled={busyId === item._id} onClick={() => void toggle(item)}>{busyId === item._id ? "Updating…" : item.isAvailable ? "Pause item" : "Make available"}</button>
			</article>)}{!items.length && <div className="restaurant-empty">No menu items have been added yet.</div>}</div>
		</section>}
	</div>;
}
