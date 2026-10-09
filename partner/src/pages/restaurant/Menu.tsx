import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import menuApi from "../../api/restaurant/menuApi";
import menuItemApi from "../../api/restaurant/menuItemApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Menu, MenuItem } from "../../types";
import { partnerImages } from "../../config/partnerImages";
import { formatCurrency as money } from "../../utils/formatCurrency";

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

	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Menu Management</h1><span>Keep your dishes, prices and availability up to date.</span></div><button className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#707e48] px-[10px] py-2 text-[9px] font-semibold text-white no-underline disabled:opacity-60" type="button" disabled={!menus.length} onClick={() => { setEditing(null); setFormOpen((value) => !value); }}><Plus size={14} /> Add item</button></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{error}</div>}
		{message && <div className="mb-[10px] flex items-center justify-start gap-[10px] rounded-md border border-[#dfe7d3] bg-[#f5f7f0] px-[11px] py-[9px] text-[9px] text-[#64753e] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:text-inherit" role="status">{message}</div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading menu…</div> : <section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px]">
			<div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><div><h2>Your menu items</h2><span>{items.length} items across {menus.length} menus</span></div><div className="flex flex-wrap items-center gap-[7px] [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#e8e9e3] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[6px] [&_button]:text-[9px] [&_button]:text-[#657246]">{!menus.length && <button type="button" disabled={busy === "menu"} onClick={() => void createMenu()}>{busy === "menu" ? "Creating…" : "Create Main Menu"}</button>}</div></div>
			{(formOpen || editing) && <form className="mb-3 grid gap-[11px] rounded-lg border border-[#ecece7] bg-[#fafaf8] p-3 [&_h3]:m-0 [&_h3]:text-sm [&>label]:grid [&>label]:gap-1 [&>label]:text-[10px] [&>label]:font-semibold [&>label]:text-[#64675e] [&_input]:w-full [&_input]:rounded-[5px] [&_input]:border [&_input]:border-[#e8e9e3] [&_input]:bg-white [&_input]:p-[9px_10px] [&_input]:text-[10px] [&_select]:w-full [&_select]:rounded-[5px] [&_select]:border [&_select]:border-[#e8e9e3] [&_select]:bg-white [&_select]:p-[9px_10px] [&_select]:text-[10px] [&_textarea]:w-full [&_textarea]:rounded-[5px] [&_textarea]:border [&_textarea]:border-[#e8e9e3] [&_textarea]:bg-white [&_textarea]:p-[9px_10px] [&_textarea]:text-[10px]" onSubmit={(event) => void saveItem(event)}>
				<h3>{editing ? "Edit menu item" : "Add a menu item"}</h3>
				<label>Menu<select name="menu" required defaultValue={editing?.menu ?? menus[0]?._id ?? ""}>{menus.map((menu) => <option key={menu._id} value={menu._id}>{menu.name}</option>)}</select></label>
				<label>Item name<input name="name" required defaultValue={editing?.name ?? ""} /></label>
				<label>Description<textarea name="description" rows={2} defaultValue={editing?.description ?? ""} /></label>
				<div className="grid grid-cols-2 gap-[11px] [&_label]:grid [&_label]:gap-[5px] [&_label]:text-[9px] [&_label]:font-semibold [&_label]:text-[#64675e] [&_input]:w-full [&_input]:rounded-[5px] [&_input]:border [&_input]:border-[#e8e9e3] [&_input]:bg-white [&_input]:p-[9px_10px] [&_input]:text-[10px] [&_select]:w-full [&_select]:rounded-[5px] [&_select]:border [&_select]:border-[#e8e9e3] [&_select]:bg-white [&_select]:p-[9px_10px] [&_select]:text-[10px] [&_textarea]:w-full [&_textarea]:rounded-[5px] [&_textarea]:border [&_textarea]:border-[#e8e9e3] [&_textarea]:bg-white [&_textarea]:p-[9px_10px] [&_textarea]:text-[10px] max-[680px]:grid-cols-1"><label>Price<input name="price" type="number" min="0" step="0.01" required defaultValue={editing?.price ?? ""} /></label><label>Preparation time (minutes)<input name="preparationTimeMinutes" type="number" min="1" defaultValue={editing?.preparationTimeMinutes ?? 15} /></label></div>
				<label>Image URL<input name="image" type="url" defaultValue={editing?.image ?? ""} /></label>
				<div className="flex flex-wrap gap-4 text-[10px] text-[#696c63] [&_label]:inline-flex [&_label]:items-center [&_label]:gap-[5px]"><label><input name="isAvailable" type="checkbox" defaultChecked={editing?.isAvailable ?? true} /> Available</label><label><input name="isFeatured" type="checkbox" defaultChecked={editing?.isFeatured ?? false} /> Featured</label></div>
				<div className="flex flex-wrap items-center gap-[7px] [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#e8e9e3] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[6px] [&_button]:text-[9px] [&_button]:text-[#657246]"><button className="justify-self-start rounded-[5px] bg-[#707e48] px-[13px] py-[9px] text-[10px] font-semibold text-white disabled:opacity-60" type="submit" disabled={busy === "item"}>{busy === "item" ? "Saving…" : "Save item"}</button><button type="button" onClick={() => { setFormOpen(false); setEditing(null); }}>Cancel</button></div>
			</form>}
			<div className="grid">{items.map((item) => <article className="flex min-w-0 items-center gap-3 border-b border-[#f0f0ed] py-[10px] px-[2px] last:border-0 max-[480px]:gap-2 max-[480px]:[&_button]:p-[5px] max-[480px]:[&_button]:text-[8px] [&>button]:rounded-[5px] [&>button]:border [&>button]:border-[#e8eadf] [&>button]:bg-[#fafbf7] [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[9px] [&>button]:font-semibold [&>button]:text-[#657246] [&>button]:disabled:opacity-50 [&>button]:disabled:cursor-wait [&>b]:text-[10px] [&>b]:text-[#464b39]" key={item._id}>
				<img className="h-11 w-12 shrink-0 rounded-md bg-[#eeece4] object-cover max-[480px]:size-[38px]" src={item.image || partnerImages.restaurant.menuItemFallback} alt="" />
				<div className="grid min-w-0 flex-1 gap-1 [&_strong]:truncate [&_strong]:text-[10px] [&_strong]:text-[#393c34] [&>span]:truncate [&>span]:text-[9px] [&>span]:text-[#85877f] [&_small]:truncate [&_small]:text-[9px] [&_small]:text-[#85877f]"><strong>{item.name}</strong><span>{item.description || "Menu item"}</span><small>{menus.find((menu) => menu._id === item.menu)?.name ?? "Menu"} · {item.isAvailable ? "Available" : "Unavailable"}</small></div>
				<b>{money(item.price, item.currency)}</b>
				<button type="button" disabled={busy === item._id} onClick={() => void toggleAvailability(item)}>{item.isAvailable ? "Pause item" : "Make available"}</button>
				<button type="button" aria-label={`Edit ${item.name}`} onClick={() => { setFormOpen(false); setEditing(item); }}><Pencil size={14} /></button>
				<button type="button" aria-label={`Remove ${item.name}`} disabled={busy === item._id} onClick={() => void removeItem(item)}><Trash2 size={14} /></button>
			</article>)}{!items.length && <div className="px-[14px] py-[22px] text-center text-[10px] text-[#898b82]">{menus.length ? "Add your first menu item." : "Create a menu before adding your first item."}</div>}</div>
		</section>}
	</div>;
}
