import { useLanguage } from "@/contexts/LanguageContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSelector({ className }: { className?: string }) {
    const { language, changeLanguage } = useLanguage();

    return (
        <Select value={language} onValueChange={changeLanguage}>
            <SelectTrigger 
                className={className}
                aria-label="Select interface language"
            >
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <SelectValue placeholder="Select language" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
                <SelectItem value="de">Deutsch (German)</SelectItem>
                <SelectItem value="zh">中文 (Chinese)</SelectItem>
                <SelectItem value="ja">日本語 (Japanese)</SelectItem>
            </SelectContent>
        </Select>
    );
}
