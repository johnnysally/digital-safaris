import { Headphones, HelpCircle, PlayCircle, ShieldAlert } from "lucide-react";
import { AccommodationPartnerLayout, PageHeader } from "../../components/layout/Layout";

const supportItems = [
  { title: "FAQs", description: "Find answers to common questions", icon: HelpCircle },
  { title: "Contact Support", description: "Talk to our support team", icon: Headphones },
  { title: "Video Guides", description: "Learn how to use the platform", icon: PlayCircle },
  { title: "Report an Issue", description: "Let us know about a problem", icon: ShieldAlert },
];

export function SupportPage() {
  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="Help & Support" subtitle="Get help when you need it." />

        <div className="grid grid-cols-2 gap-5">
          {supportItems.map(({ title, description, icon: Icon }) => (
            <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-6 shadow-[0_8px_18px_rgba(36,22,13,0.03)] [&_h3]:m-0 [&_h3]:tracking-[-0.03em]" key={title}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-[rgba(197,138,42,0.12)] text-[var(--gold)]">
                <Icon size={18} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="mt-4 inline-block font-semibold text-[var(--gold)]">Learn more →</span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[18px] bg-[var(--sidebar)] p-8 text-white">
          <div className="max-w-[520px] [&_h3]:mb-4 [&_h3]:text-2xl">
            <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)] text-white/80">Need more help?</p>
            <h3>Our support team is available 24/7.</h3>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98] w-full">Contact Support</button>
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
