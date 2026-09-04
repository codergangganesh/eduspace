import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface LanguageOption {
  code: string;
  nativeLabel: string;
  englishLabel: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", nativeLabel: "English", englishLabel: "English", region: "Global / US / UK" },
  { code: "te", nativeLabel: "తెలుగు", englishLabel: "Telugu", region: "Andhra Pradesh & Telangana" },
  { code: "hi", nativeLabel: "हिन्दी", englishLabel: "Hindi", region: "India" },
];

export function LanguageDialog() {
  const [open, setOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-language-dialog", handleOpen);
    return () => window.removeEventListener("open-language-dialog", handleOpen);
  }, []);

  const handleSelectLanguage = (code: string, nativeLabel: string) => {
    changeLanguage(code);
    setOpen(false);
    toast.success(`Language changed to ${nativeLabel}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl border-border/60 shadow-2xl backdrop-blur-2xl bg-popover/95 z-[10005]">
        <DialogHeader className="text-left space-y-1 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Globe className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">Select Language</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Choose your preferred interface language
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {SUPPORTED_LANGUAGES.map((lang) => {


            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code, lang.nativeLabel)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/40",
                  isSelected
                    ? "bg-primary/10 border-primary text-primary shadow-sm ring-1 ring-primary/20 font-semibold"
                    : "bg-card/50 hover:bg-card border-border/60 hover:border-primary/40 text-foreground"
                )}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-sm font-bold tracking-tight">{lang.nativeLabel}</span>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground/80 transition-colors">
                    {lang.englishLabel}
                  </span>
                </div>
                {isSelected ? (
                  <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="size-4 rounded-full border border-border/80 group-hover:border-primary/60 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
