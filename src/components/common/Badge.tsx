import React from "react";
import { PlanRole, TaskPriority, TaskStatus, MilestoneStatus } from "../../types";

export const RoleBadge: React.FC<{ role?: PlanRole | string; size?: "sm" | "md" }> = ({
  role = "VIEWER",
  size = "md",
}) => {
  const isSm = size === "sm";
  const baseClass = `inline-flex items-center font-black tracking-widest whitespace-nowrap rounded-full uppercase border border-black ${
    isSm ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]"
  }`;

  switch (role) {
    case "OWNER":
      return (
        <span className={`${baseClass} bg-[#E0FF62] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          Owner
        </span>
      );
    case "EDITOR":
      return (
        <span className={`${baseClass} bg-[#70D6FF] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          Editor
        </span>
      );
    case "VIEWER":
    default:
      return (
        <span className={`${baseClass} bg-white text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          Viewer
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: TaskStatus | MilestoneStatus | string; size?: "sm" | "md" }> = ({
  status,
  size = "md",
}) => {
  const isSm = size === "sm";
  const baseClass = `inline-flex items-center font-black tracking-widest whitespace-nowrap rounded-full uppercase border border-black ${
    isSm ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]"
  }`;

  switch (status) {
    case "COMPLETED":
      return (
        <span className={`${baseClass} bg-[#BBF7D0] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          <span className="w-1.5 h-1.5 rounded-full bg-black mr-1.5" />
          Completed
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className={`${baseClass} bg-[#FFD60A] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          <span className="w-1.5 h-1.5 rounded-full bg-black mr-1.5 animate-pulse" />
          In Progress
        </span>
      );
    case "TODO":
    case "PENDING":
    default:
      return (
        <span className={`${baseClass} bg-white text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          <span className="w-1.5 h-1.5 rounded-full bg-black/40 mr-1.5" />
          Todo
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: TaskPriority | string; size?: "sm" | "md" }> = ({
  priority,
  size = "md",
}) => {
  const isSm = size === "sm";
  const baseClass = `inline-flex items-center font-black tracking-widest whitespace-nowrap rounded-full uppercase border border-black ${
    isSm ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]"
  }`;

  switch (priority) {
    case "HIGH":
      return (
        <span className={`${baseClass} bg-[#FF70A6] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          High
        </span>
      );
    case "MEDIUM":
      return (
        <span className={`${baseClass} bg-[#FFD60A] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          Med
        </span>
      );
    case "LOW":
    default:
      return (
        <span className={`${baseClass} bg-[#E5E7EB] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          Low
        </span>
      );
  }
};

