import React, { useState } from "react";
import { Plan, Task, Milestone, PlanInvitation, Activity } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { formatIDR, formatDate, formatMonthYear, formatRelativeTime } from "../../lib/formatters";
import { CategoryIcon } from "../common/CategoryIcon";
import { ProgressBar } from "../common/ProgressBar";
import { RoleBadge, StatusBadge, PriorityBadge } from "../common/Badge";
import { UserAvatar } from "../common/UserAvatar";
import {
  Plus,
  Compass,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  Flag,
  ArrowRight,
  Sparkles,
  Inbox,
  Clock,
  ChevronRight,
  Activity as ActivityIcon,
  Zap,
  Layers,
  MoreVertical,
  Edit2,
  Trash2,
  LogOut,
  FolderOpen,
} from "lucide-react";

interface DashboardViewProps {
  myPlans: Plan[];
  sharedPlans: Plan[];
  pendingInvitations: PlanInvitation[];
  upcomingTasks: Task[];
  upcomingMilestones: Milestone[];
  recentActivities: Activity[];
  onSelectPlan: (planId: string) => void;
  onNewPlan: () => void;
  onEditPlan?: (plan: Plan) => void;
  onDeletePlan?: (planId: string, planName: string) => void;
  onLeavePlan?: (planId: string, planName: string) => void;
  onRespondInvite: (inviteId: string, action: "ACCEPT" | "DECLINE") => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  myPlans,
  sharedPlans,
  pendingInvitations,
  upcomingTasks,
  upcomingMilestones,
  recentActivities,
  onSelectPlan,
  onNewPlan,
  onEditPlan,
  onDeletePlan,
  onLeavePlan,
  onRespondInvite,
}) => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  const totalActivePlans = myPlans.length + sharedPlans.length;
  const allTasksCount = myPlans.reduce((sum, p) => sum + (p.stats?.totalTasks || 0), 0) +
    sharedPlans.reduce((sum, p) => sum + (p.stats?.totalTasks || 0), 0);
  const completedTasksCount = myPlans.reduce((sum, p) => sum + (p.stats?.completedTasks || 0), 0) +
    sharedPlans.reduce((sum, p) => sum + (p.stats?.completedTasks || 0), 0);
  const totalCompletionRate = allTasksCount > 0 ? Math.round((completedTasksCount / allTasksCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 w-full overflow-hidden">
      {/* 1. Bento Grid Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Main Bento Hero Card (col-span-2) */}
        <div className="md:col-span-2 border-[1.5px] border-black rounded-2xl sm:rounded-[32px] p-5 sm:p-8 flex flex-col justify-between bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
              Station // Node_Active
            </span>
            <span className="text-[11px] font-black px-2.5 py-0.5 bg-[#BBF7D0] border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              ONLINE
            </span>
          </div>

          <div className="my-2 sm:my-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-tight mb-2 sm:mb-3 break-words">
              {getGreeting()},<br />
              {user?.name || "Architect"}
            </h1>
            <p className="text-xs sm:text-sm opacity-70 font-medium max-w-sm leading-relaxed">
              Collaborative execution matrix. You have {totalActivePlans} active workspace {totalActivePlans === 1 ? "plan" : "plans"} and {upcomingTasks.length} pending actions.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-black/10 mt-3 gap-2">
            <button
              type="button"
              onClick={onNewPlan}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0"
            >
              <Plus size={15} className="stroke-[3]" />
              <span>Create Plan</span>
            </button>

            <div className="text-right shrink-0">
              <div className="text-[9px] font-black opacity-40 uppercase tracking-widest">Progress</div>
              <div className="text-xl sm:text-3xl font-black tracking-tight">{totalCompletionRate}%</div>
            </div>
          </div>
        </div>

        {/* Bento Metric Tile 1: Electric Indigo (col-span-1) */}
        <div className="border-[1.5px] border-black rounded-2xl sm:rounded-[32px] p-5 sm:p-6 bg-[#6366F1] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Execution Load</div>
            <Zap size={18} className="opacity-90" />
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tighter leading-none block">{upcomingTasks.length}</span>
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Pending Actions</span>
          </div>
          <div className="flex gap-1 h-6 items-end">
            <div className="w-full bg-white h-[30%] opacity-40 rounded-xs"></div>
            <div className="w-full bg-white h-[55%] opacity-60 rounded-xs"></div>
            <div className="w-full bg-white h-[90%] opacity-80 rounded-xs"></div>
            <div className="w-full bg-white h-[70%] opacity-70 rounded-xs"></div>
            <div className="w-full bg-white h-[100%] opacity-100 rounded-xs"></div>
          </div>
        </div>

        {/* Bento Metric Tile 2: Lime & Checkpoint (col-span-1) */}
        <div className="border-[1.5px] border-black rounded-2xl sm:rounded-[32px] p-5 sm:p-6 bg-[#E0FF62] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Checkpoints</div>
            <div className="w-6 h-6 border border-black rounded-full flex items-center justify-center bg-white">
              <Flag size={12} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tighter leading-none block">{upcomingMilestones.length}</span>
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Active Milestones</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider bg-white border border-black px-2.5 py-1 rounded-full text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Phase Synced
          </div>
        </div>
      </div>

      {/* 2. Pending Invitations Alert Bento Tile */}
      {pendingInvitations.length > 0 && (
        <div className="border-[1.5px] border-black rounded-2xl sm:rounded-[32px] p-4 sm:p-6 bg-[#FFD60A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-black">
              <Inbox size={18} className="stroke-[2.5]" />
              <span>Pending Invitations ({pendingInvitations.length})</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-black text-white rounded-full">
              Incoming
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white border-2 border-black p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div
                    className="w-10 h-10 rounded-xl border border-black flex items-center justify-center text-white shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    style={{ backgroundColor: inv.plan_color || "#000000" }}
                  >
                    <CategoryIcon name={inv.plan_icon} size={20} />
                  </div>
                  <div className="truncate min-w-0">
                    <h4 className="text-xs font-black text-black uppercase tracking-tight truncate">{inv.plan_name}</h4>
                    <p className="text-[11px] opacity-70 truncate font-medium">
                      By <span className="font-bold text-black">{inv.inviter_name}</span> as <span className="uppercase text-[9px] font-black px-1.5 py-0.2 bg-[#E0FF62] border border-black rounded-full">{inv.role}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onRespondInvite(inv.id, "ACCEPT")}
                    className="px-3 py-1.5 bg-[#BBF7D0] hover:bg-[#86efac] border border-black text-black text-xs font-black uppercase rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onRespondInvite(inv.id, "DECLINE")}
                    className="px-2.5 py-1.5 bg-white hover:bg-[#F0F0F0] border border-black text-black text-xs font-bold uppercase rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Plans Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Cols: My Plans & Shared Plans */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Section: My Plans */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-black uppercase tracking-tight">Personal Plans</h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-white text-black border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {myPlans.length}
                </span>
              </div>
            </div>

            {myPlans.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-white border-2 border-dashed border-black rounded-2xl sm:rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#E0FF62] border-2 border-black text-black mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Sparkles size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">No Personal Plans Active</h3>
                  <p className="text-xs text-black/60 max-w-sm mx-auto mt-1 font-medium leading-relaxed">
                    Deploy your first structured plan with actionable checkpoints, milestone paths, and collaborative controls.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onNewPlan}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 bg-[#E0FF62] hover:bg-[#d6f54c] text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  Create Plan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {myPlans.map((plan) => (
                  <PlanBentoCard
                    key={plan.id}
                    plan={plan}
                    onSelect={() => onSelectPlan(plan.id)}
                    onEdit={onEditPlan ? () => onEditPlan(plan) : undefined}
                    onDelete={onDeletePlan ? () => onDeletePlan(plan.id, plan.name) : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section: Shared With Me */}
          {sharedPlans.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-black text-black uppercase tracking-tight">Shared Collaborative Plans</h2>
                  <span className="text-[10px] font-black px-2.5 py-0.5 bg-[#70D6FF] text-black border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {sharedPlans.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {sharedPlans.map((plan) => (
                  <PlanBentoCard
                    key={plan.id}
                    plan={plan}
                    isShared
                    onSelect={() => onSelectPlan(plan.id)}
                    onLeave={onLeavePlan ? () => onLeavePlan(plan.id, plan.name) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Upcoming Actions, Milestones & Recent Activity */}
        <div className="space-y-4 sm:space-y-6">
          {/* Widget 1: Upcoming Tasks */}
          <div className="border-[1.5px] border-black rounded-2xl sm:rounded-[32px] p-4 sm:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1.5">
                <CheckCircle2 size={15} className="text-black stroke-[2.5]" />
                <span>Next Action Items</span>
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#F0F0F0] border border-black rounded-full">
                {upcomingTasks.length}
              </span>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-black/50 py-2 text-center font-medium">No upcoming tasks scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectPlan(t.plan_id)}
                    className="p-3 bg-[#F0F0F0] hover:bg-[#E0FF62] border border-black rounded-2xl cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all space-y-1.5 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-black line-clamp-1 group-hover:underline">
                        {t.title}
                      </span>
                      <PriorityBadge priority={t.priority} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-black/70 font-semibold gap-1">
                      <span className="truncate uppercase tracking-wider font-black max-w-[120px]">
                        {t.plan_name}
                      </span>
                      {t.due_date && (
                        <span className="flex items-center space-x-1 shrink-0">
                          <Clock size={11} />
                          <span>{formatDate(t.due_date)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 2: Upcoming Milestones */}
          <div className="border-[1.5px] border-black rounded-2xl sm:rounded-[32px] p-4 sm:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1.5">
                <Flag size={15} className="stroke-[2.5]" />
                <span>Upcoming Milestones</span>
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#BBF7D0] border border-black rounded-full">
                {upcomingMilestones.length}
              </span>
            </div>

            {upcomingMilestones.length === 0 ? (
              <p className="text-xs text-black/50 py-2 text-center font-medium">No milestone deadlines set.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingMilestones.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectPlan(m.plan_id)}
                    className="p-3 bg-[#F0F0F0] hover:bg-[#70D6FF] border border-black rounded-2xl cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-black truncate group-hover:underline">{m.title}</span>
                      <span className="text-[10px] text-black font-black uppercase tracking-wider shrink-0">
                        {formatMonthYear(m.target_date)}
                      </span>
                    </div>
                    <p className="text-[10px] text-black/60 truncate font-bold uppercase tracking-wider">
                      {m.plan_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 3: Collaborative Activity Feed */}
          {recentActivities.length > 0 && (
            <div className="border-[1.5px] border-black rounded-2xl sm:rounded-[32px] p-4 sm:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1.5">
                  <ActivityIcon size={15} className="stroke-[2.5]" />
                  <span>Activity Protocol</span>
                </h3>
              </div>

              <div className="space-y-2.5">
                {recentActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start space-x-2.5 text-xs">
                    <UserAvatar
                      name={act.actor_name}
                      size="xs"
                      className="shrink-0 mt-0.5"
                    />
                    <div className="space-y-0.5 truncate flex-1 min-w-0">
                      <p className="text-xs text-black font-medium truncate">
                        <span className="font-black">{act.actor_name}</span>{" "}
                        <span className="opacity-70">{act.details}</span>
                      </p>
                      <p className="text-[10px] opacity-40 font-mono font-bold">
                        {formatRelativeTime(act.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Bento Plan Card Component
const PlanBentoCard: React.FC<{
  plan: Plan;
  isShared?: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onLeave?: () => void;
}> = ({ plan, isShared, onSelect, onEdit, onDelete, onLeave }) => {
  const [showMenu, setShowMenu] = useState(false);
  const stats = plan.stats;
  const progress = stats?.progress || 0;

  return (
    <div
      onClick={onSelect}
      className="border-[1.5px] border-black rounded-2xl sm:rounded-[32px] p-4 sm:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      <div>
        {/* Top bar: Category Badge, Role Pill, Options menu */}
        <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0 group-hover:scale-105 transition-transform"
              style={{ backgroundColor: plan.color || "#000000" }}
            >
              <CategoryIcon name={plan.icon} size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 block truncate">
                {plan.category}
              </span>
              <h3 className="text-sm sm:text-base font-black text-black uppercase tracking-tight group-hover:underline line-clamp-1 truncate">
                {plan.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {isShared ? (
              <RoleBadge role={plan.role} size="sm" />
            ) : (
              <RoleBadge role="OWNER" size="sm" />
            )}

            {(onDelete || onLeave || onEdit) && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 hover:bg-[#F0F0F0] border border-black/30 rounded-full transition-colors"
                  title="Plan Options"
                >
                  <MoreVertical size={14} className="stroke-[2.5] text-black" />
                </button>

                {showMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-1 w-44 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-1.5 z-20"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onSelect();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-black hover:bg-[#E0FF62] rounded-xl font-bold transition-colors"
                    >
                      <FolderOpen size={13} className="stroke-[2.5]" />
                      <span>Open Plan</span>
                    </button>

                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onEdit();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-black hover:bg-[#F0F0F0] rounded-xl font-bold transition-colors"
                      >
                        <Edit2 size={13} className="stroke-[2.5]" />
                        <span>Edit Details</span>
                      </button>
                    )}

                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onDelete();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-[#E11D48] hover:bg-[#FFE4E6] rounded-xl font-bold transition-colors"
                      >
                        <Trash2 size={13} className="stroke-[2.5]" />
                        <span>Delete Plan</span>
                      </button>
                    )}

                    {onLeave && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onLeave();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-[#E11D48] hover:bg-[#FFE4E6] rounded-xl font-bold transition-colors"
                      >
                        <LogOut size={13} className="stroke-[2.5]" />
                        <span>Leave Plan</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description snippet if any */}
        {plan.description && (
          <p className="text-xs text-black/70 font-medium line-clamp-2 mb-3 leading-relaxed">
            {plan.description}
          </p>
        )}

        {/* Progress Track */}
        <div className="mb-3">
          <ProgressBar progress={progress} color={plan.color || "#E0FF62"} height="md" showLabel />
        </div>

        {/* Metrics Pill Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-t border-b border-black/10 mb-3">
          <div className="bg-[#F0F0F0] p-2 rounded-xl border border-black min-w-0">
            <span className="text-[9px] uppercase font-black opacity-50 block tracking-wider truncate">Tasks</span>
            <span className="font-black text-black text-xs">
              {stats?.completedTasks || 0} / {stats?.totalTasks || 0}
            </span>
          </div>

          <div className="bg-[#F0F0F0] p-2 rounded-xl border border-black min-w-0">
            <span className="text-[9px] uppercase font-black opacity-50 block tracking-wider truncate">Milestones</span>
            <span className="font-black text-black text-xs">
              {stats?.completedMilestones || 0} / {stats?.totalMilestones || 0}
            </span>
          </div>

          {plan.budget_enabled && (
            <div className="col-span-2 bg-[#F0F0F0] p-2 rounded-xl border border-black min-w-0">
              <span className="text-[9px] uppercase font-black opacity-50 block tracking-wider truncate">Budget Allocation</span>
              <span className="font-black text-black font-mono text-[10px] sm:text-[11px] truncate block">
                {formatIDR(stats?.totalActual || 0)} / {formatIDR(plan.budget_target || stats?.totalEstimated || 0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Target date & Member avatars */}
      <div className="flex items-center justify-between pt-1 text-xs text-black font-bold">
        <div className="flex items-center space-x-1.5">
          <Calendar size={13} className="stroke-[2.5]" />
          <span className="text-[11px] font-black uppercase tracking-wider">{formatMonthYear(plan.target_date)}</span>
        </div>

        {/* Member Avatars Stack */}
        {plan.members && plan.members.length > 0 && (
          <div className="flex items-center -space-x-2">
            {plan.members.slice(0, 3).map((m) => (
              <UserAvatar
                key={m.id}
                name={m.name}
                size="sm"
                className="shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              />
            ))}
            {plan.members.length > 3 && (
              <span className="w-6 h-6 rounded-full bg-[#E0FF62] text-black text-[10px] font-black flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                +{plan.members.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


