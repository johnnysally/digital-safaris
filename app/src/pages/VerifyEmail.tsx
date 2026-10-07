import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Mail, ArrowLeft } from "lucide-react";
import { publicApi } from "../api";
import Card from "../components/ui/Card";
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <div className="space-y-4 py-6">
          {state === "verifying" && (
            <>
              <Spinner size="lg" />
              <p className="text-sm text-text-muted">{message}</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary">
                Email verified
              </h1>
              <p className="text-sm text-text-muted">{message}</p>
              <div className="flex justify-center pt-2">
                <Button onClick={() => navigate(ROUTES.LOGIN)}>
                  Continue to login
                </Button>
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
                <XCircle className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary">
                Verification failed
              </h1>
              <p className="text-sm text-text-muted">{message}</p>

              <div className="space-y-3 pt-2 text-left">
                <Input
                  label="Email"
                  type="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Button
                  fullWidth
                  loading={resending}
                  onClick={handleResend}
                  disabled={!email}
                >
                  Resend verification
                </Button>
              </div>

              <div className="flex justify-center pt-2">
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary">
                Verify your email
              </h1>
              <p className="text-sm text-text-muted">
                We sent a verification link to your inbox. Click the link to
                activate your account.
              </p>

              <div className="space-y-3 pt-4 text-left">
                <Input
                  label="Email"
                  type="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Button
                  fullWidth
                  loading={resending}
                  onClick={handleResend}
                  disabled={!email}
                >
                  Resend verification link
                </Button>
              </div>

              <div className="flex justify-center pt-2">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Back to login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}