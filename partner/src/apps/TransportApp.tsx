import { Link } from "react-router-dom";
import { ArrowLeft, BusFront } from "lucide-react";

export default function TransportApp() {
	return (
		<main className="partner-app-unavailable">
			<Link to="/partner" className="partner-app-back"><ArrowLeft size={15} /> All partner workspaces</Link>
			<div className="partner-app-unavailable-content">
				<span className="partner-app-mark"><BusFront size={24} /></span>
				<p className="eyebrow">Transport Partner</p>
				<h1>Transport workspace</h1>
				<p>This app has a reserved access URL, but its partner screens are not implemented in this workspace yet.</p>
				<code>/partner/transport</code>
			</div>
		</main>
	);
}
