import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  ExternalLink,
  FileQuestion,
  Headphones,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios, { getApiErrorMessage } from "../../api/axios";
import { isNonEmpty, isValidEmail, isValidPhoneNumber } from "../../utils/validators";
import { AccommodationPartnerLayout, PageHeader } from "../../components/layout/Layout";

const faqs = [
  {
    category: "Property",
    question: "How do I add or update my property?",
    answer: "Open My Property from the sidebar. Choose Add Property to create a listing, or use the edit action on an existing property. Keep your location, contact details, check-in times, and description accurate so guests know what to expect.",
  },
  {
    category: "Availability",
    question: "How do I block dates or change a room rate?",
    answer: "Open Availability, choose the room type and date range, then set the nightly rate and available units. Select the block-dates option when the room should not be bookable, then save the date range.",
  },
  {
    category: "Bookings",
    question: "Where can I review or update a reservation?",
    answer: "Use Bookings to review guest, stay, payment, and reservation status details. Available actions depend on the booking status; the page shows the actions supported for each reservation.",
  },
  {
    category: "Payments",
    question: "Where do I manage payout information?",
    answer: "Go to Settings, then Banking & Payouts. Review the payout method and account details carefully before saving. Changes may require verification before they are used for a payout.",
  },
  {
    category: "Account",
    question: "How do I change my contact or property details?",
    answer: "Open Settings and choose Profile to update contact details, or Property Details to update the information shown to guests. Save changes from the bottom of the relevant section.",
  },
  {
    category: "Account",
    question: "Can I change my password or notification delivery settings here?",
    answer: "Password changes, two-factor controls, and server-side notification delivery preferences are not currently available through the accommodation partner API. Contact support for account-access help; notification toggles in Settings are saved only in this browser.",
  },
];

const topics = [
  ["general", "General question"],
  ["portal", "Partner portal support"],
  ["portal", "Booking issue"],
  ["portal", "Property or availability"],
  ["portal", "Payments and payouts"],
  ["other", "Report a technical issue"],
] as const;
const initialForm = { name: "", email: "", phone: "", subject: "portal", message: "" };

export function SupportPage() {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return faqs;
    return faqs.filter(({ category, question, answer }) => `${category} ${question} ${answer}`.toLowerCase().includes(query));
  }, [search]);

  async function submitSupportRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isNonEmpty(form.name) || !isNonEmpty(form.message)) {
      setError("Please enter your name and describe what you need help with.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address so the team can reply.");
      return;
    }
    if (form.phone && !isValidPhoneNumber(form.phone)) {
      setError("Please enter a valid phone number or leave that field blank.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await axios.post("/web/contact", {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm(initialForm);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "We could not send your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccommodationPartnerLayout>
      <div className="w-full">
        <PageHeader title="Help & Support" subtitle="Find a quick answer or send the partner support team a message." />

        <section className="relative mb-5 overflow-hidden rounded-2xl bg-[#2d2015] text-white shadow-[0_12px_30px_rgba(36,22,13,.1)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_20%,rgba(206,145,58,.26),transparent_45%),linear-gradient(110deg,rgba(35,24,16,.98),rgba(48,32,18,.88))]" />
          <div className="relative flex flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8 sm:py-8">
            <div className="max-w-2xl">
              <span className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#f0c16f]"><Sparkles size={13} /> Partner care</span>
              <h2 className="m-0 font-serif text-2xl font-semibold sm:text-3xl">Let’s get you back to hosting.</h2>
              <p className="mb-0 mt-2 max-w-xl text-xs leading-relaxed text-white/75 sm:text-sm">Search practical guides for bookings, availability, property setup, and payouts—or send us a support request.</p>
            </div>
            <a href="#support-request" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#c58a2a] px-4 text-xs font-semibold text-white no-underline transition hover:bg-[#b5771e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <MessageCircle size={16} /> Contact partner support <ArrowRight size={14} />
            </a>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e9dfd1] bg-[rgba(255,252,247,.95)] shadow-[0_8px_22px_rgba(36,22,13,.04)]" aria-labelledby="help-center-title">
            <div className="border-b border-[#eee5d9] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]"><BookOpen size={18} /></span>
                <div>
                  <h2 id="help-center-title" className="m-0 font-serif text-lg font-semibold text-[#29231e]">Partner help center</h2>
                  <p className="mb-0 mt-1 text-xs text-[#70675e]">Search these quick guides to find an answer.</p>
                </div>
              </div>
              <label className="mt-4 flex min-h-11 items-center gap-2.5 rounded-lg border border-[#e4d9ca] bg-white px-3 text-[#897e71] focus-within:border-[#b9781d] focus-within:ring-2 focus-within:ring-[#b9781d]/15">
                <Search size={16} aria-hidden="true" />
                <input className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-[#332b24] outline-none placeholder:text-[#a69b8d]" type="search" placeholder="Search bookings, payouts, availability..." value={search} onChange={(event) => setSearch(event.target.value)} />
                <span className="hidden text-[10px] text-[#9b9083] sm:inline">{filteredFaqs.length} guides</span>
              </label>
            </div>
            <div className="divide-y divide-[#f0e9df] px-5 sm:px-6">
              {filteredFaqs.length ? filteredFaqs.map(({ category, question, answer }) => (
                <details className="group py-4" key={question}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold text-[#332b24] marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b5b17] [&::-webkit-details-marker]:hidden">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f8f2e8] text-[#94601e]"><CircleHelp size={16} /></span>
                    <span className="min-w-0 flex-1">{question}<small className="mt-1 block text-[9px] font-medium uppercase tracking-[.1em] text-[#9a8060]">{category}</small></span>
                    <ChevronDown size={17} className="shrink-0 text-[#8f8273] transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mb-0 ml-11 mt-3 max-w-3xl text-xs leading-relaxed text-[#70675e]">{answer}</p>
                </details>
              )) : (
                <div className="py-10 text-center">
                  <FileQuestion size={24} className="mx-auto text-[#a68a62]" />
                  <p className="mb-1 mt-3 text-sm font-semibold text-[#332b24]">No guide matches that search</p>
                  <p className="m-0 text-xs text-[#81766a]">Try another phrase or send the team a support request.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-2xl border border-[#e9dfd1] bg-[rgba(255,252,247,.95)] p-5 shadow-[0_8px_22px_rgba(36,22,13,.04)]">
              <h2 className="m-0 font-serif text-lg font-semibold text-[#29231e]">Popular destinations</h2>
              <p className="mb-4 mt-1 text-xs text-[#70675e]">Jump straight to the tools partners use most.</p>
              <div className="grid gap-2">
                {([
                  ["Manage bookings", "Review guest reservations", CalendarDays, "/partner/accommodation/bookings"],
                  ["Update availability", "Rates, units, and blocked dates", Clock3, "/partner/accommodation/availability"],
                  ["Review payouts", "Payment activity and details", CreditCard, "/partner/accommodation/payments"],
                  ["Edit property", "Listing and guest information", LifeBuoy, "/partner/accommodation/properties"],
                ] as const).map(([title, description, Icon, href]) => (
                  <Link className="group flex min-h-[58px] items-center gap-3 rounded-xl border border-[#eee5d9] bg-white/70 px-3 py-2.5 text-inherit no-underline transition hover:border-[#d8c6a8] hover:bg-[#fffdf8]" to={href} key={href}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f7f0e5] text-[#89591f]"><Icon size={16} /></span>
                    <span className="min-w-0 flex-1"><strong className="block text-xs text-[#332b24]">{title}</strong><small className="mt-0.5 block text-[10px] text-[#81766a]">{description}</small></span>
                    <ExternalLink size={14} className="shrink-0 text-[#a09282] transition group-hover:text-[#9b5b17]" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e9dfd1] bg-[rgba(255,252,247,.95)] p-5 shadow-[0_8px_22px_rgba(36,22,13,.04)]">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]"><Headphones size={18} /></span>
                <div><h2 className="m-0 font-serif text-lg font-semibold text-[#29231e]">Still need help?</h2><p className="mb-0 mt-1 text-xs leading-relaxed text-[#70675e]">Send a message with enough detail for the team to investigate.</p></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#fbf7f0] p-3"><Clock3 size={15} className="mb-1.5 text-[#95611e]" /><strong className="block text-[10px] text-[#44392e]">Response time</strong><span className="mt-0.5 block text-[10px] leading-relaxed text-[#81766a]">We’ll reply to your email as soon as possible.</span></div>
                <div className="rounded-lg bg-[#fbf7f0] p-3"><ShieldAlert size={15} className="mb-1.5 text-[#95611e]" /><strong className="block text-[10px] text-[#44392e]">Account safety</strong><span className="mt-0.5 block text-[10px] leading-relaxed text-[#81766a]">Never include passwords or full payment details.</span></div>
              </div>
            </section>
          </aside>
        </div>

        <section id="support-request" className="mt-5 scroll-mt-5 overflow-hidden rounded-2xl border border-[#e9dfd1] bg-[rgba(255,252,247,.96)] shadow-[0_8px_22px_rgba(36,22,13,.04)]">
          <div className="grid lg:grid-cols-[.72fr_1.28fr]">
            <div className="bg-[linear-gradient(145deg,#342417,#24180f)] p-5 text-white sm:p-7">
              <span className="grid size-11 place-items-center rounded-xl border border-[#e9b65e]/30 bg-[#e9b65e]/10 text-[#efc476]"><Mail size={19} /></span>
              <h2 className="mt-4 font-serif text-2xl font-semibold">Send us a message</h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/70">Include the affected page, booking reference (if relevant), and what you expected to happen. Please leave out passwords and sensitive payment information.</p>
              <div className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-white/60"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-[#e9b65e]" />Support requests are sent securely to the DigitalSafaris contact service.</div>
            </div>
            <div className="p-5 sm:p-7">
              {sent ? (
                <div className="flex min-h-[250px] flex-col items-center justify-center text-center" role="status">
                  <span className="grid size-14 place-items-center rounded-full bg-[#edf5e9] text-[#347447]"><CheckCircle2 size={27} /></span>
                  <h3 className="mb-1 mt-4 text-base font-semibold text-[#332b24]">Your request was sent</h3>
                  <p className="max-w-sm text-xs leading-relaxed text-[#70675e]">Thanks for getting in touch. The support team can reply to the email address you provided.</p>
                  <button type="button" className="mt-2 rounded-lg border border-[#e4d9ca] bg-white px-4 py-2 text-xs font-semibold text-[#695d51] hover:bg-[#fbf7f0]" onClick={() => setSent(false)}>Send another request</button>
                </div>
              ) : (
                <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={submitSupportRequest}>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#554c43]">Your name<input className="min-h-11 rounded-lg border border-[#e4d9ca] bg-white px-3 py-2 text-sm font-normal focus:border-[#b9781d] focus:outline-none focus:ring-2 focus:ring-[#b9781d]/15" autoComplete="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#554c43]">Email address<input className="min-h-11 rounded-lg border border-[#e4d9ca] bg-white px-3 py-2 text-sm font-normal focus:border-[#b9781d] focus:outline-none focus:ring-2 focus:ring-[#b9781d]/15" autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#554c43]">Phone <span className="font-normal text-[#958a7d]">(optional)</span><input className="min-h-11 rounded-lg border border-[#e4d9ca] bg-white px-3 py-2 text-sm font-normal focus:border-[#b9781d] focus:outline-none focus:ring-2 focus:ring-[#b9781d]/15" autoComplete="tel" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+254..." /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#554c43]">Topic<select className="min-h-11 rounded-lg border border-[#e4d9ca] bg-white px-3 py-2 text-sm font-normal focus:border-[#b9781d] focus:outline-none focus:ring-2 focus:ring-[#b9781d]/15" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>{topics.map(([value, label]) => <option key={label} value={value}>{label}</option>)}</select></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#554c43] sm:col-span-2">How can we help?<textarea className="min-h-[132px] resize-y rounded-lg border border-[#e4d9ca] bg-white px-3 py-2.5 text-sm font-normal leading-relaxed focus:border-[#b9781d] focus:outline-none focus:ring-2 focus:ring-[#b9781d]/15" required maxLength={3000} rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Describe the issue and the steps you took..." /></label>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                    <span className="text-[10px] text-[#81766a]">{form.message.length}/3000 characters</span>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>
                      <Send size={15} />{submitting ? "Sending request..." : "Send support request"}
                    </button>
                  </div>
                  {error ? <p className="m-0 rounded-lg border border-[#eed3cf] bg-[#fff8f7] px-3 py-2 text-xs text-[#914940] sm:col-span-2" role="alert">{error}</p> : null}
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </AccommodationPartnerLayout>
  );
}
