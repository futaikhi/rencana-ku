import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import {
  Plan,
  PlanDetailResponse,
  Task,
  Milestone,
  BudgetItem,
  PlanRole,
} from "./types";

import { Navbar } from "./components/layout/Navbar";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { LandingView } from "./components/landing/LandingView";
import { DashboardView } from "./components/dashboard/DashboardView";
import { PlanDetailView } from "./components/plan/PlanDetailView";

import { AuthModal } from "./components/auth/AuthModal";
import { ProfileModal } from "./components/auth/ProfileModal";
import { PlanModal } from "./components/plan/PlanModal";
import { TaskModal } from "./components/plan/TaskModal";
import { MilestoneModal } from "./components/plan/MilestoneModal";
import { BudgetItemModal } from "./components/plan/BudgetItemModal";
import { InviteModal } from "./components/plan/InviteModal";
import { InvitationsModal } from "./components/plan/InvitationsModal";
import { ConfirmModal } from "./components/common/ConfirmModal";
import { BrandLogo } from "./components/common/BrandLogo";
import { useToast } from "./context/ToastContext";
import { Loader2, AlertCircle } from "lucide-react";

export default function App() {
  const { user, token, loading: authLoading, pendingInvitations, refreshInvitations, respondInvitation } = useAuth();
  const { showSuccess, showInfo, showError } = useToast();

  // Navigation State
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Dashboard Data State
  const [myPlans, setMyPlans] = useState<Plan[]>([]);
  const [sharedPlans, setSharedPlans] = useState<Plan[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<Milestone[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);

  // Active Plan Detail State
  const [currentPlanDetail, setCurrentPlanDetail] = useState<PlanDetailResponse | null>(null);
  const [loadingPlanDetail, setLoadingPlanDetail] = useState<boolean>(false);

  // Modals Visibility
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskMilestoneId, setDefaultTaskMilestoneId] = useState<string | null>(null);

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [showBudgetItemModal, setShowBudgetItemModal] = useState(false);
  const [editingBudgetItem, setEditingBudgetItem] = useState<BudgetItem | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);

  // In-app Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "warning";
    icon?: "trash" | "logout" | "warning";
    loading?: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
  });

  // Error Banner State
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load Dashboard Data
  const loadDashboard = useCallback(async () => {
    if (!token) {
      setLoadingDashboard(false);
      return;
    }
    try {
      setLoadingDashboard(true);
      const [plansRes, activityRes] = await Promise.allSettled([
        api.getPlans(),
        api.getActivityFeed(),
      ]);

      if (plansRes.status === "fulfilled") {
        setMyPlans(plansRes.value.myPlans || []);
        setSharedPlans(plansRes.value.sharedPlans || []);
        setUpcomingTasks(plansRes.value.upcomingTasks || []);
        setUpcomingMilestones(plansRes.value.upcomingMilestones || []);
      }
      if (activityRes.status === "fulfilled") {
        setRecentActivities(activityRes.value.activities || []);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
      setGlobalError(err.message || "Failed to fetch dashboard data.");
    } finally {
      setLoadingDashboard(false);
    }
  }, [token]);

  // Load Plan Detail Data
  const loadPlanDetail = useCallback(
    async (planId: string) => {
      try {
        setLoadingPlanDetail(true);
        const data = await api.getPlanDetail(planId);
        setCurrentPlanDetail(data);
      } catch (err: any) {
        console.error("Failed to load plan detail:", err);
        setGlobalError(err.message || "Failed to load plan details.");
        setSelectedPlanId(null);
      } finally {
        setLoadingPlanDetail(false);
      }
    },
    []
  );

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token, loadDashboard]);

  useEffect(() => {
    if (selectedPlanId && token) {
      loadPlanDetail(selectedPlanId);
    } else {
      setCurrentPlanDetail(null);
    }
  }, [selectedPlanId, token, loadPlanDetail]);

  // --- Handlers for Plans ---
  const handleCreateOrUpdatePlan = async (data: {
    name: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    target_date?: string | "";
    budget_enabled?: boolean;
    budget_target?: number;
    initialMilestones?: string[];
    initialTasks?: string[];
  }) => {
    try {
      if (editingPlan) {
        await api.updatePlan(editingPlan.id, data);
        showSuccess(`Plan "${data.name}" has been updated.`, "Plan Updated");
        if (selectedPlanId === editingPlan.id) {
          await loadPlanDetail(editingPlan.id);
        }
      } else {
        const created = await api.createPlan(data);
        showSuccess(`Plan "${data.name}" created successfully!`, "Plan Created");
        setSelectedPlanId(created.plan.id);
      }
      await loadDashboard();
      setEditingPlan(null);
    } catch (err: any) {
      showError(err.message || "Failed to save plan.", "Plan Error");
    }
  };

  const handleDeletePlan = (planId?: string, planName?: string) => {
    const id = planId || currentPlanDetail?.plan.id;
    const name = planName || currentPlanDetail?.plan.name || "this plan";
    if (!id) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Plan",
      message: `Are you sure you want to permanently delete "${name}"? All associated milestones, tasks, budget entries, notes, and activity logs will be permanently deleted. This action cannot be undone.`,
      confirmLabel: "Delete Plan",
      variant: "danger",
      icon: "trash",
      action: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          await api.deletePlan(id);
          if (selectedPlanId === id) {
            setSelectedPlanId(null);
          }
          await loadDashboard();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
          showSuccess(`Plan "${name}" has been permanently deleted.`, "Plan Deleted");
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, loading: false, isOpen: false }));
          showError(err.message || "Failed to delete plan.", "Delete Failed");
        }
      },
    });
  };

  const handleLeavePlan = (planId?: string, planName?: string) => {
    const id = planId || currentPlanDetail?.plan.id;
    const name = planName || currentPlanDetail?.plan.name || "this plan";
    if (!id) return;

    setConfirmModal({
      isOpen: true,
      title: "Leave Collaborative Plan",
      message: `Are you sure you want to leave "${name}"? You will lose access to this workspace until reinvited.`,
      confirmLabel: "Leave Plan",
      variant: "warning",
      icon: "logout",
      action: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          await api.leavePlan(id);
          if (selectedPlanId === id) {
            setSelectedPlanId(null);
          }
          await loadDashboard();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
          showSuccess(`You have left "${name}".`, "Plan Left");
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, loading: false, isOpen: false }));
          showError(err.message || "Failed to leave plan.", "Leave Failed");
        }
      },
    });
  };

  // --- Handlers for Tasks ---
  const handleOpenTaskModal = (task?: Task | null, milestoneId?: string | null) => {
    setEditingTask(task || null);
    setDefaultTaskMilestoneId(milestoneId || null);
    setShowTaskModal(true);
  };

  const handleSubmitTask = async (taskData: Partial<Task>) => {
    if (!selectedPlanId) return;
    try {
      if (editingTask) {
        await api.updateTask(selectedPlanId, editingTask.id, taskData);
        showSuccess(`Task "${taskData.title || editingTask.title}" updated.`, "Task Updated");
      } else {
        await api.createTask(selectedPlanId, taskData);
        showSuccess(`Task "${taskData.title || "New Task"}" created successfully.`, "Task Created");
      }
      await loadPlanDetail(selectedPlanId);
      await loadDashboard();
      setEditingTask(null);
      setDefaultTaskMilestoneId(null);
    } catch (err: any) {
      showError(err.message || "Failed to save task.", "Task Error");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!selectedPlanId) return;
    try {
      const task = currentPlanDetail?.tasks.find((t) => t.id === taskId);
      const isNowCompleted = task?.status !== "COMPLETED";
      await api.toggleTask(selectedPlanId, taskId);
      await loadPlanDetail(selectedPlanId);
      await loadDashboard();
      if (task) {
        if (isNowCompleted) {
          showSuccess(`Completed: "${task.title}"!`, "Task Completed");
        } else {
          showInfo(`Reopened: "${task.title}".`, "Task In Progress");
        }
      }
    } catch (err: any) {
      showError(err.message || "Failed to update task status.", "Task Error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedPlanId) return;
    const task = currentPlanDetail?.tasks.find((t) => t.id === taskId);
    const taskTitle = task?.title || "this action item";

    setConfirmModal({
      isOpen: true,
      title: "Delete Action Item",
      message: `Are you sure you want to delete "${taskTitle}"?`,
      confirmLabel: "Delete Task",
      variant: "danger",
      icon: "trash",
      action: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          await api.deleteTask(selectedPlanId, taskId);
          await loadPlanDetail(selectedPlanId);
          await loadDashboard();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
          showSuccess(`Action item "${taskTitle}" was deleted.`, "Task Deleted");
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, loading: false, isOpen: false }));
          showError(err.message || "Failed to delete task.", "Delete Failed");
        }
      },
    });
  };

  // --- Handlers for Milestones ---
  const handleOpenMilestoneModal = (milestone?: Milestone | null) => {
    setEditingMilestone(milestone || null);
    setShowMilestoneModal(true);
  };

  const handleSubmitMilestone = async (milestoneData: Partial<Milestone>) => {
    if (!selectedPlanId) return;
    try {
      if (editingMilestone) {
        await api.updateMilestone(selectedPlanId, editingMilestone.id, milestoneData);
        showSuccess(`Milestone "${milestoneData.title || editingMilestone.title}" updated.`, "Milestone Updated");
      } else {
        await api.createMilestone(selectedPlanId, milestoneData);
        showSuccess(`Milestone "${milestoneData.title || "New Milestone"}" created!`, "Milestone Created");
      }
      await loadPlanDetail(selectedPlanId);
      await loadDashboard();
      setEditingMilestone(null);
    } catch (err: any) {
      showError(err.message || "Failed to save milestone.", "Milestone Error");
    }
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    if (!selectedPlanId) return;
    try {
      const ms = currentPlanDetail?.milestones.find((m) => m.id === milestoneId);
      const isNowCompleted = ms?.status !== "COMPLETED";
      await api.toggleMilestone(selectedPlanId, milestoneId);
      await loadPlanDetail(selectedPlanId);
      await loadDashboard();
      if (ms) {
        if (isNowCompleted) {
          showSuccess(`Milestone "${ms.title}" achieved!`, "Milestone Completed");
        } else {
          showInfo(`Milestone "${ms.title}" reopened.`, "Milestone In Progress");
        }
      }
    } catch (err: any) {
      showError(err.message || "Failed to update milestone status.", "Milestone Error");
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!selectedPlanId) return;
    const ms = currentPlanDetail?.milestones.find((m) => m.id === milestoneId);
    const msTitle = ms?.title || "this milestone";

    setConfirmModal({
      isOpen: true,
      title: "Delete Milestone",
      message: `Are you sure you want to delete milestone "${msTitle}"? Tasks linked to this milestone will remain but become unassigned from this checkpoint.`,
      confirmLabel: "Delete Milestone",
      variant: "danger",
      icon: "trash",
      action: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          await api.deleteMilestone(selectedPlanId, milestoneId);
          await loadPlanDetail(selectedPlanId);
          await loadDashboard();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
          showSuccess(`Milestone "${msTitle}" was deleted.`, "Milestone Deleted");
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, loading: false, isOpen: false }));
          showError(err.message || "Failed to delete milestone.", "Delete Failed");
        }
      },
    });
  };

  // --- Handlers for Budget Items ---
  const handleOpenBudgetItemModal = (item?: BudgetItem | null) => {
    setEditingBudgetItem(item || null);
    setShowBudgetItemModal(true);
  };

  const handleSubmitBudgetItem = async (itemData: Partial<BudgetItem>) => {
    if (!selectedPlanId) return;
    try {
      if (editingBudgetItem) {
        await api.updateBudgetItem(selectedPlanId, editingBudgetItem.id, itemData);
        showSuccess(`Budget entry "${itemData.name || editingBudgetItem.name}" updated.`, "Budget Updated");
      } else {
        await api.createBudgetItem(selectedPlanId, itemData);
        showSuccess(`Budget entry "${itemData.name || "New Item"}" added.`, "Budget Added");
      }
      await loadPlanDetail(selectedPlanId);
      await loadDashboard();
      setEditingBudgetItem(null);
    } catch (err: any) {
      showError(err.message || "Failed to save budget item.", "Budget Error");
    }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    if (!selectedPlanId) return;
    const item = currentPlanDetail?.budgetItems.find((b) => b.id === itemId);
    const itemName = item?.name || "this budget item";

    setConfirmModal({
      isOpen: true,
      title: "Delete Budget Entry",
      message: `Are you sure you want to delete "${itemName}" from the budget tracker?`,
      confirmLabel: "Delete Entry",
      variant: "danger",
      icon: "trash",
      action: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          await api.deleteBudgetItem(selectedPlanId, itemId);
          await loadPlanDetail(selectedPlanId);
          await loadDashboard();
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
          showSuccess(`Budget entry "${itemName}" was deleted.`, "Budget Item Deleted");
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, loading: false, isOpen: false }));
          showError(err.message || "Failed to delete budget item.", "Delete Failed");
        }
      },
    });
  };

  // --- Notes Handler ---
  const handleSaveNotes = async (notes: string) => {
    if (!selectedPlanId) return;
    try {
      await api.updateNotes(selectedPlanId, notes);
      await loadPlanDetail(selectedPlanId);
      showSuccess("Workspace notes saved successfully.", "Notes Saved");
    } catch (err: any) {
      showError(err.message || "Failed to save notes.", "Notes Error");
    }
  };

  // --- Member & Invitation Handlers ---
  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    if (!selectedPlanId) return;
    try {
      await api.updateMemberRole(selectedPlanId, memberId, role);
      await loadPlanDetail(selectedPlanId);
      showSuccess(`Collaborator permissions updated to ${role}.`, "Role Updated");
    } catch (err: any) {
      showError(err.message || "Failed to update member role.", "Role Error");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedPlanId) return;
    const member = currentPlanDetail?.members.find((m) => m.id === memberId);
    const memberName = member?.name || "this collaborator";

    setConfirmModal({
      isOpen: true,
      title: "Remove Collaborator",
      message: `Are you sure you want to remove ${memberName} from this plan?`,
      confirmLabel: "Remove Collaborator",
      variant: "danger",
      icon: "trash",
      action: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          await api.removeMember(selectedPlanId, memberId);
          await loadPlanDetail(selectedPlanId);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
          showSuccess(`${memberName} removed from this plan.`, "Member Removed");
        } catch (err: any) {
          setConfirmModal((prev) => ({ ...prev, loading: false, isOpen: false }));
          showError(err.message || "Failed to remove collaborator.", "Removal Failed");
        }
      },
    });
  };

  const handleCancelInvitation = async (inviteId: string) => {
    if (!selectedPlanId) return;
    try {
      await api.cancelInvitation(inviteId);
      await loadPlanDetail(selectedPlanId);
      showSuccess("Invitation has been revoked.", "Invitation Canceled");
    } catch (err: any) {
      showError(err.message || "Failed to cancel invitation.", "Cancel Error");
    }
  };

  const handleRespondInvite = async (inviteId: string, action: "ACCEPT" | "DECLINE") => {
    const invite = pendingInvitations.find((i) => i.id === inviteId);
    const planName = invite?.plan_name || "the plan";

    try {
      await respondInvitation(inviteId, action);
      if (action === "ACCEPT") {
        showSuccess(`Joined "${planName}"! You can now collaborate in the workspace.`, "Invitation Accepted");
      } else {
        showInfo(`Declined invitation to "${planName}".`, "Invitation Declined");
      }
      await loadDashboard();
    } catch (err: any) {
      showError(err.message || "Failed to respond to invitation.", "Invitation Error");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="animate-pulse">
          <BrandLogo size="lg" showTagline tagline="Bento Planning OS" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-black/60 pt-2">
          <Loader2 size={16} className="animate-spin text-black stroke-[2.5]" />
          <span>Loading RencanaKu...</span>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the Mobile-first PWA Landing View directly!
  if (!user || !token) {
    return (
      <>
        <LandingView onOpenAuthModal={() => setShowAuthModal(true)} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-black flex flex-col font-sans selection:bg-[#E0FF62] selection:text-black pb-20 md:pb-0 w-full max-w-full overflow-x-hidden">
      {/* Top Main Navbar */}
      <Navbar
        onNewPlan={() => {
          setEditingPlan(null);
          setShowPlanModal(true);
        }}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onGoHome={() => setSelectedPlanId(null)}
        onOpenInvitations={() => setShowInvitationsModal(true)}
      />

      {/* Global Error Alert Banner if any */}
      {globalError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="p-3 bg-[#FFE4E6] border-2 border-black rounded-2xl flex items-center justify-between text-[#E11D48] text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="stroke-[2.5]" />
              <span>{globalError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGlobalError(null)}
              className="text-xs font-black uppercase tracking-wider underline hover:text-black"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16 w-full max-w-full overflow-x-hidden">
        {selectedPlanId ? (
          loadingPlanDetail || !currentPlanDetail ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3 text-black">
              <Loader2 size={36} className="animate-spin text-black stroke-[2.5]" />
              <p className="text-xs font-black uppercase tracking-wider">Loading plan workspace...</p>
            </div>
          ) : (
            <PlanDetailView
              plan={currentPlanDetail.plan}
              access={currentPlanDetail.access}
              tasks={currentPlanDetail.tasks}
              milestones={currentPlanDetail.milestones}
              budgetItems={currentPlanDetail.budgetItems}
              members={currentPlanDetail.members}
              invitations={currentPlanDetail.invitations}
              activities={currentPlanDetail.activities}
              onBack={() => setSelectedPlanId(null)}
              onEditPlan={() => {
                setEditingPlan(currentPlanDetail.plan);
                setShowPlanModal(true);
              }}
              onDeletePlan={handleDeletePlan}
              onLeavePlan={handleLeavePlan}
              onOpenTaskModal={handleOpenTaskModal}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onOpenMilestoneModal={handleOpenMilestoneModal}
              onToggleMilestone={handleToggleMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onOpenBudgetItemModal={handleOpenBudgetItemModal}
              onDeleteBudgetItem={handleDeleteBudgetItem}
              onSaveNotes={handleSaveNotes}
              onOpenInviteModal={() => setShowInviteModal(true)}
              onUpdateMemberRole={handleUpdateMemberRole}
              onRemoveMember={handleRemoveMember}
              onCancelInvitation={handleCancelInvitation}
            />
          )
        ) : loadingDashboard ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-black">
            <Loader2 size={36} className="animate-spin text-black stroke-[2.5]" />
            <p className="text-xs font-black uppercase tracking-wider">Loading your collaborative plans...</p>
          </div>
        ) : (
          <DashboardView
            myPlans={myPlans}
            sharedPlans={sharedPlans}
            pendingInvitations={pendingInvitations}
            upcomingTasks={upcomingTasks}
            upcomingMilestones={upcomingMilestones}
            recentActivities={recentActivities}
            onSelectPlan={(id) => setSelectedPlanId(id)}
            onNewPlan={() => {
              setEditingPlan(null);
              setShowPlanModal(true);
            }}
            onEditPlan={(plan) => {
              setEditingPlan(plan);
              setShowPlanModal(true);
            }}
            onDeletePlan={(planId, planName) => handleDeletePlan(planId, planName)}
            onLeavePlan={(planId, planName) => handleLeavePlan(planId, planName)}
            onRespondInvite={handleRespondInvite}
          />
        )}
      </main>

      {/* Mobile Phone Priority Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={selectedPlanId ? "plan" : "dashboard"}
        onGoHome={() => setSelectedPlanId(null)}
        onNewPlan={() => {
          setEditingPlan(null);
          setShowPlanModal(true);
        }}
        onOpenInvitations={() => setShowInvitationsModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* --- Modals --- */}
      {/* 0. Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        icon={confirmModal.icon}
        loading={confirmModal.loading}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.action}
      />

      {/* 1. Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* 2. Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 3. Invitations Modal */}
      <InvitationsModal
        isOpen={showInvitationsModal}
        onClose={() => setShowInvitationsModal(false)}
        invitations={pendingInvitations}
        onRespond={handleRespondInvite}
      />

      {/* 4. Plan Modal */}
      <PlanModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setEditingPlan(null);
        }}
        onSubmit={handleCreateOrUpdatePlan}
        editingPlan={editingPlan}
      />

      {/* 5. Task Modal */}
      {currentPlanDetail && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
            setDefaultTaskMilestoneId(null);
          }}
          onSubmit={handleSubmitTask}
          editingTask={editingTask}
          milestones={currentPlanDetail.milestones}
          members={currentPlanDetail.members}
          defaultMilestoneId={defaultTaskMilestoneId}
        />
      )}

      {/* 6. Milestone Modal */}
      {currentPlanDetail && (
        <MilestoneModal
          isOpen={showMilestoneModal}
          onClose={() => {
            setShowMilestoneModal(false);
            setEditingMilestone(null);
          }}
          onSubmit={handleSubmitMilestone}
          editingMilestone={editingMilestone}
        />
      )}

      {/* 7. Budget Item Modal */}
      {currentPlanDetail && (
        <BudgetItemModal
          isOpen={showBudgetItemModal}
          onClose={() => {
            setShowBudgetItemModal(false);
            setEditingBudgetItem(null);
          }}
          onSubmit={handleSubmitBudgetItem}
          editingItem={editingBudgetItem}
        />
      )}

      {/* 8. Invite Modal */}
      {currentPlanDetail && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          planId={currentPlanDetail.plan.id}
          planName={currentPlanDetail.plan.name}
          onInviteSent={async () => {
            await loadPlanDetail(currentPlanDetail.plan.id);
            await refreshInvitations();
          }}
        />
      )}
    </div>
  );
}
