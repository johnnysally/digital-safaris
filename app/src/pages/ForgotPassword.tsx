import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { authApi } from "../api";
import { useToast } from "../context/toastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Logo from "../components/ui/Logo";
import { isEmail, isEmpty, isValidOTP } from "../utils/validators";
import { ROUTES } from "../utils/constants";

type Step = "email" | "otp";

export default function ForgotPassword() {
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (isEmpty(email)) next.email = "Email is required";
    else if (!isEmail(email)) next.email = "Enter a valid email";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      toastSuccess("Reset code sent", "Check your email for the OTP.");
      setStep("otp");
    } catch {
      toastError("Could not send reset code", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!isValidOTP(otp)) next.otp = "Enter the 6-digit code";
    if (isEmpty(newPassword)) next.newPassword = "New password is required";
    else if (newPassword.length < 6)
      next.newPassword = "Password must be at least 6 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        newPassword,
      });
      toastSuccess("Password reset", "You can now sign in.");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      toastError("Reset failed", "Check the code and try again.");
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
            {step === "email"
              ? "We'll send a code to your email"
              : "Enter the code and your new password"}
          </p>
        </div>

        <Card>
          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Button type="submit" fullWidth loading={loading}>
                Send reset code
              </Button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.newPassword}
              />
              <Button type="submit" fullWidth loading={loading}>
                Reset password
              </Button>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-xs text-secondary-600 hover:underline"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
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