import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Textarea from "../components/ui/Textarea";
import Switch from "../components/ui/Switch";
import Badge from "../components/ui/Badge";
import Table, { type Column } from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Dropdown from "../components/ui/Dropdown";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import { settingApi, locationApi, downloadApi } from "../api";
import { useToast } from "../context/toastContext";
import { isUrl } from "../utils/validators";
import { formatDate } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type {
  GeneralSettings,
  BroadcastSettings,
  CommissionSettings,
  LegalType,
  LegalDocument,
  Location,
  LocationType,
  DownloadItem,
  DownloadPlatform,
} from "../types";

const TABS = [
  { key: "general", label: "General" },
  { key: "broadcast", label: "Broadcast" },
  { key: "commission", label: "Commission" },
  { key: "legal", label: "Legal" },
  { key: "locations", label: "Locations" },
  { key: "downloads", label: "Downloads" },
];

const EMPTY_GENERAL: GeneralSettings = {
  appName: "",
  apiUrl: "",
  appUrl: "",
  clientUrl: "",
  adminUrl: "",
  partnerUrl: "",
  websiteUrl: "",
  timezone: "Africa/Nairobi",
  currency: "KES",
  language: "en",
  supportEmail: "",
  supportPhone: "",
  logoUrl: "",
};

const EMPTY_BROADCAST: BroadcastSettings = {
  radiusKm: 5,
  expirySeconds: 60,
};

const EMPTY_COMMISSION: CommissionSettings = {
  defaultRate: 10,
  byService: {
    accommodation: 10,
    food: 10,
    transport: 10,
    dinein: 10,
  },
};

const LEGAL_TYPES: LegalType[] = ["terms", "privacy", "cookies"];
const LOCATION_TYPES: LocationType[] = [
  "country",
  "county",
  "town",
  "city",
  "area",
];
const DOWNLOAD_PLATFORMS: DownloadPlatform[] = [
  "windows",
  "macos",
  "linux",
  "android",
  "ios",
  "web",
  "other",
];

interface LocationForm {
  name: string;
  type: LocationType;
  countryCode: string;
  county: string;
  latitude: string;
  longitude: string;
  radiusKm: number;
  timezone: string;
  currency: string;
  isOperational: boolean;
  isDefault: boolean;
}

const EMPTY_LOCATION_FORM: LocationForm = {
  name: "",
  type: "town",
  countryCode: "KE",
  county: "",
  latitude: "",
  longitude: "",
  radiusKm: 10,
  timezone: "Africa/Nairobi",
  currency: "KES",
  isOperational: true,
  isDefault: false,
};

interface DownloadForm {
  name: string;
  platform: DownloadPlatform;
  architecture: string;
  version: string;
  size: string;
  url: string;
  minimumOs: string;
  checksum: string;
  releaseNotes: string;
  available: boolean;
}

const EMPTY_DOWNLOAD_FORM: DownloadForm = {
  name: "",
  platform: "windows",
  architecture: "x64",
  version: "",
  size: "",
  url: "",
  minimumOs: "",
  checksum: "",
  releaseNotes: "",
  available: true,
};

export default function Settings() {
  const { success, error: toastError } = useToast();
  const [tab, setTab] = useState("general");

  const [general, setGeneral] = useState<GeneralSettings>(EMPTY_GENERAL);
  const [generalLoading, setGeneralLoading] = useState(true);
  const [generalSaving, setGeneralSaving] = useState(false);

  const [broadcast, setBroadcast] = useState<BroadcastSettings>(EMPTY_BROADCAST);
  const [broadcastSaving, setBroadcastSaving] = useState(false);

  const [commission, setCommission] = useState<CommissionSettings>(
    EMPTY_COMMISSION
  );
  const [commissionLoading, setCommissionLoading] = useState(true);
  const [commissionSaving, setCommissionSaving] = useState(false);

  const [legalType, setLegalType] = useState<LegalType>("terms");
  const [legal, setLegal] = useState<Record<LegalType, LegalDocument | null>>({
    terms: null,
    privacy: null,
    cookies: null,
  });
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalSaving, setLegalSaving] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [locationTypeFilter, setLocationTypeFilter] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [locationEditing, setLocationEditing] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState<LocationForm>(
    EMPTY_LOCATION_FORM
  );
  const [locationFormSaving, setLocationFormSaving] = useState(false);
  const [locationDeleteTarget, setLocationDeleteTarget] =
    useState<Location | null>(null);
  const [locationDeleteLoading, setLocationDeleteLoading] = useState(false);

  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [downloadsLoading, setDownloadsLoading] = useState(false);
  const [downloadsError, setDownloadsError] = useState<string | null>(null);
  const [downloadPlatformFilter, setDownloadPlatformFilter] = useState("");
  const [downloadFormOpen, setDownloadFormOpen] = useState(false);
  const [downloadEditing, setDownloadEditing] = useState<DownloadItem | null>(
    null
  );
  const [downloadForm, setDownloadForm] = useState<DownloadForm>(
    EMPTY_DOWNLOAD_FORM
  );
  const [downloadSaving, setDownloadSaving] = useState(false);
  const [downloadDeleteTarget, setDownloadDeleteTarget] =
    useState<DownloadItem | null>(null);
  const [downloadDeleteLoading, setDownloadDeleteLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setGeneralLoading(true);
      setCommissionLoading(true);

      try {
        const list = await settingApi.list();
        const map: Record<string, unknown> = {};
        list.forEach((s) => {
          map[s.key] = s.value;
        });
        if (map.general && typeof map.general === "object") {
          setGeneral({ ...EMPTY_GENERAL, ...(map.general as GeneralSettings) });
        }
        if (map.broadcast && typeof map.broadcast === "object") {
          setBroadcast({
            ...EMPTY_BROADCAST,
            ...(map.broadcast as BroadcastSettings),
          });
        }
      } catch {
        toastError("Could not load settings", "Using defaults.");
      } finally {
        setGeneralLoading(false);
      }

      try {
        const c = await settingApi.getCommission();
        setCommission({
          defaultRate: c?.defaultRate ?? EMPTY_COMMISSION.defaultRate,
          byService: {
            ...EMPTY_COMMISSION.byService,
            ...(c?.byService || {}),
          },
        });
      } catch {
        /* defaults */
      } finally {
        setCommissionLoading(false);
      }
    };
    load();
  }, [toastError]);

  const fetchLocations = async () => {
    setLocationsLoading(true);
    setLocationsError(null);
    try {
      const items = await locationApi.list({
        type: (locationTypeFilter || undefined) as LocationType | undefined,
        search: locationSearch || undefined,
      });
      setLocations(items);
    } catch {
      setLocationsError("Could not load locations.");
    } finally {
      setLocationsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "locations") {
      fetchLocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, locationTypeFilter]);

  const fetchDownloads = async () => {
    setDownloadsLoading(true);
    setDownloadsError(null);
    try {
      const items = await downloadApi.list({
        platform: downloadPlatformFilter || undefined,
      });
      setDownloads(items);
    } catch {
      setDownloadsError("Could not load downloads.");
    } finally {
      setDownloadsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "downloads") {
      fetchDownloads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, downloadPlatformFilter]);

  const saveGeneral = async () => {
    const urls: Array<[string, string | undefined]> = [
      ["API URL", general.apiUrl],
      ["App URL", general.appUrl],
      ["Client URL", general.clientUrl],
      ["Admin URL", general.adminUrl],
      ["Partner URL", general.partnerUrl],
      ["Website URL", general.websiteUrl],
    ];

    for (const [label, value] of urls) {
      if (value && !isUrl(value)) {
        toastError(
          `Invalid ${label}`,
          "Must be a valid URL including protocol."
        );
        return;
      }
    }

    setGeneralSaving(true);
    try {
      await settingApi.upsert({ key: "general", value: general });
      success("General settings saved");
    } catch {
      toastError("Could not save general settings");
    } finally {
      setGeneralSaving(false);
    }
  };

  const saveBroadcast = async () => {
    setBroadcastSaving(true);
    try {
      await settingApi.upsert({ key: "broadcast", value: broadcast });
      success("Broadcast settings saved");
    } catch {
      toastError("Could not save broadcast settings");
    } finally {
      setBroadcastSaving(false);
    }
  };

  const saveCommission = async () => {
    const values = Object.values(commission.byService);
    if (values.some((v) => v < 0 || v > 100)) {
      toastError("Invalid rate", "Rates must be between 0 and 100.");
      return;
    }
    setCommissionSaving(true);
    try {
      await settingApi.updateCommission(commission);
      success("Commission settings saved");
    } catch {
      toastError("Could not save commission settings");
    } finally {
      setCommissionSaving(false);
    }
  };

  const setServiceRate = (
    key: keyof CommissionSettings["byService"],
    value: number
  ) => {
    setCommission((prev) => ({
      ...prev,
      byService: { ...prev.byService, [key]: value },
    }));
  };

  const loadLegal = async (type: LegalType) => {
    setLegalLoading(true);
    try {
      const doc = await settingApi.getLegal(type);
      setLegal((prev) => ({
        ...prev,
        [type]: {
          _id: doc._id ?? type,
          type,
          title: doc.title ?? "",
          content: doc.content ?? "",
          updatedAt: doc.updatedAt ?? new Date().toISOString(),
        },
      }));
    } catch {
      setLegal((prev) => ({
        ...prev,
        [type]: {
          _id: type,
          type,
          title: "",
          content: "",
          updatedAt: new Date().toISOString(),
        },
      }));
    } finally {
      setLegalLoading(false);
    }
  };

  const saveLegal = async () => {
    const doc = legal[legalType];
    if (!doc) return;
    setLegalSaving(true);
    try {
      const saved = await settingApi.upsertLegal({
        type: legalType,
        title: doc.title,
        content: doc.content,
      });
      setLegal((prev) => ({
        ...prev,
        [legalType]: {
          _id: saved._id ?? legalType,
          type: legalType,
          title: saved.title ?? doc.title,
          content: saved.content ?? doc.content,
          updatedAt: saved.updatedAt ?? new Date().toISOString(),
        },
      }));
      success("Legal document saved");
    } catch {
      toastError("Could not save legal document");
    } finally {
      setLegalSaving(false);
    }
  };

  useEffect(() => {
    if (tab === "legal" && !legal[legalType]) {
      loadLegal(legalType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, legalType]);

  const openLocationCreate = () => {
    setLocationEditing(null);
    setLocationForm(EMPTY_LOCATION_FORM);
    setLocationFormOpen(true);
  };

  const openLocationEdit = (loc: Location) => {
    setLocationEditing(loc);
    setLocationForm({
      name: loc.name,
      type: loc.type,
      countryCode: loc.countryCode,
      county: loc.county ?? "",
      latitude: loc.latitude != null ? String(loc.latitude) : "",
      longitude: loc.longitude != null ? String(loc.longitude) : "",
      radiusKm: loc.radiusKm ?? 10,
      timezone: loc.timezone || "Africa/Nairobi",
      currency: loc.currency || "KES",
      isOperational: loc.isOperational,
      isDefault: loc.isDefault,
    });
    setLocationFormOpen(true);
  };

  const closeLocationForm = () => {
    setLocationFormOpen(false);
    setLocationEditing(null);
    setLocationForm(EMPTY_LOCATION_FORM);
  };

  const saveLocationForm = async () => {
    if (!locationForm.name.trim()) {
      toastError("Name is required");
      return;
    }
    if (!locationForm.countryCode.trim()) {
      toastError("Country code is required");
      return;
    }

    const payload = {
      name: locationForm.name.trim(),
      type: locationForm.type,
      countryCode: locationForm.countryCode.trim().toUpperCase(),
      county: locationForm.county.trim() || null,
      latitude: locationForm.latitude ? Number(locationForm.latitude) : null,
      longitude: locationForm.longitude ? Number(locationForm.longitude) : null,
      radiusKm: Number(locationForm.radiusKm) || 10,
      timezone: locationForm.timezone,
      currency: locationForm.currency,
      isOperational: locationForm.isOperational,
      isDefault: locationForm.isDefault,
    };

    setLocationFormSaving(true);
    try {
      if (locationEditing) {
        await locationApi.update(locationEditing._id, payload);
        success("Location updated");
      } else {
        await locationApi.create(payload);
        success("Location created");
      }
      closeLocationForm();
      fetchLocations();
    } catch {
      toastError("Could not save location");
    } finally {
      setLocationFormSaving(false);
    }
  };

  const toggleLocationOperational = async (loc: Location) => {
    try {
      const { isOperational } = await locationApi.toggleOperational(loc._id);
      setLocations((prev) =>
        prev.map((r) => (r._id === loc._id ? { ...r, isOperational } : r))
      );
      success(isOperational ? "Marked operational" : "Marked not operational");
    } catch {
      toastError("Could not update status");
    }
  };

  const deleteLocation = async () => {
    if (!locationDeleteTarget) return;
    setLocationDeleteLoading(true);
    try {
      await locationApi.remove(locationDeleteTarget._id);
      success("Location deleted");
      setLocationDeleteTarget(null);
      fetchLocations();
    } catch {
      toastError("Could not delete location");
    } finally {
      setLocationDeleteLoading(false);
    }
  };

  const openDownloadCreate = () => {
    setDownloadEditing(null);
    setDownloadForm(EMPTY_DOWNLOAD_FORM);
    setDownloadFormOpen(true);
  };

  const openDownloadEdit = (item: DownloadItem) => {
    setDownloadEditing(item);
    setDownloadForm({
      name: item.name,
      platform: item.platform,
      architecture: item.architecture,
      version: item.version,
      size: item.size,
      url: item.url,
      minimumOs: item.minimumOs ?? "",
      checksum: item.checksum ?? "",
      releaseNotes: item.releaseNotes ?? "",
      available: item.available,
    });
    setDownloadFormOpen(true);
  };

  const closeDownloadForm = () => {
    setDownloadFormOpen(false);
    setDownloadEditing(null);
    setDownloadForm(EMPTY_DOWNLOAD_FORM);
  };

  const saveDownload = async () => {
    if (!downloadForm.name.trim()) {
      toastError("Name is required");
      return;
    }
    if (!downloadForm.version.trim()) {
      toastError("Version is required");
      return;
    }
    if (!downloadForm.size.trim()) {
      toastError("Size is required");
      return;
    }
    if (!downloadForm.url.trim() || !isUrl(downloadForm.url)) {
      toastError("Valid URL is required");
      return;
    }

    const payload = {
      name: downloadForm.name.trim(),
      platform: downloadForm.platform,
      architecture: downloadForm.architecture.trim() || "x64",
      version: downloadForm.version.trim(),
      size: downloadForm.size.trim(),
      url: downloadForm.url.trim(),
      minimumOs: downloadForm.minimumOs.trim() || null,
      checksum: downloadForm.checksum.trim() || null,
      releaseNotes: downloadForm.releaseNotes.trim() || null,
      available: downloadForm.available,
    };

    setDownloadSaving(true);
    try {
      if (downloadEditing?._id) {
        const updated = await downloadApi.update(
          downloadEditing._id,
          payload
        );
        setDownloads((prev) =>
          prev.map((d) => (d._id === updated._id ? updated : d))
        );
        success("Download updated");
      } else {
        const created = await downloadApi.create(payload);
        setDownloads((prev) => [created, ...prev]);
        success("Download added");
      }
      closeDownloadForm();
    } catch {
      toastError("Could not save download");
    } finally {
      setDownloadSaving(false);
    }
  };

  const toggleDownload = async (item: DownloadItem) => {
    if (!item._id) return;
    try {
      const res = await downloadApi.toggleAvailable(item._id);
      setDownloads((prev) =>
        prev.map((d) =>
          d._id === item._id ? { ...d, available: res.available } : d
        )
      );
      success(res.available ? "Download enabled" : "Download disabled");
    } catch {
      toastError("Could not update download");
    }
  };

  const deleteDownload = async () => {
    if (!downloadDeleteTarget?._id) return;
    setDownloadDeleteLoading(true);
    try {
      await downloadApi.remove(downloadDeleteTarget._id);
      setDownloads((prev) =>
        prev.filter((d) => d._id !== downloadDeleteTarget._id)
      );
      setDownloadDeleteTarget(null);
      success("Download deleted");
    } catch {
      toastError("Could not delete download");
    } finally {
      setDownloadDeleteLoading(false);
    }
  };

  const locationColumns = useMemo<Column<Location>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        render: (row) => (
          <div>
            <p className="text-sm font-medium text-text-primary">{row.name}</p>
            <p className="font-mono text-xs text-text-muted">{row.slug}</p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        render: (row) => <Badge variant="neutral">{capitalize(row.type)}</Badge>,
      },
      {
        key: "countryCode",
        header: "Country",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.countryCode.toUpperCase()}
          </span>
        ),
      },
      {
        key: "county",
        header: "County",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.county ?? "—"}
          </span>
        ),
      },
      {
        key: "radiusKm",
        header: "Radius",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.radiusKm} km</span>
        ),
      },
      {
        key: "isOperational",
        header: "Operational",
        render: (row) => (
          <Badge variant={row.isOperational ? "success" : "neutral"}>
            {row.isOperational ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
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
            <Dropdown
              trigger={
                <span className="rounded-md px-2 py-1 text-text-muted hover:bg-surface-alt">
                  ⋯
                </span>
              }
              items={[
                {
                  key: "edit",
                  label: "Edit",
                  onClick: () => openLocationEdit(row),
                },
                {
                  key: "toggle",
                  label: row.isOperational
                    ? "Mark not operational"
                    : "Mark operational",
                  onClick: () => toggleLocationOperational(row),
                },
                {
                  key: "delete",
                  label: "Delete",
                  danger: true,
                  onClick: () => setLocationDeleteTarget(row),
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

  const downloadColumns = useMemo<Column<DownloadItem>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        render: (row) => (
          <div>
            <p className="text-sm font-medium text-text-primary">{row.name}</p>
            <p className="text-xs text-text-muted">v{row.version}</p>
          </div>
        ),
      },
      {
        key: "platform",
        header: "Platform",
        render: (row) => (
          <Badge variant="neutral">{capitalize(row.platform)}</Badge>
        ),
      },
      {
        key: "architecture",
        header: "Arch",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.architecture}
          </span>
        ),
      },
      {
        key: "size",
        header: "Size",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.size}</span>
        ),
      },
      {
        key: "available",
        header: "Available",
        render: (row) => (
          <Badge variant={row.available ? "success" : "neutral"}>
            {row.available ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        render: (row) => (
          <span className="text-xs text-text-muted">
            {row.createdAt ? formatDate(row.createdAt) : "—"}
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
                  key: "edit",
                  label: "Edit",
                  onClick: () => openDownloadEdit(row),
                },
                {
                  key: "toggle",
                  label: row.available ? "Disable" : "Enable",
                  onClick: () => toggleDownload(row),
                },
                {
                  key: "open",
                  label: "Open URL",
                  onClick: () => window.open(row.url, "_blank"),
                },
                {
                  key: "delete",
                  label: "Delete",
                  danger: true,
                  onClick: () => setDownloadDeleteTarget(row),
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
          <p className="mt-1 text-sm text-text-muted">
            Runtime configuration of the platform.
          </p>
        </div>

        <Tabs tabs={TABS} activeKey={tab} onChange={setTab} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pt-6 scrollbar-thin">
        {tab === "general" && (
          <Card
            title="General"
            actions={
              <Button size="sm" loading={generalSaving} onClick={saveGeneral}>
                Save
              </Button>
            }
          >
            {generalLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                    Platform
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      label="App name"
                      value={general.appName}
                      onChange={(e) =>
                        setGeneral({ ...general, appName: e.target.value })
                      }
                    />
                    <Select
                      label="Language"
                      value={general.language}
                      onChange={(e) =>
                        setGeneral({ ...general, language: e.target.value })
                      }
                      options={[
                        { label: "English", value: "en" },
                        { label: "Swahili", value: "sw" },
                      ]}
                    />
                    <Input
                      label="Timezone"
                      value={general.timezone}
                      onChange={(e) =>
                        setGeneral({ ...general, timezone: e.target.value })
                      }
                    />
                    <Select
                      label="Currency"
                      value={general.currency}
                      onChange={(e) =>
                        setGeneral({ ...general, currency: e.target.value })
                      }
                      options={[
                        { label: "KES", value: "KES" },
                        { label: "USD", value: "USD" },
                        { label: "EUR", value: "EUR" },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                    URLs
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Input
                        label="API URL"
                        value={general.apiUrl ?? ""}
                        onChange={(e) =>
                          setGeneral({ ...general, apiUrl: e.target.value })
                        }
                        placeholder="http://localhost:5000"
                      />
                    </div>
                    <Input
                      label="Customer app URL"
                      value={general.clientUrl ?? ""}
                      onChange={(e) =>
                        setGeneral({ ...general, clientUrl: e.target.value })
                      }
                      placeholder="http://localhost:3000"
                    />
                    <Input
                      label="Admin URL"
                      value={general.adminUrl ?? ""}
                      onChange={(e) =>
                        setGeneral({ ...general, adminUrl: e.target.value })
                      }
                      placeholder="http://localhost:3001"
                    />
                    <Input
                      label="Partner URL"
                      value={general.partnerUrl ?? ""}
                      onChange={(e) =>
                        setGeneral({ ...general, partnerUrl: e.target.value })
                      }
                      placeholder="http://localhost:3002"
                    />
                    <Input
                      label="Website URL"
                      value={general.websiteUrl ?? ""}
                      onChange={(e) =>
                        setGeneral({ ...general, websiteUrl: e.target.value })
                      }
                      placeholder="http://localhost:3003"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Customer app URL (legacy)"
                        value={general.appUrl ?? ""}
                        onChange={(e) =>
                          setGeneral({ ...general, appUrl: e.target.value })
                        }
                        helper="Alias of Customer app URL. Keep in sync or leave blank."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                    Support
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      label="Support email"
                      type="email"
                      value={general.supportEmail}
                      onChange={(e) =>
                        setGeneral({
                          ...general,
                          supportEmail: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Support phone"
                      value={general.supportPhone}
                      onChange={(e) =>
                        setGeneral({
                          ...general,
                          supportPhone: e.target.value,
                        })
                      }
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Logo URL"
                        value={general.logoUrl ?? ""}
                        onChange={(e) =>
                          setGeneral({ ...general, logoUrl: e.target.value })
                        }
                        helper="Overrides Branding logo when set. Leave blank to use Branding → Logo."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {tab === "broadcast" && (
          <Card
            title="Broadcast"
            actions={
              <Button
                size="sm"
                loading={broadcastSaving}
                onClick={saveBroadcast}
              >
                Save
              </Button>
            }
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Radius (km)"
                type="number"
                min={1}
                value={broadcast.radiusKm}
                onChange={(e) =>
                  setBroadcast({
                    ...broadcast,
                    radiusKm: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Expiry (seconds)"
                type="number"
                min={10}
                value={broadcast.expirySeconds}
                onChange={(e) =>
                  setBroadcast({
                    ...broadcast,
                    expirySeconds: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </Card>
        )}

        {tab === "commission" && (
          <Card
            title="Commission"
            actions={
              <Button
                size="sm"
                loading={commissionSaving}
                onClick={saveCommission}
              >
                Save
              </Button>
            }
          >
            {commissionLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-5">
                <Alert variant="info">
                  Rates apply to all new transactions. Existing records keep the
                  rate they were created with.
                </Alert>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    label="Default rate (%)"
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={commission.defaultRate}
                    onChange={(e) =>
                      setCommission({
                        ...commission,
                        defaultRate: Number(e.target.value) || 0,
                      })
                    }
                    helper="Used when a service-specific rate is not set."
                  />
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                    Per service
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      label="Accommodation (%)"
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={commission.byService.accommodation ?? 0}
                      onChange={(e) =>
                        setServiceRate(
                          "accommodation",
                          Number(e.target.value) || 0
                        )
                      }
                    />
                    <Input
                      label="Food (%)"
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={commission.byService.food ?? 0}
                      onChange={(e) =>
                        setServiceRate("food", Number(e.target.value) || 0)
                      }
                    />
                    <Input
                      label="Transport (%)"
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={commission.byService.transport ?? 0}
                      onChange={(e) =>
                        setServiceRate(
                          "transport",
                          Number(e.target.value) || 0
                        )
                      }
                    />
                    <Input
                      label="Dine-In (%)"
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={commission.byService.dinein ?? 0}
                      onChange={(e) =>
                        setServiceRate("dinein", Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                <div className="rounded-md border border-border bg-surface-alt p-3 text-xs text-text-secondary">
                  <p className="mb-2 font-medium uppercase tracking-wide text-text-muted">
                    Preview
                  </p>
                  <ul className="space-y-1">
                    <li>
                      Accommodation · 10,000 → commission{" "}
                      <span className="font-medium text-text-primary">
                        {(
                          (10_000 *
                            (commission.byService.accommodation ?? 0)) /
                          100
                        ).toFixed(2)}
                      </span>
                    </li>
                    <li>
                      Food · 1,000 → commission{" "}
                      <span className="font-medium text-text-primary">
                        {(
                          (1_000 * (commission.byService.food ?? 0)) /
                          100
                        ).toFixed(2)}
                      </span>
                    </li>
                    <li>
                      Transport · 500 → commission{" "}
                      <span className="font-medium text-text-primary">
                        {(
                          (500 * (commission.byService.transport ?? 0)) /
                          100
                        ).toFixed(2)}
                      </span>
                    </li>
                    <li>
                      Dine-In · 2,000 → commission{" "}
                      <span className="font-medium text-text-primary">
                        {(
                          (2_000 * (commission.byService.dinein ?? 0)) /
                          100
                        ).toFixed(2)}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </Card>
        )}

        {tab === "legal" && (
          <Card
            title="Legal"
            actions={
              <Button size="sm" loading={legalSaving} onClick={saveLegal}>
                Save
              </Button>
            }
          >
            <div className="mb-4 flex gap-1">
              {LEGAL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLegalType(t)}
                  className={
                    "rounded-md px-3 py-1.5 text-sm " +
                    (legalType === t
                      ? "bg-secondary-500/10 text-secondary-600"
                      : "text-text-muted hover:bg-surface-alt")
                  }
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {legalLoading || !legal[legalType] ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Title"
                  value={legal[legalType]!.title}
                  onChange={(e) =>
                    setLegal((prev) => ({
                      ...prev,
                      [legalType]: {
                        ...prev[legalType]!,
                        title: e.target.value,
                      },
                    }))
                  }
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Content
                  </label>
                  <textarea
                    rows={14}
                    value={legal[legalType]!.content}
                    onChange={(e) =>
                      setLegal((prev) => ({
                        ...prev,
                        [legalType]: {
                          ...prev[legalType]!,
                          content: e.target.value,
                        },
                      }))
                    }
                    className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/40"
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {tab === "locations" && (
          <Card padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Locations
                </p>
                <p className="text-xs text-text-muted">
                  Towns, cities, and areas where Digital Safaris operates
                </p>
              </div>
              <Button size="sm" onClick={openLocationCreate}>
                + Add Location
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchLocations();
              }}
              className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
            >
              <Input
                placeholder="Search name, county…"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
              <Select
                placeholder="All types"
                value={locationTypeFilter}
                onChange={(e) => setLocationTypeFilter(e.target.value)}
                options={LOCATION_TYPES.map((t) => ({
                  label: capitalize(t),
                  value: t,
                }))}
              />
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" variant="secondary" fullWidth>
                  Search
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setLocationSearch("");
                    setLocationTypeFilter("");
                    setTimeout(fetchLocations, 0);
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>

            {locationsError && (
              <div className="p-4">
                <Alert variant="danger" title="Failed to load">
                  {locationsError}
                </Alert>
              </div>
            )}

            <Table
              columns={locationColumns}
              data={locations}
              loading={locationsLoading}
              rowKey={(r) => r._id}
            />
          </Card>
        )}

        {tab === "downloads" && (
          <Card padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Downloads
                </p>
                <p className="text-xs text-text-muted">
                  Publish app installers for customers and partners.
                </p>
              </div>
              <Button size="sm" onClick={openDownloadCreate}>
                + Add download
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchDownloads();
              }}
              className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
            >
              <Select
                placeholder="All platforms"
                value={downloadPlatformFilter}
                onChange={(e) => setDownloadPlatformFilter(e.target.value)}
                options={DOWNLOAD_PLATFORMS.map((p) => ({
                  label: capitalize(p),
                  value: p,
                }))}
              />
              <div className="flex gap-2 md:col-span-3">
                <Button type="submit" variant="secondary" fullWidth>
                  Filter
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDownloadPlatformFilter("");
                    setTimeout(fetchDownloads, 0);
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>

            {downloadsError && (
              <div className="p-4">
                <Alert variant="danger" title="Failed to load">
                  {downloadsError}
                </Alert>
              </div>
            )}

            <Table
              columns={downloadColumns}
              data={downloads}
              loading={downloadsLoading}
              rowKey={(r) => r._id || r.url}
              emptyState={
                <EmptyState
                  title="No downloads yet"
                  description="Click Add download to publish the first release."
                />
              }
            />
          </Card>
        )}
      </div>

      <Modal
        isOpen={locationFormOpen}
        onClose={closeLocationForm}
        title={locationEditing ? "Edit Location" : "Add Location"}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeLocationForm}
              disabled={locationFormSaving}
            >
              Cancel
            </Button>
            <Button onClick={saveLocationForm} loading={locationFormSaving}>
              {locationEditing ? "Save" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Name"
              value={locationForm.name}
              onChange={(e) =>
                setLocationForm({ ...locationForm, name: e.target.value })
              }
              placeholder="e.g. Maasai Mara"
            />
          </div>
          <Select
            label="Type"
            value={locationForm.type}
            onChange={(e) =>
              setLocationForm({
                ...locationForm,
                type: e.target.value as LocationType,
              })
            }
            options={LOCATION_TYPES.map((t) => ({
              label: capitalize(t),
              value: t,
            }))}
          />
          <Input
            label="Country code"
            value={locationForm.countryCode}
            onChange={(e) =>
              setLocationForm({
                ...locationForm,
                countryCode: e.target.value.toUpperCase(),
              })
            }
            placeholder="KE"
          />
          <Input
            label="County"
            value={locationForm.county}
            onChange={(e) =>
              setLocationForm({ ...locationForm, county: e.target.value })
            }
          />
          <Input
            label="Radius (km)"
            type="number"
            min={1}
            value={locationForm.radiusKm}
            onChange={(e) =>
              setLocationForm({
                ...locationForm,
                radiusKm: Number(e.target.value) || 10,
              })
            }
          />
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={locationForm.latitude}
            onChange={(e) =>
              setLocationForm({ ...locationForm, latitude: e.target.value })
            }
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            value={locationForm.longitude}
            onChange={(e) =>
              setLocationForm({ ...locationForm, longitude: e.target.value })
            }
          />
          <Input
            label="Timezone"
            value={locationForm.timezone}
            onChange={(e) =>
              setLocationForm({ ...locationForm, timezone: e.target.value })
            }
          />
          <Input
            label="Currency"
            value={locationForm.currency}
            onChange={(e) =>
              setLocationForm({ ...locationForm, currency: e.target.value })
            }
          />
          <div className="md:col-span-2">
            <Switch
              checked={locationForm.isOperational}
              onChange={(v) =>
                setLocationForm({ ...locationForm, isOperational: v })
              }
              label="Operational"
              description="Customers can find partners in this location"
            />
          </div>
          <div className="md:col-span-2">
            <Switch
              checked={locationForm.isDefault}
              onChange={(v) =>
                setLocationForm({ ...locationForm, isDefault: v })
              }
              label="Default location"
              description="Used as fallback when nothing else matches"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!locationDeleteTarget}
        onClose={() => setLocationDeleteTarget(null)}
        onConfirm={deleteLocation}
        title="Delete location?"
        description={
          locationDeleteTarget
            ? `"${locationDeleteTarget.name}" will be permanently removed. Locations with children cannot be deleted.`
            : ""
        }
        confirmText="Delete"
        variant="danger"
        loading={locationDeleteLoading}
      />

      <Modal
        isOpen={downloadFormOpen}
        onClose={closeDownloadForm}
        title={downloadEditing ? "Edit download" : "Add download"}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeDownloadForm}
              disabled={downloadSaving}
            >
              Cancel
            </Button>
            <Button onClick={saveDownload} loading={downloadSaving}>
              {downloadEditing ? "Save" : "Add download"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Name"
            value={downloadForm.name}
            onChange={(e) =>
              setDownloadForm({ ...downloadForm, name: e.target.value })
            }
            placeholder="e.g. Digital Safaris for Windows"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Platform"
              value={downloadForm.platform}
              onChange={(e) =>
                setDownloadForm({
                  ...downloadForm,
                  platform: e.target.value as DownloadPlatform,
                })
              }
              options={DOWNLOAD_PLATFORMS.map((p) => ({
                label: capitalize(p),
                value: p,
              }))}
            />
            <Input
              label="Architecture"
              value={downloadForm.architecture}
              onChange={(e) =>
                setDownloadForm({
                  ...downloadForm,
                  architecture: e.target.value,
                })
              }
              placeholder="x64"
            />
            <Input
              label="Version"
              value={downloadForm.version}
              onChange={(e) =>
                setDownloadForm({ ...downloadForm, version: e.target.value })
              }
              placeholder="1.2.0"
            />
            <Input
              label="Size"
              value={downloadForm.size}
              onChange={(e) =>
                setDownloadForm({ ...downloadForm, size: e.target.value })
              }
              placeholder="45 MB"
            />
          </div>
          <Input
            label="URL"
            value={downloadForm.url}
            onChange={(e) =>
              setDownloadForm({ ...downloadForm, url: e.target.value })
            }
            placeholder="https://downloads.example.com/file.exe"
          />
          <Input
            label="Minimum OS"
            value={downloadForm.minimumOs}
            onChange={(e) =>
              setDownloadForm({ ...downloadForm, minimumOs: e.target.value })
            }
            placeholder="Windows 10+"
          />
          <Input
            label="Checksum (SHA-256)"
            value={downloadForm.checksum}
            onChange={(e) =>
              setDownloadForm({ ...downloadForm, checksum: e.target.value })
            }
            placeholder="Optional"
          />
          <Textarea
            label="Release notes"
            rows={4}
            value={downloadForm.releaseNotes}
            onChange={(e) =>
              setDownloadForm({
                ...downloadForm,
                releaseNotes: e.target.value,
              })
            }
            placeholder="What's new in this version..."
          />
          <Switch
            checked={downloadForm.available}
            onChange={(v) =>
              setDownloadForm({ ...downloadForm, available: v })
            }
            label="Make this download available immediately"
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!downloadDeleteTarget}
        onClose={() => setDownloadDeleteTarget(null)}
        onConfirm={deleteDownload}
        title="Delete download?"
        description={
          downloadDeleteTarget
            ? `"${downloadDeleteTarget.name}" will be removed from the public list.`
            : ""
        }
        confirmText="Delete"
        variant="danger"
        loading={downloadDeleteLoading}
      />
    </div>
  );
}