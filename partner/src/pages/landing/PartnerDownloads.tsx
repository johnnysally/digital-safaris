import { useEffect, useState } from "react";
import { Download, Monitor, HardDrive, Package, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import downloadApi from "../../api/downloadApi";
import { formatDate } from "../../utils/formatDate";
import type { PublicDownload } from "../../types";

export default function PartnerDownloads() {
  const [items, setItems] = useState<PublicDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    downloadApi
      .list()
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load downloads.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = items.length
    ? items
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )[0]
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/partner"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to partner home
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
          Desktop app
        </h1>
        <p className="text-sm text-[var(--text-soft)]">
          Download the Digital Safaris Partner app for Windows.
        </p>
      </header>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow-soft)]">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-strong)] text-[var(--gold)]">
            <Package className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold text-[var(--text)]">
            No builds available yet
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            The Windows installer isn't published yet. Check back soon.
          </p>
        </div>
      )}

      {!loading && latest && (
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/10 text-[var(--gold)]">
                <Monitor className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {latest.name}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Latest build · v{latest.version} · {latest.architecture}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" /> {latest.size}
                  </span>
                  {latest.minimumOs && (
                    <span className="inline-flex items-center gap-1">
                      <Monitor className="h-3.5 w-3.5" /> {latest.minimumOs}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />{" "}
                    {formatDate(latest.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <a
              href={latest.url}
              download
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--gold-soft)]"
            >
              <Download className="h-4 w-4" />
              Download installer
            </a>
          </div>

          {latest.releaseNotes && (
            <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Release notes
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--text)]">
                {latest.releaseNotes}
              </p>
            </div>
          )}

          {latest.checksum && (
            <div className="border-t border-[var(--border)] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                SHA-256 checksum
              </p>
              <p className="mt-2 break-all font-mono text-xs text-[var(--text-soft)]">
                {latest.checksum}
              </p>
            </div>
          )}
        </section>
      )}

      {!loading && items.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            All builds
          </h2>
          <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
            {items.map((item) => (
              <li
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-strong)] text-[var(--gold)]">
                    <Package className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      v{item.version} · {item.architecture} · {item.size}
                      {item.minimumOs ? ` · ${item.minimumOs}` : ""}
                    </p>
                  </div>
                </div>
                <a
                  href={item.url}
                  download
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[var(--gold)] transition-colors hover:bg-[var(--gold)] hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        Need help installing? Contact support at{" "}
        <a
          href="mailto:support@digitalsafaris.co.ke"
          className="font-medium text-[var(--gold)] underline"
        >
          support@digitalsafaris.co.ke
        </a>
        .
      </p>
    </div>
  );
}