import React from "react";

type SectionHeaderProps = {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrowTone?: "accent" | "muted";
  className?: string;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  eyebrowTone = "accent",
  className = "",
}) => (
  <div className={`text-center space-y-3 ${className}`.trim()}>
    <span
      className={`text-xs font-bold uppercase tracking-widest ${
        eyebrowTone === "accent" ? "text-brand-amber" : "text-content-muted"
      }`}
    >
      {eyebrow}
    </span>
    <h2 className="text-section-title font-extrabold tracking-tight sm:text-section-title-lg">{title}</h2>
    {description && (
      <p className="mx-auto max-w-xl text-sm text-content-muted sm:text-base">
        {description}
      </p>
    )}
  </div>
);
