import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import menuApi from "../../api/restaurant/menuApi";
import menuItemApi from "../../api/restaurant/menuItemApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Menu, MenuItem } from "../../types";
import foodImage from "../../../../website/public/food and dinning.jpg";

function money(value: number, currency: string) {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value); }
	catch { return `${currency} ${value.toLocaleString()}`; }
}

export function RestaurantMenuPage() {
	const [items, setItems] = useState<MenuItem[]>([]);
	const [menus, setMenus] = useState<Menu[]>([]);
	const [editing, setEditing] = useState<MenuItem | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		Promise.all([menuItemApi.list(), menuApi.list()]).then(([itemList, menuList]) => {
			if (!cancelled) { setItems(itemList); setMenus(menuList); }
		}).catch((cause: unknown) => { if (!cancelled) setError(getApiErrorMessage(cause, "Could not load your menu.")); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function createMenu() {
		setBusy("menu");
		try {
			const created = await menuApi.create({ name: "Main Menu" });
			setMenus((current) => [...current, created]);
			setMessage("Main Menu created.");
			setError("");
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not create a menu.")); }
		finally { setBusy(""); }
	}

	async function saveItem(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const price = Number(data.get("price"));
		const menu = String(data.get("menu") ?? "");
		const name = String(data.get("name") ?? "").trim();
		if (!menu || !name || !Number.isFinite(price) || price < 0) {
			setError("Choose a menu, enter an item name, and provide a valid price.");
			return;
		}
		const payload: Partial<MenuItem> = {
			menu, name, price,
			description: String(data.get("description") ?? "").trim(),
			image: String(data.get("image") ?? "").trim() || null,
			preparationTimeMinutes: Number(data.get("preparationTimeMinutes")) || 15,
			isAvailable: data.get("isAvailable") === "on",
			isFeatured: data.get("isFeatured") === "on",
		};
		setBusy("item");
		setError("");
		try {
			if (editing) await menuItemApi.update(editing._id, payload);
			else await menuItemApi.create(payload);
			setMessage(editing ? "Menu item updated." : "Menu item added.");
			setEditing(null);
			setFormOpen(false);
			setReload((value) => value + 1);
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not save this menu item.")); }
		finally { setBusy(""); }
	}

	async function toggleAvailability(item: MenuItem) {
		setBusy(item._id);
		setError("");
		try {
			await menuItemApi.toggleAvailability(item._id);
			setReload((value) => value + 1);
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not update item availability.")); }
		finally { setBusy(""); }
	}

	async function removeItem(item: MenuItem) {
		if (!window.confirm(`Remove ${item.name} from your menu?`)) return;
		setBusy(item._id);
		setError("");
		try {
			await menuItemApi.remove(item._id);
			setMessage(`${item.name} removed.`);
			setReload((value) => value + 1);
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not remove this item.")); }
		finally { setBusy(""); }
	}

	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Menu Management</h1><span>Keep your dishes, prices and availability up to date.</span></div><button className="restaurant-primary-link" type="button" disabled={!menus.length} onClick={() => { setEditing(null); setFormOpen((value) => !value); }}><Plus size={14} /> Add item</button></header>
		{error && <div className="restaurant-feedback" role="alert">{error}</div>}
		{message && <div className="restaurant-success" role="status">{message}</div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading menu…</div> : <section className="restaurant-card restaurant-section-card">
			<div className="restaurant-section-toolbar"><div><h2>Your menu items</h2><span>{items.length} items across {menus.length} menus</span></div><div className="restaurant-toolbar-actions">{!menus.length && <button type="button" disabled={busy === "menu"} onClick={() => void createMenu()}>{busy === "menu" ? "Creating…" : "Create Main Menu"}</button>}</div></div>
			{(formOpen || editing) && <form className="restaurant-edit-form" onSubmit={(event) => void saveItem(event)}>
				<h3>{editing ? "Edit menu item" : "Add a menu item"}</h3>
				<label>Menu<select name="menu" required defaultValue={editing?.menu ?? menus[0]?._id ?? ""}>{menus.map((menu) => <option key={menu._id} value={menu._id}>{menu.name}</option>)}</select></label>
				<label>Item name<input name="name" required defaultValue={editing?.name ?? ""} /></label>
				<label>Description<textarea name="description" rows={2} defaultValue={editing?.description ?? ""} /></label>
				<div className="restaurant-form-grid"><label>Price<input name="price" type="number" min="0" step="0.01" required defaultValue={editing?.price ?? ""} /></label><label>Preparation time (minutes)<input name="preparationTimeMinutes" type="number" min="1" defaultValue={editing?.preparationTimeMinutes ?? 15} /></label></div>
				<label>Image URL<input name="image" type="url" defaultValue={editing?.image ?? ""} /></label>
				<div className="restaurant-form-checks"><label><input name="isAvailable" type="checkbox" defaultChecked={editing?.isAvailable ?? true} /> Available</label><label><input name="isFeatured" type="checkbox" defaultChecked={editing?.isFeatured ?? false} /> Featured</label></div>
				<div className="restaurant-toolbar-actions"><button className="restaurant-primary-button" type="submit" disabled={busy === "item"}>{busy === "item" ? "Saving…" : "Save item"}</button><button type="button" onClick={() => { setFormOpen(false); setEditing(null); }}>Cancel</button></div>
			</form>}
			<div className="restaurant-resource-list">{items.map((item) => <article className="restaurant-resource-row" key={item._id}>
				<img className="restaurant-resource-photo" src={item.image || foodImage} alt="" />
				<div className="restaurant-resource-copy"><strong>{item.name}</strong><span>{item.description || "Menu item"}</span><small>{menus.find((menu) => menu._id === item.menu)?.name ?? "Menu"} · {item.isAvailable ? "Available" : "Unavailable"}</small></div>
				<b>{money(item.price, item.currency)}</b>
				<button type="button" disabled={busy === item._id} onClick={() => void toggleAvailability(item)}>{item.isAvailable ? "Pause item" : "Make available"}</button>
				<button type="button" aria-label={`Edit ${item.name}`} onClick={() => { setFormOpen(false); setEditing(item); }}><Pencil size={14} /></button>
				<button type="button" aria-label={`Remove ${item.name}`} disabled={busy === item._id} onClick={() => void removeItem(item)}><Trash2 size={14} /></button>
			</article>)}{!items.length && <div className="restaurant-empty">{menus.length ? "Add your first menu item." : "Create a menu before adding your first item."}</div>}</div>
		</section>}
	</div>;
}
