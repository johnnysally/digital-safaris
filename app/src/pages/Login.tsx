import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Logo from "../components/ui/Logo";
import { isEmail, isEmpty } from "../utils/validators";
import { ROUTES } from "../utils/constants";

interface LocationState {
  from?: { pathname: string; search?: string };
}

export default function Login() {
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const redirectTo = (() => {
    const from = (location.state as LocationState | null)?.from;
    if (!from?.pathname) return ROUTES.HOME;
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
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;

      if (status === 403 && /not verified/i.test(message || "")) {
        navigate(
          `${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email.trim())}`,
          { replace: true, state: { from: location.state } }
        );
        return;
      }

      if (status === 403 && /suspended/i.test(message || "")) {
        toastError("Account suspended", "Contact support for assistance.");
        return;
      }

      const msg =
        message ||
        (err instanceof Error ? err.message : "Check your email and password.");
      toastError("Login failed", msg);
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
            Welcome back
          </h1>
          <p className="text-xs text-text-muted">
            Sign in to continue your journey
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <div className="flex justify-end">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-secondary-600 hover:text-secondary-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-text-muted">
          Don't have an account?{" "}
          <Link to={ROUTES.REGISTER} className="text-secondary-600 underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}