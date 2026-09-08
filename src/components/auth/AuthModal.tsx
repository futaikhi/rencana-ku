import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { LogIn, UserPlus, AlertCircle, ArrowRight } from "lucide-react";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && password !== confirmPassword) {
      const msg = "Password and confirm password do not match.";
      setError(msg);
      showError(msg, "Password Mismatch");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password });
        showSuccess(`Welcome to PlanCraft, ${name}!`, "Account Created");
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
      title={isRegister ? "Create PlanCraft Account" : "Sign In to PlanCraft"}
      subtitle={
        isRegister
          ? "Start executing your goals and managing life plans in structured bento blocks."
          : "Welcome back! Continue and manage your active plans."
      }
      maxWidth="md"
    >
      <div>
        {/* Quick Demo Switcher banner for reviewers */}
        <div className="mb-5 p-3.5 bg-amber-50 border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center space-x-1.5">
              <span>Quick 1-Click Demo Login</span>
              <span className="px-1.5 py-0.2 bg-amber-300 text-black border border-black rounded text-[8px] font-black uppercase">
                Sandbox
              </span>
            </p>
          </div>
          <p className="text-[11px] text-amber-900/80 mb-2 leading-tight">
            Use pre-configured demo profiles to preview team collaboration without registering:
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
                className="px-2.5 py-1 text-xs bg-white hover:bg-[#E0FF62] border-2 border-black rounded-full font-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center space-x-1.5"
              >
                <span>{u.name}</span>
                <span className="text-[9px] font-bold text-black/60 bg-amber-200 px-1 rounded">Demo</span>
              </button>
            ))}
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
                Confirm Password <span className="text-[#E11D48]">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>
          )}

          {isRegister && (
            <div className="p-2.5 bg-[#FAF8F5] border-2 border-black/30 rounded-xl text-center">
              <p className="text-[11px] text-black/70 font-medium leading-tight">
                Creating a <strong className="text-black font-black">Real Account</strong>. Your profile and plans remain distinct and will never be mixed into demo profiles.
              </p>
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
              setConfirmPassword("");
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
