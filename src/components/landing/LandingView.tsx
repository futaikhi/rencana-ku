import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar } from "../common/UserAvatar";
import { BrandLogo } from "../common/BrandLogo";
import {
  Compass,
  CheckCircle2,
  Users,
  Target,
  DollarSign,
  Smartphone,
  Zap,
  ArrowRight,
  Shield,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

interface LandingViewProps {
  onOpenAuthModal?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = () => {
  const { login, register, demoUsers, demoLogin } = useAuth();

  // Auth mode: "login" | "register" | "demo"
  const [authMode, setAuthMode] = useState<"login" | "register" | "demo">("login");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMode === "register" && password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      if (authMode === "register") {
        await register({ name, email, password });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(demoEmail);
    } catch (err: any) {
      setError(err.message || "Failed to log in with demo account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-black flex flex-col font-sans selection:bg-[#E0FF62] selection:text-black">
      {/* Top Header / App Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <BrandLogo size="md" showTagline tagline="PWA • Mobile-First Planner" />

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode("demo");
                const authCard = document.getElementById("auth-section");
                authCard?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#F0F0F0] hover:bg-[#E0FF62] text-xs font-black uppercase tracking-wider text-black border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Zap size={14} className="stroke-[2.5]" />
              <span>1-Tap Demo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "register" ? "login" : "register");
                const authCard = document.getElementById("auth-section");
                authCard?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-1.5 bg-[#E0FF62] hover:bg-[#d2f545] text-xs font-black uppercase tracking-wider text-black border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              {authMode === "register" ? "Sign In" : "Get Started"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Direct Authentication Section */}
      <section className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Left Column: Value Proposition & Highlights */}
        <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6 text-left">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-2.5 sm:px-3 py-1 bg-[#E0FF62] border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles size={14} className="stroke-[2.5] text-black shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">
              Collaborative Goal Execution Platform
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black leading-[1.1]">
            Plan Goals. <br className="hidden sm:inline" />
            Track Budgets. <br />
            <span className="bg-[#FF70A6] px-2 py-0.5 border-2 border-black rounded-xl inline-block mt-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              Execute Together.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-black/80 font-medium leading-relaxed">
            A modern, mobile-optimized workspace built for seamless planning on your phone or desktop. Turn ambitious goals into phased milestones, action items, and live collaborative progress.
          </p>

          {/* Key Feature Badges Grid - Single column on mobile, 2 columns on tablet/desktop for neat spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
            {/* Card 1: Phased Milestones */}
            <div className="p-3 sm:p-3.5 bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transition-transform hover:-translate-y-0.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#70D6FF] border-2 border-black rounded-xl shrink-0 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <Target size={18} className="stroke-[2.5] text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-black uppercase text-black tracking-tight truncate">
                    Phased Milestones
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#F0F0F0] border border-black rounded-md text-black/70 shrink-0">
                    Timeline
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-black/70 font-medium truncate mt-0.5">
                  Track stages, due dates & progress
                </p>
              </div>
            </div>

            {/* Card 2: Role Collaboration */}
            <div className="p-3 sm:p-3.5 bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transition-transform hover:-translate-y-0.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#FF9F1C] border-2 border-black rounded-xl shrink-0 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <Users size={18} className="stroke-[2.5] text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-black uppercase text-black tracking-tight truncate">
                    Role Collaboration
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#F0F0F0] border border-black rounded-md text-black/70 shrink-0">
                    Multi-Role
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-black/70 font-medium truncate mt-0.5">
                  Admins, Editors & Viewers access
                </p>
              </div>
            </div>

            {/* Card 3: Budget Tracker */}
            <div className="p-3 sm:p-3.5 bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transition-transform hover:-translate-y-0.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#A7F3D0] border-2 border-black rounded-xl shrink-0 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <DollarSign size={18} className="stroke-[2.5] text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-black uppercase text-black tracking-tight truncate">
                    Budget Tracker
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#F0F0F0] border border-black rounded-md text-black/70 shrink-0">
                    Expenses
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-black/70 font-medium truncate mt-0.5">
                  Planned vs actual cost variance
                </p>
              </div>
            </div>

            {/* Card 4: PWA Ready */}
            <div className="p-3 sm:p-3.5 bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transition-transform hover:-translate-y-0.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#E0FF62] border-2 border-black rounded-xl shrink-0 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <Smartphone size={18} className="stroke-[2.5] text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-black uppercase text-black tracking-tight truncate">
                    PWA Ready
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#F0F0F0] border border-black rounded-md text-black/70 shrink-0">
                    Mobile
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-black/70 font-medium truncate mt-0.5">
                  Fast phone UX with bottom nav
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Direct Mobile-Optimized Auth Card */}
        <div
          id="auth-section"
          className="w-full lg:w-1/2 max-w-md bg-white border-[2.5px] border-black rounded-[24px] sm:rounded-[32px] p-5 sm:p-7 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          {/* Auth Tab Switcher */}
          <div className="flex bg-[#F0F0F0] border-2 border-black rounded-2xl p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setError(null);
                setConfirmPassword("");
              }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                authMode === "login"
                  ? "bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setError(null);
                setConfirmPassword("");
              }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                authMode === "register"
                  ? "bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("demo");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                authMode === "demo"
                  ? "bg-[#E0FF62] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "text-black/60 hover:text-black"
              }`}
            >
              ⚡ Demo
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-[#FFE4E6] border-2 border-black rounded-2xl flex items-start space-x-2 text-[#E11D48] text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle size={16} className="shrink-0 mt-0.5 stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Tap Demo Tab */}
          {authMode === "demo" ? (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF8F5] border-2 border-black rounded-2xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-black mb-1">
                  Instant 1-Tap Demo Access
                </h3>
                <p className="text-xs text-black/70 font-medium">
                  Select any test profile below to jump straight into pre-populated collaborative workspaces:
                </p>
              </div>

              <div className="space-y-2.5">
                {demoUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoSelect(u.email)}
                    className="w-full p-3 bg-white hover:bg-[#E0FF62] border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <UserAvatar name={u.name} size="md" />
                      <div>
                        <p className="text-xs font-black uppercase text-black group-hover:text-black">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-black/60 font-medium">{u.email}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="stroke-[2.5] text-black group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Login & Register Forms */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    Full Name <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Lin"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <UserIcon size={16} className="absolute left-3 top-3 text-black/50 stroke-[2.5]" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Email Address <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <Mail size={16} className="absolute left-3 top-3 text-black/50 stroke-[2.5]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Password <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <Lock size={16} className="absolute left-3 top-3 text-black/50 stroke-[2.5]" />
                </div>
              </div>

              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    Confirm Password <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <Lock size={16} className="absolute left-3 top-3 text-black/50 stroke-[2.5]" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[#E0FF62] hover:bg-[#d4f745] disabled:opacity-50 text-xs sm:text-sm font-black uppercase tracking-wider text-black border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2"
              >
                <span>{loading ? "Processing..." : authMode === "register" ? "Create Free Account" : "Sign In to PlanCraft"}</span>
                <ArrowRight size={16} className="stroke-[2.5]" />
              </button>

              {/* Quick 1-Tap Demo Switch Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode("demo")}
                  className="text-xs text-black font-black uppercase tracking-wider hover:underline flex items-center justify-center space-x-1 mx-auto"
                >
                  <Zap size={13} className="stroke-[2.5] text-black" />
                  <span>Or test with 1-click Demo Account</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* PWA Mobile Priority Showcase Footer Banner */}
      <footer className="border-t-2 border-black bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center space-x-2.5">
            <BrandLogo size="sm" showWordmark={false} />
            <p className="text-xs font-black uppercase tracking-wider text-black">
              PlanCraft Mobile PWA • Real-time Collaboration
            </p>
          </div>
          <p className="text-xs text-black/60 font-medium">
            Multi-User • Role Based • Milestones & Budgets
          </p>
        </div>
      </footer>
    </div>
  );
};
