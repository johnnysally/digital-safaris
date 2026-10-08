import { BusFront, Mountain, Utensils } from "lucide-react";

type PartnerLogoVariant =
  | "landing-header"
  | "landing-footer"
  | "accommodation-auth"
  | "accommodation-sidebar"
  | "restaurant-auth"
  | "restaurant-sidebar"
  | "transport-auth"
  | "transport-sidebar";

const brandName = (
  <>
    Digital<span className="text-[#e7a12a]">Safaris</span>
  </>
);

const tagline = "Travel · Explore · Experience";

export function PartnerLogo({ variant }: { variant: PartnerLogoVariant }) {
  switch (variant) {
    case "landing-header":
      return (
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-[#f7bd59] font-serif text-xl font-bold text-[#ffce73] max-[767px]:h-[38px] max-[767px]:w-[38px]">D</span>
          <span className="leading-tight">
            <strong className="block font-serif text-xl">Digital<span className="text-[#f7b54a]">Safaris</span></strong>
            <small className="block text-[9px] tracking-[.12em] text-white/85">TRAVEL · EXPLORE · EXPERIENCE</small>
          </span>
        </span>
      );
    case "landing-footer":
      return (
        <span className="inline-flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-amber-300 font-serif text-xl text-amber-200">D</span>
          <strong className="font-serif text-xl">Digital<span className="text-[#eab657]">Safaris</span></strong>
        </span>
      );
    case "accommodation-auth":
      return (
        <span className="grid grid-cols-[auto_1fr] items-center gap-x-[9px] text-white [&_svg]:row-span-2">
          <Mountain size={46} strokeWidth={1.7} aria-hidden="true" />
          <strong className="self-end font-serif text-[1.9rem] leading-[0.95]">{brandName}</strong>
          <small className="mt-1 self-start text-[0.57rem] tracking-[0.08em] text-white/75">{tagline}</small>
        </span>
      );
    case "accommodation-sidebar":
      return (
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[rgba(197,138,42,0.4)] bg-[rgba(197,138,42,0.18)] text-[#fefaf4]">
            <Mountain size={29} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <span className="text-white [&_strong>span]:text-white">
            <strong className="block text-[1.08rem] font-bold tracking-[-0.02em]">{brandName}</strong>
            <small className="mt-0.5 block text-[0.65rem] text-white/70">{tagline}</small>
          </span>
        </span>
      );
    case "restaurant-auth":
      return (
        <span className="grid w-max max-w-[220px] justify-items-start gap-px text-white [&_svg]:block [&_svg]:h-[53px] [&_svg]:w-[178px] max-[680px]:[&_svg]:h-[42px] max-[680px]:[&_svg]:w-[142px]">
          <svg viewBox="0 0 194 47" aria-hidden="true">
            <path d="M8 22 34 8l12 11 16-15 18 18M24 18l10-6 6 6M48 17l14-13 15 18" fill="none" stroke="#eaa331" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M89 21c-2-9 0-15 2-19m-1 10-8-7m8 7 8-8m-8 8-9 1m9-1 9 2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
            <text x="0" y="42" fill="#fff" fontFamily="Georgia, serif" fontSize="23" fontWeight="bold">Digital<tspan fill="#eaa331">Safaris</tspan></text>
          </svg>
          <small className="pl-[7px] text-[9px] tracking-[.15px] text-white/85">Travel <i className="mx-1 mb-[2px] inline-block size-[2px] rounded-full bg-[#e3aa40]" /> Explore <i className="mx-1 mb-[2px] inline-block size-[2px] rounded-full bg-[#e3aa40]" /> Experience</small>
        </span>
      );
    case "restaurant-sidebar":
      return (
        <span className="relative grid grid-cols-[30px_1fr] gap-x-2 gap-y-0 max-[760px]:[&_strong]:hidden max-[760px]:[&_small]:hidden">
          <span className="row-span-2 grid size-[30px] place-items-center rounded-[10px] bg-[#d8c48d] text-[#30342a] max-[480px]:size-[27px]">
            <Utensils size={22} aria-hidden="true" />
          </span>
          <strong className="text-white">Digital<span>Safaris</span></strong>
          <small className="text-white/75">Restaurant Partner Portal</small>
        </span>
      );
    case "transport-auth":
      return (
        <span className="inline-flex items-center gap-2.5 text-white">
          <Mountain className="text-[#fff6e7]" size={36} strokeWidth={1.7} aria-hidden="true" />
          <span className="flex flex-col">
            <strong className="font-['Cormorant_Garamond',Georgia,serif] text-[1.85rem] leading-[.95]">{brandName}</strong>
            <small className="mt-1.5 text-[.63rem] tracking-[.025em]">{tagline}</small>
          </span>
        </span>
      );
    case "transport-sidebar":
      return (
        <span className="flex flex-col items-center border-b border-white/10 px-1 pt-1 pb-[19px] text-white no-underline max-[760px]:flex-row max-[760px]:justify-start max-[760px]:gap-[7px] max-[760px]:border-0 max-[760px]:p-0 max-[760px]:pb-2 [&_strong]:font-[Cormorant_Garamond,Georgia,serif] [&_strong]:text-[1.38rem] [&_strong]:leading-none [&_small]:mt-[5px] [&_small]:text-[.5rem] [&_small]:text-white/75 max-[760px]:[&_small]:m-0 max-[760px]:[&_small]:ml-auto">
          <span className="grid h-[34px] w-[38px] place-items-center text-[#fff7e8] max-[760px]:h-[27px] max-[760px]:w-7">
            <BusFront size={26} aria-hidden="true" />
          </span>
          <strong className="[&_span]:text-white">{brandName}</strong>
          <small>{tagline}</small>
        </span>
      );
  }
}
