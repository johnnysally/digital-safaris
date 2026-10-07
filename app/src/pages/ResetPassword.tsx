import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, KeyRound, Lock } from "lucide-react";
import { authApi } from "../api";
import { useToast } from "../context/toastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Logo from "../components/ui/Logo";
import { isEmail, isEmpty, isValidOTP } from "../utils/validators";
import { ROUTES } from "../utils/constants";

export default function ResetPassword() {
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState(params.get("otp") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (isEmpty(email)) next.email = "Email is required";
    else if (!isEmail(email)) next.email = "Enter a valid email";
    if (isEmpty(otp)) next.otp = "Code is required";
    else if (!isValidOTP(otp)) next.otp = "Enter the 6-digit code";
    if (isEmpty(newPassword)) next.newPassword = "New password is required";
    else if (newPassword.length < 6)
      next.newPassword = "Password must be at least 6 characters";
    if (confirmPassword !== newPassword)
      next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        newPassword,
      });
      toastSuccess("Password reset", "You can now sign in with your new password.");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Check the code and try again.";
      toastError("Reset failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" showText={false} />
          <h1 className="text-xl font-semibold text-text-primary">
            Reset your password
          </h1>
          <p className="text-xs text-text-muted">
            Enter the code we sent you and choose a new password
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <Input
              label="6-digit code"
              inputMode="numeric"
              maxLength={6}
              leftIcon={<KeyRound className="h-4 w-4" />}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              error={errors.otp}
            />

            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
              helper="At least 6 characters"
            />

            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />

            <Button type="submit" fullWidth loading={loading}>
              Reset password
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-text-muted">
          Remembered it?{" "}
          <Link to={ROUTES.LOGIN} className="text-secondary-600 underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}