import Button from "./Button";
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

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      <Button
        size="sm"
        variant="ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </Button>
      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const gap = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-text-muted">…</span>}
            <button
              type="button"
              onClick={() => onChange(p)}
              className={classNames(
                "min-w-[32px] rounded-md px-2 py-1 text-xs font-medium",
                p === page
                  ? "bg-secondary-500 text-white"
                  : "text-text-primary hover:bg-surface-alt"
              )}
            >
              {p}
            </button>
          </span>
        );
      })}
      <Button
        size="sm"
        variant="ghost"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}