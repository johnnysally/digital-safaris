import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import AuthLayout from "../components/layout/AuthLayout";
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
    <AuthLayout
      title={<>Discover the<br /><span className="text-[#efb348]">Extraordinary</span></>}
      description="Find stays, experiences and journeys across Kenya. Sign in to pick up where your next adventure begins."
    >
      <div>
        <header className="mb-5">
          <h2 className="m-0 font-sans text-[1.45rem] font-bold tracking-[-0.035em] text-[#26231f]">Welcome back</h2>
          <p className="mt-1.5 text-[0.72rem] text-[#77736d]">Sign in to your DigitalSafaris account.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              className="h-10 rounded-md border-[#e7e1d8] bg-white text-xs placeholder:text-[#aaa49a] focus:border-[#bd781f] focus:ring-[#bd781f]/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              className="h-10 rounded-md border-[#e7e1d8] bg-white text-xs placeholder:text-[#aaa49a] focus:border-[#bd781f] focus:ring-[#bd781f]/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <div className="flex justify-end pt-0.5">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-[0.68rem] font-semibold text-[#a66b1d] no-underline hover:text-[#805014] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />} className="!min-h-10 !rounded-md !bg-[#bd781f] !px-4 !py-2 !text-xs !font-bold shadow-sm hover:!bg-[#a96517] focus:!ring-[#bd781f]/30">
              Sign In
            </Button>
          </form>

        <p className="mt-5 border-t border-[#eee8df] pt-4 text-center text-[0.68rem] text-[#77736d]">
          Don&apos;t have an account?{" "}
          <Link to={ROUTES.REGISTER} className="font-semibold text-[#a66b1d] no-underline hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}