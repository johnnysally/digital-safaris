import { useEffect, useRef, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  User as UserIcon,
  LogOut,
  Wallet,
  Calendar,
  Heart,
  Camera,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Switch from "../components/ui/Switch";
import Avatar from "../components/ui/Avatar";
import Spinner from "../components/ui/Spinner";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { customerApi, axiosInstance, unwrap } from "../api";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import { ROUTES } from "../utils/constants";
import { formatDate } from "../utils/formatDate";
import { fullName } from "../utils/helpers";
import type { CustomerProfile, CustomerPreferences } from "../types";

export default function Profile() {
  const { customer, logout, setCustomer } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [preference, setPreference] = useState<CustomerPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    phone: customer?.phone || "",
    town: customer?.town || "",
  });

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoveLoading, setAvatarRemoveLoading] = useState(false);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await customerApi.profile();
      setProfile(data.profile || null);
      setPreference(data.preference || null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = () => {
    setEditForm({
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      phone: customer?.phone || "",
      town: customer?.town || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const updated = await customerApi.updateProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        town: editForm.town,
      });
      setCustomer(updated);
      toastSuccess("Profile updated");
      setEditOpen(false);
    } catch {
      toastError("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);

      const res = await axiosInstance.patch("/customer/profile/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const body = unwrap<{ avatar?: string } | { customer?: { avatar?: string } }>(
        res.data
      );
      const avatarUrl =
        (body as { avatar?: string }).avatar ||
        (body as { customer?: { avatar?: string } }).customer?.avatar;

      if (customer) {
        setCustomer({ ...customer, avatar: avatarUrl || null });
      }
      setProfile((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));
      toastSuccess("Profile photo updated");
      setAvatarOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toastError("Could not upload photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toastError("File too large", "Maximum 5 MB.");
      return;
    }
    if (!/^image\//.test(file.type)) {
      toastError("Invalid file", "Choose an image.");
      return;
    }
    uploadAvatar(file);
  };

  const removeAvatar = async () => {
    setAvatarRemoveLoading(true);
    try {
      const res = await axiosInstance.patch("/customer/profile/avatar", {
        avatar: null,
      });
      unwrap(res.data);
      if (customer) {
        setCustomer({ ...customer, avatar: null });
      }
      setProfile((prev) => (prev ? { ...prev, avatar: undefined } : prev));
      toastSuccess("Profile photo removed");
      setAvatarOpen(false);
    } catch {
      toastError("Could not remove photo");
    } finally {
      setAvatarRemoveLoading(false);
    }
  };

  const handlePreferenceToggle = async (
    group: "notifications" | "categories",
    key: string,
    value: boolean
  ) => {
    if (!preference) return;
    const next = {
      ...preference,
      [group]: { ...(preference as never)[group], [key]: value },
    } as CustomerPreferences;
    setPreference(next);
    try {
      await customerApi.updatePreferences(next);
    } catch {
      toastError("Could not save preference");
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } finally {
      setLogoutLoading(false);
      setLogoutOpen(false);
    }
  };

  if (loading && !customer) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const avatarSrc = customer?.avatar || profile?.avatar || undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Profile</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage your account details.
          </p>
        </div>
        <Button variant="ghost" onClick={openEdit}>
          Edit profile
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setAvatarOpen(true)}
            className="group relative rounded-full"
            aria-label="Change profile photo"
          >
            <Avatar
              src={avatarSrc}
              fallback={fullName(customer?.firstName, customer?.lastName)}
              size="lg"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-text-primary">
              {fullName(customer?.firstName, customer?.lastName) || "—"}
            </p>
            <p className="truncate text-sm text-text-muted">{customer?.email}</p>
            <p className="mt-1 text-xs text-text-muted">
              Member since {formatDate(customer?.createdAt)}
            </p>
          </div>

          <Button variant="ghost" onClick={() => setAvatarOpen(true)}>
            Change photo
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link to={ROUTES.BOOKING}>
          <Card className="transition-colors hover:bg-surface-alt">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  My Bookings
                </p>
                <p className="text-xs text-text-muted">Manage your stays</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to={ROUTES.WALLET}>
          <Card className="transition-colors hover:bg-surface-alt">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">Wallet</p>
                <p className="text-xs text-text-muted">Check and top up</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to={ROUTES.REVIEWS}>
          <Card className="transition-colors hover:bg-surface-alt">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
                <Heart className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  My Reviews
                </p>
                <p className="text-xs text-text-muted">What you've shared</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <Card title="Details">
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-text-muted" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">
                Email
              </dt>
              <dd className="text-sm text-text-primary">{customer?.email}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 text-text-muted" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">
                Phone
              </dt>
              <dd className="text-sm text-text-primary">{customer?.phone}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">
                Town
              </dt>
              <dd className="text-sm text-text-primary">
                {customer?.town || "—"}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <UserIcon className="mt-0.5 h-4 w-4 text-text-muted" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-text-muted">
                Referral code
              </dt>
              <dd className="font-mono text-sm text-text-primary">
                {customer?.referralCode || "—"}
              </dd>
            </div>
          </div>
        </dl>
      </Card>

      {preference && (
        <Card title="Notifications">
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Channels
            </div>
            <Switch
              checked={preference.notifications.email}
              onChange={(v) => handlePreferenceToggle("notifications", "email", v)}
              label="Email"
            />
            <Switch
              checked={preference.notifications.sms}
              onChange={(v) => handlePreferenceToggle("notifications", "sms", v)}
              label="SMS"
            />
            <Switch
              checked={preference.notifications.push}
              onChange={(v) => handlePreferenceToggle("notifications", "push", v)}
              label="Push"
            />
            <Switch
              checked={preference.notifications.inApp}
              onChange={(v) => handlePreferenceToggle("notifications", "inApp", v)}
              label="In-app"
            />

            <div className="pt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Categories
            </div>
            <Switch
              checked={preference.categories.orderUpdates}
              onChange={(v) =>
                handlePreferenceToggle("categories", "orderUpdates", v)
              }
              label="Order updates"
            />
            <Switch
              checked={preference.categories.bookingUpdates}
              onChange={(v) =>
                handlePreferenceToggle("categories", "bookingUpdates", v)
              }
              label="Booking updates"
            />
            <Switch
              checked={preference.categories.tripUpdates}
              onChange={(v) =>
                handlePreferenceToggle("categories", "tripUpdates", v)
              }
              label="Trip updates"
            />
            <Switch
              checked={preference.categories.paymentUpdates}
              onChange={(v) =>
                handlePreferenceToggle("categories", "paymentUpdates", v)
              }
              label="Payment updates"
            />
            <Switch
              checked={preference.categories.promotions}
              onChange={(v) =>
                handlePreferenceToggle("categories", "promotions", v)
              }
              label="Promotions"
            />
            <Switch
              checked={preference.categories.newsletters}
              onChange={(v) =>
                handlePreferenceToggle("categories", "newsletters", v)
              }
              label="Newsletters"
            />
          </div>
        </Card>
      )}

      <Card>
        <Button
          variant="danger"
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={() => setLogoutOpen(true)}
        >
          Log out
        </Button>
      </Card>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="First name"
            value={editForm.firstName}
            onChange={(e) =>
              setEditForm({ ...editForm, firstName: e.target.value })
            }
          />
          <Input
            label="Last name"
            value={editForm.lastName}
            onChange={(e) =>
              setEditForm({ ...editForm, lastName: e.target.value })
            }
          />
          <div className="sm:col-span-2">
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Town"
              value={editForm.town}
              onChange={(e) =>
                setEditForm({ ...editForm, town: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        title="Profile photo"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAvatarOpen(false)}>
              Close
            </Button>
            <Button
              variant="danger"
              loading={avatarRemoveLoading}
              onClick={removeAvatar}
              leftIcon={<Trash2 className="h-4 w-4" />}
              disabled={!avatarSrc}
            >
              Remove
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Avatar
              src={avatarSrc}
              fallback={fullName(customer?.firstName, customer?.lastName)}
              size="lg"
            />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            fullWidth
            leftIcon={<Camera className="h-4 w-4" />}
            loading={avatarUploading}
            onClick={() => fileRef.current?.click()}
          >
            {avatarSrc ? "Choose new photo" : "Upload photo"}
          </Button>

          <p className="text-center text-xs text-text-muted">
            JPG, PNG, or WebP. Max 5 MB.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Log out?"
        description="You will need to sign in again to access your account."
        confirmText="Log out"
        variant="danger"
        loading={logoutLoading}
      />
    </div>
  );
}