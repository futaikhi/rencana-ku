import React from "react";
import { UserAvatar } from "../common/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import { Compass, PlusCircle, Bell } from "lucide-react";

interface MobileBottomNavProps {
  currentTab: "dashboard" | "plan";
  onGoHome: () => void;
  onNewPlan: () => void;
  onOpenInvitations: () => void;
  onOpenProfile: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onGoHome,
  onNewPlan,
  onOpenInvitations,
  onOpenProfile,
}) => {
  const { user, pendingInvitations } = useAuth();
  const inviteCount = pendingInvitations.length;

  if (!user) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t-2 border-black px-3 py-1.5 safe-area-inset-bottom shadow-[0px_-4px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto items-center">
        {/* 1. Plans Tab */}
        <button
          type="button"
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-h-[48px] border transition-all ${
            currentTab === "dashboard"
              ? "bg-[#E0FF62] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black"
              : "bg-transparent text-black/60 border-transparent hover:text-black font-bold"
          }`}
        >
          <Compass size={21} className="stroke-[2.5]" />
          <span className="text-[10px] uppercase tracking-wider mt-0.5 leading-tight">Plans</span>
        </button>

        {/* 2. New Plan Tab (Cohesive icon style matching Compass and Bell) */}
        <button
          type="button"
          onClick={onNewPlan}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-h-[48px] border border-transparent text-black/70 hover:text-black active:bg-[#E0FF62]/40 font-bold transition-all group"
          title="Create New Plan"
        >
          <PlusCircle size={21} className="stroke-[2.5] text-black group-hover:scale-105 group-active:scale-95 transition-transform" />
          <span className="text-[10px] uppercase tracking-wider mt-0.5 leading-tight font-black">New Plan</span>
        </button>

        {/* 3. Invitations Tab */}
        <button
          type="button"
          onClick={onOpenInvitations}
          className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-h-[48px] border border-transparent text-black/60 hover:text-black font-bold transition-all"
        >
          <div className="relative">
            <Bell size={21} className="stroke-[2.5]" />
            {inviteCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#E11D48] text-white text-[9px] font-black w-4 h-4 rounded-full border border-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {inviteCount}
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-wider mt-0.5 leading-tight">Invites</span>
        </button>

        {/* 4. Profile Tab */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-h-[48px] border border-transparent text-black/60 hover:text-black font-bold transition-all"
        >
          <UserAvatar name={user.name} size="xs" />
          <span className="text-[10px] uppercase tracking-wider mt-0.5 truncate max-w-[65px] leading-tight">
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};

