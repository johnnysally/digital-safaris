import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Textarea from "../components/ui/Textarea";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import { brandingApi } from "../api";
import { useToast } from "../context/toastContext";
import { useBranding } from "../context/brandingContext";
import { isUrl } from "../utils/validators";
import type { Branding } from "../types";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const DEFAULT_LOGO_APPEARANCE: NonNullable<Branding["logoAppearance"]> = {
  maxWidth: 320,
  maxHeight: 128,
  fit: "contain",
  padding: 0,
  borderRadius: 0,
};
const DEFAULT_FAVICON_APPEARANCE: NonNullable<Branding["faviconAppearance"]> = {
  fit: "contain",
  padding: 4,
  borderRadius: 12,
};

function AssetPreview({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className: string;
  style?: CSSProperties;
}) {
  const [failedSrc, setFailedSrc] = useState("");

  if (!src || failedSrc === src) {
    return (
      <span className="px-2 text-center text-[10px] font-medium text-[#887b6b]">
        {src ? "Image could not be loaded" : "No image selected"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailedSrc(src)}
    />
  );
}

export default function BrandingPage() {
  const { success, error: toastError } = useToast();
  const { setBranding: setBrandingContext } = useBranding();

  const [branding, setBranding] = useState<Branding>({
    logo: "",
    logoUrl: "",
    favicon: "",
    logoAppearance: DEFAULT_LOGO_APPEARANCE,
    faviconAppearance: DEFAULT_FAVICON_APPEARANCE,
    emailHeaderLogo: "",
    fontFamily: "Montserrat",
    metaTitle: "Digital Safaris",
    metaDescription: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<"logo" | "favicon" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await brandingApi.get();
        setBranding((prev) => ({ ...prev, ...data }));
      } catch {
        setError("Could not load branding. Using defaults.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = <K extends keyof Branding>(key: K, value: Branding[K]) =>
    setBranding((prev) => ({ ...prev, [key]: value }));

  const updateLogo = (value: string) =>
    setBranding((prev) => ({ ...prev, logo: value, logoUrl: value }));

  const updateLogoAppearance = (
    key: keyof NonNullable<Branding["logoAppearance"]>,
    value: string | number
  ) =>
    setBranding((prev) => ({
      ...prev,
      logoAppearance: {
        ...DEFAULT_LOGO_APPEARANCE,
        ...prev.logoAppearance,
        [key]: value,
      },
    }));

  const updateFaviconAppearance = (
    key: keyof NonNullable<Branding["faviconAppearance"]>,
    value: string | number
  ) =>
    setBranding((prev) => ({
      ...prev,
      faviconAppearance: {
        ...DEFAULT_FAVICON_APPEARANCE,
        ...prev.faviconAppearance,
        [key]: value,
      },
    }));

  const handleAssetUpload = async (
    file: File | undefined,
    kind: "logo" | "favicon"
  ) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Choose an image file", "Logo and favicon files must be images.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toastError("Image is too large", "Choose an image smaller than 10 MB.");
      return;
    }

    setUploadingAsset(kind);
    try {
      const url = await brandingApi.uploadAsset(file);
      if (kind === "logo") updateLogo(url);
      else update("favicon", url);
      success("Image uploaded", `${kind === "logo" ? "Logo" : "Favicon"} is ready to preview.`);
    } catch {
      toastError(`Could not upload ${kind}`, "Please try again.");
    } finally {
      setUploadingAsset(null);
    }
  };

  const validate = () => {
    if (branding.logoUrl && !isUrl(branding.logoUrl) && !branding.logoUrl.startsWith("/")) {
      toastError("Invalid logo URL");
      return false;
    }
    if (branding.favicon && !isUrl(branding.favicon) && !branding.favicon.startsWith("/")) {
      toastError("Invalid favicon URL");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const saved = await brandingApi.update(branding);
      setBranding(saved);
      setBrandingContext(saved);
      try {
        const persisted = await brandingApi.get();
        setBranding(persisted);
        setBrandingContext(persisted);
        success("Branding saved", "Saved values reloaded and applied across the platform.");
      } catch {
        success("Branding saved", "Changes were saved and applied. The form is showing the save response.");
        toastError("Could not reload saved branding", "Reload the page to confirm the latest saved values.");
      }
    } catch {
      toastError("Could not save branding", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBranding({
      logo: "",
      logoUrl: "",
      favicon: "",
      logoAppearance: DEFAULT_LOGO_APPEARANCE,
      faviconAppearance: DEFAULT_FAVICON_APPEARANCE,
      emailHeaderLogo: "",
      fontFamily: "Montserrat",
      metaTitle: "Digital Safaris",
      metaDescription: "",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Branding</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage the brand identity across the platform and emails
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving}>
            Reset
          </Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="warning" title="Could not load">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Logos">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Input
                  label="Logo URL"
                  type="url"
                  value={branding.logoUrl ?? branding.logo ?? ""}
                  onChange={(e) => updateLogo(e.target.value)}
                  helper="Shown in the page header, sidebar, and login."
                />
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void handleAssetUpload(e.target.files?.[0], "logo");
                    e.currentTarget.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  loading={uploadingAsset === "logo"}
                  disabled={uploadingAsset !== null}
                  onClick={() => logoFileRef.current?.click()}
                >
                  Upload logo image
                </Button>
                <p className="m-0 text-[11px] text-text-muted">Image file, up to 10 MB.</p>
              </div>
              <div className="space-y-2">
                <Input
                  label="Favicon URL"
                  type="url"
                  value={branding.favicon ?? ""}
                  onChange={(e) => update("favicon", e.target.value)}
                  helper="Small icon shown in the browser tab."
                />
                <input
                  ref={faviconFileRef}
                  type="file"
                  accept="image/*,.ico"
                  className="hidden"
                  onChange={(e) => {
                    void handleAssetUpload(e.target.files?.[0], "favicon");
                    e.currentTarget.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  loading={uploadingAsset === "favicon"}
                  disabled={uploadingAsset !== null}
                  onClick={() => faviconFileRef.current?.click()}
                >
                  Upload favicon image
                </Button>
                <p className="m-0 text-[11px] text-text-muted">Square PNG, SVG, or ICO works best.</p>
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Email header logo URL"
                  value={branding.emailHeaderLogo ?? ""}
                  onChange={(e) => update("emailHeaderLogo", e.target.value)}
                  helper="Shown at the top of outgoing emails."
                />
              </div>
            </div>
          </Card>

          <Card title="Logo appearance">
            <p className="mb-4 text-xs text-text-muted">
              These CSS-style values control the logo across the admin, customer app, and public site.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Maximum width (px)"
                type="number"
                min={24}
                max={320}
                value={branding.logoAppearance?.maxWidth ?? DEFAULT_LOGO_APPEARANCE.maxWidth}
                onChange={(e) => updateLogoAppearance("maxWidth", Math.min(320, Math.max(24, Number(e.target.value))))}
              />
              <Input
                label="Maximum height (px)"
                type="number"
                min={24}
                max={128}
                value={branding.logoAppearance?.maxHeight ?? DEFAULT_LOGO_APPEARANCE.maxHeight}
                onChange={(e) => updateLogoAppearance("maxHeight", Math.min(128, Math.max(24, Number(e.target.value))))}
              />
              <Select
                label="Image fit"
                value={branding.logoAppearance?.fit ?? DEFAULT_LOGO_APPEARANCE.fit}
                options={[
                  { label: "Contain (show full logo)", value: "contain" },
                  { label: "Cover (fill the logo box)", value: "cover" },
                ]}
                onChange={(e) => updateLogoAppearance("fit", e.target.value as "contain" | "cover")}
              />
              <Input
                label="Inner padding (px)"
                type="number"
                min={0}
                max={24}
                value={branding.logoAppearance?.padding ?? DEFAULT_LOGO_APPEARANCE.padding}
                onChange={(e) => updateLogoAppearance("padding", Math.min(24, Math.max(0, Number(e.target.value))))}
              />
              <Input
                label="Corner radius (px)"
                type="number"
                min={0}
                max={32}
                value={branding.logoAppearance?.borderRadius ?? DEFAULT_LOGO_APPEARANCE.borderRadius}
                onChange={(e) => updateLogoAppearance("borderRadius", Math.min(32, Math.max(0, Number(e.target.value))))}
              />
            </div>
          </Card>

          <Card title="Favicon appearance">
            <p className="mb-4 text-xs text-text-muted">
              Styling is rendered from the selected favicon for browser tabs; browsers do not apply page CSS to tab icons.
            </p>
            <div className="mb-4 flex items-center gap-4 rounded-xl border border-border bg-surface-alt p-4">
              <span
                className="grid size-16 shrink-0 place-items-center overflow-hidden border border-border"
                style={{
                  borderRadius: `${branding.faviconAppearance?.borderRadius ?? DEFAULT_FAVICON_APPEARANCE.borderRadius}px`,
                  backgroundImage: "linear-gradient(45deg, #e5e1db 25%, transparent 25%), linear-gradient(-45deg, #e5e1db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e1db 75%), linear-gradient(-45deg, transparent 75%, #e5e1db 75%)",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                  backgroundSize: "16px 16px",
                }}
              >
                <AssetPreview
                  src={branding.favicon ?? ""}
                  alt="Favicon appearance preview"
                  className="size-full"
                  style={{
                    objectFit: branding.faviconAppearance?.fit ?? DEFAULT_FAVICON_APPEARANCE.fit,
                    padding: `${branding.faviconAppearance?.padding ?? DEFAULT_FAVICON_APPEARANCE.padding}px`,
                    borderRadius: `${branding.faviconAppearance?.borderRadius ?? DEFAULT_FAVICON_APPEARANCE.borderRadius}px`,
                  }}
                />
              </span>
              <div>
                <p className="m-0 text-sm font-semibold text-text-primary">Favicon preview</p>
                <p className="mb-0 mt-1 text-xs text-text-muted">
                  Updates as you change the fit, padding, and corner radius.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                label="Image fit"
                value={branding.faviconAppearance?.fit ?? DEFAULT_FAVICON_APPEARANCE.fit}
                options={[
                  { label: "Contain (show full icon)", value: "contain" },
                  { label: "Cover (fill the icon tile)", value: "cover" },
                ]}
                onChange={(e) => updateFaviconAppearance("fit", e.target.value as "contain" | "cover")}
              />
              <Input
                label="Inner padding (px)"
                type="number"
                min={0}
                max={24}
                value={branding.faviconAppearance?.padding ?? DEFAULT_FAVICON_APPEARANCE.padding}
                onChange={(e) => updateFaviconAppearance("padding", Math.min(24, Math.max(0, Number(e.target.value))))}
              />
              <Input
                label="Corner radius (px)"
                type="number"
                min={0}
                max={32}
                value={branding.faviconAppearance?.borderRadius ?? DEFAULT_FAVICON_APPEARANCE.borderRadius}
                onChange={(e) => updateFaviconAppearance("borderRadius", Math.min(32, Math.max(0, Number(e.target.value))))}
              />
            </div>
          </Card>

          <Card title="Typography & Meta">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Font family"
                value={branding.fontFamily}
                onChange={(e) => update("fontFamily", e.target.value)}
              />
              <Input
                label="Meta title"
                value={branding.metaTitle}
                onChange={(e) => update("metaTitle", e.target.value)}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Meta description"
                  rows={3}
                  value={branding.metaDescription}
                  onChange={(e) => update("metaDescription", e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Live preview">
            <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Page header</p>
                  <div className="flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-[#e9e0d4] bg-white px-4 py-3 shadow-sm">
                    <AssetPreview
                      src={branding.logoUrl || branding.logo || ""}
                      alt="Page header logo preview"
                      className="object-contain"
                      style={{
                        maxWidth: `${branding.logoAppearance?.maxWidth ?? DEFAULT_LOGO_APPEARANCE.maxWidth}px`,
                        maxHeight: `${branding.logoAppearance?.maxHeight ?? DEFAULT_LOGO_APPEARANCE.maxHeight}px`,
                        objectFit: branding.logoAppearance?.fit ?? DEFAULT_LOGO_APPEARANCE.fit,
                        padding: `${branding.logoAppearance?.padding ?? DEFAULT_LOGO_APPEARANCE.padding}px`,
                        borderRadius: `${branding.logoAppearance?.borderRadius ?? DEFAULT_LOGO_APPEARANCE.borderRadius}px`,
                      }}
                    />
                    <span className="min-w-0 truncate text-sm font-semibold text-[#30271f]">
                      {branding.metaTitle || "Digital Safaris"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Sidebar</p>
                  <div className="flex min-h-[4.5rem] items-center gap-3 rounded-xl bg-[#211b16] px-4 py-3 text-white">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white p-1.5">
                      <AssetPreview
                        src={branding.logoUrl || branding.logo || ""}
                        alt="Sidebar logo preview"
                        className="max-h-full max-w-full object-contain"
                        style={{
                          maxWidth: `${branding.logoAppearance?.maxWidth ?? DEFAULT_LOGO_APPEARANCE.maxWidth}px`,
                          maxHeight: `${branding.logoAppearance?.maxHeight ?? DEFAULT_LOGO_APPEARANCE.maxHeight}px`,
                          objectFit: branding.logoAppearance?.fit ?? DEFAULT_LOGO_APPEARANCE.fit,
                          padding: `${branding.logoAppearance?.padding ?? DEFAULT_LOGO_APPEARANCE.padding}px`,
                          borderRadius: `${branding.logoAppearance?.borderRadius ?? DEFAULT_LOGO_APPEARANCE.borderRadius}px`,
                        }}
                      />
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold">
                      {branding.metaTitle || "Digital Safaris"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Browser tab</p>
                  <div className="rounded-xl border border-[#ddd5cb] bg-[#f5f2ed] p-3">
                    <div className="flex max-w-[220px] items-center gap-2 rounded-t-lg border border-[#ded7ce] border-b-0 bg-white px-3 py-2 shadow-sm">
                      <span
                        className="grid size-5 shrink-0 place-items-center overflow-hidden"
                        style={{
                          borderRadius: `${branding.faviconAppearance?.borderRadius ?? DEFAULT_FAVICON_APPEARANCE.borderRadius}px`,
                        }}
                      >
                        <AssetPreview
                          src={branding.favicon ?? ""}
                          alt="Favicon preview"
                          className="size-full"
                          style={{
                            objectFit: branding.faviconAppearance?.fit ?? DEFAULT_FAVICON_APPEARANCE.fit,
                            padding: `${branding.faviconAppearance?.padding ?? DEFAULT_FAVICON_APPEARANCE.padding}px`,
                          }}
                        />
                      </span>
                      <span className="min-w-0 truncate text-[10px] text-[#4e463d]">
                        {branding.metaTitle || "Digital Safaris"}
                      </span>
                    </div>
                    <div className="h-7 rounded-b-lg border border-[#ded7ce] bg-white/75" />
                  </div>
                </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                  Font
                </p>
                <p
                  className="text-lg font-medium text-text-primary"
                  style={{ fontFamily: branding.fontFamily }}
                >
                  The quick brown fox
                </p>
                <p
                  className="text-sm text-text-secondary"
                  style={{ fontFamily: branding.fontFamily }}
                >
                  Jumps over the lazy dog
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                  Meta
                </p>
                <div className="rounded-md border border-border bg-surface-alt p-3">
                  <p className="text-sm font-medium text-text-primary">
                    {branding.metaTitle || "Untitled"}
                  </p>
                  <p className="mt-1 text-xs text-text-muted line-clamp-3">
                    {branding.metaDescription || "No description"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}