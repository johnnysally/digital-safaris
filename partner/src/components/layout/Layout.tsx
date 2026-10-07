import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PartnerSidebar } from "./Sidebar";
import { PartnerHeader } from "./Header";

interface AccommodationPartnerLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AccommodationPartnerLayout({ children, className = "" }: AccommodationPartnerLayoutProps) {
  return (
    <div className={`accommodation-app-shell ${className}`.trim()}>
      <PartnerSidebar />
      <div className="workspace-shell">
        <PartnerHeader />
        <main className="content-area">
          <div className="content-inner">{children}</div>
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
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
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
    <div className="card kpi-card">
      <div className="kpi-label-row">
        <span>{label}</span>
        {isPositive ? <ArrowUpRight size={16} className="kpi-icon positive" /> : <ArrowDownRight size={16} className="kpi-icon" />}
      </div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-change ${isPositive ? "positive" : ""}`}>{change}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  return <span className={`status-badge ${normalized}`}>{status}</span>;
}

export function ApiFeedback({ loading, error, onRetry }: { loading: boolean; error: string; onRetry?: () => void }) {
  if (loading) return <div className="api-feedback" role="status">Loading your latest data...</div>;
  if (!error) return null;

  return (
    <div className="api-feedback error" role="alert">
      <span>{error}</span>
      {onRetry ? <button type="button" className="text-button" onClick={onRetry}>Retry</button> : null}
    </div>
  );
}
