import type { ReactNode } from "react";
import { BusFront, Globe2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { PartnerLogo } from "../../components/brand/PartnerLogo";
import transportHero from "../../../../website/public/hero-bg.jpg";

export function TransportAuthLayout({ children }: { children: ReactNode }) {
	return (
		<main className="grid min-h-screen min-h-[100svh] grid-cols-[minmax(0,50.5%)_minmax(0,49.5%)] bg-[#faf7f0] font-['DM_Sans','Segoe_UI',sans-serif] text-[#292622] max-[820px]:grid-cols-[minmax(0,43%)_minmax(0,57%)] max-[640px]:flex max-[640px]:flex-col">
			<section className="relative min-h-screen min-h-[100svh] overflow-hidden bg-[#382617] text-white max-[640px]:min-h-[240px] max-[640px]:h-[240px]" aria-label="DigitalSafaris Transport Partner">
				<img className="absolute inset-0 h-full w-full object-cover object-[82%_50%]" src={transportHero} alt="" />
				<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,12,.34),transparent_33%,rgba(19,14,9,.76))]" />
				<div className="absolute inset-0 z-[1] flex flex-col justify-between p-[clamp(30px,5.2vw,66px)_clamp(28px,5.5vw,68px)] max-[820px]:p-[36px] max-[640px]:p-6">
					<Link className="inline-flex w-fit items-center gap-2.5 text-white no-underline" to="/partner/transport/login" aria-label="DigitalSafaris Transport Partner sign in">
						<PartnerLogo variant="transport-auth" />
					</Link>
					<div className="mb-[1.5vh] max-[640px]:hidden">
						<span className="mb-4 block h-[3px] w-12 bg-[#e39a21]" />
						<h1 className="m-0 font-['Cormorant_Garamond',Georgia,serif] text-[clamp(2.1rem,3.15vw,3rem)] font-bold leading-[1.08] text-white">Move people.<br />Connect destinations.<br />Grow with <strong className="text-[#ed9c1d]">DigitalSafaris.</strong></h1>
						<p className="mt-5 flex items-center gap-3 text-[.9rem] text-white/85"><BusFront className="text-[#eea226]" size={21} /> Transport Partner Portal</p>
					</div>
				</div>
			</section>
			<section className="relative flex min-w-0 min-h-screen min-h-[100svh] flex-col justify-center overflow-hidden bg-[radial-gradient(ellipse_at_100%_0%,transparent_0_85px,rgba(188,157,113,.07)_86px_87px,transparent_88px_110px,rgba(188,157,113,.06)_111px_112px,transparent_113px_136px,rgba(188,157,113,.05)_137px_138px,transparent_139px),linear-gradient(160deg,#fcf9f2_0%,#faf6ed_70%,#f3e9d9_100%)] px-[clamp(28px,5.2vw,64px)] pt-[70px] pb-[46px] max-[820px]:px-9 max-[640px]:min-h-[calc(100svh-240px)] max-[640px]:px-6 max-[640px]:pt-16">
				<div className="absolute top-[25px] right-[clamp(28px,5vw,62px)] flex items-center gap-[9px] text-[#48433d] max-[640px]:right-6"><span className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-[rgba(123,109,95,.16)] bg-white/60 px-3 text-[.68rem]"><Globe2 size={15} /> English</span></div>
				<div className="relative z-[1] m-auto w-full max-w-[380px]">{children}</div>
				<p className="absolute bottom-5 left-[clamp(28px,5.2vw,64px)] m-0 flex items-center gap-2 text-[.7rem] text-[#66615c] max-[640px]:left-6"><ShieldCheck className="text-[#925719]" size={16} /> Your account and partner data are protected.</p>
			</section>
		</main>
	);
}
