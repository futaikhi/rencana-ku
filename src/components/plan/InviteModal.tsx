import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { User, PlanRole } from "../../types";
import { UserAvatar } from "../common/UserAvatar";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { Mail, UserPlus, Check, AlertCircle, Eye, Edit3 } from "lucide-react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  onInviteSent: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  planId,
  planName,
  onInviteSent,
}) => {
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [role, setRole] = useState<PlanRole>("EDITOR");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedUser(null);
      setCustomEmail("");
      setRole("EDITOR");
      setError(null);
      setSuccessMsg(null);
      loadRecentUsers();
    }
  }, [isOpen]);

  const loadRecentUsers = async (query = "") => {
    setSearching(true);
    try {
      const res = await api.searchUsers(query);
      setSearchedUsers(res.users);
    } catch {
      setSearchedUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    loadRecentUsers(q);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const emailToSend = selectedUser ? selectedUser.email : customEmail.trim();
    if (!emailToSend) {
      setError("Please select a registered user or provide an email.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendInvitation(planId, {
        email: emailToSend,
        userId: selectedUser ? selectedUser.id : undefined,
        role,
      });

      setSuccessMsg(res.message);
      showSuccess(`Invitation sent to ${emailToSend} as ${role}!`, "Invite Sent");
      onInviteSent();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      const msg = err.message || "Failed to send invitation.";
      setError(msg);
      showError(msg, "Invitation Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite Collaborator to "${planName}"`}
      subtitle="Invite team members, partners, or friends to work on this plan together."
      maxWidth="md"
    >
      <div>
        {successMsg && (
          <div className="mb-4 p-3 bg-[#D1FAE5] border-2 border-black rounded-2xl flex items-center space-x-2 text-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Check size={16} className="stroke-[2.5]" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-[#FFE4E6] border-2 border-black rounded-2xl flex items-start space-x-2 text-[#E11D48] text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle size={16} className="shrink-0 mt-0.5 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSendInvite} className="space-y-4">
          {/* Quick Select Registered User */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Select Registered User or Search by Name/Email
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search user..."
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
            />

            {/* Quick list */}
            <div className="mt-2 space-y-1 max-h-36 overflow-y-auto p-1.5 bg-[#F0F0F0] border-2 border-black rounded-2xl">
              {searching ? (
                <div className="p-2 text-xs font-bold text-black/50 text-center">Searching users...</div>
              ) : searchedUsers.length > 0 ? (
                searchedUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUser(u);
                        setCustomEmail(u.email);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? "bg-[#E0FF62] border-black text-black font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white hover:bg-[#FAF8F5] border-transparent text-black"
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <UserAvatar name={u.name} size="xs" />
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5">
                            <p className="text-xs truncate font-black">{u.name}</p>
                            {u.is_demo ? (
                              <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-amber-200 text-black border border-black/40 rounded">
                                Demo
                              </span>
                            ) : (
                              <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-[#E0FF62] text-black border border-black/40 rounded">
                                Real User
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] opacity-60 truncate">{u.email}</p>
                        </div>
                      </div>
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                    </div>
                  );
                })
              ) : (
                <div className="p-2 text-xs font-bold text-black/50 text-center">
                  No other registered users found with this query.
                </div>
              )}
            </div>
          </div>

          {/* Or Manual Email */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Invitee Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                <Mail size={14} className="stroke-[2.5]" />
              </span>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => {
                  setCustomEmail(e.target.value);
                  setSelectedUser(null);
                }}
                placeholder="colleague@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Role Choice */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Assigned Plan Role & Permissions
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-2xl border-2 border-black cursor-pointer flex flex-col justify-between transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  role === "EDITOR"
                    ? "bg-[#E0FF62] text-black ring-2 ring-black"
                    : "bg-white text-black hover:bg-[#F0F0F0]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 font-black text-xs uppercase tracking-wider">
                    <Edit3 size={14} className="stroke-[2.5]" />
                    <span>Editor</span>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    value="EDITOR"
                    checked={role === "EDITOR"}
                    onChange={() => setRole("EDITOR")}
                    className="accent-black"
                  />
                </div>
                <p className="text-[10px] opacity-70 leading-relaxed font-medium">
                  Can create and edit tasks, milestones, timeline, budget, and notes.
                </p>
              </label>

              <label
                className={`p-3 rounded-2xl border-2 border-black cursor-pointer flex flex-col justify-between transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  role === "VIEWER"
                    ? "bg-[#E0FF62] text-black ring-2 ring-black"
                    : "bg-white text-black hover:bg-[#F0F0F0]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 font-black text-xs uppercase tracking-wider">
                    <Eye size={14} className="stroke-[2.5]" />
                    <span>Viewer</span>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    value="VIEWER"
                    checked={role === "VIEWER"}
                    onChange={() => setRole("VIEWER")}
                    className="accent-black"
                  />
                </div>
                <p className="text-[10px] opacity-70 leading-relaxed font-medium">
                  Read-only view of tasks, milestones, timeline, budget, and progress.
                </p>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-black hover:bg-[#F0F0F0] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <UserPlus size={14} className="stroke-[2.5]" />
              <span>{loading ? "Sending..." : "Send Invitation"}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
