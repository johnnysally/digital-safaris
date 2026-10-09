import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Mail, ArrowLeft, Mountain } from "lucide-react";
import { publicApi } from "../api";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import Input from "../components/ui/Input";
import { useToast } from "../context/toastContext";
import { ROUTES } from "../utils/constants";
import { isEmail } from "../utils/validators";

type State = "verifying" | "success" | "error" | "pending";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const token = params.get("token");
  const initialEmail = params.get("email") || "";

  const [state, setState] = useState<State>(token ? "verifying" : "pending");
  const [message, setMessage] = useState(
    token ? "Verifying your email…" : "Check your inbox to verify your account."
  );
  const [email, setEmail] = useState(initialEmail);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    publicApi
      .verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setState("success");
        setMessage("Email verified. Welcome aboard!");
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Verification failed or link expired.";
        setState("error");
        setMessage(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async () => {
    if (!isEmail(email)) {
      toastError("Invalid email", "Enter a valid email address.");
      return;
    }

    setResending(true);
    try {
      await publicApi.resendVerification(email);
      toastSuccess(
        "Verification sent",
        "Check your inbox for a fresh verification link."
      );
    } catch {
      toastError("Could not send", "Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen min-h-svh flex-col items-center justify-center overflow-hidden bg-[#21170f] px-4 py-8 text-[#35271c]">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(39,25,14,.32),rgba(120,65,23,.14)_42%,rgba(36,22,12,.54)),linear-gradient(90deg,rgba(35,23,15,.25),transparent_48%,rgba(35,23,15,.28))]"
        aria-hidden="true"
      />

      <Link
        to={ROUTES.HOME}
        className="mb-7 inline-flex items-center gap-2.5 text-white no-underline drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]"
      >
        <Mountain className="h-9 w-9 text-[#ffc361]" strokeWidth={1.6} aria-hidden="true" />
        <span className="flex flex-col">
          <span className="font-[Georgia,serif] text-xl font-bold leading-none tracking-tight">
            Digital<span className="text-[#ffc361]">Safaris</span>
          </span>
          <span className="mt-1 text-[9px] font-medium tracking-[.17em] text-white/85 uppercase">
            Travel · Explore · Experience
          </span>
        </span>
      </Link>

      <section className="w-full max-w-md rounded-2xl border border-white/75 bg-[#fffaf1]/[.97] px-6 py-7 text-center shadow-[0_24px_80px_rgba(35,20,10,.38)] backdrop-blur-sm sm:px-9 sm:py-9">
        <p className="mb-5 text-[10px] font-bold tracking-[.2em] text-[#a45c23] uppercase">
          Secure account verification
        </p>
        <div className="space-y-4">
          {state === "verifying" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4e3c7] text-[#a96020]">
                <Spinner size="lg" />
              </div>
              <h1 className="text-2xl font-semibold text-[#38291d]">Verifying your email</h1>
              <p className="text-sm leading-relaxed text-[#746455]">{message}</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf2df] text-[#657a3a]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold text-[#38291d]">
                Email verified
              </h1>
              <p className="text-sm leading-relaxed text-[#746455]">{message}</p>
              <div className="flex justify-center pt-2">
                <Button className="!bg-[#a85f22] !text-white hover:!bg-[#8d4b19]" onClick={() => navigate(ROUTES.LOGIN)}>
                  Continue to login
                </Button>
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f8e6db] text-[#b34f34]">
                <XCircle className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold text-[#38291d]">
                Verification failed
              </h1>
              <p className="text-sm leading-relaxed text-[#746455]">{message}</p>

              <div className="space-y-3 pt-2 text-left [&_label]:!text-[#675542]">
                <Input
                  label="Email"
                  type="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="!border-[#e5d4bd] !bg-white !text-[#35271c] placeholder:!text-[#a09383] focus:!border-[#b96c24] focus:!ring-[#b96c24]/20"
                />
                <Button
                  fullWidth
                  className="!bg-[#a85f22] !text-white hover:!bg-[#8d4b19]"
                  loading={resending}
                  onClick={handleResend}
                  disabled={!email}
                >
                  Resend verification
                </Button>
              </div>

              <div className="flex justify-center pt-2 [&_button]:!border-[#eadbc8] [&_button]:!text-[#725c45] [&_button]:hover:!bg-[#f8efdf]">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Back to login
                  </Button>
                </Link>
              </div>
            </>
          )}

          {state === "pending" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4e3c7] text-[#a96020]">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold text-[#38291d]">
                Verify your email
              </h1>
              <p className="text-sm leading-relaxed text-[#746455]">
                We sent a verification link to your inbox. Click the link to
                activate your account.
              </p>

              <div className="space-y-3 pt-4 text-left [&_label]:!text-[#675542]">
                <Input
                  label="Email"
                  type="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="!border-[#e5d4bd] !bg-white !text-[#35271c] placeholder:!text-[#a09383] focus:!border-[#b96c24] focus:!ring-[#b96c24]/20"
                />
                <Button
                  fullWidth
                  className="!bg-[#a85f22] !text-white hover:!bg-[#8d4b19]"
                  loading={resending}
                  onClick={handleResend}
                  disabled={!email}
                >
                  Resend verification link
                </Button>
              </div>

              <div className="flex justify-center pt-2 [&_button]:!border-[#eadbc8] [&_button]:!text-[#725c45] [&_button]:hover:!bg-[#f8efdf]">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Back to login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      <p className="mt-6 text-center text-[10px] font-medium tracking-[.14em] text-white/90 drop-shadow-[0_1px_5px_rgba(0,0,0,.5)] uppercase">
        Your journey, rooted in Kenya
      </p>
    </main>
  );
}