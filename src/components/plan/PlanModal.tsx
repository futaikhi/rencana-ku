import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Plan, PlanTemplate } from "../../types";
import { CATEGORIES, PLAN_TEMPLATES, formatIDR } from "../../lib/formatters";
import { CategoryIcon } from "../common/CategoryIcon";
import { Sparkles, DollarSign, Calendar, Tag, Palette } from "lucide-react";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    target_date?: string | null;
    budget_enabled?: boolean;
    budget_target?: number;
    initialMilestones?: string[];
    initialTasks?: string[];
  }) => Promise<void>;
  editingPlan?: Plan | null;
}

const COLOR_OPTIONS = [
  "#C45A38", // Terracotta
  "#3B6E58", // Deep Sage
  "#B8731F", // Warm Amber
  "#0F766E", // Deep Teal
  "#5A67D8", // Indigo Blue
  "#7C3AED", // Royal Violet
  "#D97706", // Ochre Gold
  "#475569", // Slate
];

const ICON_OPTIONS = [
  "HeartHandshake",
  "Home",
  "Plane",
  "Car",
  "GraduationCap",
  "Hammer",
  "Rocket",
  "Target",
  "Sparkles",
  "Compass",
  "Briefcase",
  "BookOpen",
];

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingPlan,
}) => {
  const isEditing = Boolean(editingPlan);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Custom");
  const [icon, setIcon] = useState("Target");
  const [color, setColor] = useState("#C45A38");
  const [targetDate, setTargetDate] = useState("");
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [budgetTarget, setBudgetTarget] = useState<number | string>("");

  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPlan) {
      setName(editingPlan.name || "");
      setDescription(editingPlan.description || "");
      setCategory(editingPlan.category || "Custom");
      setIcon(editingPlan.icon || "Target");
      setColor(editingPlan.color || "#C45A38");
      setTargetDate(editingPlan.target_date ? editingPlan.target_date.substring(0, 10) : "");
      setBudgetEnabled(Boolean(editingPlan.budget_enabled));
      setBudgetTarget(editingPlan.budget_target || "");
      setSelectedTemplate(null);
    } else {
      setName("");
      setDescription("");
      setCategory("Custom");
      setIcon("Target");
      setColor("#C45A38");
      setTargetDate("");
      setBudgetEnabled(false);
      setBudgetTarget("");
      setSelectedTemplate(null);
    }
  }, [editingPlan, isOpen]);

  const handleSelectTemplate = (template: PlanTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setCategory(template.category);
    setIcon(template.icon);
    setColor(template.color);
    setBudgetEnabled(template.budget_enabled);
    setBudgetTarget(template.budget_target || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a Plan name.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        color,
        target_date: targetDate || null,
        budget_enabled: budgetEnabled,
        budget_target: budgetEnabled ? Number(budgetTarget) || 0 : 0,
        initialMilestones: !isEditing && selectedTemplate ? selectedTemplate.sampleMilestones : undefined,
        initialTasks: !isEditing && selectedTemplate ? selectedTemplate.sampleTasks : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Plan Details" : "Create a New Plan"}
      subtitle={
        isEditing
          ? "Update your plan goals, timeline, and aesthetic configuration."
          : "Turn any idea, vision, or collaborative objective into an actionable plan."
      }
      maxWidth="lg"
    >
      <div>
        {!isEditing && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#66707A] flex items-center space-x-1.5">
                <Sparkles size={13} className="text-[#C45A38]" />
                <span>Start from a Template (Optional)</span>
              </span>
              {selectedTemplate && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setName("");
                    setDescription("");
                    setCategory("Custom");
                    setIcon("Target");
                    setColor("#C45A38");
                    setBudgetEnabled(false);
                    setBudgetTarget("");
                  }}
                  className="text-[11px] text-[#A63A1E] hover:underline font-medium"
                >
                  Clear Template
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLAN_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-3 text-left rounded-2xl border-2 border-black transition-all flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      isSelected
                        ? "bg-[#E0FF62] text-black ring-2 ring-black"
                        : "bg-white hover:bg-[#F0F0F0] text-black"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div
                        className="w-7 h-7 rounded-xl border border-black flex items-center justify-center text-white shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        style={{ backgroundColor: tpl.color }}
                      >
                        <CategoryIcon name={tpl.icon} size={14} />
                      </div>
                      <span className="text-xs font-black uppercase truncate">{tpl.name}</span>
                    </div>
                    <span className="text-[10px] font-bold opacity-60">{tpl.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-[#FFE4E6] border-2 border-black rounded-2xl text-[#E11D48] text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Plan Title <span className="text-[#E11D48]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wedding Celebration, Build a House, Learn Japanese"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Goal & Purpose <span className="opacity-50 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you aiming to accomplish?"
              className="w-full px-4 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-medium text-black focus:outline-none focus:bg-white resize-none transition-colors"
            />
          </div>

          {/* Category & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  const matched = CATEGORIES.find((c) => c.id === e.target.value);
                  if (matched) {
                    setIcon(matched.icon);
                    setColor(matched.color);
                  }
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-bold text-black focus:outline-none focus:bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          {/* Aesthetic: Icon & Swatch */}
          <div className="p-4 bg-[#F0F0F0] border-2 border-black rounded-2xl space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center space-x-1">
                <Palette size={13} className="stroke-[2.5]" />
                <span>Plan Theme Accent Color</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 border-black transition-transform ${
                      color === c ? "scale-125 ring-2 ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Icon Visual Symbol
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-2 rounded-xl border-2 border-black transition-all ${
                      icon === ic
                        ? "bg-[#E0FF62] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white text-black hover:bg-[#F0F0F0]"
                    }`}
                  >
                    <CategoryIcon name={ic} size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Budget Switch */}
          <div className="p-4 bg-white border-2 border-black rounded-2xl space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1.5">
                  <DollarSign size={15} className="stroke-[2.5]" />
                  <span>Track Expected Budget for this Plan</span>
                </span>
                <p className="text-[11px] opacity-60 font-medium mt-0.5">
                  Optional. Enable if this plan involves estimated expenses and costs.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={budgetEnabled}
                  onChange={(e) => setBudgetEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#D1D5DB] border-2 border-black peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E0FF62]"></div>
              </label>
            </div>

            {budgetEnabled && (
              <div className="pt-2 border-t-2 border-black/10">
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Total Target Budget (IDR)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-black">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={budgetTarget}
                    onChange={(e) => setBudgetTarget(e.target.value)}
                    placeholder="75000000"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-mono font-bold focus:outline-none focus:bg-white"
                  />
                </div>
                {budgetTarget ? (
                  <p className="text-[11px] text-black font-mono font-bold mt-1">
                    {formatIDR(Number(budgetTarget))}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* Submit */}
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
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
