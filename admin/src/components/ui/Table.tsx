import type { ReactNode } from "react";
import { classNames } from "../../utils/helpers";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: ReactNode;
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function Table<T extends object>({
  columns,
  data,
  loading,
  emptyState,
  rowKey,
  onRowClick,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-6">
        {emptyState ?? <EmptyState title="No data" />}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-alt/75 text-left text-[10px] font-semibold uppercase tracking-[.12em] text-text-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={classNames(
                  "border-b border-border px-4 py-3.5 font-semibold",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={rowKey ? rowKey(row) : idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={classNames(
                "border-b border-border/75 transition-colors last:border-0 even:bg-surface-alt/20 hover:bg-surface-alt/70",
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={classNames("px-4 py-3.5 align-middle", col.className)}
                >
                  {col.render
                    ? col.render(row)
                    : (row[col.key as keyof T] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}