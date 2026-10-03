import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Crown,
  ExternalLink,
  FileCheck,
  FileText,
  FolderGit2,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  deleteLmsAnnouncement,
  deleteLmsTask,
  deleteRoadmap,
  fetchClubMembers,
  fetchLmsAnnouncements,
  fetchLmsEventProposals,
  fetchLmsTasks,
  fetchOrganizerDashboard,
  fetchRoadmaps,
  reviewTaskSubmission,
  saveCmsEvent,
  saveLmsAnnouncement,
  saveLmsTask,
  saveRoadmap,
  type ClubMember,
  type LmsAnnouncement,
  type LmsEventProposal,
  type LmsRoadmap,
  type LmsTask,
  type LmsTaskSubmission,
  type OrganizerDashboardData,
} from "@/lib/api";
import { getClubTheme } from "@/lib/clubTheme";

export type LeadTab = "overview" | "tasks" | "roadmap" | "members" | "events" | "announcements";

export interface StoredUser {
  id?: number;
  name?: string;
  email?: string;
  rollNumber?: string;
  roll_number?: string;
  role?: string;
  club?: string;
  year?: string;
  year_of_study?: string;
  managed_club?: string;
  managed_wing?: string;
}

interface LeadLmsProps {
  user: StoredUser | null;
  managedClub?: string | undefined;
  managedWing?: string | undefined;
  onLogout?: (() => void) | undefined;
}

export function LeadLms({ user, managedClub, managedWing, onLogout }: LeadLmsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LeadTab>("overview");
  const [taskTab, setTaskTab] = useState<"submissions" | "tasks">("submissions");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrganizerDashboardData | null>(null);

  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<string>("pending");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  // Batch grading state
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<number[]>([]);
  const [isBatchGradingModalOpen, setIsBatchGradingModalOpen] = useState(false);
  const [batchScore, setBatchScore] = useState<number>(100);
  const [batchFeedback, setBatchFeedback] = useState<string>("Approved and verified by Track Lead.");
  const [batchStatus, setBatchStatus] = useState<"approved" | "rejected" | "changes_requested">("approved");
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Roadmap CRUD state for Track Lead
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [expandedRoadmapPhases, setExpandedRoadmapPhases] = useState<Record<number, boolean>>({ 0: true });
  const [editingRoadmap, setEditingRoadmap] = useState<{
    id?: number;
    title: string;
    sub_club_slug: string;
    description: string;
    is_active: number;
    phases: Array<{
      id?: number;
      title: string;
      description: string;
      phase_order: number;
      modules: Array<{
        id?: number;
        title: string;
        description: string;
        estimated_hours: number;
        lessons: Array<{
          id?: number;
          title: string;
          content: string;
          resource_url: string;
        }>;
      }>;
    }>;
  }>({
    title: "",
    sub_club_slug: "web-dev",
    description: "",
    is_active: 1,
    phases: [],
  });
  const [isSavingRoadmap, setIsSavingRoadmap] = useState(false);

  const [events, setEvents] = useState<LmsEventProposal[]>([]);
  const [isProposeEventModalOpen, setIsProposeEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    dates: "",
    time: "10:00 AM - 01:00 PM",
    mode: "offline",
    location: "Lab 3 / SAC Seminar Hall",
    price: "Free",
    about: "",
    highlights: "",
  });

  const clubSlug = managedClub || user?.managed_club || user?.club || "developers-club";
  const wingName = managedWing || user?.managed_wing || "Core Track";
  const clubTheme = useMemo(() => getClubTheme(clubSlug), [clubSlug]);
  const clubDisplayName = clubTheme.name;

  const leadName = user?.name || "Club Lead";
  const leadRoll = user?.rollNumber || user?.roll_number || "";

  // Load Lead Dashboard Data
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [d, membersList, roadmapsList, tasksList, annList, eventsList] = await Promise.all([
        fetchOrganizerDashboard(clubSlug),
        fetchClubMembers({ club: clubSlug }),
        fetchRoadmaps({ club_slug: clubSlug, all: 1 }),
        fetchLmsTasks({ club_slug: clubSlug }),
        fetchLmsAnnouncements(clubSlug),
        fetchLmsEventProposals(),
      ]);

      const allMembers = membersList || d?.members || [];
      const allRoadmaps = roadmapsList || d?.roadmaps || [];
      const allTasks = tasksList || d?.tasks || [];
      const allSubmissions = d?.submissions || [];
      const allAnnouncements = annList || d?.announcements || [];
      setEvents(eventsList || []);

      const pendingCount = allSubmissions.filter(
        (s) => s.status === "submitted" || s.status === "pending" || s.status === "under_review"
      ).length;
      const approvedCount = allSubmissions.filter((s) => s.status === "approved").length;

      setData({
        ...d,
        members: allMembers,
        roadmaps: allRoadmaps,
        tasks: allTasks,
        submissions: allSubmissions,
        announcements: allAnnouncements,
        stats: {
          ...d?.stats,
          totalMembers: allMembers.length,
          activeMembers: allMembers.filter((m) => m.status === "active").length,
          pendingMembers: allMembers.filter((m) => m.status === "pending").length,
          suspendedMembers: allMembers.filter((m) => m.status === "suspended").length,
          totalWings: d?.wings?.length || 1,
          totalRoadmaps: allRoadmaps.length,
          totalTasks: allTasks.length,
          totalSubmissions: allSubmissions.length,
          pendingSubmissions: pendingCount,
          approvedSubmissions: approvedCount,
          rejectedSubmissions: allSubmissions.filter((s) => s.status === "rejected").length,
          totalAnnouncements: allAnnouncements.length,
        },
      });
    } catch (e) {
      console.warn("Failed to load Lead LMS:", e);
      toast.error("Failed to load track data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [clubSlug]);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("sac_user");
      toast.info("Logged out of LMS portal");
      navigate({ to: "/login" });
    }
  };

  const stats = data?.stats || {
    totalMembers: 0, activeMembers: 0, pendingMembers: 0, suspendedMembers: 0,
    totalWings: 0, totalRoadmaps: 0, totalTasks: 0, totalSubmissions: 0,
    pendingSubmissions: 0, approvedSubmissions: 0, rejectedSubmissions: 0,
    totalAnnouncements: 0,
  };

  // Submissions filtered
  const filteredSubmissions = useMemo(() => {
    if (!data?.submissions) return [];
    return data.submissions.filter((s) => {
      let matchesStatus = true;
      if (submissionStatusFilter === "pending") {
        matchesStatus = s.status === "submitted" || s.status === "pending" || s.status === "under_review";
      } else if (submissionStatusFilter === "approved") {
        matchesStatus = s.status === "approved";
      } else if (submissionStatusFilter === "changes_requested") {
        matchesStatus = s.status === "changes_requested";
      } else if (submissionStatusFilter === "rejected") {
        matchesStatus = s.status === "rejected";
      }

      let matchesSearch = true;
      if (submissionSearch.trim()) {
        const q = submissionSearch.toLowerCase().trim();
        const sName = (s.student_name || "").toLowerCase();
        const sRoll = (s.student_roll || "").toLowerCase();
        const tTitle = (s.task_title || "").toLowerCase();
        matchesSearch = sName.includes(q) || sRoll.includes(q) || tTitle.includes(q);
      }

      return matchesStatus && matchesSearch;
    });
  }, [data?.submissions, submissionStatusFilter, submissionSearch]);

  // Track members
  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    return data.members.filter((m) => {
      if (!memberSearch) return true;
      const q = memberSearch.toLowerCase().trim();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.roll_number?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    });
  }, [data?.members, memberSearch]);

  // -------------------------------------------------------------
  // REVIEW & MARKS ALLOTMENT
  // -------------------------------------------------------------
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<LmsTaskSubmission | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected" | "changes_requested" | "under_review">("approved");
  const [reviewScore, setReviewScore] = useState<number>(100);
  const [reviewFeedback, setReviewFeedback] = useState<string>("");

  const handleOpenReviewModal = (sub: LmsTaskSubmission) => {
    setReviewingSubmission(sub);
    const validStatus: "approved" | "rejected" | "changes_requested" | "under_review" =
      sub.status === "rejected" || sub.status === "changes_requested" || sub.status === "under_review"
        ? sub.status
        : "approved";
    setReviewStatus(validStatus);
    const maxScore = sub.max_score || 100;
    setReviewScore(sub.score !== null && sub.score !== undefined ? sub.score : maxScore);
    setReviewFeedback(sub.feedback || "");
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updated = (prev.submissions || []).map((s) =>
        s.id === reviewingSubmission.id
          ? {
              ...s,
              status: reviewStatus,
              score: reviewScore,
              feedback: reviewFeedback,
              reviewer_name: leadName,
              reviewed_at: new Date().toISOString(),
            }
          : s
      );
      const pend = updated.filter((s) => s.status === "submitted" || s.status === "pending" || s.status === "under_review").length;
      const app = updated.filter((s) => s.status === "approved").length;
      const rej = updated.filter((s) => s.status === "rejected").length;
      return {
        ...prev,
        submissions: updated,
        stats: {
          ...prev.stats,
          pendingSubmissions: pend,
          approvedSubmissions: app,
          rejectedSubmissions: rej,
        },
      };
    });

    try {
      const res = await reviewTaskSubmission({
        id: reviewingSubmission.id,
        status: reviewStatus,
        score: reviewScore,
        feedback: reviewFeedback,
        reviewer_name: leadName,
        reviewer_role: "Club Lead",
      });
      if (res.success) {
        toast.success(res.message || "Submission verified and marks allotted!");
        setIsReviewModalOpen(false);
        await loadDashboard();
      } else {
        toast.error(res.message || "Failed to submit review");
        await loadDashboard();
      }
    } catch {
      toast.error("Failed to submit review");
      await loadDashboard();
    }
  };

  // -------------------------------------------------------------
  // BATCH / BULK MARKS ALLOTMENT HANDLERS
  // -------------------------------------------------------------
  const handleToggleSelectAll = () => {
    if (selectedSubmissionIds.length === filteredSubmissions.length && filteredSubmissions.length > 0) {
      setSelectedSubmissionIds([]);
    } else {
      setSelectedSubmissionIds(filteredSubmissions.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedSubmissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenBatchModal = () => {
    if (selectedSubmissionIds.length === 0) {
      toast.error("Please select at least one submission to evaluate.");
      return;
    }
    setBatchScore(100);
    setBatchStatus("approved");
    setBatchFeedback("Approved and verified by Track Lead.");
    setIsBatchGradingModalOpen(true);
  };

  const handleSaveBatchReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubmissionIds.length === 0) return;
    setIsBatchSaving(true);
    try {
      const selectedIds = [...selectedSubmissionIds];

      // Optimistic UI update
      setData((prev) => {
        if (!prev) return prev;
        const updated = (prev.submissions || []).map((s) =>
          selectedIds.includes(s.id)
            ? {
                ...s,
                status: batchStatus,
                score: batchScore,
                feedback: batchFeedback,
                reviewer_name: leadName,
                reviewed_at: new Date().toISOString(),
              }
            : s
        );
        const pend = updated.filter((s) => s.status === "submitted" || s.status === "pending" || s.status === "under_review").length;
        const app = updated.filter((s) => s.status === "approved").length;
        const rej = updated.filter((s) => s.status === "rejected").length;
        return {
          ...prev,
          submissions: updated,
          stats: {
            ...prev.stats,
            pendingSubmissions: pend,
            approvedSubmissions: app,
            rejectedSubmissions: rej,
          },
        };
      });

      // Execute review API calls for all selected submissions
      await Promise.all(
        selectedIds.map((id) =>
          reviewTaskSubmission({
            id,
            status: batchStatus,
            score: batchScore,
            feedback: batchFeedback,
            reviewer_name: leadName,
            reviewer_role: "Club Lead",
          })
        )
      );

      toast.success(`Successfully allotted ${batchScore} marks to ${selectedIds.length} students!`);
      setSelectedSubmissionIds([]);
      setIsBatchGradingModalOpen(false);
      await loadDashboard();
    } catch {
      toast.error("Failed to allot marks to some submissions");
      await loadDashboard();
    } finally {
      setIsBatchSaving(false);
    }
  };

  // -------------------------------------------------------------
  // TASKS CRUD
  // -------------------------------------------------------------
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<LmsTask> | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    sub_club_slug: wingName ? wingName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "web-dev",
    description: "",
    instructions: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    max_score: 100,
  });

  const handleOpenTaskModal = (task?: LmsTask) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title || "",
        sub_club_slug: task.sub_club_slug || wingName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: task.description || "",
        instructions: task.instructions || "",
        due_date: task.due_date ? task.due_date.slice(0, 10) : "",
        priority: (task.priority as any) || "medium",
        max_score: task.max_score || 100,
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: "",
        sub_club_slug: wingName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: "",
        instructions: "",
        due_date: "",
        priority: "medium",
        max_score: 100,
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    try {
      const res = await saveLmsTask({
        ...(editingTask?.id ? { id: editingTask.id } : {}),
        club_slug: clubSlug,
        created_by: leadName,
        ...taskForm,
      });
      if (res.success) {
        toast.success(res.message);
        setIsTaskModalOpen(false);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to save task");
    }
  };

  const handleDeleteTask = async (id: number, title: string) => {
    if (!confirm(`Delete task "${title}"?`)) return;
    try {
      const res = await deleteLmsTask(id);
      if (res.success) {
        toast.success(res.message);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete task");
    }
  };

  // -------------------------------------------------------------
  // ROADMAP CRUD HANDLERS
  // -------------------------------------------------------------
  const handleOpenRoadmapModal = (rm?: any) => {
    const defaultSlug = wingName ? wingName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "web-dev";
    if (rm) {
      setEditingRoadmap({
        id: rm.id,
        title: rm.title || "",
        sub_club_slug: rm.sub_club_slug || defaultSlug,
        description: rm.description || "",
        is_active: rm.is_active !== undefined ? Number(rm.is_active) : 1,
        phases: (rm.phases || []).map((p: any, pIdx: number) => ({
          id: p.id,
          title: p.title || `Phase ${pIdx + 1}`,
          description: p.description || "",
          phase_order: p.phase_order !== undefined ? Number(p.phase_order) : pIdx + 1,
          modules: (p.modules || []).map((m: any, mIdx: number) => ({
            id: m.id,
            title: m.title || `Module ${pIdx + 1}.${mIdx + 1}`,
            description: m.description || "",
            estimated_hours: Number(m.estimated_hours) || 6,
            lessons: (m.lessons || []).map((l: any) => ({
              id: l.id,
              title: l.title || "",
              content: l.content || "",
              resource_url: l.resource_url || "",
            })),
          })),
        })),
      });
    } else {
      setEditingRoadmap({
        title: `${wingName} Mastery Roadmap`,
        sub_club_slug: defaultSlug,
        description: `Complete structured curriculum and hands-on milestones for ${wingName}.`,
        is_active: 1,
        phases: [
          {
            title: "Phase 1: Foundations & Core Concepts",
            description: "Essential primitives, setup, and fundamentals",
            phase_order: 1,
            modules: [
              {
                title: "Module 1.1: Core Architecture",
                description: "Hands-on fundamentals and project setup",
                estimated_hours: 6,
                lessons: [
                  {
                    title: "Lesson 1: Introduction & Tooling",
                    content: "Environment configuration, dependencies, and starter project",
                    resource_url: "",
                  },
                ],
              },
            ],
          },
        ],
      });
    }
    setIsRoadmapModalOpen(true);
  };

  const handleSaveRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoadmap.title.trim()) {
      toast.error("Roadmap title is required");
      return;
    }
    setIsSavingRoadmap(true);
    try {
      const res = await saveRoadmap({
        club_slug: clubSlug,
        sub_club_slug: editingRoadmap.sub_club_slug || wingName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: editingRoadmap.title.trim(),
        description: editingRoadmap.description.trim(),
        is_active: editingRoadmap.is_active,
        phases: editingRoadmap.phases,
        ...(editingRoadmap.id ? { id: editingRoadmap.id } : {}),
      });

      if (res.success) {
        toast.success(editingRoadmap.id ? "Roadmap updated successfully!" : "Roadmap created successfully!");
        setIsRoadmapModalOpen(false);
        await loadDashboard();
      } else {
        toast.error(res.message || "Failed to save roadmap");
      }
    } catch {
      toast.error("Failed to save roadmap");
    } finally {
      setIsSavingRoadmap(false);
    }
  };

  const handleDeleteRoadmap = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete roadmap "${title}"?`)) return;
    try {
      const res = await deleteRoadmap(id);
      if (res.success) {
        toast.success("Roadmap deleted successfully");
        await loadDashboard();
      } else {
        toast.error(res.message || "Failed to delete roadmap");
      }
    } catch {
      toast.error("Failed to delete roadmap");
    }
  };

  const handleAddPhase = () => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: [
        ...prev.phases,
        {
          title: `Phase ${prev.phases.length + 1}: `,
          description: "",
          phase_order: prev.phases.length + 1,
          modules: [
            {
              title: `Module ${prev.phases.length + 1}.1: `,
              description: "",
              estimated_hours: 6,
              lessons: [
                {
                  title: "Lesson 1: Introduction",
                  content: "",
                  resource_url: "",
                },
              ],
            },
          ],
        },
      ],
    }));
  };

  const handleRemovePhase = (pIdx: number) => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: prev.phases.filter((_, idx) => idx !== pIdx),
    }));
  };

  const handleUpdatePhase = (pIdx: number, field: string, val: any) => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: prev.phases.map((p, idx) => (idx === pIdx ? { ...p, [field]: val } : p)),
    }));
  };

  const handleAddModule = (pIdx: number) => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: prev.phases.map((p, idx) => {
        if (idx !== pIdx) return p;
        return {
          ...p,
          modules: [
            ...p.modules,
            {
              title: `Module ${pIdx + 1}.${p.modules.length + 1}: `,
              description: "",
              estimated_hours: 6,
              lessons: [
                {
                  title: `Lesson 1: Overview`,
                  content: "",
                  resource_url: "",
                },
              ],
            },
          ],
        };
      }),
    }));
  };

  const handleRemoveModule = (pIdx: number, mIdx: number) => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: prev.phases.map((p, idx) => {
        if (idx !== pIdx) return p;
        return {
          ...p,
          modules: p.modules.filter((_, midx) => midx !== mIdx),
        };
      }),
    }));
  };

  const handleUpdateModule = (pIdx: number, mIdx: number, field: string, val: any) => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: prev.phases.map((p, idx) => {
        if (idx !== pIdx) return p;
        return {
          ...p,
          modules: p.modules.map((m, midx) => (midx === mIdx ? { ...m, [field]: val } : m)),
        };
      }),
    }));
  };

  const handleAddLesson = (pIdx: number, mIdx: number) => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: prev.phases.map((p, idx) => {
        if (idx !== pIdx) return p;
        return {
          ...p,
          modules: p.modules.map((m, midx) => {
            if (midx !== mIdx) return m;
            return {
              ...m,
              lessons: [
                ...m.lessons,
                {
                  title: `Lesson ${m.lessons.length + 1}: `,
                  content: "",
                  resource_url: "",
                },
              ],
            };
          }),
        };
      }),
    }));
  };

  const handleRemoveLesson = (pIdx: number, mIdx: number, lIdx: number) => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: prev.phases.map((p, idx) => {
        if (idx !== pIdx) return p;
        return {
          ...p,
          modules: p.modules.map((m, midx) => {
            if (midx !== mIdx) return m;
            return {
              ...m,
              lessons: m.lessons.filter((_, lidx) => lidx !== lIdx),
            };
          }),
        };
      }),
    }));
  };

  const handleUpdateLesson = (pIdx: number, mIdx: number, lIdx: number, field: string, val: any) => {
    setEditingRoadmap((prev) => ({
      ...prev,
      phases: prev.phases.map((p, idx) => {
        if (idx !== pIdx) return p;
        return {
          ...p,
          modules: p.modules.map((m, midx) => {
            if (midx !== mIdx) return m;
            return {
              ...m,
              lessons: m.lessons.map((l, lidx) => (lidx === lIdx ? { ...l, [field]: val } : l)),
            };
          }),
        };
      }),
    }));
  };


  // -------------------------------------------------------------
  // ANNOUNCEMENTS
  // -------------------------------------------------------------
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", content: "", priority: "normal" as "normal" | "urgent" | "pinned" });

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.content.trim()) return;
    try {
      const res = await saveLmsAnnouncement({
        club_slug: clubSlug,
        sub_club_slug: wingName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: annForm.title.trim(),
        content: annForm.content.trim(),
        priority: annForm.priority,
        author_name: leadName,
        author_role: "Club Lead",
      });
      if (res.success) {
        toast.success(res.message);
        setIsAnnouncementModalOpen(false);
        setAnnForm({ title: "", content: "", priority: "normal" });
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to post notice");
    }
  };

  const handleDeleteAnnouncement = async (id: number, title: string) => {
    if (!confirm(`Delete notice "${title}"?`)) return;
    try {
      const res = await deleteLmsAnnouncement(id);
      if (res.success) {
        toast.success(res.message);
        await loadDashboard();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  // -------------------------------------------------------------
  // EVENTS & WORKSHOPS PIPELINE
  // -------------------------------------------------------------
  const handleProposeTrackEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      toast.error("Event title is required");
      return;
    }
    try {
      const slug = eventForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const res = await saveCmsEvent({
        title: eventForm.title.trim(),
        slug,
        dates: eventForm.dates || new Date().toISOString().slice(0, 10),
        time: eventForm.time,
        mode: eventForm.mode,
        price: eventForm.price,
        club: clubDisplayName,
        location: eventForm.location,
        organizer: `${leadName} (${wingName} Lead)`,
        about: eventForm.about,
        highlights: eventForm.highlights ? eventForm.highlights.split("\n").filter(Boolean) : [],
        status: "pending",
      });
      if (res.success) {
        toast.success("Event proposal submitted! Awaiting Faculty Mentor review.");
        setIsProposeEventModalOpen(false);
        setEventForm({
          title: "",
          dates: "",
          time: "10:00 AM - 01:00 PM",
          mode: "offline",
          location: "Lab 3 / SAC Seminar Hall",
          price: "Free",
          about: "",
          highlights: "",
        });
        await loadDashboard();
      } else {
        toast.error(res.message || "Failed to propose event");
      }
    } catch {
      toast.error("Failed to propose event");
    }
  };

  const navItems: { tab: LeadTab; label: string; icon: React.ReactNode; badge?: string | number | undefined }[] = [
    { tab: "overview", label: "Track Overview", icon: <LayoutDashboard className="size-4 shrink-0" /> },
    { tab: "tasks", label: "Verify & Allot Marks", icon: <FileCheck className="size-4 shrink-0" />, badge: stats.pendingSubmissions > 0 ? stats.pendingSubmissions : undefined },
    { tab: "roadmap", label: "Track Curriculum", icon: <Compass className="size-4 shrink-0" />, badge: stats.totalRoadmaps },
    { tab: "members", label: "Track Students", icon: <Users className="size-4 shrink-0" />, badge: stats.totalMembers },
    { tab: "events", label: "Workshops & Events", icon: <Calendar className="size-4 shrink-0" />, badge: events.length > 0 ? events.length : undefined },
    { tab: "announcements", label: "Track Broadcasts", icon: <Megaphone className="size-4 shrink-0" />, badge: stats.totalAnnouncements },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card/95 backdrop-blur-md transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 px-5">
          <Link to="/" className="flex items-center gap-3">
            <div className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${clubTheme.gradient} text-white shadow-soft`}>
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-black tracking-tight text-brand-deep">
                AITAM SAC
              </span>
              <span className={`block text-[10px] font-semibold uppercase tracking-wider ${clubTheme.text}`}>
                Club Lead LMS
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Lead Profile */}
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className={`grid size-8 place-items-center rounded-full bg-gradient-to-br ${clubTheme.gradient} text-white font-bold text-xs shadow-sm`}>
              {leadName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{leadName}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                {leadRoll ? `${leadRoll} • ` : ""}Track Lead
              </p>
            </div>
          </div>

          <div className="mt-2.5 rounded-xl border border-border bg-muted/40 p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Assigned Wing:</span>
              <span className={`font-bold ${clubTheme.text}`}>{wingName}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{clubDisplayName}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto p-3 text-xs font-medium">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Track Management
          </div>
          {navItems.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => {
                setActiveTab(item.tab);
                setIsMobileNavOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                activeTab === item.tab
                  ? clubTheme.activeNav
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === item.tab ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-border/80 p-3 space-y-1">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-card/90 backdrop-blur-md px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-foreground">
                  {navItems.find((n) => n.tab === activeTab)?.label || "Track Overview"}
                </h1>
                <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Lead LMS
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                {clubDisplayName} • {wingName} Lead
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${clubTheme.badge}`}>
              <ShieldCheck className="size-3" /> {leadName}
            </span>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 text-xs"
              title="Sign Out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className={`size-8 animate-spin ${clubTheme.text}`} />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading Lead LMS...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Lead Banner */}
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${clubTheme.bannerGradient} p-6 text-white shadow-lg`}>
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-2">
                          <ShieldCheck className="size-3" /> Track Lead • {wingName}
                        </div>
                        <h2 className="text-2xl font-black">Welcome, Lead {leadName}!</h2>
                        <p className="mt-1 text-sm text-white/80 max-w-lg">
                          Guide students in {wingName}, verify coding deliverables, and allot marks to keep students progressing.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("tasks");
                          setTaskTab("submissions");
                        }}
                        className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-zinc-900 shadow-soft hover:brightness-105 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        Verify Submissions & Allot Marks &rarr;
                      </button>
                    </div>
                  </div>

                  {/* 4 Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Track Students</span>
                      <p className="text-2xl font-black text-blue-950 mt-1">{stats.totalMembers}</p>
                      <p className="text-[11px] text-blue-700/80">{stats.activeMembers} active students</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Needs Verification</span>
                      <p className="text-2xl font-black text-amber-950 mt-1">{stats.pendingSubmissions}</p>
                      <p className="text-[11px] text-amber-700/80">Awaiting your evaluation</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Graded & Approved</span>
                      <p className="text-2xl font-black text-emerald-950 mt-1">{stats.approvedSubmissions}</p>
                      <p className="text-[11px] text-emerald-700/80">Marks allotted</p>
                    </div>
                    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Assignments</span>
                      <p className="text-2xl font-black text-purple-950 mt-1">{stats.totalTasks}</p>
                      <p className="text-[11px] text-purple-700/80">Track challenges active</p>
                    </div>
                  </div>

                  {/* Submissions Requiring Attention */}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600" /> Deliverables Needing Marks Allotment
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("tasks");
                          setTaskTab("submissions");
                        }}
                        className={`text-xs font-bold hover:underline ${clubTheme.text}`}
                      >
                        Open Verification Queue &rarr;
                      </button>
                    </div>

                    {data?.submissions && data.submissions.filter((s) => s.status === "submitted" || s.status === "pending").length > 0 ? (
                      <div className="space-y-2">
                        {data.submissions
                          .filter((s) => s.status === "submitted" || s.status === "pending")
                          .slice(0, 4)
                          .map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-section">
                              <div>
                                <span className="text-xs font-bold text-foreground">{s.student_name} ({s.student_roll})</span>
                                <p className="text-[11px] text-muted-foreground">{s.task_title}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenReviewModal(s)}
                                className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white shadow-2xs hover:brightness-110"
                              >
                                <Check className="size-3.5" /> Allot Marks
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">No pending submissions right now.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS & SUBMISSIONS VERIFICATION */}
              {activeTab === "tasks" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Track Verification & Assignments</h2>
                      <p className="text-xs text-muted-foreground">Inspect deliverables, allot marks, and manage challenges</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenTaskModal()}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid}`}
                    >
                      <Plus className="size-4" /> Create Track Assignment
                    </button>
                  </div>

                  {/* Toggle subtabs */}
                  <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-2xl w-fit border border-border">
                    <button
                      type="button"
                      onClick={() => setTaskTab("submissions")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        taskTab === "submissions" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>Verify Submissions & Allot Marks ({data?.submissions?.length || 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskTab("tasks")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        taskTab === "tasks" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText className="size-3.5 text-brand" />
                      <span>Assignments List ({data?.tasks?.length || 0})</span>
                    </button>
                  </div>

                  {taskTab === "submissions" && (
                    <div className="space-y-3">
                      {/* Search & Status Filters */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto">
                          {["all", "pending", "approved", "changes_requested", "rejected"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setSubmissionStatusFilter(st)}
                              className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-all ${
                                submissionStatusFilter === st
                                  ? `${clubTheme.badgeSolid} text-white shadow-2xs`
                                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {st.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={submissionSearch}
                          onChange={(e) => setSubmissionSearch(e.target.value)}
                          placeholder="Search student or roll..."
                          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none shadow-2xs w-full sm:w-56"
                        />
                      </div>

                      {/* Bulk Selection & Marks Toolbar */}
                      {filteredSubmissions.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-3.5 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleToggleSelectAll}
                              className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-brand transition-colors cursor-pointer select-none"
                            >
                              {selectedSubmissionIds.length === filteredSubmissions.length && filteredSubmissions.length > 0 ? (
                                <CheckSquare className="size-4 text-brand" />
                              ) : (
                                <Square className="size-4 text-muted-foreground" />
                              )}
                              <span>
                                {selectedSubmissionIds.length === filteredSubmissions.length && filteredSubmissions.length > 0
                                  ? "Deselect All"
                                  : `Select All (${filteredSubmissions.length})`}
                              </span>
                            </button>

                            {selectedSubmissionIds.length > 0 && (
                              <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-extrabold">
                                {selectedSubmissionIds.length} Selected
                              </span>
                            )}
                          </div>

                          {selectedSubmissionIds.length > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={handleOpenBatchModal}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:opacity-95 transition-opacity cursor-pointer`}
                              >
                                <Sparkles className="size-3.5" />
                                Allot Marks to All Selected ({selectedSubmissionIds.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedSubmissionIds([])}
                                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-card transition-colors cursor-pointer"
                              >
                                Clear Selection
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">
                              Tip: Click the checkboxes to select multiple submissions and allot marks simultaneously.
                            </span>
                          )}
                        </div>
                      )}

                      {filteredSubmissions.length > 0 ? (
                        <div className="space-y-3">
                          {filteredSubmissions.map((s) => {
                            const isSelected = selectedSubmissionIds.includes(s.id);
                            return (
                              <div
                                key={s.id}
                                className={`rounded-2xl border p-5 shadow-card transition-all ${
                                  isSelected
                                    ? "border-brand ring-2 ring-brand/20 bg-brand/[0.02]"
                                    : "border-border bg-card hover:border-brand/40"
                                }`}
                              >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    {/* Selection Checkbox */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSelectOne(s.id)}
                                      className="mt-0.5 text-muted-foreground hover:text-brand transition-colors cursor-pointer shrink-0"
                                      title={isSelected ? "Deselect submission" : "Select for batch evaluation"}
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="size-5 text-brand" />
                                      ) : (
                                        <Square className="size-5 text-muted-foreground/60 hover:text-muted-foreground" />
                                      )}
                                    </button>

                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-foreground">{s.student_name}</span>
                                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">{s.student_roll}</span>
                                        <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[10px] font-bold">
                                          {s.task_title}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase ${
                                          s.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                          s.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                          s.status === "changes_requested" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                          "bg-blue-50 text-blue-700 border-blue-200"
                                        }`}>
                                          {s.status}
                                        </span>
                                      </div>

                                      {s.submission_url && (
                                        <div className="flex items-center gap-2 pt-1">
                                          <span className="text-[11px] font-bold text-muted-foreground">Deliverable:</span>
                                          <a
                                            href={s.submission_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono"
                                          >
                                            <ExternalLink className="size-3" /> {s.submission_url}
                                          </a>
                                        </div>
                                      )}

                                      {s.notes && (
                                        <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded-lg">
                                          "{s.notes}"
                                        </p>
                                      )}

                                      <div className="flex items-center gap-3 text-xs pt-1">
                                        {s.score !== null && s.score !== undefined ? (
                                          <span className="font-bold text-foreground flex items-center gap-1">
                                            <Award className="size-3.5 text-amber-500" />
                                            Marks Allotted: <strong className="text-brand">{s.score}</strong> / {s.max_score || 100}
                                          </span>
                                        ) : (
                                          <span className="text-amber-600 font-medium">Pending marks allotment</span>
                                        )}
                                        {s.reviewer_name && <span className="text-muted-foreground text-[11px]">(Evaluated by {s.reviewer_name})</span>}
                                      </div>

                                      {s.feedback && <p className="text-xs text-brand font-medium">Feedback: {s.feedback}</p>}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReviewModal(s)}
                                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} cursor-pointer`}
                                    >
                                      <Check className="size-4" />
                                      {s.score !== null ? "Edit Marks" : "Verify & Allot Marks"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground text-xs bg-card rounded-2xl border border-border">
                          No submissions matching selected filter.
                        </div>
                      )}
                    </div>
                  )}

                  {taskTab === "tasks" && (
                    <div className="space-y-3">
                      {data?.tasks && data.tasks.length > 0 ? (
                        data.tasks.map((t) => (
                          <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="rounded-full bg-brand/10 text-brand px-2 py-0.5 text-[10px] font-bold uppercase">{t.priority}</span>
                                <span className="font-mono text-xs font-bold text-foreground">Max: {t.max_score} pts</span>
                              </div>
                              <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenTaskModal(t)}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id, t.title)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                          <FileText className="size-7 mx-auto text-muted-foreground" />
                          <h3 className="text-sm font-bold text-foreground">No Tasks Assigned Yet</h3>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Assign coding challenges, project deliverables, and milestone tasks to students in {wingName}.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenTaskModal()}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} cursor-pointer`}
                          >
                            <Plus className="size-4" /> Assign New Task
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ROADMAP */}
              {activeTab === "roadmap" && (
                <div className="space-y-6">
                  {/* Top Bar with Title and Create Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Track Roadmaps & Curriculum</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your track's multi-phase learning curriculum, modules, hours, and lesson resources.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenRoadmapModal()}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} cursor-pointer shrink-0`}
                    >
                      <Plus className="size-4" /> Add Track Roadmap
                    </button>
                  </div>

                  {data?.roadmaps && data.roadmaps.length > 0 ? (
                    <div className="space-y-4">
                      {data.roadmaps.map((r) => {
                        const totalModules = (r.phases || []).reduce(
                          (acc: number, p: any) => acc + (p.modules?.length || 0),
                          0
                        );
                        const totalHours = (r.phases || []).reduce(
                          (acc: number, p: any) =>
                            acc +
                            (p.modules || []).reduce(
                              (mAcc: number, m: any) => mAcc + (Number(m.estimated_hours) || 0),
                              0
                            ),
                          0
                        );

                        return (
                          <div
                            key={r.id}
                            className="rounded-2xl border border-border bg-card p-6 shadow-card hover:border-brand/40 transition-all"
                          >
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border/70">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                    {r.sub_club_slug || wingName}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                      Number(r.is_active) !== 0
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-muted text-muted-foreground border-border"
                                    }`}
                                  >
                                    {Number(r.is_active) !== 0 ? "Active Curriculum" : "Archived"}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground font-medium">
                                    {r.phases?.length || 0} Phases • {totalModules} Modules • ~{totalHours} Total Hours
                                  </span>
                                </div>
                                <h3 className="text-base font-bold text-foreground">{r.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                                  {r.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRoadmapModal(r)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs"
                                >
                                  <Pencil className="size-3.5 text-brand" /> Edit Curriculum
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRoadmap(r.id, r.title)}
                                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                                  title="Delete Roadmap"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Phases Breakdown Accordion / List */}
                            <div className="mt-4 space-y-3">
                              {(r.phases || []).map((phase: any, pIdx: number) => {
                                const pKey = phase.id || pIdx;
                                const isExpanded = Boolean(expandedRoadmapPhases[pKey]);
                                return (
                                  <div
                                    key={pKey}
                                    className="rounded-xl border border-border/80 bg-muted/20 overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedRoadmapPhases((prev) => ({
                                          ...prev,
                                          [pKey]: !prev[pKey],
                                        }))
                                      }
                                      className="w-full flex items-center justify-between p-3.5 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className="size-6 rounded-lg bg-brand/10 text-brand font-bold text-xs flex items-center justify-center">
                                          {phase.phase_order || pIdx + 1}
                                        </div>
                                        <div>
                                          <h4 className="text-xs font-bold text-foreground">{phase.title}</h4>
                                          {phase.description && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                                              {phase.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono text-[11px]">
                                          {phase.modules?.length || 0} Modules
                                        </span>
                                        {isExpanded ? (
                                          <ChevronDown className="size-4" />
                                        ) : (
                                          <ChevronRight className="size-4" />
                                        )}
                                      </div>
                                    </button>

                                    {isExpanded && (
                                      <div className="p-3.5 pt-0 border-t border-border/40 space-y-2 mt-2">
                                        {(phase.modules || []).map((mod: any, mIdx: number) => (
                                          <div
                                            key={mod.id || mIdx}
                                            className="rounded-lg border border-border bg-card p-3 space-y-1.5"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-xs font-bold text-foreground">{mod.title}</span>
                                              <span className="font-mono text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                                ~{mod.estimated_hours || 4} hrs
                                              </span>
                                            </div>
                                            {mod.description && (
                                              <p className="text-[11px] text-muted-foreground">{mod.description}</p>
                                            )}
                                            {mod.lessons && mod.lessons.length > 0 && (
                                              <div className="pt-1.5 border-t border-border/50 space-y-1">
                                                {mod.lessons.map((les: any, lIdx: number) => (
                                                  <div
                                                    key={les.id || lIdx}
                                                    className="flex items-center justify-between text-[11px] text-muted-foreground"
                                                  >
                                                    <span className="flex items-center gap-1.5">
                                                      <span className="size-1 rounded-full bg-brand" />
                                                      {les.title}
                                                    </span>
                                                    {les.resource_url && (
                                                      <a
                                                        href={les.resource_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-brand hover:underline font-mono text-[10px] flex items-center gap-0.5"
                                                      >
                                                        Resource <ExternalLink className="size-2.5" />
                                                      </a>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                      <Layers className="size-8 mx-auto text-muted-foreground" />
                      <h3 className="text-sm font-bold text-foreground">No Roadmaps Created Yet</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Create the foundational learning path for {wingName} students with structured phases and lessons.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenRoadmapModal()}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} cursor-pointer`}
                      >
                        <Plus className="size-4" /> Create Track Roadmap
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MEMBERS */}
              {activeTab === "members" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Track Enrolled Students ({filteredMembers.length})</h2>
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search member..."
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs outline-none"
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Student</th>
                          <th className="px-4 py-3 text-left">Roll Number</th>
                          <th className="px-4 py-3 text-left">Email</th>
                          <th className="px-4 py-3 text-left">Year</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredMembers.map((m) => (
                          <tr key={m.id || m.roll_number} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-semibold text-foreground">{m.name}</td>
                            <td className="px-4 py-3 font-mono text-[10px] font-bold">{m.roll_number}</td>
                            <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                            <td className="px-4 py-3 text-muted-foreground">{m.year_of_study}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {m.status || "active"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: EVENTS & WORKSHOPS PIPELINE */}
              {activeTab === "events" && (
                <div className="space-y-6">
                  {/* Multi-tier pipeline banner */}
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                      
                        <h3 className="text-base font-black text-blue-950">
                          1. Club Lead Proposes &rarr; 2. Faculty Mentor Accepts &rarr; 3. CMS Admin Publishes
                        </h3>
                        <p className="text-xs text-blue-800/80 mt-1 max-w-2xl leading-relaxed">
                          As {wingName} Lead, you can design and propose workshops, hackathons, and guest seminars. Your proposed event is first evaluated and accepted by your Faculty Mentor, and then published to the live SAC website by the CMS Admin.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProposeEventModalOpen(true)}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-soft hover:opacity-95 ${clubTheme.badgeSolid}`}
                      >
                        <Plus className="size-4" /> Propose Track Event
                      </button>
                    </div>
                  </div>

                  {/* Events List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Calendar className="size-4 text-blue-600" />
                        Club Events & Workshop Proposals ({events.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsProposeEventModalOpen(true)}
                        className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                      >
                        <Plus className="size-3.5" /> New Proposal
                      </button>
                    </div>

                    {events.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                        <Calendar className="mx-auto size-10 text-muted-foreground/40 mb-3" />
                        <h4 className="text-sm font-bold text-foreground">No Events or Workshops Proposed Yet</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                          Propose a technical workshop, coding boot camp, or sprint for {wingName} members.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsProposeEventModalOpen(true)}
                          className={`mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid}`}
                        >
                          <Plus className="size-4" /> Propose Track Event
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {events.map((ev) => {
                          const isApprovedLive = ev.status === "approved" || ev.status === "published";
                          const isMentorApproved = ev.approval_stage === "approved_mentor";
                          const isMentorRejected = ev.approval_stage === "rejected_mentor";

                          return (
                            <div
                              key={ev.id}
                              className="rounded-2xl border border-border bg-card p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-bold text-foreground">{ev.title}</h4>
                                  {isApprovedLive ? (
                                    <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                                      <CheckCircle2 className="size-3" /> Live on SAC Site
                                    </span>
                                  ) : isMentorApproved ? (
                                    <span className="shrink-0 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                                      <Clock className="size-3" /> Mentor Accepted • Awaiting CMS Admin
                                    </span>
                                  ) : isMentorRejected ? (
                                    <span className="shrink-0 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold">
                                      Returned for Revision
                                    </span>
                                  ) : (
                                    <span className="shrink-0 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                                      <Clock className="size-3" /> Awaiting Mentor Approval
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2">{ev.about || "No description provided."}</p>

                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                                  {ev.dates && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="size-3" /> {ev.dates}
                                    </span>
                                  )}
                                  {ev.time && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="size-3" /> {ev.time}
                                    </span>
                                  )}
                                  {ev.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="size-3" /> {ev.location}
                                    </span>
                                  )}
                                  {ev.mode && (
                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase">
                                      {ev.mode}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground truncate">
                                  Organizer: <strong className="text-foreground">{ev.organizer || "Club Lead"}</strong>
                                </span>
                                {isApprovedLive && (
                                  <Link
                                    to="/events/$slug"
                                    params={{ slug: String(ev.slug || ev.id) }}
                                    className="font-bold text-brand hover:underline flex items-center gap-1"
                                  >
                                    View Live <ExternalLink className="size-3" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: ANNOUNCEMENTS */}
              {activeTab === "announcements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Track Notices & Broadcasts</h2>
                    <button
                      type="button"
                      onClick={() => setIsAnnouncementModalOpen(true)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid}`}
                    >
                      <Plus className="size-4" /> Post Track Notice
                    </button>
                  </div>

                  <div className="space-y-3">
                    {data?.announcements?.map((a) => (
                      <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-card flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{a.title}</span>
                            <span className="text-[10px] font-bold uppercase rounded px-2 py-0.2 bg-muted">{a.priority}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{a.content}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(a.id, a.title)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {isReviewModalOpen && reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Verify Submission & Allot Marks</h3>
                <p className="text-xs text-muted-foreground">Club Lead Evaluation</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="mt-4 space-y-4">
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground block">{reviewingSubmission.student_name}</span>
                    <span className="text-[11px] text-muted-foreground">Task: <strong>{reviewingSubmission.task_title}</strong></span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-card border border-border px-2 py-0.5 rounded">
                    {reviewingSubmission.student_roll}
                  </span>
                </div>

                {reviewingSubmission.submission_url && (
                  <div className="flex items-center justify-between gap-2 p-2 bg-card rounded-xl border border-border">
                    <span className="text-xs font-mono text-blue-600 truncate">{reviewingSubmission.submission_url}</span>
                    <a
                      href={reviewingSubmission.submission_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-2 py-1 text-[11px] font-bold shrink-0"
                    >
                      <ExternalLink className="size-3" /> Open Work
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Status *</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="approved">Verified & Approved</option>
                    <option value="changes_requested">Changes Requested</option>
                    <option value="under_review">Under Verification</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Marks Allotted *</label>
                  <input
                    type="number"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(Number(e.target.value))}
                    min={0}
                    max={reviewingSubmission.max_score || 100}
                    required
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-base outline-none"
                  />
                </div>
              </div>

              {/* Quick score buttons */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Quick Score Presets:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "100%", pct: 1.0 },
                    { label: "90%", pct: 0.9 },
                    { label: "80%", pct: 0.8 },
                    { label: "75%", pct: 0.75 },
                    { label: "50%", pct: 0.5 },
                    { label: "0", pct: 0.0 },
                  ].map((p) => {
                    const max = reviewingSubmission.max_score || 100;
                    const calculated = Math.round(max * p.pct);
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setReviewScore(calculated)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                          reviewScore === calculated
                            ? "bg-brand text-white border-brand shadow-2xs"
                            : "border-border bg-card hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.label} ({calculated})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Feedback Remarks</label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Leave comments on code execution, architecture, and next steps..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid}`}
                >
                  Save Verification & Allot Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Assignment Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingTask ? "Edit Assignment" : "Assign New Track Task"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Assign hands-on project deliverables to students enrolled in {wingName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build a Responsive Dashboard with API Integration"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Target Wing / Track *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.sub_club_slug}
                    onChange={(e) => setTaskForm({ ...taskForm, sub_club_slug: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Max Marks / Score *</label>
                  <input
                    type="number"
                    value={taskForm.max_score}
                    onChange={(e) => setTaskForm({ ...taskForm, max_score: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Task Overview / Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Summary of the project or coding objective..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Submission Deliverables & Instructions</label>
                <textarea
                  rows={3}
                  value={taskForm.instructions}
                  onChange={(e) => setTaskForm({ ...taskForm, instructions: e.target.value })}
                  placeholder="Specify required submission format (e.g., GitHub repository URL, deployed demo URL, video walkthrough, architectural notes)..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} cursor-pointer`}
                >
                  {editingTask ? "Update Assignment" : "Assign Task to Track Students"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Grading / Bulk Evaluation Modal */}
      {isBatchGradingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Bulk Verify & Allot Marks</h3>
                <p className="text-xs text-muted-foreground">
                  Simultaneously grade and evaluate <strong className="text-brand">{selectedSubmissionIds.length}</strong> selected student submissions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchGradingModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchReview} className="mt-4 space-y-4">
              {/* Selected Students Preview Chips */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Selected Submissions ({selectedSubmissionIds.length}):
                </label>
                <div className="max-h-24 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2.5 flex flex-wrap gap-1.5">
                  {filteredSubmissions
                    .filter((s) => selectedSubmissionIds.includes(s.id))
                    .map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2 py-1 text-[11px] font-bold text-foreground shadow-2xs"
                      >
                        <span>{s.student_name}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">({s.student_roll})</span>
                      </span>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Status for All *</label>
                  <select
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="approved">Verified & Approved</option>
                    <option value="changes_requested">Changes Requested</option>
                    <option value="under_review">Under Verification</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Marks to Allot (All) *</label>
                  <input
                    type="number"
                    value={batchScore}
                    onChange={(e) => setBatchScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    required
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              {/* Quick score buttons */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Quick Score Presets:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[100, 95, 90, 85, 80, 75, 50, 0].map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setBatchScore(sc)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        batchScore === sc
                          ? "bg-brand text-white border-brand shadow-2xs"
                          : "border-border bg-card hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {sc} pts
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Feedback Remarks for All</label>
                <textarea
                  rows={3}
                  value={batchFeedback}
                  onChange={(e) => setBatchFeedback(e.target.value)}
                  placeholder="Provide constructive feedback applied to all selected submissions..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none resize-none"
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground font-semibold">Quick remarks:</span>
                  {[
                    "Excellent submission! Code verified and approved.",
                    "Great work on completing all milestones.",
                    "Good effort, verified by Track Lead.",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBatchFeedback(preset)}
                      className="text-[10px] bg-muted/60 hover:bg-muted px-2 py-0.5 rounded text-muted-foreground cursor-pointer truncate max-w-[200px]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsBatchGradingModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
                  disabled={isBatchSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBatchSaving}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} cursor-pointer flex items-center gap-1.5`}
                >
                  {isBatchSaving ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Allotting Marks...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" /> Allot {batchScore} Marks to All {selectedSubmissionIds.length} Students
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roadmap Management Modal */}
      {isRoadmapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            style={{ height: "85vh", maxHeight: "85vh" }}
            className="w-full max-w-3xl rounded-3xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0 bg-card">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingRoadmap.id ? "Edit Track Roadmap & Curriculum" : "Create New Track Roadmap"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Design learning milestones, hands-on modules, and resources for {wingName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoadmapModalOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSaveRoadmap}
              style={{ flex: "1 1 0%", minHeight: 0 }}
              className="flex flex-col overflow-hidden"
            >
              <div
                style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}
                className="p-5 sm:p-6 space-y-6"
              >
                {/* General Info */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Compass className="size-3.5 text-brand" /> Roadmap Overview
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-foreground mb-1">Roadmap Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Modern Full-Stack Web Development Track"
                        value={editingRoadmap.title}
                        onChange={(e) => setEditingRoadmap({ ...editingRoadmap, title: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Target Wing Slug *</label>
                      <input
                        type="text"
                        required
                        value={editingRoadmap.sub_club_slug}
                        onChange={(e) => setEditingRoadmap({ ...editingRoadmap, sub_club_slug: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingRoadmap.description}
                      onChange={(e) => setEditingRoadmap({ ...editingRoadmap, description: e.target.value })}
                      placeholder="Outline the learning objectives, expectations, and real-world outcomes..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="roadmap-active"
                      checked={editingRoadmap.is_active === 1}
                      onChange={(e) => setEditingRoadmap({ ...editingRoadmap, is_active: e.target.checked ? 1 : 0 })}
                      className="size-4 rounded accent-brand cursor-pointer"
                    />
                    <label htmlFor="roadmap-active" className="text-xs font-semibold text-foreground cursor-pointer">
                      Curriculum is active & visible to students
                    </label>
                  </div>
                </div>

                {/* Phases & Curriculum Builder */}
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="size-3.5 text-brand" /> Curriculum Phases & Modules ({editingRoadmap.phases.length})
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Break down your track into structured sequential phases with practical modules.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPhase}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="size-3.5 text-brand" /> Add Phase
                    </button>
                  </div>

                  {editingRoadmap.phases.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-border rounded-2xl bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-2">No phases added yet.</p>
                      <button
                        type="button"
                        onClick={handleAddPhase}
                        className="text-xs font-bold text-brand hover:underline"
                      >
                        + Add First Phase
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editingRoadmap.phases.map((phase, pIdx) => (
                        <div
                          key={phase.id || pIdx}
                          className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="size-6 rounded-lg bg-brand/10 text-brand font-bold text-xs flex items-center justify-center shrink-0">
                                {pIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={phase.title}
                                onChange={(e) => handleUpdatePhase(pIdx, "title", e.target.value)}
                                placeholder={`Phase ${pIdx + 1} Title`}
                                className="font-bold text-xs text-foreground bg-transparent border-b border-border/80 focus:border-brand px-1 py-0.5 outline-none flex-1"
                              />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <span>Order:</span>
                                <input
                                  type="number"
                                  value={phase.phase_order}
                                  onChange={(e) => handleUpdatePhase(pIdx, "phase_order", Number(e.target.value))}
                                  className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-mono text-center"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePhase(pIdx)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Phase"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={phase.description}
                              onChange={(e) => handleUpdatePhase(pIdx, "description", e.target.value)}
                              placeholder="Phase summary / focus areas..."
                              className="w-full text-[11px] text-muted-foreground bg-transparent border border-border/60 rounded-lg px-2.5 py-1.5 outline-none focus:bg-background"
                            />
                          </div>

                          {/* Modules List inside Phase */}
                          <div className="space-y-2.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Modules in Phase {pIdx + 1} ({phase.modules.length}):
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddModule(pIdx)}
                                className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="size-3" /> Add Module
                              </button>
                            </div>

                            {phase.modules.map((mod, mIdx) => (
                              <div
                                key={mod.id || mIdx}
                                className="rounded-xl border border-border bg-card p-3 space-y-2.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={mod.title}
                                    onChange={(e) => handleUpdateModule(pIdx, mIdx, "title", e.target.value)}
                                    placeholder="Module Title..."
                                    className="font-bold text-xs text-foreground bg-transparent border-b border-border/60 focus:border-brand px-1 py-0.5 outline-none flex-1"
                                  />
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] text-muted-foreground">Est. Hours:</span>
                                    <input
                                      type="number"
                                      value={mod.estimated_hours}
                                      onChange={(e) => handleUpdateModule(pIdx, mIdx, "estimated_hours", Number(e.target.value))}
                                      min={1}
                                      className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-mono text-center"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveModule(pIdx, mIdx)}
                                      className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                                      title="Delete Module"
                                    >
                                      <Trash2 className="size-3" />
                                    </button>
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  value={mod.description}
                                  onChange={(e) => handleUpdateModule(pIdx, mIdx, "description", e.target.value)}
                                  placeholder="Module brief / topics..."
                                  className="w-full text-[11px] text-muted-foreground bg-transparent border border-border/50 rounded-lg px-2 py-1 outline-none focus:bg-background"
                                />

                                {/* Lessons inside Module */}
                                <div className="space-y-1.5 pt-1 border-t border-border/40">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                      Lessons ({mod.lessons.length}):
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddLesson(pIdx, mIdx)}
                                      className="text-[10px] font-bold text-brand hover:underline flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <Plus className="size-2.5" /> Add Lesson
                                    </button>
                                  </div>

                                  {mod.lessons.map((les, lIdx) => (
                                    <div
                                      key={les.id || lIdx}
                                      className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/40 border border-border/60 text-[11px]"
                                    >
                                      <input
                                        type="text"
                                        value={les.title}
                                        onChange={(e) => handleUpdateLesson(pIdx, mIdx, lIdx, "title", e.target.value)}
                                        placeholder="Lesson title..."
                                        className="font-medium text-foreground bg-transparent border-b border-transparent focus:border-brand px-1 py-0.5 outline-none flex-1 text-[11px]"
                                      />
                                      <input
                                        type="text"
                                        value={les.resource_url}
                                        onChange={(e) => handleUpdateLesson(pIdx, mIdx, lIdx, "resource_url", e.target.value)}
                                        placeholder="Resource URL (docs, repo, video)..."
                                        className="text-blue-600 bg-transparent border-b border-transparent focus:border-brand px-1 py-0.5 outline-none flex-1 text-[10px] font-mono"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveLesson(pIdx, mIdx, lIdx)}
                                        className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer shrink-0"
                                        title="Delete Lesson"
                                      >
                                        <X className="size-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border shrink-0 bg-card">
                <button
                  type="button"
                  onClick={() => setIsRoadmapModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
                  disabled={isSavingRoadmap}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRoadmap}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} cursor-pointer flex items-center gap-1.5`}
                >
                  {isSavingRoadmap ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Saving Curriculum...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      {editingRoadmap.id ? "Save Roadmap Changes" : "Publish Track Roadmap"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Post Track Notice</h3>
              <button type="button" onClick={() => setIsAnnouncementModalOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAnnouncement} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Notice Content *</label>
                <textarea
                  rows={3}
                  required
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsAnnouncementModalOpen(false)} className="px-4 py-2 text-xs text-muted-foreground">
                  Cancel
                </button>
                <button type="submit" className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid}`}>
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Propose Track Event Modal */}
      {isProposeEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Propose Track Event / Workshop</h3>
                <p className="text-xs text-muted-foreground">
                  Submitted to Faculty Mentor for review, then published by CMS Admin
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProposeEventModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleProposeTrackEvent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Event / Workshop Title *</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g., ${wingName} Hands-On Masterclass & Hackathon`}
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Dates *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Oct 15 - 16, 2026"
                    value={eventForm.dates}
                    onChange={(e) => setEventForm({ ...eventForm, dates: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Timing</label>
                  <input
                    type="text"
                    placeholder="e.g., 10:00 AM - 01:00 PM"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Mode</label>
                  <select
                    value={eventForm.mode}
                    onChange={(e) => setEventForm({ ...eventForm, mode: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">Location / Venue</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">About the Event</label>
                <textarea
                  rows={3}
                  value={eventForm.about}
                  onChange={(e) => setEventForm({ ...eventForm, about: e.target.value })}
                  placeholder="Explain event outcomes, prerequisites, and what students will build..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Key Highlights (one per line)</label>
                <textarea
                  rows={2}
                  value={eventForm.highlights}
                  onChange={(e) => setEventForm({ ...eventForm, highlights: e.target.value })}
                  placeholder="Hands-on coding sprint&#10;Industry mentor Q&A&#10;Certificate of Excellence"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none outline-none"
                />
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900">
                <span className="font-bold">Multi-Tier Approval Pipeline:</span> Submitting this will register the proposal in <code className="text-blue-700 font-bold">pending</code> status. Your Faculty Mentor will be notified to review and accept it, after which CMS Admin will publish it directly to the live SAC website.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsProposeEventModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid}`}
                >
                  Submit Proposal to Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
