import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BedDouble, Check, LockKeyhole, Mail, Mountain, Phone, ShieldCheck, TrendingUp, UserRound, Users } from "lucide-react";
import authApi from "../../api/accommodation/authApi";
import propertyApi, { type PropertyLocation } from "../../api/accommodation/propertyApi";
import { getApiErrorMessage } from "../../api/axios";
import storage from "../../utils/storage";

const loginBackground = "linear-gradient(90deg, rgba(23, 17, 13, 0.47) 0%, rgba(23, 17, 13, 0.2) 52%, rgba(23, 17, 13, 0.16) 100%), url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2200&q=90')";

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-screen" style={{ backgroundImage: loginBackground }}>
      <div className="auth-brand">
        <Mountain size={46} strokeWidth={1.7} aria-hidden="true" />
        <span className="auth-brand-name"><span>Digital</span><strong>Safaris</strong></span>
        <span className="auth-brand-tagline">Travel · Explore · Experience</span>
      </div>

      <section className="auth-hero-copy">
        <h1>Accommodation<br />Partner Portal</h1>
        <p>Join our network of trusted accommodation partners and grow your business with DigitalSafaris.</p>
      </section>

      <div className="auth-benefits" aria-label="Partner benefits">
        <div><ShieldCheck size={24} /><span><strong>Trusted Partners</strong><small>Build your credibility</small></span></div>
        <div><Users size={24} /><span><strong>More Bookings</strong><small>Reach global travelers</small></span></div>
        <div><TrendingUp size={24} /><span><strong>Grow Together</strong><small>Your success matters</small></span></div>
      </div>

      <section className="auth-panel-wrap">{children}</section>
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
  const returnTo = (location.state as { from?: string } | null)?.from ?? "/partner/accommodation/dashboard";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await authApi.login({ email, password });
      storage.setAccessToken("accommodation", result.accessToken, remember);
      storage.setRefreshToken("accommodation", result.refreshToken, remember);
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to sign in. Please check your details and try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-panel">
        <header className="auth-panel-heading">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your property and reservations.</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-input-row">
            <Mail size={17} aria-hidden="true" />
            <input aria-label="Business email" type="email" autoComplete="username" placeholder="Business Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="auth-input-row">
            <LockKeyhole size={17} aria-hidden="true" />
            <input aria-label="Password" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>

          <div className="auth-options">
            <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label>
            <span className="auth-muted-link">Need help signing in?</span>
          </div>

          {error ? <div className="auth-error" role="alert">{error}</div> : null}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}<ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <p className="auth-switch">New to DigitalSafaris? <Link to="/partner/accommodation/signup">Create an account</Link></p>
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
      <div className="auth-panel">
        {submitted ? (
          <div className="auth-success-state" role="status">
            <span><Check size={23} /></span>
            <h2>Application Received</h2>
            <p>Thanks for applying. Our partner team will review your accommodation and follow up by email.</p>
            <Link className="auth-submit" to="/partner/accommodation/login">Return to sign in <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <>
            <header className="auth-panel-heading">
              <h2>Create Your Account</h2>
              <p>Become an accommodation partner and start receiving bookings today.</p>
            </header>

            <form className="auth-form signup-form" onSubmit={handleSubmit}>
              <label className="auth-input-row">
                <UserRound size={17} aria-hidden="true" />
                <input aria-label="Full name" autoComplete="name" placeholder="Full Name" value={contactName} onChange={(event) => setContactName(event.target.value)} required />
              </label>
              <label className="auth-input-row">
                <Mail size={17} aria-hidden="true" />
                <input aria-label="Business email" type="email" autoComplete="email" placeholder="Business Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className="auth-input-row">
                <BedDouble size={17} aria-hidden="true" />
                <input aria-label="Property name" placeholder="Property Name" value={propertyName} onChange={(event) => setPropertyName(event.target.value)} required />
              </label>
              <label className="auth-input-row">
                <Phone size={17} aria-hidden="true" />
                <input aria-label="Phone number" type="tel" autoComplete="tel" placeholder="Phone Number" value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </label>
              <label className="auth-input-row">
                <LockKeyhole size={17} aria-hidden="true" />
                <input aria-label="Password" type="password" autoComplete="new-password" minLength={8} placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>

              <label className="auth-terms-row">
                <input type="checkbox" required />
                <span>I agree to the <strong>Terms &amp; Conditions</strong> and <strong>Privacy Policy</strong></span>
              </label>

              {locationError ? <div className="auth-error" role="alert">{locationError}</div> : null}
              {error ? <div className="auth-error" role="alert">{error}</div> : null}

              <button type="submit" className="auth-submit" disabled={isSubmitting || !location}>
                {isSubmitting ? "Submitting..." : "Create Account"}<ArrowRight size={16} />
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>
            <p className="auth-switch">Already have an account? <Link to="/partner/accommodation/login">Sign In</Link></p>
          </>
        )}
      </div>
    </AuthShell>
  );
}