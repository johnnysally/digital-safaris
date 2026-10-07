import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Phone, User, MapPin } from "lucide-react";
import { authApi } from "../api";
import { useToast } from "../context/toastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Logo from "../components/ui/Logo";
import { isEmail, isEmpty, isPhone } from "../utils/validators";
import { ROUTES } from "../utils/constants";

export default function Register() {
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    town: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (isEmpty(form.firstName)) next.firstName = "First name is required";
    if (isEmpty(form.lastName)) next.lastName = "Last name is required";
    if (isEmpty(form.email)) next.email = "Email is required";
    else if (!isEmail(form.email)) next.email = "Enter a valid email";
    if (isEmpty(form.phone)) next.phone = "Phone is required";
    else if (!isPhone(form.phone)) next.phone = "Enter a valid Kenyan number";
    if (isEmpty(form.password)) next.password = "Password is required";
    else if (form.password.length < 6)
      next.password = "Password must be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        town: form.town.trim() || undefined,
      });

      toastSuccess(
        "Account created",
        "Check your email to verify your account."
      );
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Please check your details.";
      toastError("Registration failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" showText={false} />
          <h1 className="text-xl font-semibold text-text-primary">
            Create your account
          </h1>
          <p className="text-xs text-text-muted">
            Your journey starts here
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                leftIcon={<User className="h-4 w-4" />}
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                error={errors.firstName}
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                error={errors.lastName}
              />
            </div>

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
            />

            <Input
              label="Phone"
              type="tel"
              autoComplete="tel"
              placeholder="254712345678"
              leftIcon={<Phone className="h-4 w-4" />}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              error={errors.phone}
              helper="Use format 254712345678 or 0712345678"
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
              helper="At least 6 characters"
            />

            <Input
              label="Town (optional)"
              leftIcon={<MapPin className="h-4 w-4" />}
              placeholder="e.g. Nairobi"
              value={form.town}
              onChange={(e) => update("town", e.target.value)}
            />

            <Button type="submit" fullWidth loading={loading}>
              Create account
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-text-muted">
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="text-secondary-600 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}