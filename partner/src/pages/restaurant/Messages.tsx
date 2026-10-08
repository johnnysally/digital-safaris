import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

export function RestaurantMessagesPage() {
	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Messages</h1><span>Customer conversations and booking notes.</span></div></header>
		<section className="restaurant-card restaurant-empty-state"><MessageCircle size={25} /><h2>Restaurant messaging is not connected</h2><p>The restaurant API does not currently expose customer conversations. Review booking notes and order details from their respective pages.</p><div><Link to="/partner/restaurant/orders">View orders</Link><Link to="/partner/restaurant/bookings">View bookings</Link></div></section>
	</div>;
}
