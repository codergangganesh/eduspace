
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PricingTable } from "./PricingTable";

export function SubscriptionModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Upgrade Plan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>Choose your plan</DialogTitle>
                    <DialogDescription>
                        Unlock all features with our Pro plan.
                    </DialogDescription>
                </DialogHeader>
                <PricingTable />
            </DialogContent>
        </Dialog>
    );
}
