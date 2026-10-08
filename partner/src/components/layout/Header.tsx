import { Bell, ChevronDown, Search } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function PartnerHeader() {
  return (
    <header className="flex min-h-[88px] items-center justify-between gap-5 border-b border-stone-500/15 bg-[#faf6ef]/95 px-6 py-4 backdrop-blur md:px-[34px]">
      <label className="flex h-12 min-w-0 max-w-[560px] flex-1 items-center gap-2.5 rounded-[14px] border border-stone-500/20 bg-white/35 px-3.5 text-stone-500 focus-within:border-amber-700/60 focus-within:ring-2 focus-within:ring-amber-700/10 sm:min-w-[340px]">
        <Search size={16} aria-hidden="true" />
        <Input
          aria-label="Search anything"
          placeholder="Search anything..."
          className="border-0 bg-transparent px-0 shadow-none focus:border-0 focus:ring-0"
        />
      </label>

      <div className="flex shrink-0 items-center gap-3.5">
        <Button variant="secondary" className="h-[42px] min-h-[42px] w-[42px] rounded-xl p-0" aria-label="Notifications">
          <Bell size={17} />
        </Button>

        <div className="flex items-center gap-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2">
          <div className="h-[38px] w-[38px] rounded-full bg-gradient-to-br from-[#e9d5ad] to-[#d6a26a]" aria-label="Serengeti Lodge" />
          <div>
            <strong className="block text-sm">Serengeti Lodge</strong>
            <span className="block text-xs text-[var(--text-soft)]">Accommodation Partner</span>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}
