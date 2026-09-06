import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { LogIn, UserPlus, AlertCircle, ArrowRight, Chrome, Apple } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, demoUsers, demoLogin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password, bio });
        showSuccess(`Welcome to RencanaKu, ${name}!`, "Account Created");
      } else {
        await login(email, password);
        showSuccess("Signed in successfully!", "Welcome Back");
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || "Authentication failed.";
      setError(msg);
      showError(msg, "Authentication Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? "Create RencanaKu Account" : "Sign In to RencanaKu"}
      subtitle={
        isRegister
          ? "Start executing your goals and managing life plans in structured bento blocks."
          : "Welcome back! Continue and manage your active plans."
      }
      maxWidth="md"
    >
      <div>
        {/* Quick Demo Switcher banner for reviewers */}
        <div className="mb-5 p-3.5 bg-[#F0F0F0] border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-black mb-1.5">
            Quick 1-Click Demo Login
          </p>
          <div className="flex flex-wrap gap-1.5">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={async () => {
                  try {
                    await demoLogin(u.email);
                    showSuccess(`Logged in as ${u.name}!`, "Demo Account");
                    onClose();
                  } catch (err: any) {
                    showError(err.message || "Failed to login to demo account.", "Login Failed");
                  }
                }}
                className="px-2.5 py-1 text-xs bg-white hover:bg-[#E0FF62] border-2 border-black rounded-full font-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center space-x-1"
              >
                <span>{u.name}</span>
                <span className="text-[10px] opacity-60">({u.email.split("@")[0]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* OAuth Login Buttons */}
        <div className="mb-4 space-y-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/20"></div>
            </div>
            <div className="relative flex items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/40 bg-white px-2">or sign in with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/oauth/google";
              }}
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-white hover:bg-[#F0F0F0] text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Chrome size={14} className="stroke-[2.5]" />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/oauth/apple";
              }}
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-black hover:bg-[#222] text-white text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Apple size={14} className="stroke-[2.5] fill-current" />
              <span>Apple</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FFE4E6] border-2 border-black rounded-2xl flex items-start space-x-2 text-[#E11D48] text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle size={16} className="shrink-0 mt-0.5 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                Full Name <span className="text-[#E11D48]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Email Address <span className="text-[#E11D48]">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Password <span className="text-[#E11D48]">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                Bio / Role <span className="opacity-50 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Product Designer, Trip Organizer"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : isRegister ? (
              <>
                <UserPlus size={16} className="stroke-[2.5]" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn size={16} className="stroke-[2.5]" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-5 pt-4 border-t border-black/10 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-black font-black uppercase tracking-wider hover:underline transition-colors"
          >
            {isRegister ? (
              <span>Already have an account? Sign in</span>
            ) : (
              <span>Don't have an account? Register now</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
