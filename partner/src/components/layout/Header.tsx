import { Bell, ChevronDown, Search } from "lucide-react";

export function PartnerHeader() {
  return (
    <header className="top-header">
      <div className="search-wrap">
        <Search size={16} />
        <input aria-label="Search anything" placeholder="Search anything..." />
      </div>

      <div className="top-header-actions">
        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={17} />
        </button>

        <div className="profile-chip">
          <div className="avatar-mini" aria-label="Serengeti Lodge" />
          <div>
            <strong>Serengeti Lodge</strong>
            <span>Accommodation Partner</span>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}
