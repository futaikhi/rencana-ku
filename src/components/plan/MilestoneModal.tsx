import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Milestone, MilestoneStatus } from "../../types";
import { Calendar, CheckCircle, Flag } from "lucide-react";

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Milestone>) => Promise<void>;
  editingMilestone?: Milestone | null;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingMilestone,
}) => {
  const isEditing = Boolean(editingMilestone);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<MilestoneStatus>("PENDING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingMilestone) {
      setTitle(editingMilestone.title || "");
      setDescription(editingMilestone.description || "");
      setTargetDate(editingMilestone.target_date ? editingMilestone.target_date.substring(0, 10) : "");
      setStatus(editingMilestone.status || "PENDING");
    } else {
      setTitle("");
      setDescription("");
      setTargetDate("");
      setStatus("PENDING");
    }
  }, [editingMilestone, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Milestone title is required.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        target_date: targetDate || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save milestone.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Milestone Checkpoint" : "Add New Milestone Checkpoint"}
      subtitle="Milestones represent major achievements and phases in your plan."
      maxWidth="md"
    >
      <div>
        {error && (
          <div className="mb-4 p-3 bg-[#FFE4E6] border-2 border-black rounded-2xl text-[#E11D48] text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Milestone Title <span className="text-[#E11D48]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Venue Down Payment & Date Lock"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Description & Success Criteria <span className="opacity-50 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this milestone complete?"
              className="w-full px-4 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-medium text-black focus:outline-none focus:bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center space-x-1">
                <Calendar size={13} className="stroke-[2.5]" />
                <span>Target Date (Optional)</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center space-x-1">
                <CheckCircle size={13} className="stroke-[2.5]" />
                <span>Status</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              >
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Achieved / Completed</option>
              </select>
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
              className="px-5 py-2.5 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Save Milestone" : "Create Milestone"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
