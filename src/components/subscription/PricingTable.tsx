
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, createCheckoutSession } from "@/lib/subscriptionService";

export const PricingTable = () => {
    const { user } = useAuth();

    const handleSubscribe = async (priceId: string) => {
        if (!user) {
            console.log("Please log in to subscribe");
            return;
        }
        try {
            const { url } = await createCheckoutSession(priceId);
            if (url) window.location.href = url;
        } catch (error) {
            console.error("Subscription error:", error);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan) => (
                <Card key={plan.id} className={cn("flex flex-col", plan.id === 'pro' && "border-primary")}>
                    <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        {plan.id === 'pro' && <Badge variant="default" className="w-fit mt-2">Popular</Badge>}
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="text-3xl font-bold mb-4">${plan.price}<span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span></div>
                        <ul className="space-y-2">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center text-sm">
                                    <span className="mr-2 text-primary">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant={plan.id === 'pro' ? "default" : "outline"}
                            onClick={() => handleSubscribe(plan.priceId)}
                            disabled={!plan.priceId}
                        >
                            {plan.priceId ? "Subscribe" : "Current Plan"}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};
