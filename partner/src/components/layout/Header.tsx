import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { RefObject } from "react";
import { Input } from "../ui/Input";

interface PartnerHeaderProps {
  onMenuClick: () => void;
  menuButtonRef: RefObject<HTMLButtonElement>;
  menuOpen: boolean;
  partner?: {
    name?: string;
    avatar?: string | null;
    logo?: string | null;
  };
}

export function PartnerHeader({ partner, onMenuClick, menuButtonRef, menuOpen }: PartnerHeaderProps) {
  const partnerName = partner?.name || "Serengeti Lodge";
  const avatar = partner?.avatar || partner?.logo;

  return (
    <header className="flex min-h-[60px] items-center justify-between gap-5 border-b border-stone-500/15 bg-[#faf6ef]/95 px-5 py-2 backdrop-blur max-[760px]:gap-3 max-[760px]:px-3">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        aria-controls="accommodation-sidebar"
        aria-expanded={menuOpen}
        className="hidden size-10 shrink-0 items-center justify-center rounded-lg border border-[#e7d9c4] bg-white/70 text-[#593a20] transition hover:bg-[#f7eee0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 max-[760px]:inline-flex"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <label className="flex h-[36px] min-w-0 max-w-[560px] flex-1 items-center gap-2.5 rounded-full border border-stone-500/20 bg-white/35 px-3.5 text-stone-500 focus-within:border-amber-700/60 focus-within:ring-2 focus-within:ring-amber-700/10 sm:min-w-[260px] max-[480px]:sm:min-w-0">
        <Search size={16} aria-hidden="true" />
        <Input
          aria-label="Search anything"
          placeholder="Search anything..."
          className="border-0 bg-transparent px-0 text-xs shadow-none focus:border-0 focus:ring-0"
        />
      </label>

      <div className="flex shrink-0 items-center gap-3 max-[760px]:gap-2">
        <Link
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e7d9c4] bg-[#f7eee0] text-[#75410f] shadow-sm transition hover:bg-[#f1e2ca] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          to="/partner/accommodation/notifications"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="h-[19px] w-[19px]" strokeWidth={2.2} />
          <span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full border border-[#f7eee0] bg-[#d44b35]" aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-2.5">
          {avatar ? (
            <img className="h-[34px] w-[34px] rounded-full bg-[#eee0c9] object-cover" src={avatar} alt="" />
          ) : (
            <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-gradient-to-br from-[#e9d5ad] to-[#d6a26a] text-xs font-bold text-[#644421]" aria-hidden="true">
              {partnerName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="max-[480px]:hidden">
            <strong className="block max-w-[180px] truncate text-xs">{partnerName}</strong>
            <span className="block text-[10px] text-[var(--text-soft)]">Accommodation Partner</span>
          </div>
          <ChevronDown className="max-[480px]:hidden" size={15} />
        </div>
      </div>
    </header>
  );
}
