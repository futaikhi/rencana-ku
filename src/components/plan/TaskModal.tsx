import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Task, Milestone, PlanMember, TaskStatus, TaskPriority } from "../../types";
import { Calendar, User, Flag, CheckCircle2 } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Task>) => Promise<void>;
  editingTask?: Task | null;
  milestones: Milestone[];
  members: PlanMember[];
  defaultMilestoneId?: string | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  milestones,
  members,
  defaultMilestoneId,
}) => {
  const isEditing = Boolean(editingTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setDescription(editingTask.description || "");
      setStatus(editingTask.status || "TODO");
      setPriority(editingTask.priority || "MEDIUM");
      setDueDate(editingTask.due_date ? editingTask.due_date.substring(0, 10) : "");
      setAssigneeId(editingTask.assignee_id || "");
      setMilestoneId(editingTask.milestone_id || "");
    } else {
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setDueDate("");
      setAssigneeId("");
      setMilestoneId(defaultMilestoneId || "");
    }
  }, [editingTask, defaultMilestoneId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        due_date: dueDate || undefined,
        assignee_id: assigneeId || null,
        milestone_id: milestoneId || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Action Task" : "Add New Action Task"}
      subtitle="Define actionable steps to move this plan toward achievement."
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
              Task Title <span className="text-[#E11D48]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule venue walkthrough with coordinator"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Description & Details <span className="opacity-50 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context, links, or notes..."
              className="w-full px-4 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-medium text-black focus:outline-none focus:bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center space-x-1">
                <CheckCircle2 size={13} className="stroke-[2.5]" />
                <span>Status</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center space-x-1">
                <Flag size={13} className="stroke-[2.5]" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Due Date */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center space-x-1">
                <Calendar size={13} className="stroke-[2.5]" />
                <span>Due Date (Optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center space-x-1">
                <User size={13} className="stroke-[2.5]" />
                <span>Assignee</span>
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Associate Milestone */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Checkpoint / Milestone Association
            </label>
            <select
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
            >
              <option value="">No Milestone (General Task)</option>
              {milestones.map((ms) => (
                <option key={ms.id} value={ms.id}>
                  {ms.title} {ms.status === "COMPLETED" ? "✓" : ""}
                </option>
              ))}
            </select>
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
              {loading ? "Saving..." : isEditing ? "Save Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
