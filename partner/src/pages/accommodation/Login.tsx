import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BedDouble, Check, LockKeyhole, Mail, Mountain, Phone, ShieldCheck, TrendingUp, UserRound, Users } from "lucide-react";
import authApi from "../../api/accommodation/authApi";
import propertyApi, { type PropertyLocation } from "../../api/accommodation/propertyApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";

const loginBackground = "linear-gradient(90deg, rgba(23, 17, 13, 0.47) 0%, rgba(23, 17, 13, 0.2) 52%, rgba(23, 17, 13, 0.16) 100%), url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2200&q=90')";
const loginFieldClass = "flex min-h-11 min-w-0 items-center gap-2.5 rounded-md border border-[#e6e0d9] bg-[rgba(255,255,255,0.55)] px-3 text-[#6d6b68] transition-colors focus-within:border-[#c9821f] focus-within:ring-2 focus-within:ring-[#c9821f]/15 [&_svg]:shrink-0 [&_input]:h-full [&_input]:min-w-0 [&_input]:flex-1 [&_input]:w-full [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[0.78rem] [&_input]:font-medium [&_input]:text-[#302b26] [&_input]:shadow-none [&_input]:outline-none [&_input]:placeholder:text-[#8d847a]";
const signupFieldClass = `${loginFieldClass} h-10 min-h-10 px-[11px] [&_input]:text-[0.72rem]`;

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate grid min-h-screen min-h-svh grid-cols-[minmax(0,1.12fr)_minmax(370px,0.88fr)] items-center gap-[clamp(32px,5vw,72px)] overflow-hidden bg-cover bg-center px-[clamp(48px,7.6vw,104px)] pb-[116px] pt-[84px] text-white before:absolute before:inset-0 before:-z-[1] before:bg-[linear-gradient(180deg,rgba(22,17,14,0.13),transparent_38%,rgba(20,15,11,0.28)),linear-gradient(90deg,rgba(20,15,12,0.18),transparent_57%,rgba(30,21,14,0.12))] before:content-[''] max-[900px]:grid-cols-[minmax(0,1fr)_minmax(330px,0.92fr)] max-[900px]:gap-7 max-[900px]:px-[38px] max-[700px]:flex max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-[26px] max-[700px]:overflow-auto max-[700px]:bg-[54%_center] max-[700px]:px-[18px] max-[700px]:pb-6 max-[700px]:pt-7" style={{ backgroundImage: loginBackground }}>
      <div className="absolute left-[clamp(48px,7.6vw,104px)] top-[42px] z-[1] grid grid-cols-[auto_1fr] items-center gap-x-[9px] text-white max-[900px]:left-[38px] max-[700px]:relative max-[700px]:left-auto max-[700px]:top-auto max-[700px]:self-start [&_svg]:row-span-2 [&_svg]:text-[#fff7e8] [&_svg]:max-[700px]:w-9">
        <Mountain size={46} strokeWidth={1.7} aria-hidden="true" />
        <span className="self-end font-serif text-[1.9rem] font-bold leading-[0.95]"><span>Digital</span><strong className="font-bold text-[#e4a52f]">Safaris</strong></span>
        <span className="mt-1 self-start text-[0.57rem] tracking-[0.08em] text-white/75">Travel · Explore · Experience</span>
      </div>

      <section className="col-start-1 mt-[30px] max-w-[520px] self-center max-[700px]:mt-2 [&_h1]:m-0 [&_h1]:font-serif [&_h1]:text-[clamp(3rem,5vw,4.3rem)] [&_h1]:font-semibold [&_h1]:leading-[0.92] [&_p]:mt-4 [&_p]:max-w-[430px] [&_p]:text-[0.98rem] [&_p]:leading-[1.55] [&_p]:text-white/95 max-[900px]:[&_h1]:text-5xl max-[700px]:[&_h1]:text-[2.65rem] max-[700px]:[&_p]:mt-[9px] max-[700px]:[&_p]:text-[0.86rem] max-[380px]:[&_h1]:text-[2.15rem]">
        <h1>Accommodation<br />Partner Portal</h1>
        <p>Join our network of trusted accommodation partners and grow your business with DigitalSafaris.</p>
      </section>

      <div className="absolute bottom-[27px] left-[clamp(48px,6.5vw,88px)] z-[1] flex items-center gap-[26px] text-[#f4b43e] max-[900px]:left-[38px] max-[900px]:gap-3 max-[700px]:relative max-[700px]:bottom-auto max-[700px]:left-auto max-[700px]:mt-0 max-[700px]:grid max-[700px]:grid-cols-2 max-[700px]:gap-3 max-[380px]:grid-cols-1 [&>div]:flex [&>div]:min-w-[152px] [&>div]:items-center [&>div]:gap-2.5 [&>div]:border-r [&>div]:border-white/30 [&>div]:pr-5 [&>div:last-child]:border-0 [&_span]:flex [&_span]:min-w-0 [&_span]:flex-col [&_span]:gap-[3px] [&_span]:text-white [&_strong]:text-[0.67rem] [&_strong]:font-semibold [&_small]:text-[0.58rem] [&_small]:text-white/80 max-[900px]:[&>div]:min-w-0 max-[900px]:[&>div]:pr-3 max-[700px]:[&>div]:border-0 max-[700px]:[&>div]:p-0" aria-label="Partner benefits">
        <div><ShieldCheck size={24} /><span><strong>Trusted Partners</strong><small>Build your credibility</small></span></div>
        <div><Users size={24} /><span><strong>More Bookings</strong><small>Reach global travelers</small></span></div>
        <div><TrendingUp size={24} /><span><strong>Grow Together</strong><small>Your success matters</small></span></div>
      </div>

      <section className="relative z-[1] col-start-2 mx-auto w-full max-w-[392px] text-[var(--text)] max-[700px]:max-w-[430px]">{children}</section>
    </main>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const returnTo = (location.state as { from?: string } | null)?.from ?? "/partner/accommodation/dashboard";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await authApi.login({ email, password });
      signIn("accommodation", result.accessToken, result.refreshToken, remember);
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to sign in. Please check your details and try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full rounded-[10px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,252,246,0.97)] px-[30px] pb-[22px] pt-[25px] shadow-[0_18px_48px_rgba(36,22,13,0.22)] max-[700px]:px-5 max-[700px]:pb-[18px] max-[700px]:pt-[22px] max-[380px]:px-4">
        <header className="mb-[17px] [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-[1.82rem] [&_h2]:font-bold [&_h2]:leading-[1.05] [&_h2]:text-[#211c18] [&_p]:mt-2 [&_p]:text-[0.78rem] [&_p]:leading-[1.45] [&_p]:text-[#85817c]">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your property and reservations.</p>
        </header>

        <form className="flex flex-col gap-[10px]" onSubmit={handleSubmit}>
          <label className={loginFieldClass}>
            <Mail size={17} aria-hidden="true" />
            <input aria-label="Business email" type="email" autoComplete="username" placeholder="Business Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className={loginFieldClass}>
            <LockKeyhole size={17} aria-hidden="true" />
            <input aria-label="Password" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>

          <div className="flex items-center justify-between gap-2.5 text-[0.65rem] text-[#77726d]">
            <label className="inline-flex items-center gap-2"><input className="m-0 h-[15px] w-[15px] shrink-0 accent-[#c88420]" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label>
            <span className="text-[#87551b]">Need help signing in?</span>
          </div>

          {error ? <div className="rounded-md border border-[rgba(168,92,82,0.25)] bg-[rgba(168,92,82,0.08)] px-[10px] py-[9px] text-[0.72rem] leading-[1.4] text-[#8e443b]" role="alert">{error}</div> : null}

          <button type="submit" className="flex min-h-10 w-full items-center justify-center gap-2.5 rounded-md border-0 bg-[#c9821f] px-[14px] text-white hover:bg-[#b87419] disabled:cursor-wait disabled:opacity-[0.72]" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}<ArrowRight size={16} />
          </button>
        </form>

        <div className="mb-[10px] mt-[14px] flex items-center gap-3 text-[0.62rem] text-[#8f8982] before:h-px before:flex-1 before:bg-[#e9e2d9] after:h-px after:flex-1 after:bg-[#e9e2d9]"><span>or</span></div>
        <p className="m-0 text-center text-[0.65rem] text-[#77716a] [&_a]:ml-1 [&_a]:font-semibold [&_a]:text-[#a96d18] [&_a]:no-underline hover:[&_a]:underline">New to DigitalSafaris? <Link to="/partner/accommodation/signup">Create an account</Link></p>
      </div>
    </AuthShell>
  );
}

export function SignupPage() {
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState<PropertyLocation | null>(null);
  const [locationError, setLocationError] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadLocations() {
      try {
        const locations = await propertyApi.locations();
        const defaultLocation = locations.find((item) => (item as PropertyLocation & { isDefault?: boolean }).isDefault) ?? locations[0] ?? null;
        if (!cancelled) {
          setLocation(defaultLocation);
          if (!defaultLocation) setLocationError("Partner applications are temporarily unavailable. Please contact support.");
        }
      } catch (requestError) {
        if (!cancelled) setLocationError(getApiErrorMessage(requestError, "Could not prepare the registration form."));
      }
    }
    void loadLocations();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location) {
      setError(locationError || "No operational partner location is available yet.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await authApi.register({
        contactName: contactName.trim(),
        name: propertyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        locationId: location._id,
        town: location.name,
        address: location.county || location.name,
        latitude: location.latitude ?? undefined,
        longitude: location.longitude ?? undefined,
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to submit your application. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full rounded-[10px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,252,246,0.97)] px-[30px] pb-[22px] pt-[25px] shadow-[0_18px_48px_rgba(36,22,13,0.22)] max-[700px]:px-5 max-[700px]:pb-[18px] max-[700px]:pt-[22px] max-[380px]:px-4">
        {submitted ? (
          <div className="flex flex-col items-start gap-3 py-8 [&>span]:grid [&>span]:h-[42px] [&>span]:w-[42px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[rgba(95,125,93,0.13)] [&>span]:text-[#587850] [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-[1.82rem] [&_h2]:font-bold [&_h2]:leading-[1.05] [&_p]:mt-2 [&_p]:text-[0.78rem] [&_p]:leading-[1.45] [&_p]:text-[#85817c] [&_a]:mt-2" role="status">
            <span><Check size={23} /></span>
            <h2>Application Received</h2>
            <p>Thanks for applying. Our partner team will review your accommodation and follow up by email.</p>
            <Link className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-4 py-3 font-bold text-white no-underline shadow-[var(--shadow-soft)]" to="/partner/accommodation/login">Return to sign in <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <>
            <header className="mb-[17px] [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-[1.82rem] [&_h2]:font-bold [&_h2]:leading-[1.05] [&_h2]:text-[#211c18] [&_p]:mt-2 [&_p]:text-[0.78rem] [&_p]:leading-[1.45] [&_p]:text-[#85817c]">
              <h2>Create Your Account</h2>
              <p>Become an accommodation partner and start receiving bookings today.</p>
            </header>

            <form className="grid grid-cols-2 gap-[10px] max-[700px]:grid-cols-1 [&>label:nth-child(n+6)]:col-span-2 max-[700px]:[&>label:nth-child(n+6)]:col-span-1" onSubmit={handleSubmit}>
              <label className={signupFieldClass}>
                <UserRound size={17} aria-hidden="true" />
                <input aria-label="Full name" autoComplete="name" placeholder="Full Name" value={contactName} onChange={(event) => setContactName(event.target.value)} required />
              </label>
              <label className={signupFieldClass}>
                <Mail size={17} aria-hidden="true" />
                <input aria-label="Business email" type="email" autoComplete="email" placeholder="Business Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className={signupFieldClass}>
                <BedDouble size={17} aria-hidden="true" />
                <input aria-label="Property name" placeholder="Property Name" value={propertyName} onChange={(event) => setPropertyName(event.target.value)} required />
              </label>
              <label className={signupFieldClass}>
                <Phone size={17} aria-hidden="true" />
                <input aria-label="Phone number" type="tel" autoComplete="tel" placeholder="Phone Number" value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </label>
              <label className={signupFieldClass}>
                <LockKeyhole size={17} aria-hidden="true" />
                <input aria-label="Password" type="password" autoComplete="new-password" minLength={8} placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>

              <label className="col-span-2 my-px mb-0.5 flex items-start gap-2 text-[0.61rem] leading-[1.4] text-[#817a73] max-[700px]:col-span-1 [&_input]:mt-px [&_input]:h-[15px] [&_input]:w-[15px] [&_input]:shrink-0 [&_input]:accent-[#c88420] [&_strong]:font-semibold [&_strong]:text-[#a96d18]">
                <input type="checkbox" required />
                <span>I agree to the <strong>Terms &amp; Conditions</strong> and <strong>Privacy Policy</strong></span>
              </label>

              {locationError ? <div className="col-span-2 rounded-md border border-[rgba(168,92,82,0.25)] bg-[rgba(168,92,82,0.08)] px-[10px] py-[9px] text-[0.72rem] leading-[1.4] text-[#8e443b] max-[700px]:col-span-1" role="alert">{locationError}</div> : null}
              {error ? <div className="col-span-2 rounded-md border border-[rgba(168,92,82,0.25)] bg-[rgba(168,92,82,0.08)] px-[10px] py-[9px] text-[0.72rem] leading-[1.4] text-[#8e443b] max-[700px]:col-span-1" role="alert">{error}</div> : null}

              <button type="submit" className="col-span-2 flex min-h-10 w-full items-center justify-center gap-2.5 rounded-md border-0 bg-[#c9821f] px-[14px] text-white hover:bg-[#b87419] disabled:cursor-wait disabled:opacity-[0.72] max-[700px]:col-span-1" disabled={isSubmitting || !location}>
                {isSubmitting ? "Submitting..." : "Create Account"}<ArrowRight size={16} />
              </button>
            </form>

            <div className="mb-[10px] mt-[14px] flex items-center gap-3 text-[0.62rem] text-[#8f8982] before:h-px before:flex-1 before:bg-[#e9e2d9] after:h-px after:flex-1 after:bg-[#e9e2d9]"><span>or</span></div>
            <p className="m-0 text-center text-[0.65rem] text-[#77716a] [&_a]:ml-1 [&_a]:font-semibold [&_a]:text-[#a96d18] [&_a]:no-underline [&_a:hover]:underline">Already have an account? <Link to="/partner/accommodation/login">Sign In</Link></p>
          </>
        )}
      </div>
    </AuthShell>
  );
}