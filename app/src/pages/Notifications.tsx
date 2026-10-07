import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Tabs from "../components/ui/Tabs";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import { notificationApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatRelative } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type { Notification } from "../types";

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "order", label: "Orders" },
  { key: "booking", label: "Bookings" },
  { key: "payment", label: "Payments" },
];

export default function Notifications() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
      };
      if (tab === "unread") params.isRead = false;
      if (["order", "booking", "payment"].includes(tab)) params.type = tab;

      const res = await notificationApi.list(params);
      setItems(res.data ?? []);
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toastError("Could not mark as read");
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toastSuccess("All notifications marked as read");
    } catch {
      toastError("Could not mark all as read");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await notificationApi.remove(id);
      setItems((prev) => prev.filter((n) => n._id !== id));
    } catch {
      toastError("Could not delete notification");
    }
  };

  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Check className="h-4 w-4" />}
            onClick={handleMarkAll}
          >
            Mark all read
          </Button>
        )}
      </div>

      <Tabs tabs={TABS} activeKey={tab} onChange={setTab} />

      {error && (
        <Alert variant="danger" title="Failed to load">
          {error}
        </Alert>
      )}

      <Card padded={false}>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="No notifications"
            description="You will see activity here as it happens."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n._id}
                className={
                  "flex items-start gap-3 px-4 py-3 " +
                  (!n.isRead ? "bg-secondary-50/40" : "")
                }
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {n.body}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatRelative(n.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="neutral">{capitalize(n.type)}</Badge>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n._id)}
                        className="text-xs text-secondary-600 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(n._id)}
                      className="ml-auto inline-flex items-center gap-1 text-xs text-text-muted hover:text-danger"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}