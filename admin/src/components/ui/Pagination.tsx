import { classNames } from "../../utils/helpers";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  const add = (v: number | "…") => pages.push(v);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (page > 3) add("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      add(i);
    }
    if (page < totalPages - 2) add("…");
    add(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary transition hover:bg-surface-alt disabled:opacity-50"
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={classNames(
              "min-w-[2rem] rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors",
              p === page
                ? "bg-secondary-500 text-white"
                : "text-text-secondary hover:bg-surface-alt"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary transition hover:bg-surface-alt disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}