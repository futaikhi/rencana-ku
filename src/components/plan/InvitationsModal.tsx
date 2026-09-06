import React from "react";
import { Modal } from "../common/Modal";
import { PlanInvitation } from "../../types";
import { CategoryIcon } from "../common/CategoryIcon";
import { formatRelativeTime } from "../../lib/formatters";
import { Inbox, Check, X } from "lucide-react";

interface InvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitations: PlanInvitation[];
  onRespond: (inviteId: string, action: "ACCEPT" | "DECLINE") => Promise<void>;
}

export const InvitationsModal: React.FC<InvitationsModalProps> = ({
  isOpen,
  onClose,
  invitations,
  onRespond,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collaboration Invitations"
      subtitle="Plans you've been invited to join."
      maxWidth="md"
    >
      <div>
        {invitations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Inbox size={36} className="mx-auto text-black stroke-[1.5]" />
            <h4 className="text-sm font-black uppercase tracking-wider text-black">No pending invitations</h4>
            <p className="text-xs opacity-60 font-medium">
              When someone invites you to collaborate on a plan, it will appear right here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white border-2 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className="w-10 h-10 rounded-2xl border-2 border-black flex items-center justify-center text-white shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    style={{ backgroundColor: inv.plan_color || "#C45A38" }}
                  >
                    <CategoryIcon name={inv.plan_icon} size={20} />
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-black text-black uppercase tracking-tight truncate">{inv.plan_name}</h4>
                    <p className="text-xs opacity-70 font-medium">
                      Invited by <span className="font-bold text-black">{inv.inviter_name}</span> (
                      {inv.inviter_email})
                    </p>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-[#E0FF62] text-black border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        Role: {inv.role}
                      </span>
                      <span className="text-[10px] font-bold opacity-50">
                        {formatRelativeTime(inv.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-black/10">
                  <button
                    type="button"
                    onClick={async () => {
                      await onRespond(inv.id, "DECLINE");
                    }}
                    className="px-4 py-1.5 bg-[#F0F0F0] hover:bg-white border-2 border-black text-xs font-bold text-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onRespond(inv.id, "ACCEPT");
                    }}
                    className="px-4 py-1.5 bg-[#E0FF62] hover:bg-[#d6f54c] text-xs font-black uppercase tracking-wider text-black rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center space-x-1.5"
                  >
                    <Check size={14} className="stroke-[3]" />
                    <span>Accept Invitation</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
