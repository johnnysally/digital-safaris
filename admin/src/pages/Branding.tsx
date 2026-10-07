import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import Logo from "../components/ui/Logo";
import { brandingApi } from "../api";
import { useToast } from "../context/toastContext";
import { useBranding } from "../context/brandingContext";
import { isHexColor, isUrl } from "../utils/validators";
import type { Branding, Hex } from "../types";

const DEFAULT_PRIMARY = "#1A1F2E" as Hex;
const DEFAULT_SECONDARY = "#C9A063" as Hex;

export default function BrandingPage() {
  const { success, error: toastError } = useToast();
  const { setBranding: setBrandingContext } = useBranding();

  const [branding, setBranding] = useState<Branding>({
    logo: "",
    logoUrl: "",
    favicon: "",
    emailHeaderLogo: "",
    primaryColor: DEFAULT_PRIMARY,
    secondaryColor: DEFAULT_SECONDARY,
    fontFamily: "Montserrat",
    metaTitle: "Digital Safaris",
    metaDescription: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const validate = () => {
    if (branding.primaryColor && !isHexColor(branding.primaryColor)) {
      toastError("Invalid primary color", "Use a hex value like #1A1F2E");
      return false;
    }
    if (branding.secondaryColor && !isHexColor(branding.secondaryColor)) {
      toastError("Invalid secondary color", "Use a hex value like #C9A063");
      return false;
    }
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
      const merged = { ...branding, ...saved };
      setBranding(merged);
      setBrandingContext(merged);
      success("Branding saved", "Changes applied across the platform.");
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
      emailHeaderLogo: "",
      primaryColor: DEFAULT_PRIMARY,
      secondaryColor: DEFAULT_SECONDARY,
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
              <Input
                label="Logo URL"
                value={branding.logoUrl ?? ""}
                onChange={(e) => update("logoUrl", e.target.value)}
                helper="Primary logo. Used in the sidebar and login."
              />
              <Input
                label="Favicon URL"
                value={branding.favicon ?? ""}
                onChange={(e) => update("favicon", e.target.value)}
                helper="Browser tab icon."
              />
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

          <Card title="Colors">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Input
                  label="Primary color"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    update("primaryColor", e.target.value as Hex)
                  }
                  helper="Deep navy. Used for primary surfaces."
                />
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-md border border-border"
                    style={{ background: branding.primaryColor }}
                  />
                  <span className="text-xs text-text-muted">
                    {branding.primaryColor}
                  </span>
                </div>
              </div>
              <div>
                <Input
                  label="Secondary color"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    update("secondaryColor", e.target.value as Hex)
                  }
                  helper="Warm gold. Used for accents and CTAs."
                />
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-md border border-border"
                    style={{ background: branding.secondaryColor }}
                  />
                  <span className="text-xs text-text-muted">
                    {branding.secondaryColor}
                  </span>
                </div>
              </div>
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
          <Card title="Preview">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                  Logo
                </p>
                <div className="flex items-center justify-center rounded-md border border-border bg-surface-alt p-4">
                  <Logo size="lg" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                  Colors
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div
                      className="h-12 rounded-md border border-border"
                      style={{ background: branding.primaryColor }}
                    />
                    <p className="mt-1 text-center text-xs text-text-muted">
                      Primary
                    </p>
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-12 rounded-md border border-border"
                      style={{ background: branding.secondaryColor }}
                    />
                    <p className="mt-1 text-center text-xs text-text-muted">
                      Secondary
                    </p>
                  </div>
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