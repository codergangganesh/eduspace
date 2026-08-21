import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string | null | undefined;
  avatarUrl?: string | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-base",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name || "User"} />}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};
