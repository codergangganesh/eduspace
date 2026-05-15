import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FlowLinkButtonProps {
  to: string;
  text?: string;
  className?: string;
}

export function FlowLinkButton({
  to,
  text = "Modern Button",
  className,
}: FlowLinkButtonProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex w-full items-center justify-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-[#333333]/40 bg-transparent px-8 py-3 text-sm font-semibold text-[#111111] cursor-pointer transition-all [transition-duration:600ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-white hover:rounded-[12px] active:scale-[0.95]",
        className,
      )}
    >
      <ArrowRight
        className="absolute w-4 h-4 left-[-25%] stroke-[#111111] fill-none z-[9] group-hover:left-4 group-hover:stroke-white transition-all [transition-duration:800ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
      />

      <span className="relative z-[1] -translate-x-3 group-hover:translate-x-3 transition-all [transition-duration:800ms] ease-out">
        {text}
      </span>

      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#111111] rounded-[50%] opacity-0 group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100 transition-all [transition-duration:800ms] [transition-timing-function:cubic-bezier(0.19,1,0.22,1)]"></span>

      <ArrowRight
        className="absolute w-4 h-4 right-4 stroke-[#111111] fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-white transition-all [transition-duration:800ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
      />
    </Link>
  );
}
