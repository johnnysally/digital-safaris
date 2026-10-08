import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

export function RestaurantMessagesPage() {
	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Messages</h1><span>Customer conversations and booking notes.</span></div></header>
		<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] grid justify-items-center gap-3 p-6 text-center [&>svg]:text-[#718044] [&_h2]:m-0 [&_h2]:text-base [&_p]:m-0 [&_p]:max-w-2xl [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#85877e] [&>div]:flex [&>div]:flex-wrap [&>div]:justify-center [&>div]:gap-2 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:rounded [&_a]:bg-[#707e48] [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:text-white [&_a]:no-underline"><MessageCircle size={25} /><h2>Restaurant messaging is not connected</h2><p>The restaurant API does not currently expose customer conversations. Review booking notes and order details from their respective pages.</p><div><Link to="/partner/restaurant/orders">View orders</Link><Link to="/partner/restaurant/bookings">View bookings</Link></div></section>
	</div>;
}
