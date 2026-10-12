import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import Alert from "../components/ui/Alert";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { authApi } from "../api";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import { roleName } from "../utils/permissions";

export default function Profile() {
  const { admin, setAdmin } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(admin?.firstName ?? "");
  const [lastName, setLastName] = useState(admin?.lastName ?? "");
  const [phone, setPhone] = useState(admin?.phone ?? "");
  const [avatar, setAvatar] = useState(admin?.avatar ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setFirstName(admin?.firstName ?? "");
    setLastName(admin?.lastName ?? "");
    setPhone(admin?.phone ?? "");
    setAvatar(admin?.avatar ?? "");
  }, [admin]);

  const handleProfileSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toastError("Complete required fields", "Name and phone number are required.");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        avatar: avatar || null,
      });
      setAdmin(updated);
      success("Profile updated", "Your admin profile changes have been saved.");
    } catch (error) {
      toastError(
        "Could not update profile",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Choose an image file", "Profile photos must be images.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError("Image is too large", "Choose an image smaller than 10 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      setAvatar(await authApi.uploadAvatar(file));
      success("Photo uploaded", "Save your profile to apply the new photo.");
    } catch {
      toastError("Could not upload photo", "Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toastError("Complete all password fields");
      return;
    }
    if (newPassword.length < 8) {
      toastError("Password is too short", "Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Passwords do not match", "Confirm the new password correctly.");
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      success("Password changed", "Your account password was updated.");
    } catch {
      toastError("Could not change password", "Check your current password and try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!admin) {
    return <Alert variant="warning" title="Profile unavailable">Sign in again to view your profile.</Alert>;
  }

  const displayName = `${admin.firstName} ${admin.lastName}`.trim();
  const role = roleName(admin) ?? "Admin";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-[#a46b24]">Account</p>
        <h1 className="m-0 text-2xl font-semibold tracking-[-.03em] text-[#30271f]">My profile</h1>
        <p className="mb-0 mt-1 text-sm text-[#887b6b]">Manage your admin details and account security.</p>
      </header>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar src={avatar || undefined} fallback={displayName} size="lg" className="!h-16 !w-16 !text-lg" />
          <div className="min-w-0 flex-1">
            <h2 className="m-0 truncate text-lg font-semibold text-text-primary">{displayName}</h2>
            <p className="mb-2 mt-1 truncate text-sm text-text-muted">{admin.email}</p>
            <Badge variant={admin.status === "active" ? "success" : "warning"}>{admin.status}</Badge>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleAvatarUpload(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            loading={uploadingAvatar}
            leftIcon={<Camera className="size-4" />}
            onClick={() => fileInput.current?.click()}
          >
            Update photo
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Personal information">
          <form className="space-y-4" onSubmit={handleProfileSave}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
              <Input label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
            </div>
            <Input
              label="Email address"
              type="email"
              value={admin.email}
              readOnly
              leftIcon={<Mail className="size-4" />}
              helper="Email changes are managed by a system administrator."
            />
            <Input label="Phone number" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-xs text-text-secondary">
              <ShieldCheck className="size-4 text-[#a46b24]" />
              Assigned role: <strong className="font-semibold text-text-primary">{role}</strong>
            </div>
            <Button type="submit" loading={savingProfile} leftIcon={<UserRound className="size-4" />}>
              Save profile
            </Button>
          </form>
        </Card>

        <Card title="Change password">
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <p className="m-0 text-xs leading-relaxed text-text-muted">
              Choose a unique password with at least 8 characters.
            </p>
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <Button type="submit" loading={changingPassword} leftIcon={<KeyRound className="size-4" />}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
