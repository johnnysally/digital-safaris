import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Lock, Phone, User, MapPin } from "lucide-react";
import { authApi } from "../api";
import { useToast } from "../context/toastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import AuthLayout from "../components/layout/AuthLayout";
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
    <AuthLayout
      title={<>Make your next<br /><span className="text-[#efb348]">story unforgettable.</span></>}
      description="Create an account to discover trusted stays, local dining and memorable experiences throughout Kenya."
    >
      <div>
        <header className="mb-4">
          <h2 className="m-0 font-sans text-[1.4rem] font-bold tracking-[-0.035em] text-[#26231f]">Create your account</h2>
          <p className="mt-1.5 text-[0.7rem] text-[#77736d]">Join DigitalSafaris and start exploring.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3 [&_label]:!font-semibold [&_label]:!text-[#493a29]">
            <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
              <Input
                label="First name"
                name="firstName"
                autoComplete="given-name"
                placeholder="Amina"
                leftIcon={<User className="h-4 w-4" />}
                className="h-10 rounded-md border-[#e7e1d8] bg-white !text-[#2d251c] caret-[#a96517] text-xs placeholder:!text-[#877866] focus:border-[#bd781f] focus:ring-[#bd781f]/20"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                error={errors.firstName}
              />
              <Input
                label="Last name"
                name="lastName"
                autoComplete="family-name"
                placeholder="Wanjiku"
                className="h-10 rounded-md border-[#e7e1d8] bg-white !text-[#2d251c] caret-[#a96517] text-xs placeholder:!text-[#877866] focus:border-[#bd781f] focus:ring-[#bd781f]/20"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                error={errors.lastName}
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              className="h-10 rounded-md border-[#e7e1d8] bg-white !text-[#2d251c] caret-[#a96517] text-xs placeholder:!text-[#877866] focus:border-[#bd781f] focus:ring-[#bd781f]/20"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
            />

            <Input
              label="Phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="254712345678"
              leftIcon={<Phone className="h-4 w-4" />}
              className="h-10 rounded-md border-[#e7e1d8] bg-white !text-[#2d251c] caret-[#a96517] text-xs placeholder:!text-[#877866] focus:border-[#bd781f] focus:ring-[#bd781f]/20"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              error={errors.phone}
              helper="Use 254712345678 or 0712345678"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              className="h-10 rounded-md border-[#e7e1d8] bg-white !text-[#2d251c] caret-[#a96517] text-xs placeholder:!text-[#877866] focus:border-[#bd781f] focus:ring-[#bd781f]/20"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
              helper="At least 6 characters"
            />

            <Input
              label="Town (optional)"
              name="town"
              autoComplete="address-level2"
              leftIcon={<MapPin className="h-4 w-4" />}
              placeholder="e.g. Nairobi"
              className="h-10 rounded-md border-[#e7e1d8] bg-white text-xs placeholder:text-[#aaa49a] focus:border-[#bd781f] focus:ring-[#bd781f]/20"
              value={form.town}
              onChange={(e) => update("town", e.target.value)}
            />

            <Button type="submit" fullWidth loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />} className="!min-h-10 !rounded-md !bg-[#bd781f] !px-4 !py-2 !text-xs !font-bold shadow-sm hover:!bg-[#a96517] focus:!ring-[#bd781f]/30">
              Create Account
            </Button>
          </form>

        <p className="mt-4 border-t border-[#eee8df] pt-3 text-center text-[0.68rem] text-[#77736d]">
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="font-semibold text-[#a66b1d] no-underline hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}