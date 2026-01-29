import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function AuthHeader() {
  return (
    <header className="w-full border-b border-border bg-surface px-4 lg:px-10 py-3 sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between whitespace-nowrap">
        <Link to="/" className="flex items-center gap-3 text-foreground">
          <div className="size-8 overflow-hidden rounded-lg border border-border">
            <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Eduspace</h2>
        </Link>
        <div className="flex items-center gap-6">
          <a
            className="text-foreground text-sm font-medium leading-normal hidden sm:block hover:text-primary transition-colors"
            href="#"
          >
            Help Center
          </a>
          <a
            className="text-foreground text-sm font-medium leading-normal hover:text-primary transition-colors"
            href="#"
          >
            Contact Support
          </a>
        </div>
      </div>
    </header>
  );
}
