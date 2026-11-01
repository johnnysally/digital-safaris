import { CircleAlert } from "lucide-react";

interface AuthErrorNoticeProps {
  title: string;
  children: string;
  className?: string;
}

export function AuthErrorNotice({
  title,
  children,
  className = "",
}: AuthErrorNoticeProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex min-w-0 items-start gap-3 rounded-xl border border-[#e8b9ad] bg-[linear-gradient(135deg,#fff8f5,#fff0eb)] px-3.5 py-3 text-[#78352d] shadow-[0_5px_16px_rgba(115,48,38,.08)] ${className}`.trim()}
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[#f7ded6] text-[#a4483d]">
        <CircleAlert size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[.8rem] font-bold leading-5">{title}</span>
        <span className="mt-0.5 block break-words text-[.76rem] leading-relaxed text-[#70423c]">
          {children}
        </span>
      </span>
    </div>
  );
}