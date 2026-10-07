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
      <div className="page-shell support-page">
        <PageHeader title="Help & Support" subtitle="Get help when you need it." />

        <div className="support-grid">
          {supportItems.map(({ title, description, icon: Icon }) => (
            <div className="card support-card" key={title}>
              <div className="support-icon-wrap">
                <Icon size={18} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="inline-link">Learn more →</span>
            </div>
          ))}
        </div>

        <div className="support-banner">
          <div className="support-banner-copy">
            <p className="eyebrow light">Need more help?</p>
            <h3>Our support team is available 24/7.</h3>
            <button type="button" className="primary-button wide-button">Contact Support</button>
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
