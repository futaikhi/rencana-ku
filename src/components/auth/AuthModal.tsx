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
  const { login, register } = useAuth();
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
                Create your account to manage your own plans and collaborate with other registered users.
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
