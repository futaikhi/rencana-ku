import React from "react";

interface UserAvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  bordered?: boolean;
  shadow?: boolean;
}

const COLOR_PALETTE = [
  "bg-[#E0FF62] text-black", // Neo Lime
  "bg-[#FF70A6] text-black", // Neo Pink
  "bg-[#70D6FF] text-black", // Neo Cyan
  "bg-[#FF9F1C] text-black", // Neo Orange
  "bg-[#C4B5FD] text-black", // Neo Purple
  "bg-[#A7F3D0] text-black", // Neo Mint
  "bg-[#FDE047] text-black", // Neo Yellow
  "bg-[#F472B6] text-black", // Neo Rose
];

function getPaletteColor(name: string): string {
  if (!name) return COLOR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = "md",
  className = "",
  bordered = true,
  shadow = false,
}) => {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const colorClass = getPaletteColor(name);

  const sizeClasses = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-14 h-14 text-xl",
  }[size];

  const borderClass = bordered ? "border-2 border-black" : "";
  const shadowClass = shadow ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "";

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-black uppercase select-none shrink-0 ${sizeClasses} ${colorClass} ${borderClass} ${shadowClass} ${className}`}
      title={name}
    >
      <span>{initial}</span>
    </div>
  );
};
