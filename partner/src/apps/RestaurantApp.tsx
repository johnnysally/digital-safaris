import { Link } from "react-router-dom";
import { ArrowLeft, Utensils } from "lucide-react";

export default function RestaurantApp() {
	return (
		<main className="partner-app-unavailable">
			<Link to="/partner" className="partner-app-back"><ArrowLeft size={15} /> All partner workspaces</Link>
			<div className="partner-app-unavailable-content">
				<span className="partner-app-mark"><Utensils size={24} /></span>
				<p className="eyebrow">Restaurant Partner</p>
				<h1>Restaurant workspace</h1>
				<p>This app has a reserved access URL, but its partner screens are not implemented in this workspace yet.</p>
				<code>/partner/restaurant</code>
			</div>
		</main>
	);
}
