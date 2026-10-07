import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Switch from "../components/ui/Switch";
import Badge from "../components/ui/Badge";
import Dropdown from "../components/ui/Dropdown";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Alert from "../components/ui/Alert";
import { backupApi, settingApi } from "../api";
import { useToast } from "../context/toastContext";
import { formatDateTime } from "../utils/formatDate";
import { fileSize, capitalize } from "../utils/helpers";
import type { Backup as BackupType, BackupSettings } from "../types";

const EMPTY_SETTINGS: BackupSettings = {
  enabled: false,
  frequency: "daily",
  time: "02:00",
  retentionDays: 30,
  notifyEmail: "",
};

function statusVariant(status: BackupType["status"]) {
  if (status === "ready") return "success" as const;
  if (status === "processing") return "warning" as const;
  return "danger" as const;
}

export default function Backup() {
  const { success, error: toastError, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backups, setBackups] = useState<BackupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [settings, setSettings] = useState<BackupSettings>(EMPTY_SETTINGS);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BackupType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState<BackupType | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backupApi.list();
      setBackups(data ?? []);
    } catch {
      setError("Could not load backups.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await settingApi.getBackupSettings();
      setSettings({ ...EMPTY_SETTINGS, ...data });
    } catch {
      /* keep defaults */
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchSettings();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await backupApi.create();
      success("Backup created");
      fetchBackups();
    } catch {
      toastError("Could not create backup");
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await backupApi.upload(file);
      success("Backup uploaded");
      fetchBackups();
    } catch {
      toastError("Could not upload backup");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (target: BackupType) => {
    try {
      const blob = await backupApi.download(target.filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = target.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      success("Download started");
    } catch {
      toastError("Could not download backup");
    }
  };

  const handleEmail = async (target: BackupType) => {
    try {
      await backupApi.email(target.filename);
      success("Backup emailed");
    } catch {
      toastError("Could not email backup");
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      await backupApi.restore(restoreTarget.filename);
      success("Restore started", "The database is being restored.");
      setRestoreTarget(null);
    } catch {
      toastError("Could not restore backup");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await backupApi.remove(deleteTarget.filename);
      success("Backup deleted");
      setDeleteTarget(null);
      fetchBackups();
    } catch {
      toastError("Could not delete backup");
    } finally {
      setDeleteLoading(false);
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await settingApi.updateBackupSettings(settings);
      success("Backup settings saved");
    } catch {
      toastError("Could not save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  const columns = useMemo<Column<BackupType>[]>(
    () => [
      {
        key: "filename",
        header: "Filename",
        render: (row) => (
          <span className="font-mono text-xs text-text-primary">
            {row.filename}
          </span>
        ),
      },
      {
        key: "size",
        header: "Size",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {fileSize(row.size)}
          </span>
        ),
      },
      {
        key: "type",
        header: "Type",
        render: (row) => (
          <Badge variant="neutral">{capitalize(row.type)}</Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={statusVariant(row.status)}>
            {capitalize(row.status)}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {formatDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        render: (row) => (
          <div className="flex justify-end">
            <Dropdown
              trigger={
                <span className="rounded-md px-2 py-1 text-text-muted hover:bg-surface-alt">
                  ⋯
                </span>
              }
              items={[
                {
                  key: "download",
                  label: "Download",
                  onClick: () => handleDownload(row),
                },
                {
                  key: "email",
                  label: "Email",
                  onClick: () => handleEmail(row),
                },
                {
                  key: "restore",
                  label: "Restore",
                  danger: true,
                  onClick: () => setRestoreTarget(row),
                },
                {
                  key: "delete",
                  label: "Delete",
                  danger: true,
                  onClick: () => setDeleteTarget(row),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Backup</h1>
          <p className="mt-1 text-sm text-text-muted">
            Database backup management
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
          <Button size="sm" loading={creating} onClick={handleCreate}>
            + Create backup
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Failed to load">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Backups" padded={false}>
            <Table
              columns={columns}
              data={backups}
              loading={loading}
              rowKey={(r) => r.filename}
            />
          </Card>
        </div>

        <Card
          title="Auto backup"
          actions={
            <Button size="sm" loading={settingsSaving} onClick={saveSettings}>
              Save
            </Button>
          }
        >
          <div className="space-y-4">
            <Switch
              checked={settings.enabled}
              onChange={(v) => setSettings({ ...settings, enabled: v })}
              label="Enable auto backup"
              description="Automatically create backups on schedule"
            />
            <Select
              label="Frequency"
              value={settings.frequency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  frequency: e.target.value as BackupSettings["frequency"],
                })
              }
              options={[
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
              ]}
              disabled={!settings.enabled}
            />
            <Input
              label="Time (HH:mm)"
              type="time"
              value={settings.time}
              onChange={(e) =>
                setSettings({ ...settings, time: e.target.value })
              }
              disabled={!settings.enabled}
            />
            <Input
              label="Retention (days)"
              type="number"
              min={1}
              value={settings.retentionDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  retentionDays: Number(e.target.value) || 1,
                })
              }
              disabled={!settings.enabled}
            />
            <Input
              label="Notify email"
              type="email"
              value={settings.notifyEmail ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, notifyEmail: e.target.value })
              }
              disabled={!settings.enabled}
              helper="We'll email when a backup completes or fails."
            />
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore from backup?"
        description={
          restoreTarget
            ? `This will overwrite the current database with "${restoreTarget.filename}". Data created after this backup will be lost.`
            : ""
        }
        confirmText="Restore"
        variant="danger"
        loading={restoreLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete backup?"
        description={
          deleteTarget
            ? `"${deleteTarget.filename}" will be permanently removed.`
            : ""
        }
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}