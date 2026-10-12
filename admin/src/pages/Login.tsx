import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { authApi } from "../api";
import { isEmail, isEmpty } from "../utils/validators";
import { useBranding } from "../context/brandingContext";

interface LocationState {
  from?: { pathname: string; search?: string };
}

export default function Login() {
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    () => localStorage.getItem("ds_admin_remember_email_value") ?? ""
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("ds_admin_remember_email") === "true"
  );
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const redirectTo = (() => {
    const from = (location.state as LocationState | null)?.from;
    if (!from?.pathname) return "/";
    return `${from.pathname}${from.search ?? ""}`;
  })();
  const appName = branding?.metaTitle?.split("—")[0]?.trim() || "Digital Safaris";
  const logoSrc = branding?.logoUrl || branding?.logo || "/favicon.svg";

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
      if (rememberMe) {
        localStorage.setItem("ds_admin_remember_email_value", email.trim());
        localStorage.setItem("ds_admin_remember_email", "true");
      } else {
        localStorage.removeItem("ds_admin_remember_email_value");
        localStorage.removeItem("ds_admin_remember_email");
      }
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
    <>
    <main className="relative grid min-h-screen w-full grid-cols-[minmax(0,55%)_minmax(0,45%)] overflow-hidden bg-[#faf8f1] text-[#27211b] [font-family:Inter,Segoe_UI,sans-serif] max-[900px]:grid-cols-[minmax(0,48%)_minmax(0,52%)] max-[680px]:grid-cols-1 max-[680px]:overflow-auto">
        <section className="relative min-h-screen w-full overflow-hidden bg-cover bg-[center_55%] bg-[#322819] max-[680px]:min-h-[320px]" style={{ backgroundImage: "url('/login-safari-bg.jpg')" }}>
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,23,15,.58),rgba(43,26,17,.2)_72%,rgba(43,26,17,.08)),linear-gradient(0deg,rgba(25,15,9,.62),transparent_50%)]"
          />

          <div className="relative z-[1] flex min-h-screen flex-col px-[clamp(26px,5.1vw,60px)] py-8 text-white max-[900px]:px-[27px] max-[680px]:min-h-[320px] max-[680px]:px-6 max-[680px]:py-5">
            <div className="flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,.35)]">
              <img src={logoSrc} alt="" className="size-12 object-contain sm:size-14" />
              <div>
                <p className="m-0 text-[25px] font-bold leading-none tracking-[-.05em] text-white sm:text-[30px]">
                  Digital<span className="text-[#ff9f0b]">Safari</span>
                </p>
                <p className="mb-0 mt-1.5 text-[9px] tracking-[.2em] text-white/80 sm:text-[10px]">
                  ADMINISTRATION PORTAL
                </p>
              </div>
            </div>

            <div className="mb-auto ml-[4%] mt-8 max-w-lg drop-shadow-[0_2px_12px_rgba(0,0,0,.4)] sm:ml-[12%] sm:mt-12 lg:ml-[16%] lg:mt-[clamp(52px,11vh,112px)]">
              <div className="mb-4 inline-flex min-h-8 items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
                <ShieldCheck className="size-4 text-[#f2a935]" />
                Secure admin access
              </div>
              <h1 className="m-0 font-serif text-[clamp(2.25rem,4.3vw,4rem)] font-semibold leading-[.98] tracking-[-.035em] text-white max-[680px]:text-[2rem]">
                Welcome back,
                <span className="mt-1 block text-[#ffb12a]">Administrator</span>
              </h1>
              <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/90 sm:text-sm">
                Manage your platform, partners and services from one powerful dashboard.
              </p>
            </div>

            <div className="mb-5 grid max-w-xl grid-cols-2 gap-x-4 gap-y-3 sm:mb-7 sm:grid-cols-4 sm:gap-3">
              {[
                { key: "performance", icon: Activity, label: <>Monitor<br />Performance</> },
                { key: "users", icon: UsersRound, label: <>Manage<br />Users &amp; Partners</> },
                { key: "operations", icon: Settings2, label: <>Control<br />Operations</> },
                { key: "security", icon: ShieldCheck, label: <>Ensure<br />Security</> },
              ].map(({ key, icon: Icon, label }) => (
                <div className="flex items-center gap-2 border-white/25 sm:border-r sm:px-2 sm:last:border-0" key={key}>
                  <Icon className="size-[18px] shrink-0 text-[#ffb12a] sm:mb-2 sm:size-5" />
                  <p className="m-0 text-[10px] leading-snug text-white/90 sm:text-[11px]">{label}</p>
                </div>
              ))}
            </div>

            <p className="mb-1 mt-0 -rotate-3 font-serif text-lg italic text-[#ffb12a] drop-shadow sm:text-xl">
              Connecting Horizons Seamlessly
            </p>
            <div className="ml-8 h-0.5 w-44 rotate-[-7deg] rounded-full bg-[#ff9f0b] shadow-[0_0_12px_rgba(255,159,11,.6)]" />
          </div>
        </section>

        <section className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-[#faf8f1] px-5 py-12 [background-image:radial-gradient(ellipse_at_72%_13%,transparent_0_77px,rgba(190,179,150,.1)_78px,transparent_79px_91px,rgba(190,179,150,.08)_92px,transparent_93px_106px,rgba(190,179,150,.07)_107px,transparent_108px),radial-gradient(ellipse_at_92%_45%,transparent_0_115px,rgba(190,179,150,.08)_116px,transparent_117px_132px,rgba(190,179,150,.07)_133px,transparent_134px)] max-[900px]:px-6 max-[680px]:min-h-[590px] max-[680px]:px-[22px] max-[680px]:py-10">
          <div className="absolute right-7 top-7 flex items-center gap-2 text-[#9a6531] max-[680px]:right-5 max-[680px]:top-5">
            <ShieldCheck className="size-4" />
            <span className="text-[10px] font-semibold tracking-wide">Protected sign in</span>
          </div>
          <div className="relative z-[1] mx-auto my-auto w-full max-w-[392px]">
            <div className="w-full rounded-[10px] border border-[rgba(255,255,255,.8)] bg-[rgba(255,252,246,.94)] px-6 pb-6 pt-7 shadow-[0_18px_48px_rgba(72,47,23,.13)] sm:px-8 sm:pb-7 sm:pt-8">
              <header className="mb-6">
                <div className="mb-4 inline-flex min-h-8 items-center gap-2 rounded-full bg-[#f8e9cc] px-3 text-[10px] font-semibold text-[#a85e07]">
                  <Settings2 className="size-[15px] text-[#90621c]" />
                  DigitalSafaris Admin
                </div>
                <h2 className="m-0 font-serif text-[32px] font-bold leading-[1.05] tracking-[-.8px] text-[#211c18] sm:text-[36px]">
                  Welcome Back
                </h2>
                <p className="mb-0 mt-2 text-[13px] leading-relaxed text-[#77716b]">
                  Sign in to manage your platform and partners.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="admin-email" className="mb-1.5 block text-[11px] font-semibold text-[#5c554e]">Email address</label>
                <div className={`group flex h-[48px] items-center gap-2.5 rounded-md border bg-white/75 px-3 transition focus-within:border-[#c9821f] focus-within:ring-2 focus-within:ring-[#c9821f]/15 ${errors.email ? "border-red-400" : "border-[#e6e0d9]"}`}>
                  <Mail aria-hidden="true" className="size-[17px] shrink-0 text-[#8b7761] transition group-focus-within:text-[#a96717]" />
                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="admin@digitalsafaris.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "admin-email-error" : undefined}
                    className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#302b26] outline-none placeholder:text-[#8d847a]"
                  />
                </div>
                {errors.email && <p id="admin-email-error" className="mb-0 mt-1.5 text-xs text-[#a3443b]">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="admin-password" className="mb-1.5 block text-[11px] font-semibold text-[#5c554e]">Password</label>
                <div className={`group flex h-[48px] items-center gap-2.5 rounded-md border bg-white/75 px-3 transition focus-within:border-[#c9821f] focus-within:ring-2 focus-within:ring-[#c9821f]/15 ${errors.password ? "border-red-400" : "border-[#e6e0d9]"}`}>
                  <LockKeyhole aria-hidden="true" className="size-[17px] shrink-0 text-[#8b7761] transition group-focus-within:text-[#a96717]" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "admin-password-error" : undefined}
                    className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#302b26] outline-none placeholder:text-[#8d847a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-[#898078] transition hover:bg-[#f3eadb] hover:text-[#81551f]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p id="admin-password-error" className="mb-0 mt-1.5 text-xs text-[#a3443b]">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-[#77716b]">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-[15px] accent-[#c9821f]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[11px] font-semibold text-[#87551b] transition hover:text-[#bd7620]"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                rightIcon={!loading && <ArrowRight className="size-[18px]" />}
                className="!mt-2 !h-11 !rounded-md !bg-[#c9821f] !text-white !shadow-[0_6px_16px_rgba(132,79,18,.18)] hover:!bg-[#b87419]"
              >
                Sign In
              </Button>
              </form>

              <div className="mt-5 flex items-center gap-2.5 border-t border-[#eee6da] pt-4 text-[10px] text-[#82786d]">
                <ShieldCheck className="size-4 shrink-0 text-[#a96717]" />
                <span>Secure, trusted access to {appName} administration.</span>
              </div>
            </div>
          </div>
        </section>
    </main>

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
    </>
  );
}