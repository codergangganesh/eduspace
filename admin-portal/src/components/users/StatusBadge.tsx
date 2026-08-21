import React from "react";
import { Badge } from "@/components/ui/badge";
import { UserStatus } from "@/types";

export const StatusBadge: React.FC<{ status: UserStatus | string | null | undefined; className?: string }> = ({
  status = "active",
  className = "",
}) => {
  const isSuspended = status === "suspended";

  return (
    <Badge
      variant={isSuspended ? "destructive" : "success"}
      className={`capitalize font-medium text-[11px] px-2 py-0.5 inline-flex items-center gap-1.5 ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isSuspended ? "bg-red-500 animate-pulse" : "bg-emerald-500"
        }`}
      />
      {isSuspended ? "Suspended" : "Active"}
    </Badge>
  );
};
