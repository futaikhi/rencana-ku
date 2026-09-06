import React, { useState } from "react";
import { BRAND_CONFIG } from "../../config/brand";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  logoUrl?: string | null;
  showWordmark?: boolean;
  showTagline?: boolean;
  tagline?: string;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  logoUrl,
  showWordmark = true,
  showTagline = false,
  tagline = "Bento Planning OS",
  className = "",
  onClick,
}) => {
  const activeLogoUrl = logoUrl !== undefined ? logoUrl : BRAND_CONFIG.logoUrl;
  const [imgFailed, setImgFailed] = useState(false);

  // Dimensions depending on size prop
  const iconSizeClasses = {
    sm: "w-7 h-7 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-0.5 gap-0.5",
    md: "w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-[2px_2px_0px_0px_rgba(224,255,98,1)] sm:shadow-[3px_3px_0px_0px_rgba(224,255,98,1)] p-1 gap-0.5",
    lg: "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-[3px_3px_0px_0px_rgba(224,255,98,1)] sm:shadow-[4px_4px_0px_0px_rgba(224,255,98,1)] p-1.5 gap-1",
  }[size];

  const customImgContainerClasses = {
    sm: "w-7 h-7 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-0.5",
    md: "w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-[2px_2px_0px_0px_rgba(224,255,98,1)] sm:shadow-[3px_3px_0px_0px_rgba(224,255,98,1)] p-0.5",
    lg: "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-[3px_3px_0px_0px_rgba(224,255,98,1)] sm:shadow-[4px_4px_0px_0px_rgba(224,255,98,1)] p-1",
  }[size];

  const fontSizeClasses = {
    sm: "text-sm",
    md: "text-base sm:text-xl",
    lg: "text-xl sm:text-2xl",
  }[size];

  const kuBadgeClasses = {
    sm: "text-[9px] px-1 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
    md: "text-[10px] sm:text-xs px-1.5 py-0.5 rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]",
    lg: "text-xs sm:text-sm px-2 py-0.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  }[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-3 select-none ${
        onClick ? "cursor-pointer group" : ""
      } ${className}`}
    >
      {/* Either Custom Developer-Provided PNG/ICO or Authentic Neo-Brutalist Bento Planner Emblem */}
      {activeLogoUrl && !imgFailed ? (
        <div
          className={`bg-white border-2 border-black shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden ${customImgContainerClasses}`}
          title="RencanaKu"
        >
          <img
            src={activeLogoUrl}
            alt="RencanaKu Logo"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div
          className={`bg-black border-2 border-black grid grid-cols-2 grid-rows-2 shrink-0 group-hover:scale-105 transition-transform ${iconSizeClasses}`}
          title="RencanaKu"
        >
          {/* Cell 1: RencanaKu Monogram (Chartreuse Accent) */}
          <div className="bg-[#E0FF62] border border-black rounded-[3px] sm:rounded-[4px] flex items-center justify-center overflow-hidden">
            <span className="font-black text-[10px] sm:text-xs md:text-sm text-black font-mono leading-none">
              P
            </span>
          </div>

          {/* Cell 2: Target / Goal Point (Vivid Coral) */}
          <div className="bg-[#FF70A6] border border-black rounded-[3px] sm:rounded-[4px] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-black rounded-full shadow-inner" />
          </div>

          {/* Cell 3 & 4: Progress Timeline & Milestone Flag (White + Cyan Waypoint) */}
          <div className="col-span-2 bg-white border border-black rounded-[3px] sm:rounded-[4px] flex items-center justify-between px-1">
            <div className="w-1 h-1 bg-black rounded-full shrink-0" />
            <div className="h-[2px] flex-1 bg-black mx-1 rounded" />
            <div className="w-1.5 h-1.5 bg-[#70D6FF] border border-black rounded-sm shrink-0" />
          </div>
        </div>
      )}

      {/* Wordmark: PLAN + CRAFT Accent Badge */}
      {showWordmark && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={`font-black tracking-tight uppercase text-black truncate leading-none ${fontSizeClasses}`}
            >
              RENCANA
            </span>
            <span
              className={`bg-[#E0FF62] text-black border-2 border-black font-black uppercase tracking-wider leading-none shrink-0 ${kuBadgeClasses}`}
            >
              KU
            </span>
            <span className="hidden md:inline-block text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 bg-white text-black border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ml-1">
              OS
            </span>
          </div>

          {showTagline && (
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-black/60 hidden sm:block mt-0.5 truncate">
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
