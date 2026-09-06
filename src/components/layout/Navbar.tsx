import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { UserAvatar } from "../common/UserAvatar";
import { BrandLogo } from "../common/BrandLogo";
import {
  Plus,
  Bell,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Users,
} from "lucide-react";

interface NavbarProps {
  onNewPlan: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onGoHome: () => void;
  onOpenInvitations: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewPlan,
  onOpenProfile,
  onOpenAuth,
  onGoHome,
  onOpenInvitations,
}) => {
  const { user, demoUsers, demoLogin, logout, pendingInvitations } = useAuth();
  const { showSuccess, showInfo, showError } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);

  const inviteCount = pendingInvitations.length;

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 bg-[#F0F0F0]/95 backdrop-blur-md border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <BrandLogo onClick={onGoHome} size="md" />

          {/* Center Date & Status Pill */}
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span className="opacity-40">Workspace Grid</span>
            <span className="px-3 py-1 border border-black rounded-full bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {todayFormatted}
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <>
                {/* Quick Multi-User Demo Switcher Pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDemoSwitcher(!showDemoSwitcher);
                      setShowUserMenu(false);
                    }}
                    className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-black bg-white hover:bg-[#E0FF62] border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    title="Switch user to test multi-user collaboration"
                  >
                    <Users size={13} className="text-black stroke-[2.5]" />
                    <span className="opacity-50 text-[10px] uppercase font-black tracking-wider">User:</span>
                    <span className="font-black text-black">{user.name}</span>
                    <ChevronDown size={13} className="stroke-[2.5]" />
                  </button>

                  {showDemoSwitcher && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2 z-50">
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-black/20 mb-1">
                        Switch Account (Collab)
                      </div>
                      <p className="px-2 py-1 text-[11px] text-black/70 font-medium leading-tight">
                        Test collaboration, shared plans, and permissions:
                      </p>
                      <div className="space-y-1 mt-1">
                        {demoUsers.map((dUser) => (
                          <button
                            key={dUser.id}
                            type="button"
                            onClick={async () => {
                              try {
                                await demoLogin(dUser.email);
                                showSuccess(`Switched to account: ${dUser.name}`, "Active User");
                                setShowDemoSwitcher(false);
                              } catch (err: any) {
                                showError(err.message || "Failed to switch user.", "Switch Error");
                              }
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 text-left rounded-xl text-xs border border-transparent transition-all ${
                              user.email === dUser.email
                                ? "bg-[#E0FF62] text-black font-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                : "hover:bg-[#F0F0F0] text-black font-medium"
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <UserAvatar name={dUser.name} size="xs" />
                              <div className="truncate">
                                <p className="truncate font-bold">{dUser.name}</p>
                                <p className="text-[10px] opacity-60 truncate">{dUser.email}</p>
                              </div>
                            </div>
                            {user.email === dUser.email && (
                              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-black text-white rounded">Active</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Invitations Bell Button (Desktop/Tablet) */}
                <button
                  type="button"
                  onClick={onOpenInvitations}
                  className="hidden sm:flex relative p-2 text-black bg-white hover:bg-[#E0FF62] border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  aria-label="Pending Invitations"
                  title="Invitations"
                >
                  <Bell size={16} className="stroke-[2.5]" />
                  {inviteCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF70A6] text-black border border-black text-[10px] font-black rounded-full flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                      {inviteCount}
                    </span>
                  )}
                </button>

                {/* Create Plan Button (Desktop/Tablet) */}
                <button
                  type="button"
                  onClick={onNewPlan}
                  className="hidden sm:flex items-center space-x-1.5 px-4 py-2 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <Plus size={15} className="stroke-[3]" />
                  <span>New Plan</span>
                </button>

                {/* User Profile Pill & Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowDemoSwitcher(false);
                    }}
                    className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1 bg-white hover:bg-[#E0FF62] border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    <UserAvatar name={user.name} size="xs" />
                    <span className="text-xs font-black text-black hidden md:inline">
                      {user.name}
                    </span>
                    <ChevronDown size={13} className="stroke-[2.5] text-black" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2 z-50">
                      <div className="px-3 py-2 border-b border-black/20 mb-1 bg-[#F0F0F0] rounded-xl">
                        <p className="text-xs font-black text-black truncate uppercase">{user.name}</p>
                        <p className="text-[10px] opacity-60 truncate">{user.email}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-black hover:bg-[#E0FF62] rounded-xl transition-colors"
                      >
                        <UserIcon size={14} className="stroke-[2.5]" />
                        <span>Profile & Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowDemoSwitcher(true);
                        }}
                        className="md:hidden w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-black hover:bg-[#E0FF62] rounded-xl transition-colors"
                      >
                        <Users size={14} className="stroke-[2.5]" />
                        <span>Switch Demo User</span>
                      </button>

                      <div className="border-t border-black/20 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          showInfo("You have signed out.", "Signed Out");
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-black text-[#E11D48] hover:bg-[#FFE4E6] rounded-xl transition-colors"
                      >
                        <LogOut size={14} className="stroke-[2.5]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

