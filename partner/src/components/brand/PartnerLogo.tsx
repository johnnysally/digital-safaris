type PartnerLogoVariant =
  | "landing-header"
  | "landing-footer"
  | "accommodation-auth"
  | "accommodation-sidebar"
  | "restaurant-auth"
  | "restaurant-sidebar"
  | "transport-auth"
  | "transport-sidebar";

const logoClasses: Record<PartnerLogoVariant, string> = {
  "landing-header": "h-[58px] w-[96px] max-[767px]:h-[52px] max-[767px]:w-[86px]",
  "landing-footer": "h-[82px] w-[124px]",
  "accommodation-auth": "h-[92px] w-[138px]",
  "accommodation-sidebar": "h-[82px] w-[124px]",
  "restaurant-auth": "h-[86px] w-[130px]",
  "restaurant-sidebar": "h-[66px] w-[100px] max-[760px]:h-8 max-[760px]:w-8",
  "transport-auth": "h-[82px] w-[124px]",
  "transport-sidebar": "h-[76px] w-[114px] max-[760px]:h-8 max-[760px]:w-8",
};

export function PartnerLogo({ variant }: { variant: PartnerLogoVariant }) {
  const compact = variant === "restaurant-sidebar" || variant === "transport-sidebar";

  return (
    <picture>
      {compact && <source media="(max-width: 760px)" srcSet="/favicon.png" />}
      <img
        src="/logo.png"
        alt="DigitalSafaris"
        className={`block object-contain ${logoClasses[variant]}`}
      />
    </picture>
  );
}
