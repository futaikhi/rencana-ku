import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { UserAvatar } from "../common/UserAvatar";
import { api } from "../../lib/api";
import { User, Lock, Check, AlertCircle } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setLoading(true);

    try {
      await updateProfile({ name, bio });
      setProfileSuccess(true);
      showSuccess("Your profile details have been saved.", "Profile Updated");
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.message || "Failed to update profile.";
      setProfileError(msg);
      showError(msg, "Update Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      const msg = "New passwords do not match.";
      setPasswordError(msg);
      showError(msg, "Password Mismatch");
      return;
    }

    if (newPassword.length < 6) {
      const msg = "New password must be at least 6 characters.";
      setPasswordError(msg);
      showError(msg, "Password Too Short");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      showSuccess("Your account password has been updated.", "Password Changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.message || "Failed to change password.";
      setPasswordError(msg);
      showError(msg, "Password Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile & Security"
      subtitle="Manage your personal account information and password."
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Section 1: Profile Information */}
        <div className="bg-[#F0F0F0] border-2 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <h4 className="text-xs font-black uppercase tracking-wider text-black mb-3 flex items-center space-x-1.5">
            <User size={15} className="stroke-[2.5]" />
            <span>Profile Details</span>
          </h4>

          {profileSuccess && (
            <div className="mb-3 p-2.5 bg-[#D1FAE5] border-2 border-black rounded-xl flex items-center space-x-2 text-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Check size={14} className="stroke-[3]" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {profileError && (
            <div className="mb-3 p-2.5 bg-[#FFE4E6] border-2 border-black rounded-xl flex items-center space-x-2 text-[#E11D48] text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle size={14} className="stroke-[2.5]" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            {/* User Account & Avatar Preview */}
            <div className="flex items-center space-x-3 p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <UserAvatar name={name || user?.name || "?"} size="lg" shadow />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-black uppercase text-black truncate">{name || user?.name}</p>
                  {user?.is_demo ? (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-300 text-black border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      Demo Account
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#E0FF62] text-black border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      Real Account
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-black/70 font-medium truncate">{user?.email}</p>
                <p className="text-[10px] text-black/50 mt-0.5 font-medium">
                  {user?.is_demo
                    ? "Shared demo sandbox profile for evaluating collaboration features."
                    : "Your private, real user account with dedicated personal data."}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:bg-[#FAF8F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">Email Address</label>
              <input
                type="text"
                disabled
                value={user?.email || ""}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#E5E5E5] border-2 border-black rounded-xl text-black/60 font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">Bio / Headline</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Lead Planner & Designer"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border-2 border-black rounded-xl font-medium text-black focus:outline-none focus:bg-[#FAF8F5]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Save Profile
            </button>
          </form>
        </div>

        {/* Section 2: Change Password */}
        <div className="bg-[#F0F0F0] border-2 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <h4 className="text-xs font-black uppercase tracking-wider text-black mb-3 flex items-center space-x-1.5">
            <Lock size={15} className="stroke-[2.5]" />
            <span>Change Password</span>
          </h4>

          {passwordSuccess && (
            <div className="mb-3 p-2.5 bg-[#D1FAE5] border-2 border-black rounded-xl flex items-center space-x-2 text-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Check size={14} className="stroke-[3]" />
              <span>Password updated successfully!</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-3 p-2.5 bg-[#FFE4E6] border-2 border-black rounded-xl flex items-center space-x-2 text-[#E11D48] text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle size={14} className="stroke-[2.5]" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:bg-[#FAF8F5]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:bg-[#FAF8F5]"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:bg-[#FAF8F5]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 bg-[#FF70A6] hover:bg-[#fa5a94] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
