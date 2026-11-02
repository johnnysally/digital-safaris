import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { RefObject } from "react";
import profileApi from "../../api/accommodation/profileApi";
import authApi from "../../api/accommodation/authApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/toastContext";

interface PartnerHeaderProps {
  onMenuClick: () => void;
  menuButtonRef: RefObject<HTMLButtonElement>;
  menuOpen: boolean;
  partner?: {
    name?: string;
    avatar?: string | null;
    logo?: string | null;
    email?: string | null;
    type?: string | null;
  } | null;
}

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  const parts = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    // Single word — take first two characters uppercase
    const word = name.trim();
    return word.slice(0, 2).toUpperCase() || "?";
  }
  return (parts[0] + parts[1]).toUpperCase();
}

function partnerSubtitle(): string {
  return "Accommodation Partner";
}

export function PartnerHeader({
  partner,
  onMenuClick,
  menuButtonRef,
  menuOpen,
}: PartnerHeaderProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<PartnerHeaderProps["partner"]>(
    partner ?? null,
  );
  const [menuOpenProfile, setMenuOpenProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (partner) {
      setProfile((current) => ({ ...(current ?? {}), ...partner }));
      return;
    }
    let cancelled = false;
    profileApi
      .get()
      .then((data) => {
        if (!cancelled && data?.partner) {
          setProfile((current) => ({ ...(current ?? {}), ...data.partner }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [partner]);

  useEffect(() => {
    if (!menuOpenProfile) return;
    function onPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setMenuOpenProfile(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpenProfile(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpenProfile]);

  async function handleSignOut() {
    setMenuOpenProfile(false);
    try {
      await authApi.logout();
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          "Unable to complete sign out with the server.",
        ),
        "error",
      );
    }
    signOut("accommodation");
    navigate("/partner/accommodation/login", { replace: true });
  }

  const displayName = useMemo(
    () => profile?.name?.trim() || "Partner",
    [profile?.name],
  );
  const initials = useMemo(() => initialsOf(displayName), [displayName]);
  const image = profile?.logo || profile?.avatar || null;

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

      <div className="ml-auto flex shrink-0 items-center gap-3 max-[760px]:gap-2">
        <Link
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e7d9c4] bg-[#f7eee0] text-[#75410f] shadow-sm transition hover:bg-[#f1e2ca] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          to="/partner/accommodation/notifications"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="h-[19px] w-[19px]" strokeWidth={2.2} />
          <span
            className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full border border-[#f7eee0] bg-[#d44b35]"
            aria-hidden="true"
          />
        </Link>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpenProfile((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpenProfile}
            aria-label={`Account menu for ${displayName}`}
            className="flex items-center gap-2.5 rounded-full p-1 transition hover:bg-[#f1e2ca]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            {image ? (
              <img
                className="h-[38px] w-[38px] shrink-0 rounded-full border border-[#e7d9c4] bg-[#eee0c9] object-cover"
                src={image}
                alt=""
              />
            ) : (
              <span
                className="grid h-[38px] w-[38px] place-items-center rounded-full border border-[#e7d9c4] bg-gradient-to-br from-[#e9d5ad] to-[#d6a26a] text-[12px] font-bold text-[#644421]"
                aria-hidden="true"
              >
                {initials}
              </span>
            )}
            <div className="text-left max-[760px]:hidden">
              <strong className="block max-w-[160px] truncate text-[13px] font-semibold text-[#2b2017]">
                {displayName}
              </strong>
              <span className="block text-[10px] text-[var(--text-soft)]">
                {partnerSubtitle()}
              </span>
            </div>
            <ChevronDown
              className={`text-[#7c6552] transition-transform max-[760px]:hidden ${
                menuOpenProfile ? "rotate-180" : ""
              }`}
              size={15}
            />
          </button>

          {menuOpenProfile ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[220px] overflow-hidden rounded-xl border border-[#e9dfd1] bg-white shadow-[0_12px_30px_rgba(54,37,20,.12)]"
            >
              <div className="border-b border-[#f0e9df] px-4 py-3">
                <p className="m-0 truncate text-sm font-semibold text-[#2b2017]">
                  {displayName}
                </p>
                {profile?.email ? (
                  <p className="m-0 mt-0.5 truncate text-[11px] text-[#81766a]">
                    {profile.email}
                  </p>
                ) : null}
              </div>
              <Link
                to="/partner/accommodation/profile"
                role="menuitem"
                onClick={() => setMenuOpenProfile(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#3c322b] no-underline transition hover:bg-[#fbf3e7]"
              >
                <UserRound size={15} />
                Profile
              </Link>
              <Link
                to="/partner/accommodation/profile"
                role="menuitem"
                onClick={() => setMenuOpenProfile(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#3c322b] no-underline transition hover:bg-[#fbf3e7]"
              >
                <Settings size={15} />
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-2 border-t border-[#f0e9df] bg-white px-4 py-2.5 text-left text-[13px] text-[#8c3a30] transition hover:bg-[#fff4f1]"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}