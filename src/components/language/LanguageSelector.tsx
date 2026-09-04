import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface SupportedLanguage {
  code: string;
  nativeLabel: string;
  englishLabel: string;
  badge: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", nativeLabel: "English", englishLabel: "English", badge: "EN" },
  { code: "te", nativeLabel: "తెలుగు", englishLabel: "Telugu", badge: "TE" },
  { code: "hi", nativeLabel: "हिन्दी", englishLabel: "Hindi", badge: "HI" },
];

export function LanguageSelector({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === (language || "en")) ||
    SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: string, nativeLabel: string) => {
    changeLanguage(code);
    toast.success(`Language set to ${nativeLabel}`);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-all duration-200 text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer w-full text-left",
            className
          )}
          aria-label="Select interface language"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20 group-hover:scale-105 transition-all shrink-0">
              <Globe className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground truncate leading-tight">
                {currentLang.nativeLabel}
              </span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight">
                {currentLang.englishLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
              {currentLang.badge}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200",
                open && "rotate-180 text-primary"
              )}
            />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-64 p-1.5 rounded-2xl border-border/50 shadow-2xl backdrop-blur-xl bg-popover/95 z-[10002] animate-in fade-in-0 zoom-in-95 duration-150"
      >
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-3.5 text-sky-500" />
              <span className="text-xs font-bold tracking-tight text-foreground">
                {t("common.selectLanguage", "Select Language")}
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              3 {t("common.options", "Languages")}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 opacity-60" />

        <div className="space-y-1">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = (language || "en") === lang.code;
            return (
              <DropdownMenuItem
                key={lang.code}
                onSelect={(e) => {
                  e.preventDefault();
                  handleSelect(lang.code, lang.nativeLabel);
                }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-150 text-sm font-medium group",
                  isSelected
                    ? "bg-primary/15 text-primary font-bold shadow-xs"
                    : "hover:bg-muted/80 text-foreground/80 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md text-[10px] font-bold uppercase border transition-colors shrink-0",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/60 text-muted-foreground border-border/70 group-hover:border-primary/40 group-hover:text-foreground"
                    )}
                  >
                    {lang.badge}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold leading-tight truncate">
                      {lang.nativeLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight truncate">
                      {lang.englishLabel}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
