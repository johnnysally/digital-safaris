import type { ReactNode } from "react";
import { Mountain } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: ReactNode;
  title: ReactNode;
  description: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#24180f] text-white">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-[position:57%_center]"
        style={{ backgroundImage: "url(/hero-bg.jpg)" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(18,17,15,.76)_0%,rgba(24,19,14,.45)_43%,rgba(21,17,13,.48)_100%),linear-gradient(0deg,rgba(18,16,13,.55),transparent_55%,rgba(18,16,13,.18))]"
        aria-hidden="true"
      />

      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] grid-cols-[minmax(0,1fr)_minmax(340px,420px)] items-center gap-[clamp(36px,7vw,112px)] px-[clamp(28px,7vw,104px)] py-10 max-[820px]:grid-cols-1 max-[820px]:gap-8 max-[820px]:px-8 max-[820px]:py-7 max-[520px]:gap-6 max-[520px]:px-[18px] max-[520px]:py-5">
        <section className="flex min-h-[min(720px,calc(100svh-80px))] flex-col justify-between max-[820px]:min-h-0 max-[820px]:gap-8">
          <Link to="/" className="inline-flex w-fit items-center gap-3 text-white no-underline">
            <Mountain className="h-10 w-10 text-[#f0b747]" strokeWidth={1.6} aria-hidden="true" />
            <span className="flex flex-col">
              <span className="font-[Georgia,serif] text-[1.55rem] font-bold leading-none tracking-[-0.04em]">
                Digital<span className="text-[#e4a33a]">Safaris</span>
              </span>
              <span className="mt-1 text-[0.58rem] font-medium tracking-[0.16em] text-white/75 uppercase">
                Travel · Explore · Experience
              </span>
            </span>
          </Link>

          <div className="max-w-[560px] py-12 max-[820px]:py-0">
            <p className="mb-3 text-[0.68rem] font-bold tracking-[0.22em] text-[#f2be5c] uppercase">
              Kenya is closer than you think
            </p>
            <h1 className="max-w-[540px] font-[Georgia,serif] text-[clamp(2.7rem,5.4vw,5rem)] font-bold leading-[0.98] tracking-[-0.045em] text-white max-[520px]:text-[2.15rem]">
              {title}
            </h1>
            <p className="mt-5 max-w-[420px] text-[clamp(0.88rem,1.2vw,1.02rem)] leading-[1.65] text-white/90">
              {description}
            </p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[0.68rem] font-medium text-white/85">
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#edb348]" />Local experiences</span>
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#edb348]" />Trusted providers</span>
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#edb348]" />Secure bookings</span>
            </div>
          </div>

          <p className="m-0 text-[0.62rem] tracking-[0.06em] text-white/65 max-[820px]:hidden">
            YOUR JOURNEY, ROOTED IN KENYA
          </p>
        </section>

        <section className="w-full rounded-[13px] border border-white/70 bg-[#fffdf9]/[0.97] px-[clamp(22px,3vw,32px)] py-[clamp(22px,3vw,30px)] text-[#26231f] shadow-[0_24px_75px_rgba(0,0,0,.3)] max-[820px]:mx-auto max-[820px]:max-w-[460px]">
          {children}
        </section>
      </div>
    </main>
  );
}
