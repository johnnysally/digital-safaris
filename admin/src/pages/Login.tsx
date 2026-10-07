import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Logo from "../components/ui/Logo";
import { authApi } from "../api";
import { isEmail, isEmpty } from "../utils/validators";

interface LocationState {
  from?: { pathname: string; search?: string };
}

export default function Login() {
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const redirectTo = (() => {
    const from = (location.state as LocationState | null)?.from;
    if (!from?.pathname) return "/";
    return `${from.pathname}${from.search ?? ""}`;
  })();

  const validate = () => {
    const next: typeof errors = {};
    if (isEmpty(email)) next.email = "Email is required";
    else if (!isEmail(email)) next.email = "Enter a valid email";
    if (isEmpty(password)) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Check your email and password.";
      toastError("Login failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!isEmail(forgotEmail)) {
      toastError("Invalid email", "Enter a valid email address.");
      return;
    }
    setForgotLoading(true);
    try {
      await authApi.forgotPassword({ email: forgotEmail.trim() });
      toastSuccess("Reset link sent", "Check your email for the OTP.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toastError("Could not send reset", "Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" showText={false} />
          <h1 className="text-xl font-semibold text-text-primary">
            Digital Safaris Admin
          </h1>
          <p className="text-xs text-text-muted">
            Sign in to manage the platform
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@digitalsafaris.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs text-secondary-600 hover:text-secondary-700"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-text-muted">
          © {new Date().getFullYear()} Digital Safaris
        </p>
      </div>

      <Modal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reset password"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setForgotOpen(false)}
              disabled={forgotLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleForgot} loading={forgotLoading}>
              Send reset link
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Enter your email and we'll send you an OTP to reset your password.
          </p>
          <Input
            label="Email"
            type="email"
            placeholder="you@digitalsafaris.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}