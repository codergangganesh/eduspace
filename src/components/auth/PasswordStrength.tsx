import { Check, X, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface PasswordStrengthProps {
    password?: string;
}

export const getPasswordRules = (password: string) => [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Starts with Uppercase", met: /^[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special character", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]+/.test(password) },
    { label: "No spaces allowed", met: password.length > 0 && !/\s/.test(password) }
];

export const PasswordStrength = ({ password = "" }: PasswordStrengthProps) => {
    const rules = getPasswordRules(password);

    if (!password) return null;

    const metCount = rules.filter(r => r.met).length;
    const totalRules = rules.length;

    let strengthLabel = "Weak";
    let strengthColor = "bg-red-500";
    let textColor = "text-red-500";
    let Icon = ShieldAlert;

    if (metCount === totalRules) {
        strengthLabel = "Strong";
        strengthColor = "bg-green-500";
        textColor = "text-green-500";
        Icon = ShieldCheck;
    } else if (metCount >= 5) {
        strengthLabel = "Good";
        strengthColor = "bg-amber-500";
        textColor = "text-amber-500";
        Icon = Shield;
    } else if (metCount >= 3) {
        strengthLabel = "Fair";
        strengthColor = "bg-orange-500";
        textColor = "text-orange-500";
        Icon = Shield;
    }

    return (
        <div className="mt-2 p-2.5 bg-secondary/20 border border-border/50 rounded-lg space-y-2 transition-all duration-300 animate-in fade-in zoom-in-95 ease-out">
            <div className="flex justify-between items-center px-0.5">
                <span className="text-[11px] font-semibold text-foreground/80">
                    Password Strength
                </span>
                <span className={`text-[10px] uppercase tracking-wide font-bold flex items-center gap-1 transition-colors duration-300 ${textColor}`}>
                    <Icon className="size-3" />
                    {strengthLabel}
                </span>
            </div>

            <div className="flex gap-1 h-1 w-full px-0.5">
                {Array.from({ length: totalRules }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-500 ${i < metCount ? strengthColor : 'bg-secondary'
                            }`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-1.5 gap-x-2 pt-1">
                {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                        <div className={`flex shrink-0 items-center justify-center size-3 rounded-full transition-colors duration-300 ${rule.met ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-secondary text-muted-foreground/50'}`}>
                            {rule.met ? <Check className="size-2" strokeWidth={4} /> : <X className="size-2" strokeWidth={3} />}
                        </div>
                        <span className={`truncate transition-colors duration-300 ${rule.met ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {rule.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
