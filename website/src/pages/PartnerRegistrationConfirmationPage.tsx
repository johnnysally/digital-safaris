import React from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSiteConfig } from "../context/SiteConfigContext";

interface RegistrationLocationState {
  email?: string;
}

export const PartnerRegistrationConfirmationPage: React.FC = () => {
  const config = useSiteConfig();
  const location = useLocation();
  const email = (location.state as RegistrationLocationState | null)?.email;

  return (
    <main className="relative isolate flex min-h-[75vh] items-center justify-center overflow-hidden bg-[#f9f7f4] px-4 py-16 text-[#191816]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(196,124,43,.13),transparent_38rem)]" />
      <section className="mx-auto w-full max-w-[620px] text-center">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-[#ead8bf] bg-[#fffaf2] text-[#a7671c] shadow-[0_8px_24px_rgba(80,51,25,.08)]">
          <CheckCircle2 size={32} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <p className="m-0 text-xs font-bold uppercase tracking-[.16em] text-[#a7671c]">
          Partner application submitted
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-[#29221c] sm:text-5xl">
          Your application is under review.
        </h1>
        <p className="mx-auto mt-4 max-w-[510px] text-base leading-relaxed text-[#625950]">
          Thank you for applying to partner with {config?.site_name || "DigitalSafaris"}. Our team will review your business details before approving your account.
        </p>

        <div className="mx-auto mt-7 flex max-w-[520px] items-start gap-4 rounded-xl border border-[#ead8bf] bg-[#fffaf2] p-5 text-left shadow-[0_8px_24px_rgba(80,51,25,.05)]" role="status">
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-[#f4e4cc] text-[#a7671c]">
            <Mail size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 text-sm font-bold text-[#30271f]">What happens next</h2>
            <p className="mb-0 mt-1.5 break-words text-sm leading-relaxed text-[#5e5950]">
              Once your account is approved, we&apos;ll send an email
              {email ? <> to <strong className="text-[#30271f]">{email}</strong></> : " to the address you provided"}
              {" "}with your approval and instructions for getting started. You don&apos;t need to submit another application.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};