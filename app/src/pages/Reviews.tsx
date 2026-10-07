import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import { reviewApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatDate } from "../utils/formatDate";
import { capitalize, truncate } from "../utils/helpers";
import type { Review, PaginationMeta } from "../types";

export default function Reviews() {
  const { error: toastError } = useToast();
  const [rows, setRows] = useState<Review[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        targetType: targetType || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, targetType]);

  const handleDelete = async (id: string) => {
    try {
      await reviewApi.remove(id);
      fetchData();
    } catch {
      toastError("Could not delete review");
    }
  };

  const columns = useMemo<Column<Review>[]>(
    () => [
      {
        key: "targetType",
        header: "Type",
        render: (row) => (
          <Badge variant="neutral">{capitalize(row.targetType)}</Badge>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        render: (row) => (
          <span className="inline-flex items-center gap-1 text-sm text-text-primary">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  "h-3.5 w-3.5 " +
                  (i < row.rating ? "fill-secondary-500 text-secondary-500" : "text-text-muted")
                }
              />
            ))}
          </span>
        ),
      },
      {
        key: "comment",
        header: "Comment",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {truncate(row.comment, 60) || "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={row.status === "published" ? "success" : "neutral"}>
            {capitalize(row.status)}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Date",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        render: (row) => (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleDelete(row._id)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Reviews</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your reviews of restaurants, transports, and stays.
        </p>
      </div>

      <Card padded={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchData();
          }}
          className="flex flex-wrap gap-3 border-b border-border p-4"
        >
          <div className="min-w-[200px] flex-1">
            <Select
              placeholder="All types"
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(1);
              }}
              options={[
                { label: "Restaurants", value: "restaurant" },
                { label: "Transport", value: "transport" },
                { label: "Accommodation", value: "accommodation" },
              ]}
            />
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {error && (
          <div className="p-4">
            <Alert variant="danger" title="Failed to load">
              {error}
            </Alert>
          </div>
        )}

        <Table
          columns={columns}
          data={rows}
          loading={loading}
          rowKey={(r) => r._id}
        />

        {meta && meta.totalPages > 1 && (
          <div className="border-t border-border px-4">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}