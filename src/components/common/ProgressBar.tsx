import React from "react";

interface ProgressBarProps {
  progress: number;
  height?: "sm" | "md" | "lg";
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = "md",
  color = "#E0FF62",
  showLabel = false,
  className = "",
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress || 0)));

  const heightClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-[10px] text-black mb-1 font-bold uppercase tracking-wider">
          <span className="opacity-60">Progress</span>
          <span className="font-black text-xs">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-[#E5E5E5] border-[1.5px] border-black rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className="h-full rounded-full border-r-[1.5px] border-black transition-all duration-500 ease-out"
          style={{
            width: `${clamped}%`,
            backgroundColor: color === "#C45A38" ? "#E0FF62" : color || "#E0FF62",
          }}
        />
      </div>
    </div>
  );
};

