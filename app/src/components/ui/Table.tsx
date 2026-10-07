import type { ReactNode } from "react";
import { classNames } from "../../utils/helpers";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: ReactNode;
  rowKey: (row: T) => string;
}

export default function Table<T>({
  columns,
  data,
  loading,
  emptyState,
  rowKey,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded bg-surface-alt"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4">
        {emptyState || (
          <p className="py-6 text-center text-sm text-text-muted">
            No records
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-surface-alt text-[11px] uppercase tracking-wider text-text-muted">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={classNames("px-4 py-3 font-medium", c.className)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-surface-alt">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={classNames("px-4 py-3 align-middle", c.className)}
                >
                  {c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}