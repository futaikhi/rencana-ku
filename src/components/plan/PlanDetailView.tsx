import React, { useState } from "react";
import {
  Plan,
  Task,
  Milestone,
  BudgetItem,
  PlanMember,
  PlanInvitation,
  Activity,
  PlanAccess,
  TaskStatus,
  TaskPriority,
} from "../../types";
import { formatIDR, formatDate, formatMonthYear, formatRelativeTime } from "../../lib/formatters";
import { CategoryIcon } from "../common/CategoryIcon";
import { ProgressBar } from "../common/ProgressBar";
import { RoleBadge, StatusBadge, PriorityBadge } from "../common/Badge";
import { UserAvatar } from "../common/UserAvatar";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  Flag,
  ListTodo,
  FileText,
  Clock,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  MoreVertical,
  LogOut,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Save,
  Check,
  Circle,
  CheckCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

type TabType = "overview" | "tasks" | "milestones" | "timeline" | "budget" | "notes" | "members" | "activity";

interface PlanDetailViewProps {
  plan: Plan;
  access: PlanAccess;
  tasks: Task[];
  milestones: Milestone[];
  budgetItems: BudgetItem[];
  members: PlanMember[];
  invitations: PlanInvitation[];
  activities: Activity[];
  onBack: () => void;
  onEditPlan: () => void;
  onDeletePlan: () => void;
  onLeavePlan: () => void;
  onOpenTaskModal: (task?: Task | null, milestoneId?: string | null) => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onOpenMilestoneModal: (milestone?: Milestone | null) => void;
  onToggleMilestone: (milestoneId: string) => Promise<void>;
  onDeleteMilestone: (milestoneId: string) => Promise<void>;
  onOpenBudgetItemModal: (item?: BudgetItem | null) => void;
  onDeleteBudgetItem: (itemId: string) => Promise<void>;
  onSaveNotes: (notes: string) => Promise<void>;
  onOpenInviteModal: () => void;
  onUpdateMemberRole: (memberId: string, role: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onCancelInvitation: (inviteId: string) => Promise<void>;
}

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({
  plan,
  access,
  tasks,
  milestones,
  budgetItems,
  members,
  invitations,
  activities,
  onBack,
  onEditPlan,
  onDeletePlan,
  onLeavePlan,
  onOpenTaskModal,
  onToggleTask,
  onDeleteTask,
  onOpenMilestoneModal,
  onToggleMilestone,
  onDeleteMilestone,
  onOpenBudgetItemModal,
  onDeleteBudgetItem,
  onSaveNotes,
  onOpenInviteModal,
  onUpdateMemberRole,
  onRemoveMember,
  onCancelInvitation,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>("ALL");
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>("ALL");
  const [taskFilterMilestone, setTaskFilterMilestone] = useState<string>("ALL");

  const [notesContent, setNotesContent] = useState(plan.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Quick stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === "COMPLETED").length;

  const totalEstimatedBudget = budgetItems.reduce((sum, b) => sum + (b.estimated_amount || 0), 0);
  const totalActualBudget = budgetItems.reduce((sum, b) => sum + (b.actual_amount || 0), 0);
  const targetBudget = plan.budget_target || totalEstimatedBudget;
  const remainingBudget = targetBudget - totalActualBudget;

  let overallProgress = 0;
  if (totalTasks > 0 && totalMilestones > 0) {
    const taskRatio = completedTasks / totalTasks;
    const milestoneRatio = completedMilestones / totalMilestones;
    overallProgress = Math.round((taskRatio * 0.6 + milestoneRatio * 0.4) * 100);
  } else if (totalTasks > 0) {
    overallProgress = Math.round((completedTasks / totalTasks) * 100);
  } else if (totalMilestones > 0) {
    overallProgress = Math.round((completedMilestones / totalMilestones) * 100);
  }

  const handleTaskCheck = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== "COMPLETED") {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: [plan.color || "#C45A38", "#3B6E58", "#B8731F"],
        });
      }
      await onToggleTask(taskId);
    } catch (err) {
      console.error("Task toggle failed:", err);
    }
  };

  const handleMilestoneCheck = async (milestoneId: string) => {
    try {
      const ms = milestones.find((m) => m.id === milestoneId);
      if (ms && ms.status !== "COMPLETED") {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.7 },
          colors: [plan.color || "#C45A38", "#3B6E58", "#B8731F", "#F59E0B"],
        });
      }
      await onToggleMilestone(milestoneId);
    } catch (err) {
      console.error("Milestone toggle failed:", err);
    }
  };

  const handleSaveNotesClick = async () => {
    setSavingNotes(true);
    try {
      await onSaveNotes(notesContent);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } finally {
      setSavingNotes(false);
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilterStatus !== "ALL" && t.status !== taskFilterStatus) return false;
    if (taskFilterPriority !== "ALL" && t.priority !== taskFilterPriority) return false;
    if (taskFilterMilestone !== "ALL") {
      if (taskFilterMilestone === "UNASSIGNED") {
        if (t.milestone_id) return false;
      } else if (t.milestone_id !== taskFilterMilestone) {
        return false;
      }
    }
    return true;
  });

  const nextActions = tasks.filter((t) => t.status !== "COMPLETED").slice(0, 5);
  const nextMilestones = milestones.filter((m) => m.status !== "COMPLETED").slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 w-full max-w-full overflow-hidden">
      {/* 1. Top Navigation & Action Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-black/10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-2 px-3.5 py-1.5 bg-white hover:bg-[#E0FF62] border-2 border-black text-xs font-black uppercase tracking-wider text-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ArrowLeft size={14} className="stroke-[3]" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          {access.canManage && (
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#FF70A6] hover:bg-[#ff5493] border-2 border-black text-xs font-black uppercase tracking-wider text-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <UserPlus size={14} className="stroke-[2.5]" />
              <span>Invite</span>
            </button>
          )}

          {access.canEdit && (
            <button
              type="button"
              onClick={onEditPlan}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-[#E0FF62] border-2 border-black text-xs font-black uppercase tracking-wider text-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Edit2 size={13} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Edit Plan</span>
            </button>
          )}

          {/* Context Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-1.5 bg-white hover:bg-[#F0F0F0] border-2 border-black text-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <MoreVertical size={16} className="stroke-[2.5]" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2 z-30">
                {access.isOwner ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onDeletePlan();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-[#E11D48] hover:bg-[#FFE4E6] rounded-xl font-black transition-colors"
                  >
                    <Trash2 size={14} className="stroke-[2.5]" />
                    <span>Delete Plan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onLeavePlan();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-[#E11D48] hover:bg-[#FFE4E6] rounded-xl font-black transition-colors"
                  >
                    <LogOut size={14} className="stroke-[2.5]" />
                    <span>Leave Plan</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Plan Hero Bento Banner */}
      <div className="border-[1.5px] border-black rounded-[32px] p-6 sm:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div
              className="w-14 h-14 rounded-2xl border-2 border-black flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 mt-0.5"
              style={{ backgroundColor: plan.color || "#000000" }}
            >
              <CategoryIcon name={plan.icon} size={28} />
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                  {plan.category}
                </span>
                <span className="opacity-30">•</span>
                <RoleBadge role={access.role || "VIEWER"} size="sm" />
                {!access.canEdit && (
                  <span className="text-[9px] font-black uppercase text-black bg-[#F0F0F0] border border-black px-2 py-0.5 rounded-full">
                    Read Only
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
                {plan.name}
              </h1>

              {plan.description && (
                <p className="text-xs sm:text-sm text-black/70 font-medium mt-1 max-w-2xl leading-relaxed">
                  {plan.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-start md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-black/10 gap-3 shrink-0">
            <div className="flex items-center space-x-1.5 text-xs text-black">
              <Calendar size={14} className="stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Target:</span>
              <span className="font-black text-black uppercase tracking-wider">
                {formatMonthYear(plan.target_date)}
              </span>
            </div>

            {/* Member avatar group */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Members:</span>
              <div className="flex items-center -space-x-2">
                {members.slice(0, 4).map((m) => (
                  <UserAvatar
                    key={m.id}
                    name={m.name}
                    size="sm"
                    className="shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="pt-2 border-t border-black/10">
          <ProgressBar
            progress={overallProgress}
            color={plan.color || "#E0FF62"}
            height="lg"
            showLabel
          />
        </div>
      </div>

      {/* 3. Tab Bar Navigation (Pills in Bento Style) */}
      <div className="overflow-x-auto pb-2">
        <nav className="flex space-x-2 whitespace-nowrap min-w-max p-1">
          {[
            { id: "overview", label: "Overview", icon: Sparkles },
            { id: "tasks", label: `Tasks (${completedTasks}/${totalTasks})`, icon: ListTodo },
            { id: "milestones", label: `Milestones (${completedMilestones}/${totalMilestones})`, icon: Flag },
            { id: "timeline", label: "Timeline", icon: Calendar },
            { id: "budget", label: plan.budget_enabled ? "Budget" : "Budget (Optional)", icon: DollarSign },
            { id: "notes", label: "Notes", icon: FileText },
            { id: "members", label: `Members (${members.length})`, icon: Users },
            { id: "activity", label: "Activity", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 py-2 px-4 text-xs uppercase tracking-wider rounded-full border-2 border-black transition-all ${
                  isActive
                    ? "bg-[#E0FF62] text-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-white text-black font-bold hover:bg-[#F0F0F0] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                <Icon size={14} className="stroke-[2.5]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Tab Content Panels */}
      <div>
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Metrics Bento Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border-[1.5px] border-black rounded-[24px] p-5 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-50 block mb-1">
                  Overall Completion
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-black">{overallProgress}%</span>
                </div>
                <p className="text-[10px] opacity-60 mt-1 font-semibold">Weighted actions & phases</p>
              </div>

              <div className="border-[1.5px] border-black rounded-[24px] p-5 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-50 block mb-1">
                  Tasks Executed
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-black">{completedTasks}</span>
                  <span className="text-xs opacity-50 font-bold">/ {totalTasks}</span>
                </div>
                <p className="text-[10px] opacity-60 mt-1 font-semibold">
                  {totalTasks - completedTasks} remaining items
                </p>
              </div>

              <div className="border-[1.5px] border-black rounded-[24px] p-5 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-50 block mb-1">
                  Milestones Hit
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-black">{completedMilestones}</span>
                  <span className="text-xs opacity-50 font-bold">/ {totalMilestones}</span>
                </div>
                <p className="text-[10px] opacity-60 mt-1 font-semibold">
                  {totalMilestones - completedMilestones} checkpoints ahead
                </p>
              </div>

              <div className="border-[1.5px] border-black rounded-[24px] p-5 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-50 block mb-1">
                  {plan.budget_enabled ? "Budget Spent / Target" : "Budget Mode"}
                </span>
                {plan.budget_enabled ? (
                  <>
                    <div className="text-sm font-black text-black font-mono truncate">
                      {formatIDR(totalActualBudget)}
                    </div>
                    <p className="text-[10px] opacity-60 font-mono truncate mt-1">
                      of {formatIDR(targetBudget)}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-black text-black/60">No Budget</div>
                    <p className="text-[10px] opacity-50 mt-1 font-medium">Non-monetary plan</p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Next Actions Column */}
              <div className="border-[1.5px] border-black rounded-[32px] p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 size={16} className="stroke-[2.5]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-black">Next Immediate Actions</h3>
                  </div>
                  {access.canEdit && (
                    <button
                      type="button"
                      onClick={() => onOpenTaskModal()}
                      className="text-xs text-black hover:bg-[#E0FF62] font-black uppercase tracking-wider px-2 py-1 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-1"
                    >
                      <Plus size={13} className="stroke-[3]" />
                      <span>Add</span>
                    </button>
                  )}
                </div>

                {nextActions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-black/50 font-medium">
                    No pending tasks! All current actions are completed.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {nextActions.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-3 bg-[#F0F0F0] hover:bg-[#E0FF62] border border-black rounded-2xl group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <div className="flex items-start space-x-3 truncate mr-2">
                          <button
                            type="button"
                            disabled={!access.canEdit}
                            onClick={() => handleTaskCheck(task.id)}
                            className="mt-0.5 text-black hover:scale-110 transition-transform disabled:cursor-not-allowed"
                          >
                            <Circle size={17} className="stroke-[2.5]" />
                          </button>
                          <div className="truncate">
                            <p className="text-xs font-bold text-black truncate">{task.title}</p>
                            {task.milestone_title && (
                              <span className="text-[10px] text-black/70 font-semibold block truncate">
                                ↳ {task.milestone_title}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {task.due_date && (
                            <span className="text-[10px] text-black font-semibold flex items-center space-x-1">
                              <Calendar size={11} />
                              <span>{formatDate(task.due_date)}</span>
                            </span>
                          )}
                          <PriorityBadge priority={task.priority} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Milestones Column */}
              <div className="border-[1.5px] border-black rounded-[32px] p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Flag size={16} className="stroke-[2.5]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-black">Upcoming Checkpoints</h3>
                  </div>
                  {access.canEdit && (
                    <button
                      type="button"
                      onClick={() => onOpenMilestoneModal()}
                      className="text-xs text-black hover:bg-[#BBF7D0] font-black uppercase tracking-wider px-2 py-1 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-1"
                    >
                      <Plus size={13} className="stroke-[3]" />
                      <span>Add</span>
                    </button>
                  )}
                </div>

                {nextMilestones.length === 0 ? (
                  <div className="p-6 text-center text-xs text-black/50 font-medium">
                    No upcoming checkpoints scheduled.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {nextMilestones.map((ms) => (
                      <div
                        key={ms.id}
                        className="p-3.5 bg-[#F0F0F0] hover:bg-[#70D6FF] border border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2.5 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            <button
                              type="button"
                              disabled={!access.canEdit}
                              onClick={() => handleMilestoneCheck(ms.id)}
                              className="mt-0.5 text-black hover:scale-110 transition-transform disabled:cursor-not-allowed"
                            >
                              <Circle size={16} className="stroke-[2.5]" />
                            </button>
                            <div>
                              <h4 className="text-xs font-black text-black uppercase">{ms.title}</h4>
                              {ms.description && (
                                <p className="text-[11px] text-black/70 font-medium line-clamp-1 mt-0.5">
                                  {ms.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white border border-black rounded-full shrink-0">
                            {formatMonthYear(ms.target_date)}
                          </span>
                        </div>

                        {ms.totalTasks ? (
                          <div className="pt-1">
                            <ProgressBar progress={ms.taskProgress || 0} height="sm" color="#000000" />
                            <div className="flex justify-between text-[10px] text-black font-bold mt-1">
                              <span>Tasks: {ms.completedTasks} / {ms.totalTasks}</span>
                              <span>{ms.taskProgress}% done</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TASKS */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border-[1.5px] border-black rounded-[24px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <select
                  value={taskFilterStatus}
                  onChange={(e) => setTaskFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F0F0F0] border-2 border-black rounded-full font-bold text-black focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={taskFilterPriority}
                  onChange={(e) => setTaskFilterPriority(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F0F0F0] border-2 border-black rounded-full font-bold text-black focus:outline-none"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>

                {/* Milestone Filter */}
                <select
                  value={taskFilterMilestone}
                  onChange={(e) => setTaskFilterMilestone(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F0F0F0] border-2 border-black rounded-full font-bold text-black focus:outline-none"
                >
                  <option value="ALL">All Milestones</option>
                  <option value="UNASSIGNED">General (No Milestone)</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {access.canEdit && (
                <button
                  type="button"
                  onClick={() => onOpenTaskModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <Plus size={15} className="stroke-[3]" />
                  <span>Add Task</span>
                </button>
              )}
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="p-10 text-center bg-white border-[1.5px] border-black rounded-[32px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <ListTodo size={28} className="mx-auto mb-1 stroke-[2.5]" />
                <h4 className="text-sm font-black uppercase tracking-tight">No tasks match your filters</h4>
                <p className="text-xs text-black/60 font-medium">
                  Break your goal into small actionable steps to start executing.
                </p>
                {access.canEdit && (
                  <button
                    type="button"
                    onClick={() => onOpenTaskModal()}
                    className="mt-2 px-4 py-2 bg-[#E0FF62] text-black text-xs font-black uppercase rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Add Task
                  </button>
                )}
              </div>
            ) : (
              <div className="border-[1.5px] border-black rounded-[32px] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] divide-y-2 divide-black/10 overflow-hidden">
                {filteredTasks.map((task) => {
                  const isDone = task.status === "COMPLETED";
                  return (
                    <div
                      key={task.id}
                      className={`p-4 flex items-start justify-between gap-3 hover:bg-[#F0F0F0] transition-colors ${
                        isDone ? "bg-[#F9F9F9]" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3 truncate">
                        <button
                          type="button"
                          disabled={!access.canEdit}
                          onClick={() => handleTaskCheck(task.id)}
                          className={`mt-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed ${
                            isDone ? "text-black" : "text-black/40 hover:text-black"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 size={20} className="fill-[#BBF7D0] stroke-[2.5] text-black" />
                          ) : (
                            <Circle size={20} className="stroke-[2.5]" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <p
                            className={`text-xs sm:text-sm font-bold text-black ${
                              isDone ? "line-through opacity-40" : ""
                            }`}
                          >
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="text-xs text-black/70 font-medium leading-relaxed line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <StatusBadge status={task.status} size="sm" />
                            <PriorityBadge priority={task.priority} size="sm" />

                            {task.milestone_title && (
                              <span className="text-[10px] font-black uppercase text-black bg-[#E0FF62] border border-black px-2 py-0.5 rounded-full truncate max-w-[200px]">
                                {task.milestone_title}
                              </span>
                            )}

                            {task.due_date && (
                              <span className="text-[10px] text-black font-semibold flex items-center space-x-1">
                                <Calendar size={11} />
                                <span>{formatDate(task.due_date)}</span>
                              </span>
                            )}

                            {task.assignee_name && (
                              <span className="text-[10px] text-black font-bold flex items-center space-x-1 bg-[#F0F0F0] border border-black px-2 py-0.5 rounded-full">
                                <UserAvatar name={task.assignee_name} size="xs" />
                                <span>{task.assignee_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {access.canEdit && (
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenTaskModal(task)}
                            className="p-1.5 text-black hover:bg-[#E0FF62] border border-black rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors"
                            title="Edit Task"
                          >
                            <Edit2 size={13} className="stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 text-[#E11D48] hover:bg-[#FFE4E6] border border-black rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 size={13} className="stroke-[2.5]" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MILESTONES */}
        {activeTab === "milestones" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 border-[1.5px] border-black rounded-[24px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  Key Strategic Checkpoints
                </h3>
                <p className="text-[11px] text-black/60 font-medium">
                  Milestone progress automatically calculates from attached completed tasks.
                </p>
              </div>
              {access.canEdit && (
                <button
                  type="button"
                  onClick={() => onOpenMilestoneModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#BBF7D0] hover:bg-[#86efac] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <Plus size={15} className="stroke-[3]" />
                  <span>Add Milestone</span>
                </button>
              )}
            </div>

            {milestones.length === 0 ? (
              <div className="p-10 text-center bg-white border-[1.5px] border-black rounded-[32px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <Flag size={28} className="mx-auto mb-1 stroke-[2.5]" />
                <h4 className="text-sm font-black uppercase tracking-tight">No milestones created yet</h4>
                <p className="text-xs text-black/60 font-medium">
                  Define major checkpoints to measure macro progress along your journey.
                </p>
                {access.canEdit && (
                  <button
                    type="button"
                    onClick={() => onOpenMilestoneModal()}
                    className="mt-2 px-4 py-2 bg-[#BBF7D0] text-black text-xs font-black uppercase rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Add Milestone
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {milestones.map((ms, idx) => {
                  const isDone = ms.status === "COMPLETED";
                  return (
                    <div
                      key={ms.id}
                      className={`border-[1.5px] border-black rounded-[32px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-all ${
                        isDone ? "bg-[#F7FAF8]" : "bg-white"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-3">
                            <span className="w-6 h-6 rounded-full bg-[#E0FF62] border border-black text-black text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                              {idx + 1}
                            </span>
                            <div>
                              <h4
                                className={`text-sm font-black uppercase tracking-tight text-black ${
                                  isDone ? "line-through opacity-40" : ""
                                }`}
                              >
                                {ms.title}
                              </h4>
                              {ms.description && (
                                <p className="text-xs text-black/70 font-medium mt-1 leading-relaxed">
                                  {ms.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={!access.canEdit}
                              onClick={() => handleMilestoneCheck(ms.id)}
                              className="p-1 hover:scale-110 transition-transform disabled:cursor-not-allowed"
                              title="Toggle Milestone Completion"
                            >
                              {isDone ? (
                                <CheckCircle2 size={20} className="fill-[#BBF7D0] stroke-[2.5] text-black" />
                              ) : (
                                <Circle size={20} className="stroke-[2.5]" />
                              )}
                            </button>
                            {access.canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onOpenMilestoneModal(ms)}
                                  className="p-1.5 text-black hover:bg-[#E0FF62] border border-black rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors"
                                >
                                  <Edit2 size={12} className="stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteMilestone(ms.id)}
                                  className="p-1.5 text-[#E11D48] hover:bg-[#FFE4E6] border border-black rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors"
                                >
                                  <Trash2 size={12} className="stroke-[2.5]" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar of Attached Tasks */}
                        <div className="pt-2">
                          <ProgressBar progress={ms.taskProgress || 0} color="#000000" height="sm" />
                          <div className="flex items-center justify-between text-[11px] text-black font-bold mt-1.5">
                            <span>
                              {ms.completedTasks || 0} / {ms.totalTasks || 0} tasks finished
                            </span>
                            <span className="font-black">{ms.taskProgress || 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/10 text-xs">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-white border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          Target: {formatMonthYear(ms.target_date)}
                        </span>
                        {access.canEdit && (
                          <button
                            type="button"
                            onClick={() => onOpenTaskModal(null, ms.id)}
                            className="text-[10px] text-black font-black uppercase tracking-wider hover:underline"
                          >
                            + Add Task to Checkpoint
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TIMELINE */}
        {activeTab === "timeline" && (
          <div className="border-[1.5px] border-black rounded-[32px] p-6 sm:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="border-b border-black/10 pb-4">
              <h3 className="text-base font-black uppercase tracking-tight">Execution Journey Timeline</h3>
              <p className="text-xs text-black/70 font-medium mt-0.5">
                Chronological roadmap of checkpoints and scheduled actions.
              </p>
            </div>

            {milestones.length === 0 && tasks.filter((t) => t.due_date).length === 0 ? (
              <div className="p-8 text-center text-xs text-black/50 font-medium">
                Add target dates to your milestones and tasks to visualize the chronological timeline.
              </div>
            ) : (
              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-1 before:bg-black">
                {milestones.map((ms) => {
                  const related = tasks.filter((t) => t.milestone_id === ms.id);
                  const isDone = ms.status === "COMPLETED";
                  return (
                    <div key={ms.id} className="relative space-y-3">
                      {/* Timeline Node Icon */}
                      <div
                        className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          isDone ? "bg-[#BBF7D0]" : "bg-[#E0FF62]"
                        }`}
                      >
                        {isDone ? <Check size={12} className="stroke-[3]" /> : <Flag size={11} className="stroke-[2.5]" />}
                      </div>

                      <div className="bg-[#F0F0F0] border-2 border-black p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white border border-black rounded-full inline-block mb-1">
                              {formatMonthYear(ms.target_date)}
                            </span>
                            <h4 className="text-sm font-black uppercase text-black">{ms.title}</h4>
                            {ms.description && (
                              <p className="text-xs text-black/70 font-medium mt-0.5">{ms.description}</p>
                            )}
                          </div>
                          <StatusBadge status={ms.status} size="sm" />
                        </div>

                        {related.length > 0 && (
                          <div className="pt-2 border-t border-black/10 space-y-1.5">
                            <span className="text-[9px] uppercase font-black tracking-wider opacity-60 block">
                              Checkpoint Tasks:
                            </span>
                            {related.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between text-xs py-1.5 px-3 bg-white rounded-xl border border-black font-bold"
                              >
                                <span
                                  className={`truncate ${
                                    t.status === "COMPLETED" ? "line-through opacity-40" : "text-black"
                                  }`}
                                >
                                  {t.title}
                                </span>
                                <StatusBadge status={t.status} size="sm" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BUDGET */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            {!plan.budget_enabled ? (
              <div className="border-[1.5px] border-black rounded-[32px] p-8 text-center space-y-4 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-14 h-14 rounded-2xl bg-[#E0FF62] border-2 border-black text-black mx-auto flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <DollarSign size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Budget Tracking Optional</h3>
                  <p className="text-xs text-black/70 font-medium max-w-md mx-auto mt-1 leading-relaxed">
                    This plan currently does not require a monetary budget. If this goal involves estimated expenses
                    (e.g., equipment, fees, travel), you can start logging items anytime.
                  </p>
                </div>
                {access.canEdit && (
                  <button
                    type="button"
                    onClick={() => onOpenBudgetItemModal()}
                    className="px-5 py-2.5 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    Add First Budget Item
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Budget Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border-[1.5px] border-black rounded-[24px] p-5 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-50 block mb-1">
                      Target Estimated Budget
                    </span>
                    <div className="text-xl font-black text-black font-mono">
                      {formatIDR(targetBudget)}
                    </div>
                    <p className="text-[10px] opacity-60 font-mono mt-1 font-semibold">
                      Sum of items: {formatIDR(totalEstimatedBudget)}
                    </p>
                  </div>

                  <div className="border-[1.5px] border-black rounded-[24px] p-5 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-50 block mb-1">
                      Actual Spent
                    </span>
                    <div className="text-xl font-black text-black font-mono">
                      {formatIDR(totalActualBudget)}
                    </div>
                    <p className="text-[10px] opacity-60 mt-1 font-semibold">
                      {targetBudget > 0 ? `${Math.round((totalActualBudget / targetBudget) * 100)}% of target` : "0%"}
                    </p>
                  </div>

                  <div className="border-[1.5px] border-black rounded-[24px] p-5 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-50 block mb-1">
                      Remaining Balance
                    </span>
                    <div
                      className={`text-xl font-black font-mono ${
                        remainingBudget < 0 ? "text-[#E11D48]" : "text-black"
                      }`}
                    >
                      {formatIDR(remainingBudget)}
                    </div>
                    <p className="text-[10px] opacity-60 mt-1 font-semibold">
                      {remainingBudget >= 0 ? "Under budget threshold" : "Exceeded planned budget"}
                    </p>
                  </div>
                </div>

                {/* Budget Item Table */}
                <div className="border-[1.5px] border-black rounded-[32px] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="p-4 sm:p-5 flex items-center justify-between border-b-2 border-black bg-[#F0F0F0]">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-black">
                        Budget Line Items
                      </h4>
                      <p className="text-[11px] opacity-60 font-medium">
                        Expected costs and confirmed expenditures for this plan.
                      </p>
                    </div>
                    {access.canEdit && (
                      <button
                        type="button"
                        onClick={() => onOpenBudgetItemModal()}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      >
                        <Plus size={14} className="stroke-[3]" />
                        <span>Add Item</span>
                      </button>
                    )}
                  </div>

                  {budgetItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-black/50 font-medium">
                      No budget items listed yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b-2 border-black text-[10px] font-black uppercase tracking-wider text-black bg-white">
                            <th className="py-3 px-4">Item Description</th>
                            <th className="py-3 px-4">Estimated</th>
                            <th className="py-3 px-4">Actual Spent</th>
                            <th className="py-3 px-4">Variance</th>
                            <th className="py-3 px-4">Notes</th>
                            {access.canEdit && <th className="py-3 px-4 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y border-black/10">
                          {budgetItems.map((item) => {
                            const diff = (item.estimated_amount || 0) - (item.actual_amount || 0);
                            return (
                              <tr key={item.id} className="hover:bg-[#F0F0F0] transition-colors">
                                <td className="py-3 px-4 font-bold text-black">{item.name}</td>
                                <td className="py-3 px-4 font-mono font-medium text-black/70">
                                  {formatIDR(item.estimated_amount)}
                                </td>
                                <td className="py-3 px-4 font-mono font-black text-black">
                                  {formatIDR(item.actual_amount)}
                                </td>
                                <td
                                  className={`py-3 px-4 font-mono font-bold ${
                                    diff < 0 ? "text-[#E11D48]" : "text-black"
                                  }`}
                                >
                                  {diff >= 0 ? `+${formatIDR(diff)}` : `-${formatIDR(Math.abs(diff))}`}
                                </td>
                                <td className="py-3 px-4 text-black/70 font-medium max-w-xs truncate">
                                  {item.notes || "-"}
                                </td>
                                {access.canEdit && (
                                  <td className="py-3 px-4 text-right space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => onOpenBudgetItemModal(item)}
                                      className="p-1 text-black hover:bg-[#E0FF62] border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors"
                                    >
                                      <Edit2 size={12} className="stroke-[2.5]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteBudgetItem(item.id)}
                                      className="p-1 text-[#E11D48] hover:bg-[#FFE4E6] border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors"
                                    >
                                      <Trash2 size={12} className="stroke-[2.5]" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 6: NOTES */}
        {activeTab === "notes" && (
          <div className="border-[1.5px] border-black rounded-[32px] p-6 sm:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Plan Notes & Documentation</h3>
                <p className="text-xs text-black/70 font-medium mt-0.5">
                  Research, specs, contacts, and ideas in persistent storage.
                </p>
              </div>

              {access.canEdit && (
                <button
                  type="button"
                  disabled={savingNotes}
                  onClick={handleSaveNotesClick}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {savingNotes ? (
                    <span>Saving...</span>
                  ) : notesSaved ? (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} className="stroke-[2.5]" />
                      <span>Save Notes</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <textarea
              rows={14}
              disabled={!access.canEdit}
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Write your research notes, vendor phone numbers, travel itineraries, ideas, or links..."
              className="w-full p-4 text-xs sm:text-sm bg-[#F0F0F0] border-2 border-black rounded-2xl font-mono text-black focus:outline-none focus:bg-white resize-y disabled:opacity-70 leading-relaxed shadow-[inner_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
            />
          </div>
        )}

        {/* TAB 7: MEMBERS & COLLABORATION */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-5 border-[1.5px] border-black rounded-[24px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  Plan Collaborators & Permissions
                </h3>
                <p className="text-[11px] text-black/60 font-medium">
                  {access.isOwner
                    ? "As the Owner, you can invite users, assign Editor/Viewer roles, or remove members."
                    : "Collaborate together in real-time."}
                </p>
              </div>
              {access.canManage && (
                <button
                  type="button"
                  onClick={onOpenInviteModal}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#FF70A6] hover:bg-[#ff5493] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <UserPlus size={14} className="stroke-[2.5]" />
                  <span>Invite</span>
                </button>
              )}
            </div>

            {/* Members Roster */}
            <div className="border-[1.5px] border-black rounded-[32px] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] divide-y-2 divide-black/10 overflow-hidden">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3.5">
                    <UserAvatar
                      name={m.name}
                      size="lg"
                      className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-black uppercase text-black">{m.name}</h4>
                        <RoleBadge role={m.role} size="sm" />
                        {m.is_demo ? (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.2 bg-amber-200 text-black border border-black/40 rounded">
                            Demo
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.2 bg-[#E0FF62] text-black border border-black/40 rounded">
                            Real User
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-60 font-semibold">{m.email}</p>
                      {m.bio && <p className="text-[11px] opacity-70 mt-0.5 font-medium">{m.bio}</p>}
                    </div>
                  </div>

                  {access.isOwner && m.role !== "OWNER" && (
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <select
                        value={m.role}
                        onChange={(e) => onUpdateMemberRole(m.id, e.target.value)}
                        className="px-3 py-1 text-xs bg-[#F0F0F0] border-2 border-black rounded-full font-bold text-black"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onRemoveMember(m.id)}
                        className="p-1.5 bg-white hover:bg-[#FFE4E6] text-[#E11D48] border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 size={14} className="stroke-[2.5]" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pending Invitations Section */}
            {invitations.length > 0 && (
              <div className="border-[1.5px] border-black rounded-[32px] p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-black">
                  Pending Outgoing Invitations ({invitations.length})
                </h4>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 bg-[#F0F0F0] border-2 border-black rounded-2xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="truncate mr-3">
                        <p className="text-xs font-bold text-black truncate">
                          {inv.invitee_name} ({inv.invitee_email})
                        </p>
                        <p className="text-[10px] opacity-70 font-semibold">
                          Invited as <span className="font-black text-black uppercase">{inv.role}</span> • Sent {formatRelativeTime(inv.created_at)}
                        </p>
                      </div>

                      {access.canManage && (
                        <button
                          type="button"
                          onClick={() => onCancelInvitation(inv.id)}
                          className="text-xs text-[#E11D48] font-black uppercase hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone Section */}
            <div className="border-2 border-[#E11D48] rounded-[32px] p-6 bg-[#FFE4E6]/40 shadow-[8px_8px_0px_0px_rgba(225,29,72,0.3)] space-y-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={18} className="text-[#E11D48] stroke-[2.5]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#E11D48]">
                  Danger Zone
                </h4>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                  <h5 className="text-sm font-black text-black">
                    {access.isOwner ? "Permanently Delete Plan" : "Leave This Plan"}
                  </h5>
                  <p className="text-xs text-black/70 font-medium mt-0.5">
                    {access.isOwner
                      ? "Permanently delete this plan and all associated milestones, action items, budget entries, and notes."
                      : "Revoke your access to this collaborative workspace."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={access.isOwner ? onDeletePlan : onLeavePlan}
                  className="px-5 py-2.5 bg-[#FFE4E6] hover:bg-[#ffcdd3] text-[#E11D48] text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0 flex items-center space-x-1.5"
                >
                  {access.isOwner ? <Trash2 size={14} className="stroke-[2.5]" /> : <LogOut size={14} className="stroke-[2.5]" />}
                  <span>{access.isOwner ? "Delete Plan" : "Leave Plan"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: ACTIVITY LOG */}
        {activeTab === "activity" && (
          <div className="border-[1.5px] border-black rounded-[32px] p-6 sm:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b border-black/10 pb-3">
              <h3 className="text-base font-black uppercase tracking-tight">Activity Log Stream</h3>
              <p className="text-xs text-black/70 font-medium mt-0.5">
                Audit protocol of collaborative updates and checkpoint completions.
              </p>
            </div>

            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-black/50 font-medium">
                No logged activity yet.
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10">
                {activities.map((act) => (
                  <div key={act.id} className="py-3.5 flex items-start space-x-3.5">
                    <UserAvatar
                      name={act.actor_name}
                      size="md"
                      className="shrink-0 mt-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs text-black">
                        <span className="font-black">{act.actor_name}</span>{" "}
                        <span className="opacity-70 font-medium">{act.details}</span>
                      </p>
                      <p className="text-[10px] opacity-40 font-mono font-bold">
                        {formatRelativeTime(act.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

