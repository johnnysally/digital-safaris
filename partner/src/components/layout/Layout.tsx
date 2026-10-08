import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PartnerSidebar } from "./Sidebar";
import { PartnerHeader } from "./Header";
import { usePartnerSocket } from "../../context/socketContext";

interface AccommodationPartnerLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AccommodationPartnerLayout({ children, className = "" }: AccommodationPartnerLayoutProps) {
  usePartnerSocket("accommodation");
  return (
    <div className={`flex min-h-screen bg-[var(--bg)] ${className}`.trim()}>
      <PartnerSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-[rgba(243,235,223,0.96)]">
        <PartnerHeader />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1460px] px-6 pb-[42px] pt-[26px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-[22px] flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="m-0 font-serif text-[clamp(2rem,2.2vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-[#2d251f]">{title}</h1>
        <p className="mt-2 text-[0.9rem] font-medium text-[#6d625a]">{subtitle}</p>
      </div>
      {action ? <div className="flex items-center">{action}</div> : null}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  tone?: "positive" | "neutral";
}

export function KpiCard({ label, value, change, tone = "neutral" }: KpiCardProps) {
  const isPositive = tone === "positive";

  return (
    <div className="min-h-[138px] rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,255,255,0.2)] px-[18px] pb-4 pt-[18px] shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
      <div className="mb-3 flex items-center justify-between text-[0.72rem] font-semibold text-[#736960]">
        <span>{label}</span>
        {isPositive ? <ArrowUpRight size={16} className="text-[var(--success)]" /> : <ArrowDownRight size={16} className="text-[var(--text-soft)]" />}
      </div>
      <div className="mb-2 text-[clamp(2.1rem,1.9vw,2.6rem)] font-bold tracking-[-0.06em] text-[#2a221d]">{value}</div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(95,125,93,0.12)] px-2 py-[0.3rem] text-[0.72rem] font-bold text-[var(--success)]">{change}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const color = ["confirmed", "active"].includes(normalized)
    ? "bg-[rgba(95,125,93,0.12)] text-[var(--success)]"
    : ["pending"].includes(normalized)
      ? "bg-[rgba(181,125,43,0.12)] text-[var(--warning)]"
      : ["cancelled", "paused"].includes(normalized)
        ? "bg-[rgba(168,92,82,0.1)] text-[var(--danger)]"
        : "bg-stone-500/10 text-[var(--text-soft)]";
  return <span className={`inline-flex items-center justify-center rounded-full px-[0.62rem] py-[0.38rem] text-[0.72rem] font-bold ${color}`}>{status}</span>;
}

export function ApiFeedback({ loading, error, onRetry }: { loading: boolean; error: string; onRetry?: () => void }) {
  if (loading) return <div className="mb-3.5 flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-[13px] py-[11px] text-[0.82rem] text-[var(--text-soft)]" role="status">Loading your latest data...</div>;
  if (!error) return null;

  return (
    <div className="mb-3.5 flex items-center justify-between gap-3 rounded-lg border border-[rgba(168,92,82,0.28)] bg-[rgba(168,92,82,0.07)] px-[13px] py-[11px] text-[0.82rem] text-[#8e443b]" role="alert">
      <span>{error}</span>
      {onRetry ? <button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-transparent px-2 py-1 font-bold text-[var(--gold)] underline" onClick={onRetry}>Retry</button> : null}
    </div>
  );
}
