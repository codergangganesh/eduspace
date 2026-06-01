"use client";
import { Button } from "@/components/ui/button";
import { Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button variant={"outline"} className="relative">
        <div
          className={cn(
            "-inset-px pointer-events-none absolute rounded-[inherit] border-2 border-transparent border-inset [mask-clip:padding-box,border-box]",
            "[mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
          )}
        >
          <motion.div
            className={cn(
              "absolute aspect-square bg-gradient-to-r from-transparent via-primary to-primary"
            )}
            animate={{
              offsetDistance: ["0%", "100%"],
            }}
            style={{
              width: 20,
              offsetPath: `rect(0 auto auto 0 round ${20}px)`,
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 5,
              ease: "linear",
            }}
          />
        </div>
        <Moon className="size-4" />
      </Button>

      <Button variant={"outline"} className="relative">
        <div
          className={cn(
            "-inset-px pointer-events-none absolute rounded-[inherit] border-2 border-transparent border-inset [mask-clip:padding-box,border-box]",
            "[mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
          )}
        >
          <motion.div
            className={cn(
              "absolute aspect-square bg-gradient-to-r from-transparent via-primary to-primary"
            )}
            animate={{
              offsetDistance: ["0%", "100%"],
            }}
            style={{
              width: 20,
              offsetPath: `rect(0 auto auto 0 round ${20}px)`,
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 5,
              ease: "linear",
            }}
          />
        </div>
        Animated Border
      </Button>
    </div>
  );
}
