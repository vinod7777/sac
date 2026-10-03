import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  ExternalLink,
  FileCheck,
  FileText,
  FolderGit2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  Users,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  deleteCmsEvent,
  deleteLmsAnnouncement,
  deleteLmsTask,
  deleteMember,
  deleteRoadmap,
  deleteWing,
  fetchClubMembers,
  fetchClubsGovernance,
  fetchCmsEvents,
  fetchLmsAnnouncements,
  fetchLmsTasks,
  fetchOrganizerDashboard,
  fetchRoadmaps,
  reviewTaskSubmission,
  saveCmsEvent,
  saveLmsAnnouncement,
  saveLmsTask,
  saveMember,
  saveRoadmap,
  saveWing,
  updateMemberStatus,
  uploadImage,
  isStudentClubMember,
  type ClubMember,
  type ClubWing,
  type CmsEvent,
  type LmsAnnouncement,
  type LmsRoadmap,
  type LmsTask,
  type LmsTaskSubmission,
  type OrganizerDashboardData,
} from "@/lib/api";
import { getBuiltinRoadmapForWing } from "./MemberLms";
import { CLUB_THEMES, getClubTheme } from "@/lib/clubTheme";

export type OrganizerTab = "overview" | "wings" | "members" | "roadmaps" | "tasks" | "announcements" | "events";

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

interface OrganizerLmsProps {
  user: StoredUser | null;
  managedClub?: string | undefined;
  onLogout?: (() => void) | undefined;
}

export function OrganizerLms({ user, managedClub, onLogout }: OrganizerLmsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrganizerTab>("overview");
  const [taskTab, setTaskTab] = useState<"submissions" | "tasks">("submissions");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrganizerDashboardData | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>("all");

  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<string>("pending");
  const [submissionSearch, setSubmissionSearch] = useState("");

  // Events management state
  const [eventsList, setEventsList] = useState<CmsEvent[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CmsEvent> | null>(null);
  const [eventHighlightsInput, setEventHighlightsInput] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [eventSearch, setEventSearch] = useState<string>("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const posterFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "admin";
  const assignedClub = managedClub || user?.managed_club || user?.club || "developers-club";
  const [selectedClubState, setSelectedClubState] = useState<string>(assignedClub);
  const selectedClub = isAdmin ? selectedClubState : assignedClub;

  const clubTheme = useMemo(() => getClubTheme(selectedClub), [selectedClub]);
  const clubDisplayName = clubTheme.name;

  const userName = user?.name || "Club Organizer";
  const userRoll = user?.rollNumber || user?.roll_number || "";

  // Load Dashboard Data for currently selected club
  const loadDashboard = async () => {
    if (!selectedClub) return;
    setLoading(true);
    try {
      const [d, membersList, roadmapsList, tasksList, annList, gov, cmsEvts] = await Promise.all([
        fetchOrganizerDashboard(selectedClub),
        fetchClubMembers({ club: selectedClub }),
        fetchRoadmaps({ club_slug: selectedClub, all: 1 }),
        fetchLmsTasks({ club_slug: selectedClub }),
        fetchLmsAnnouncements(selectedClub),
        fetchClubsGovernance(),
        fetchCmsEvents(true),
      ]);

      // Helper: Strictly ensure no faculty mentors appear in student member directory
      const isStudentMember = (m: ClubMember) => {
        const role = ((m as any).role || "").toLowerCase();
        const desig = ((m as any).designation || "").toLowerCase();
        const year = ((m as any).year_of_study || (m as any).year || "").toLowerCase();
        const email = (m.email || "").toLowerCase();
        if (role.includes("mentor") || desig.includes("mentor") || year.includes("mentor") || year.includes("faculty")) return false;
        if (email.includes("mentor") || email.includes("faculty")) return false;
        return true;
      };

      // 1. Members merge (filtered to student members only)
      const memberMap = new Map<string, ClubMember>();
      d?.members?.forEach((m) => {
        if (!isStudentMember(m)) return;
        const key = (m.roll_number || m.id || "").toString().toUpperCase();
        if (key) memberMap.set(key, m);
      });
      membersList?.forEach((m) => {
        if (!isStudentMember(m)) return;
        const key = (m.roll_number || m.id || "").toString().toUpperCase();
        if (key && !memberMap.has(key)) {
          memberMap.set(key, m);
        }
      });
      const allMembers = Array.from(memberMap.values());
      const activeCount = allMembers.filter((m) => m.status === "active").length;
      const pendingCount = allMembers.filter((m) => m.status === "pending").length;
      const suspendedCount = allMembers.filter((m) => m.status === "suspended").length;

      // 2. Wings merge
      const wingMap = new Map<string, ClubWing>();
      const normalizeKey = (str?: string) => (str || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");

      d?.wings?.forEach((w) => {
        const key = normalizeKey(w.wing_slug || w.wing_name);
        if (key) wingMap.set(key, w);
      });
      const govWings = gov?.wings?.[selectedClub] || gov?.wings?.["developers-club"] || [];
      govWings.forEach((w) => {
        const key = normalizeKey(w.wing_slug || w.wing_name);
        if (key && !wingMap.has(key)) {
          wingMap.set(key, w);
        }
      });
      const allWings = Array.from(wingMap.values());

      // 3. Roadmaps merge & curriculum enrichment
      const rmMap = new Map<string, LmsRoadmap>();
      d?.roadmaps?.forEach((r) => {
        const key = normalizeKey(r.sub_club_slug || r.title);
        if (key) rmMap.set(key, r);
      });
      roadmapsList?.forEach((r) => {
        const key = normalizeKey(r.sub_club_slug || r.title);
        if (key && !rmMap.has(key)) {
          rmMap.set(key, r);
        }
      });

      // ENRICHMENT FALLBACK: Ensure each sub-wing has an active interactive curriculum
      allWings.forEach((wing) => {
        const wSlug = wing.wing_slug || wing.wing_name;
        const key = normalizeKey(wSlug);
        const existing = rmMap.get(key);
        if (!existing || !existing.phases || existing.phases.length === 0) {
          const builtin = getBuiltinRoadmapForWing(wSlug, selectedClub, clubDisplayName);
          if (builtin) {
            rmMap.set(key, {
              ...builtin,
              ...(existing || {}),
              phases: (existing?.phases && existing.phases.length > 0) ? existing.phases : builtin.phases,
            });
          }
        }
      });
      const allRoadmaps = Array.from(rmMap.values());

      // 4. Tasks merge
      const taskMap = new Map<string, LmsTask>();
      d?.tasks?.forEach((t) => {
        const key = normalizeKey(t.title);
        if (key) taskMap.set(key, t);
      });
      tasksList?.forEach((t) => {
        const key = normalizeKey(t.title);
        if (key && !taskMap.has(key)) {
          taskMap.set(key, t);
        }
      });
      const allTasks = Array.from(taskMap.values());

      // 5. Announcements merge
      const annMap = new Map<string, LmsAnnouncement>();
      d?.announcements?.forEach((a) => {
        const key = normalizeKey(a.title);
        if (key) annMap.set(key, a);
      });
      annList?.forEach((a) => {
        const key = normalizeKey(a.title);
        if (key && !annMap.has(key)) {
          annMap.set(key, a);
        }
      });
      const allAnnouncements = Array.from(annMap.values());

      // 6. Events merge (filtered to this club)
      const normClub = (selectedClub || "developers-club").toLowerCase().replace(/[^a-z0-9]/g, "");
      const clubEvts = (cmsEvts || []).filter((e) => {
        const c = (e.club || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normClub.includes("dev") && (c.includes("dev") || c.includes("code"))) return true;
        return c.includes(normClub) || normClub.includes(c);
      });
      setEventsList(clubEvts);

      const allSubmissions = d?.submissions || [];
      const pendingSubmissions = d?.stats?.pendingSubmissions ?? (allSubmissions.filter((s) => s.status === "submitted" || s.status === "pending" || s.status === "under_review").length || 0);
      const approvedSubmissions = d?.stats?.approvedSubmissions ?? (allSubmissions.filter((s) => s.status === "approved").length || 0);
      const rejectedSubmissions = d?.stats?.rejectedSubmissions ?? (allSubmissions.filter((s) => s.status === "rejected").length || 0);

      setData({
        ...d,
        wings: allWings,
        members: allMembers,
        roadmaps: allRoadmaps,
        tasks: allTasks,
        submissions: allSubmissions,
        announcements: allAnnouncements,
        mentors: [],
        stats: {
          ...d?.stats,
          totalMembers: allMembers.length,
          activeMembers: activeCount,
          pendingMembers: pendingCount,
          suspendedMembers: suspendedCount,
          totalWings: allWings.length,
          totalRoadmaps: allRoadmaps.length,
          totalTasks: allTasks.length,
          totalSubmissions: allSubmissions.length,
          pendingSubmissions,
          approvedSubmissions,
          rejectedSubmissions,
          totalAnnouncements: allAnnouncements.length,
        },
      });
    } catch (e) {
      console.warn("Failed to load organizer dashboard:", e);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedClub]);

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

  // Filtered members (null-safe and strictly excluding faculty mentors)
  const filteredMembers = useMemo(() => {
    if (!data?.members || !Array.isArray(data.members)) return [];
    const q = (memberSearch || "").toLowerCase().trim();
    return data.members.filter((m) => {
      // Exclude mentors or faculty accounts
      const role = ((m as any).role || "").toLowerCase();
      const desig = ((m as any).designation || "").toLowerCase();
      const year = ((m as any).year_of_study || (m as any).year || "").toLowerCase();
      const email = (m.email || "").toLowerCase();
      if (role.includes("mentor") || desig.includes("mentor") || year.includes("mentor") || year.includes("faculty")) return false;
      if (email.includes("mentor") || email.includes("faculty")) return false;

      const name = (m.name || "").toLowerCase();
      const roll = (m.roll_number || "").toLowerCase();
      const matchSearch = !q || name.includes(q) || roll.includes(q) || email.includes(q);
      const mStatus = (m.status || "active").toLowerCase();
      const matchStatus = memberStatusFilter === "all" || mStatus === memberStatusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [data?.members, memberSearch, memberStatusFilter]);

  // Filtered submissions for verification queue
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

  // -------------------------------------------------------------
  // CRUD STATE: SUB-WINGS
  // -------------------------------------------------------------
  const [isWingModalOpen, setIsWingModalOpen] = useState(false);
  const [editingWing, setEditingWing] = useState<Partial<ClubWing> | null>(null);
  const [leadMemberSearch, setLeadMemberSearch] = useState("");
  const leadSearchInputRef = useRef<HTMLInputElement>(null);
  const [wingForm, setWingForm] = useState({
    wing_name: "",
    wing_slug: "",
    description: "",
    lead_name: "",
    lead_roll_number: "",
    lead_email: "",
    lead_phone: "",
    lead_year: "3rd Year",
  });

  const searchedLeadMembers = useMemo(() => {
    if (!leadMemberSearch.trim() || !data?.members || !Array.isArray(data.members)) return [];
    const q = leadMemberSearch.toLowerCase().trim();
    return data.members
      .filter((m) => {
        // Exclude faculty / mentors from being selected as wing leads
        const role = ((m as any).role || "").toLowerCase();
        const desig = ((m as any).designation || "").toLowerCase();
        const year = ((m as any).year_of_study || (m as any).year || "").toLowerCase();
        const email = (m.email || "").toLowerCase();
        if (role.includes("mentor") || desig.includes("mentor") || year.includes("mentor") || year.includes("faculty")) return false;
        if (email.includes("mentor") || email.includes("faculty")) return false;

        const nameMatch = (m.name || "").toLowerCase().includes(q);
        const rollMatch = (m.roll_number || "").toLowerCase().includes(q);
        const emailMatch = (m.email || "").toLowerCase().includes(q);
        return nameMatch || rollMatch || emailMatch;
      })
      .slice(0, 8);
  }, [leadMemberSearch, data?.members]);

  const handleAssignMemberWing = async (member: ClubMember, wingName: string) => {
    try {
      const res = await saveMember({
        ...member,
        wing_name: wingName,
      });
      if (res.success) {
        toast.success(`Assigned ${member.name} to ${wingName || "Unassigned"}`);
        setData((prev) => {
          if (!prev) return prev;
          const updated = prev.members.map((m) =>
            (m.roll_number && m.roll_number === member.roll_number) || (m.id && m.id === member.id)
              ? { ...m, wing_name: wingName }
              : m
          );
          return { ...prev, members: updated };
        });
      } else {
        toast.error(res.message || "Failed to update wing");
      }
    } catch {
      toast.error("Failed to update member wing");
    }
  };

  const handleSelectMemberAsLead = (member: ClubMember) => {
    setWingForm((prev) => ({
      ...prev,
      lead_name: member.name || "",
      lead_roll_number: member.roll_number || "",
      lead_email: member.email || "",
      lead_phone: member.phone || "",
      lead_year: member.year_of_study || prev.lead_year || "3rd Year",
    }));
    setLeadMemberSearch("");
    toast.success(`Selected ${member.name} (${member.roll_number}) as Club Lead`);
  };

  const handleOpenWingModal = (wing?: ClubWing, memberToAppoint?: ClubMember, focusLeadSearch = false) => {
    setLeadMemberSearch("");
    if (wing) {
      setEditingWing(wing);
      setWingForm({
        wing_name: wing.wing_name || "",
        wing_slug: wing.wing_slug || "",
        description: wing.description || "",
        lead_name: memberToAppoint?.name || wing.lead_name || "",
        lead_roll_number: memberToAppoint?.roll_number || wing.lead_roll_number || "",
        lead_email: memberToAppoint?.email || wing.lead_email || "",
        lead_phone: memberToAppoint?.phone || wing.lead_phone || "",
        lead_year: memberToAppoint?.year_of_study || wing.lead_year || "3rd Year",
      });
    } else {
      const targetWing = memberToAppoint?.wing_name
        ? data?.wings?.find((w) => w.wing_name === memberToAppoint.wing_name)
        : data?.wings?.[0];

      if (targetWing) {
        setEditingWing(targetWing);
        setWingForm({
          wing_name: targetWing.wing_name || "",
          wing_slug: targetWing.wing_slug || "",
          description: targetWing.description || "",
          lead_name: memberToAppoint?.name || targetWing.lead_name || "",
          lead_roll_number: memberToAppoint?.roll_number || targetWing.lead_roll_number || "",
          lead_email: memberToAppoint?.email || targetWing.lead_email || "",
          lead_phone: memberToAppoint?.phone || targetWing.lead_phone || "",
          lead_year: memberToAppoint?.year_of_study || targetWing.lead_year || "3rd Year",
        });
      } else {
        setEditingWing(null);
        setWingForm({
          wing_name: "",
          wing_slug: "",
          description: "",
          lead_name: memberToAppoint?.name || "",
          lead_roll_number: memberToAppoint?.roll_number || "",
          lead_email: memberToAppoint?.email || "",
          lead_phone: memberToAppoint?.phone || "",
          lead_year: memberToAppoint?.year_of_study || "3rd Year",
        });
      }
    }
    setIsWingModalOpen(true);
    if (focusLeadSearch) {
      setTimeout(() => {
        leadSearchInputRef.current?.focus();
      }, 150);
    }
  };

  const handleSaveWing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wingForm.wing_name.trim()) {
      toast.error("Sub-wing name is required");
      return;
    }
    try {
      const res = await saveWing({
        ...(editingWing?.id ? { id: editingWing.id } : {}),
        club_slug: selectedClub,
        ...wingForm,
      });
      if (res.success) {
        toast.success(res.message);
        setIsWingModalOpen(false);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to save sub-wing");
    }
  };

  const handleDeleteWing = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete sub-wing "${name}"?`)) return;
    try {
      const res = await deleteWing(id);
      if (res.success) {
        toast.success(res.message);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete sub-wing");
    }
  };

  // Note: Student member enrollment and removals are strictly managed by Faculty Mentors.
  // Organizers can inspect members and appoint them as Wing Leads.
  const handleToggleMemberStatus = async (id: number, nextStatus: string) => {
    try {
      const res = await updateMemberStatus(id, nextStatus);
      if (res.success) {
        toast.success(res.message);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // -------------------------------------------------------------
  // CRUD STATE: ROADMAPS
  // -------------------------------------------------------------
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
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

  const handleOpenRoadmapModal = (rm?: any) => {
    if (rm) {
      setEditingRoadmap({
        id: rm.id,
        title: rm.title || "",
        sub_club_slug: rm.sub_club_slug || "web-dev",
        description: rm.description || "",
        is_active: rm.is_active !== undefined ? Number(rm.is_active) : 1,
        phases: (rm.phases || []).map((p: any, pIdx: number) => ({
          id: p.id,
          title: p.title || "",
          description: p.description || "",
          phase_order: p.phase_order || pIdx + 1,
          modules: (p.modules || []).map((m: any) => ({
            id: m.id,
            title: m.title || "",
            description: m.description || "",
            estimated_hours: m.estimated_hours || 10,
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
        title: "",
        sub_club_slug: "web-dev",
        description: "",
        is_active: 1,
        phases: [
          {
            title: "Phase 1: Foundations",
            description: "Core setup and fundamental concepts",
            phase_order: 1,
            modules: [
              {
                title: "Module 1.1: Getting Started",
                description: "Initial tooling and setup",
                estimated_hours: 8,
                lessons: [
                  {
                    title: "Orientation & Environment Setup",
                    content: "Setup instructions and prerequisites",
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
    try {
      const res = await saveRoadmap({
        ...editingRoadmap,
        club_slug: selectedClub,
        created_by: userName,
      });
      if (res.success) {
        toast.success(res.message);
        setIsRoadmapModalOpen(false);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to save roadmap");
    }
  };

  const handleDeleteRoadmap = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete roadmap "${title}" and all its phases, modules, and lessons?`)) return;
    try {
      const res = await deleteRoadmap(id);
      if (res.success) {
        toast.success(res.message);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete roadmap");
    }
  };

  // -------------------------------------------------------------
  // CRUD STATE: TASKS
  // -------------------------------------------------------------
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<LmsTask> | null>(null);
  const [taskForm, setTaskForm] = useState<{
    title: string;
    sub_club_slug: string;
    description: string;
    instructions: string;
    due_date: string;
    priority: "low" | "medium" | "high" | "urgent";
    max_score: number;
    allow_github: number;
    allow_drive: number;
    allow_url: number;
  }>({
    title: "",
    sub_club_slug: "",
    description: "",
    instructions: "",
    due_date: "",
    priority: "medium",
    max_score: 100,
    allow_github: 1,
    allow_drive: 1,
    allow_url: 1,
  });

  const handleOpenTaskModal = (task?: LmsTask) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title || "",
        sub_club_slug: task.sub_club_slug || "",
        description: task.description || "",
        instructions: task.instructions || "",
        due_date: task.due_date ? task.due_date.slice(0, 10) : "",
        priority: (task.priority as "low" | "medium" | "high" | "urgent") || "medium",
        max_score: task.max_score || 100,
        allow_github: task.allow_github !== undefined ? Number(task.allow_github) : 1,
        allow_drive: task.allow_drive !== undefined ? Number(task.allow_drive) : 1,
        allow_url: task.allow_url !== undefined ? Number(task.allow_url) : 1,
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: "",
        sub_club_slug: "",
        description: "",
        instructions: "",
        due_date: "",
        priority: "medium",
        max_score: 100,
        allow_github: 1,
        allow_drive: 1,
        allow_url: 1,
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
      const { sub_club_slug, ...restTaskForm } = taskForm;
      const res = await saveLmsTask({
        ...(editingTask?.id ? { id: editingTask.id } : {}),
        club_slug: selectedClub,
        sub_club_slug: sub_club_slug || undefined,
        created_by: userName,
        ...restTaskForm,
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
    if (!confirm(`Are you sure you want to delete task "${title}" and all its student submissions?`)) return;
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
  // CRUD STATE: SUBMISSION REVIEW & MARKS ALLOTMENT
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

    // Optimistically update local state
    setData((prev) => {
      if (!prev) return prev;
      const updatedSubs = (prev.submissions || []).map((s) =>
        s.id === reviewingSubmission.id
          ? {
              ...s,
              status: reviewStatus,
              score: reviewScore,
              feedback: reviewFeedback,
              reviewer_name: userName,
              reviewed_at: new Date().toISOString(),
            }
          : s
      );
      const pend = updatedSubs.filter((s) => s.status === "submitted" || s.status === "pending" || s.status === "under_review").length;
      const app = updatedSubs.filter((s) => s.status === "approved").length;
      const rej = updatedSubs.filter((s) => s.status === "rejected").length;
      return {
        ...prev,
        submissions: updatedSubs,
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
        reviewer_name: userName,
        reviewer_role: "Club Organizer",
      });
      if (res.success) {
        toast.success(res.message || "Submission verified and marks allotted successfully");
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
  // CRUD STATE: ANNOUNCEMENTS
  // -------------------------------------------------------------
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<LmsAnnouncement> | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    priority: "normal" as "normal" | "urgent" | "pinned",
    sub_club_slug: "",
  });

  const handleOpenAnnouncementModal = (ann?: LmsAnnouncement) => {
    if (ann) {
      setEditingAnnouncement(ann);
      setAnnouncementForm({
        title: ann.title || "",
        content: ann.content || "",
        priority: (ann.priority as "normal" | "urgent" | "pinned") || "normal",
        sub_club_slug: ann.sub_club_slug || "",
      });
    } else {
      setEditingAnnouncement(null);
      setAnnouncementForm({
        title: "",
        content: "",
        priority: "normal",
        sub_club_slug: "",
      });
    }
    setIsAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error("Title and Content are required");
      return;
    }
    try {
      const res = await saveLmsAnnouncement({
        ...(editingAnnouncement?.id ? { id: editingAnnouncement.id } : {}),
        club_slug: selectedClub,
        sub_club_slug: announcementForm.sub_club_slug || null,
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        priority: announcementForm.priority,
        author_name: userName,
        author_role: "Club Organizer",
      });
      if (res.success) {
        toast.success(res.message);
        setIsAnnouncementModalOpen(false);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to save announcement");
    }
  };

  const handleDeleteAnnouncement = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete announcement "${title}"?`)) return;
    try {
      const res = await deleteLmsAnnouncement(id);
      if (res.success) {
        toast.success(res.message);
        await loadDashboard();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  // -------------------------------------------------------------
  // CRUD HANDLERS: CLUB EVENTS
  // -------------------------------------------------------------
  const handleOpenEventModal = (event?: CmsEvent) => {
    if (event) {
      setEditingEvent({
        ...event,
        image: event.image || "/images.jpg",
      });
      setEventHighlightsInput(
        Array.isArray(event.highlights)
          ? event.highlights.join("\n")
          : typeof event.highlights === "string"
          ? event.highlights
          : ""
      );
    } else {
      setEditingEvent({
        title: "",
        slug: "",
        dates: "",
        time: "09:30 AM - 04:30 PM",
        mode: "Offline",
        price: "Free",
        club: clubDisplayName,
        location: "SAC Advanced Computing Lab, AITAM",
        organizer: `${clubDisplayName} & AITAM SAC`,
        about: "",
        highlights: [],
        prerequisites: "Open to all interested students.",
        mentor: "",
        mentorRole: "",
        color: clubTheme.colorVar || "var(--club-teal)",
        icon: "Calendar",
        status: "approved",
        image: "/images.jpg",
      });
      setEventHighlightsInput("");
    }
    setIsEventModalOpen(true);
  };

  const handlePosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }
    setIsUploadingPoster(true);
    try {
      const res = await uploadImage(file);
      if (res.success && res.url) {
        setEditingEvent((prev) => ({ ...prev, image: res.url }));
        toast.success("Event poster uploaded successfully!");
      } else {
        toast.error(res.message || "Failed to upload poster");
      }
    } catch {
      toast.error("Failed to upload poster");
    } finally {
      setIsUploadingPoster(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.title?.trim() || !editingEvent.dates?.trim() || !editingEvent.about?.trim()) {
      toast.error("Please fill in event title, dates, and overview description.");
      return;
    }

    setIsSavingEvent(true);
    try {
      const generatedSlug =
        editingEvent.slug ||
        editingEvent.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const highlights = eventHighlightsInput
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean);

      const payload: Partial<CmsEvent> = {
        ...editingEvent,
        title: editingEvent.title.trim(),
        slug: generatedSlug,
        club: editingEvent.club || clubDisplayName,
        organizer: editingEvent.organizer || `${clubDisplayName} & AITAM SAC`,
        highlights,
        status: editingEvent.status || "approved",
      };

      const res = await saveCmsEvent(payload);
      if (res.success) {
        toast.success(editingEvent.id ? "Event updated successfully!" : "Event created and published!");
        setIsEventModalOpen(false);
        setEditingEvent(null);
        await loadDashboard();
      } else {
        toast.error(res.message || "Failed to save event");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save event");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId?: number, eventSlug?: string, eventTitle?: string) => {
    if (!confirm(`Are you sure you want to delete event "${eventTitle || "this event"}"?`)) return;
    try {
      const res = await deleteCmsEvent({ id: eventId, slug: eventSlug });
      if (res.success) {
        toast.success("Event deleted successfully.");
        setEventsList((prev) => prev.filter((e) => (eventId ? e.id !== eventId : e.slug !== eventSlug)));
      } else {
        toast.error(res.message || "Failed to delete event");
      }
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const navItems: { tab: OrganizerTab; label: string; icon: React.ReactNode; badge?: string | number | undefined }[] = [
    { tab: "overview", label: "Dashboard", icon: <LayoutDashboard className="size-4 shrink-0" /> },
    { tab: "wings", label: "Sub-Wings", icon: <Layers className="size-4 shrink-0" />, badge: stats.totalWings },
    { tab: "members", label: "Members", icon: <Users className="size-4 shrink-0" />, badge: stats.totalMembers },
    { tab: "roadmaps", label: "Roadmaps", icon: <Compass className="size-4 shrink-0" />, badge: stats.totalRoadmaps },
    { tab: "tasks", label: "Tasks & Submissions", icon: <FileCheck className="size-4 shrink-0" />, badge: stats.pendingSubmissions > 0 ? `${stats.totalTasks} (${stats.pendingSubmissions})` : stats.totalTasks },
    { tab: "announcements", label: "Announcements", icon: <Megaphone className="size-4 shrink-0" />, badge: stats.totalAnnouncements },
    { tab: "events", label: "Club Events", icon: <Calendar className="size-4 shrink-0" />, badge: eventsList.length },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground font-sans">
      {/* ========== SIDEBAR ========== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card/95 backdrop-blur-md transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 px-5">
          <Link to="/" className="flex items-center gap-3">
            <div className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${clubTheme.gradient} text-white shadow-soft`}>
              <Crown className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-black tracking-tight text-brand-deep">
                AITAM SAC
              </span>
              <span className={`block text-[10px] font-semibold uppercase tracking-wider ${clubTheme.text}`}>
                Club Organizer LMS
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

        {/* Organizer Info & Managed Club Selector */}
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className={`grid size-8 place-items-center rounded-full bg-gradient-to-br ${clubTheme.gradient} text-white font-bold text-xs shadow-sm`}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                {userRoll ? `${userRoll} • ` : ""}Club Organizer
              </p>
            </div>
          </div>

          <div className="mt-3">
            {isAdmin ? (
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Managing Club:
                </label>
                <select
                  value={selectedClub}
                  onChange={(e) => setSelectedClubState(e.target.value)}
                  className={`w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground outline-none shadow-2xs ${clubTheme.ringFocus}`}
                >
                  {Object.values(CLUB_THEMES).map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Assigned Club:
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold ${clubTheme.badge}`}>
                  <Crown className="size-3.5" />
                  {clubDisplayName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto p-3 text-xs font-medium">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Club Governance
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
                    activeTab === item.tab
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
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
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
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
                  {navItems.find((n) => n.tab === activeTab)?.label || "Dashboard"}
                </h1>
                <span className="rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Organizer Portal
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                {clubDisplayName} • Lead Organizer Oversight
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${clubTheme.badge}`}>
              <Crown className="size-3" />
              {userName} ({userRoll || "Organizer"})
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

        {/* Content Area */}
        <div className="p-4 lg:p-6 space-y-6 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className={`size-8 animate-spin ${clubTheme.text}`} />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading organizer dashboard...</p>
            </div>
          ) : (
            <>
              {/* =============== OVERVIEW TAB =============== */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Welcome Banner */}
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${clubTheme.bannerGradient} p-6 text-white shadow-lg`}>
                    <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-2">
                          <Crown className="size-3" />
                          {clubDisplayName}
                        </div>
                        <h2 className="text-2xl font-black">
                          Welcome, Organizer {userName}!
                        </h2>
                        <p className="mt-1 text-sm text-white/80 max-w-lg">
                          You have full control over {clubDisplayName}. Manage sub-wings, roadmaps, assignments, student member enrollments, and verify submissions with marks allotment.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("tasks");
                            setTaskTab("submissions");
                          }}
                          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-900 shadow-soft hover:brightness-105 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          Verify Submissions & Allot Marks &rarr;
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("roadmaps")}
                          className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 flex items-center gap-1.5"
                        >
                          <Compass className="size-3.5" />
                          Roadmaps ({data?.roadmaps?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("events")}
                          className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 flex items-center gap-1.5"
                        >
                          <Calendar className="size-3.5" />
                          Club Events ({eventsList.length})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      { label: "Total Members", value: stats.totalMembers, sub: `${stats.activeMembers} active`, icon: <Users className="size-4" />, color: "text-blue-600 bg-blue-50 border-blue-200", tab: "members" as OrganizerTab },
                      { label: "Sub-Wings", value: stats.totalWings, sub: "Tracks managed", icon: <Layers className="size-4" />, color: "text-purple-600 bg-purple-50 border-purple-200", tab: "wings" as OrganizerTab },
                      { label: "Roadmaps", value: data?.roadmaps?.length || 0, sub: "Curriculum tracks", icon: <Compass className="size-4" />, color: "text-indigo-600 bg-indigo-50 border-indigo-200", tab: "roadmaps" as OrganizerTab },
                      { label: "Club Events", value: eventsList.length, sub: "Workshops & bootcamps", icon: <Calendar className="size-4" />, color: "text-rose-600 bg-rose-50 border-rose-200", tab: "events" as OrganizerTab },
                      { label: "Active Tasks", value: stats.totalTasks, sub: `${stats.pendingSubmissions} pending verification`, icon: <FileCheck className="size-4" />, color: "text-amber-600 bg-amber-50 border-amber-200", tab: "tasks" as OrganizerTab },
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setActiveTab(s.tab)}
                        className={`rounded-2xl border ${s.color} p-4 shadow-2xs text-left transition-all hover:scale-[1.02] hover:shadow-sm cursor-pointer`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {s.icon}
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</span>
                        </div>
                        <p className="text-2xl font-black">{s.value}</p>
                        <p className="text-[11px] font-medium opacity-70 mt-0.5">{s.sub}</p>
                      </button>
                    ))}
                  </div>

                  {/* Quick Panels */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Submissions Requiring Verification */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-600" /> Submissions Requiring Marks Allotment
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("tasks");
                            setTaskTab("submissions");
                          }}
                          className={`text-[11px] font-bold hover:underline ${clubTheme.text}`}
                        >
                          Full Queue &rarr;
                        </button>
                      </div>

                      {data?.submissions && data.submissions.filter((s) => s.status === "submitted" || s.status === "pending" || s.status === "under_review").length > 0 ? (
                        <div className="space-y-2">
                          {data.submissions
                            .filter((s) => s.status === "submitted" || s.status === "pending" || s.status === "under_review")
                            .slice(0, 3)
                            .map((sub) => (
                              <div key={sub.id} className="rounded-xl border border-border/60 bg-section p-3 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-foreground truncate">{sub.student_name}</span>
                                    <span className="font-mono text-[9px] bg-muted px-1.5 py-0.2 rounded border border-border">{sub.student_roll}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{sub.task_title || `Task #${sub.task_id}`}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModal(sub)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs hover:brightness-110 shrink-0"
                                >
                                  <Check className="size-3" /> Verify & Grade
                                </button>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <CheckCircle2 className="size-8 text-emerald-500/40 mx-auto" />
                          <p className="text-xs text-muted-foreground mt-2">All student submissions are verified!</p>
                        </div>
                      )}
                    </div>

                    {/* Sub-Wings Quick View */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Layers className="size-4 text-purple-600" /> Sub-Wings & Leads
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleOpenWingModal()}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold hover:underline ${clubTheme.text}`}
                        >
                          <Plus className="size-3" /> Add Wing
                        </button>
                      </div>
                      {data?.wings && data.wings.length > 0 ? (
                        <div className="space-y-2">
                          {data.wings.slice(0, 3).map((w) => (
                            <div key={w.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-section px-3 py-2">
                              <div>
                                <p className="text-xs font-bold text-foreground">{w.wing_name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  Lead: {w.lead_name ? (
                                    <span className="font-semibold text-foreground">{w.lead_name}</span>
                                  ) : (
                                    <span className="text-amber-600 font-medium">No lead appointed</span>
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenWingModal(w)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Edit Sub-Wing"
                              >
                                <Pencil className="size-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-xs text-muted-foreground">No sub-wings yet.</p>
                          <button
                            type="button"
                            onClick={() => handleOpenWingModal()}
                            className="mt-2 text-xs font-bold text-brand hover:underline"
                          >
                            + Create First Sub-Wing
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =============== SUB-WINGS TAB =============== */}
              {activeTab === "wings" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Sub-Wings & Specializations</h2>
                      <p className="text-xs text-muted-foreground">
                        Configure specialized wings, tracks, and student leads for {clubDisplayName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenWingModal()}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft transition-all ${clubTheme.badgeSolid} hover:brightness-110`}
                    >
                      <Plus className="size-4" /> Add Sub-Wing
                    </button>
                  </div>

                  {data?.wings && data.wings.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.wings.map((w) => (
                        <div key={w.id} className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-lg transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="grid size-10 place-items-center rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
                                <Layers className="size-5" />
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenWingModal(w)}
                                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
                                  title="Edit Sub-Wing"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => w.id && handleDeleteWing(w.id, w.wing_name)}
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                  title="Delete Sub-Wing"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                            <h3 className="text-sm font-bold text-foreground">{w.wing_name}</h3>
                            {w.description && (
                              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{w.description}</p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <User className="size-3.5 text-muted-foreground" />
                                {w.lead_name ? (
                                  <span className="text-xs font-bold text-foreground">{w.lead_name}</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                                    No Lead Appointed
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenWingModal(w, undefined, true)}
                                className="text-[10px] font-bold text-brand hover:underline"
                              >
                                {w.lead_name ? "Change Lead" : "+ Appoint Lead"}
                              </button>
                            </div>
                            {w.lead_roll_number && (
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="size-3 text-purple-600" />
                                <span className="font-mono text-[10px] font-bold text-purple-700">{w.lead_roll_number}</span>
                                {w.lead_year && (
                                  <span className="text-[10px] text-muted-foreground">({w.lead_year})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-section p-12 text-center">
                      <Layers className="size-10 text-muted-foreground/30 mx-auto" />
                      <p className="mt-3 text-sm font-semibold text-muted-foreground">No sub-wings configured yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* =============== MEMBERS TAB =============== */}
              {activeTab === "members" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Club Members Directory</h2>
                      <p className="text-xs text-muted-foreground">Inspect enrolled students and appoint track leads for sub-wings</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      <div className="relative flex-1 sm:flex-none">
                        <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Search student..."
                          className={`w-full sm:w-48 rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none shadow-2xs ${clubTheme.ringFocus}`}
                        />
                      </div>
                      <select
                        value={memberStatusFilter}
                        onChange={(e) => setMemberStatusFilter(e.target.value)}
                        className={`rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none shadow-2xs ${clubTheme.ringFocus}`}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                        <option value="alumni">Alumni</option>
                      </select>

                      <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        <Users className="size-3.5 text-brand shrink-0" />
                        <span>Enrolled Student Members</span>
                      </div>
                    </div>
                  </div>

                  {/* Informative governance alert */}
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-2.5 text-xs text-foreground/90 flex items-center gap-2">
                    <Crown className="size-4 text-brand shrink-0" />
                    <span>
                      <strong>Club Organizer Governance:</strong> Inspect enrolled student members in your club and designate qualified student members as Sub-Wing Leads.
                    </span>
                  </div>

                  {/* Members Table */}
                  <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                            <th className="px-4 py-3 text-left">Student</th>
                            <th className="px-4 py-3 text-left">Roll Number</th>
                            <th className="px-4 py-3 text-left hidden md:table-cell">Email / Phone</th>
                            <th className="px-4 py-3 text-left">Year</th>
                            <th className="px-4 py-3 text-left hidden sm:table-cell">Wing / Track</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Appoint Wing Lead</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {filteredMembers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                <Users className="size-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                                <p className="font-semibold text-xs text-foreground">No club members found</p>
                                <p className="text-[11px] mt-0.5">
                                  {memberSearch
                                    ? `No members match "${memberSearch}". Try clearing your search.`
                                    : "No students are currently registered in this club directory."}
                                </p>
                              </td>
                            </tr>
                          ) : (
                            filteredMembers.map((m, idx) => (
                              <tr key={m.id ? `m-${m.id}` : m.roll_number ? `m-${m.roll_number}` : `m-idx-${idx}`} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-foreground">{m.name || "Unnamed Student"}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-mono font-bold text-[10px] uppercase bg-muted border border-border px-1.5 py-0.5 rounded">
                                    {m.roll_number || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                                  <div>{m.email || "—"}</div>
                                  {m.phone && <div className="text-[10px] text-muted-foreground/80">{m.phone}</div>}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{m.year_of_study || "—"}</td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <select
                                    value={m.wing_name || ""}
                                    onChange={(e) => handleAssignMemberWing(m, e.target.value)}
                                    className="rounded-xl border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground outline-none shadow-2xs hover:border-brand focus:border-brand cursor-pointer transition-colors"
                                    title="Select or change this member's sub-wing"
                                  >
                                    <option value="">— Select Wing —</option>
                                    {data?.wings?.map((w) => (
                                      <option key={w.id || w.wing_slug || w.wing_name} value={w.wing_name}>
                                        {w.wing_name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                    m.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    m.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    m.status === "suspended" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}>
                                    {m.status ? m.status.toUpperCase() : "ACTIVE"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const targetWing = data?.wings?.find(
                                        (w) => w.wing_name === m.wing_name || w.wing_slug === m.wing_name
                                      ) || data?.wings?.[0];
                                      handleOpenWingModal(targetWing, m);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition-colors shadow-2xs cursor-pointer"
                                    title={`Appoint ${m.name || "Member"} as Sub-Wing Track Lead`}
                                  >
                                    <Crown className="size-3" /> Appoint Lead
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =============== ROADMAPS TAB =============== */}
              {activeTab === "roadmaps" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Club Roadmaps & Specializations</h2>
                      <p className="text-xs text-muted-foreground">
                        Create, organize, and manage tracks (Web Dev, App Dev, Game Dev, etc.) and curriculum
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenRoadmapModal()}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft transition-all ${clubTheme.badgeSolid} hover:brightness-110`}
                    >
                      <Plus className="size-4" /> Create Roadmap
                    </button>
                  </div>

                  {data?.roadmaps && data.roadmaps.length > 0 ? (
                    <div className="space-y-4">
                      {data.roadmaps.map((rm) => {
                        const totalPhases = rm.phases?.length || 0;
                        const totalModules = rm.phases?.reduce((acc: number, p: any) => acc + (p.modules?.length || 0), 0) || 0;
                        const totalLessons = rm.phases?.reduce(
                          (acc: number, p: any) =>
                            acc + (p.modules?.reduce((mAcc: number, m: any) => mAcc + (m.lessons?.length || 0), 0) || 0),
                          0
                        ) || 0;

                        return (
                          <div key={rm.id || rm.sub_club_slug || rm.title} className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-brand/30">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${clubTheme.badge}`}>
                                    {rm.sub_club_slug || "Track"}
                                  </span>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${rm.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                    {rm.is_active ? "Active" : "Inactive Draft"}
                                  </span>
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold border bg-muted/60 text-muted-foreground border-border">
                                    {totalPhases} {totalPhases === 1 ? "Phase" : "Phases"}
                                  </span>
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold border bg-muted/60 text-muted-foreground border-border">
                                    {totalModules} Modules
                                  </span>
                                  {totalLessons > 0 && (
                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold border bg-muted/60 text-muted-foreground border-border">
                                      {totalLessons} Lessons
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                  <Compass className={`size-4.5 shrink-0 ${clubTheme.text}`} />
                                  {rm.title}
                                </h3>
                                {rm.description && (
                                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{rm.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRoadmapModal(rm)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs cursor-pointer"
                                >
                                  <Pencil className="size-3.5 text-brand" /> Edit Curriculum
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRoadmap(rm.id, rm.title)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" /> Delete
                                </button>
                              </div>
                            </div>

                            {/* Curriculum Phases & Modules Breakdown */}
                            {rm.phases && rm.phases.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-border/70 space-y-2.5">
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Course Curriculum Structure:
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {rm.phases.map((ph: any, pIdx: number) => (
                                    <div key={ph.id || pIdx} className="rounded-xl border border-border/80 bg-muted/30 p-3">
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <h4 className="text-xs font-bold text-foreground truncate">
                                          {ph.title || `Phase ${pIdx + 1}`}
                                        </h4>
                                        <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                                          {ph.modules?.length || 0} mods
                                        </span>
                                      </div>
                                      {ph.description && (
                                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                                          {ph.description}
                                        </p>
                                      )}
                                      <div className="space-y-1">
                                        {ph.modules?.slice(0, 3).map((mod: any, mIdx: number) => (
                                          <div key={mod.id || mIdx} className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                                            <span className="size-1.5 rounded-full bg-brand shrink-0" />
                                            <span className="truncate">{mod.title}</span>
                                          </div>
                                        ))}
                                        {(ph.modules?.length || 0) > 3 && (
                                          <span className="text-[10px] font-semibold text-brand block">
                                            +{ph.modules.length - 3} more modules
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-section p-12 text-center">
                      <Compass className="size-10 text-muted-foreground/30 mx-auto" />
                      <p className="mt-3 text-sm font-semibold text-muted-foreground">No roadmaps created yet for {clubDisplayName}</p>
                    </div>
                  )}
                </div>
              )}

              {/* =============== TASKS & SUBMISSIONS TAB =============== */}
              {activeTab === "tasks" && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Assignments & Submissions Verification</h2>
                      <p className="text-xs text-muted-foreground">Verify student deliverables, allot marks, and manage track assignments</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenTaskModal()}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft transition-all ${clubTheme.badgeSolid} hover:brightness-110`}
                    >
                      <Plus className="size-4" /> Create Task
                    </button>
                  </div>

                  {/* Sub-Tabs: Submissions Queue vs Manage Tasks */}
                  <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-2xl w-fit border border-border">
                    <button
                      type="button"
                      onClick={() => setTaskTab("submissions")}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        taskTab === "submissions"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>Verify Submissions & Allot Marks</span>
                      <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                        stats.pendingSubmissions > 0
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {data?.submissions?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskTab("tasks")}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        taskTab === "tasks"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText className="size-3.5 text-brand" />
                      <span>Assignments & Tasks ({data?.tasks?.length || 0})</span>
                    </button>
                  </div>

                  {/* SUB-VIEW 1: SUBMISSIONS VERIFICATION QUEUE */}
                  {taskTab === "submissions" && (
                    <div className="space-y-4">
                      {/* Filter Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                          {[
                            { key: "all", label: "All Submissions", count: data?.submissions?.length || 0 },
                            { key: "pending", label: "Needs Verification", count: stats.pendingSubmissions },
                            { key: "approved", label: "Verified & Graded", count: stats.approvedSubmissions },
                            { key: "changes_requested", label: "Changes Requested", count: (data?.submissions || []).filter((s) => s.status === "changes_requested").length },
                            { key: "rejected", label: "Rejected", count: stats.rejectedSubmissions },
                          ].map((f) => (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => setSubmissionStatusFilter(f.key)}
                              className={`rounded-full px-3 py-1 text-xs font-bold transition-all shrink-0 ${
                                submissionStatusFilter === f.key
                                  ? `${clubTheme.badgeSolid} text-white shadow-2xs`
                                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {f.label} ({f.count})
                            </button>
                          ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            value={submissionSearch}
                            onChange={(e) => setSubmissionSearch(e.target.value)}
                            placeholder="Search by student or roll..."
                            className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Submissions Queue Cards */}
                      {filteredSubmissions && filteredSubmissions.length > 0 ? (
                        <div className="space-y-3">
                          {filteredSubmissions.map((s) => (
                            <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card hover:border-brand/40 transition-all">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-foreground">{s.student_name}</span>
                                    <span className="font-mono text-xs font-bold bg-muted text-foreground px-2 py-0.5 rounded-md border border-border">
                                      {s.student_roll}
                                    </span>
                                    <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[10px] font-bold">
                                      Task: {s.task_title || `Task #${s.task_id}`}
                                    </span>
                                    {s.task_track && (
                                      <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.2 text-[9px] font-bold uppercase">
                                        {s.task_track}
                                      </span>
                                    )}
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase ${
                                      s.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      s.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                      s.status === "changes_requested" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                      "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}>
                                      {s.status === "submitted" || s.status === "under_review" || s.status === "pending" ? "Needs Verification" : s.status}
                                    </span>
                                  </div>

                                  {/* Submitted URL */}
                                  {s.submission_url && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[11px] font-bold text-muted-foreground">Deliverable:</span>
                                      <a
                                        href={s.submission_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono break-all"
                                      >
                                        <ExternalLink className="size-3.5 shrink-0" /> {s.submission_url}
                                      </a>
                                    </div>
                                  )}

                                  {s.notes && (
                                    <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50 italic">
                                      Notes: "{s.notes}"
                                    </p>
                                  )}

                                  {/* Marks & Evaluator feedback */}
                                  <div className="flex items-center gap-4 text-xs flex-wrap pt-1">
                                    {s.score !== null && s.score !== undefined ? (
                                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                                        <Award className="size-4 text-amber-500" />
                                        <span>Marks Allotted: <strong className="text-brand text-sm">{s.score}</strong> / {s.max_score || 100}</span>
                                      </div>
                                    ) : (
                                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                        <Clock className="size-3.5" /> No marks allotted yet
                                      </span>
                                    )}

                                    {s.reviewer_name && (
                                      <span className="text-muted-foreground text-[11px]">
                                        Verified by: <strong>{s.reviewer_name}</strong>
                                      </span>
                                    )}

                                    {s.reviewed_at && (
                                      <span className="text-muted-foreground text-[11px]">
                                        on {new Date(s.reviewed_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>

                                  {s.feedback && (
                                    <p className="text-xs text-brand font-medium">
                                      Remarks: {s.feedback}
                                    </p>
                                  )}
                                </div>

                                <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReviewModal(s)}
                                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-soft transition-all ${clubTheme.badgeSolid} hover:brightness-110 w-full lg:w-auto`}
                                  >
                                    <Check className="size-4" />
                                    {s.score !== null && s.score !== undefined ? "Edit Marks & Review" : "Verify & Allot Marks"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-section p-12 text-center">
                          <CheckCircle2 className="size-10 text-muted-foreground/30 mx-auto" />
                          <p className="mt-3 text-sm font-semibold text-muted-foreground">
                            {submissionStatusFilter === "pending"
                              ? "No pending submissions requiring verification right now."
                              : "No submissions found."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-VIEW 2: ASSIGNMENTS & TASKS LIST */}
                  {taskTab === "tasks" && (
                    <>
                      {data?.tasks && data.tasks.length > 0 ? (
                        <div className="space-y-4">
                          {data.tasks.map((t) => (
                            <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    {t.sub_club_slug && (
                                      <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[10px] font-bold uppercase">
                                        {t.sub_club_slug}
                                      </span>
                                    )}
                                    <span className="rounded-full bg-muted text-foreground px-2 py-0.5 text-[10px] font-bold border border-border">
                                      {t.priority}
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                                  {t.description && (
                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                                    {t.due_date && <span>Due: {new Date(t.due_date).toLocaleDateString()}</span>}
                                    <span className="font-mono font-bold text-foreground">Max: {t.max_score} pts</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTaskModal(t)}
                                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground"
                                    title="Edit Task"
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(t.id, t.title)}
                                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-section p-12 text-center">
                          <FileCheck className="size-10 text-muted-foreground/30 mx-auto" />
                          <p className="mt-3 text-sm font-semibold text-muted-foreground">No tasks created yet</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* =============== ANNOUNCEMENTS TAB =============== */}
              {activeTab === "announcements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Club Announcements</h2>
                      <p className="text-xs text-muted-foreground">Broadcast news, workshop schedules, and updates to members</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAnnouncementModal()}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft transition-all ${clubTheme.badgeSolid} hover:brightness-110`}
                    >
                      <Plus className="size-4" /> Post Notice
                    </button>
                  </div>

                  {data?.announcements && data.announcements.length > 0 ? (
                    <div className="space-y-3">
                      {data.announcements.map((a) => (
                        <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                                <Megaphone className="size-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">{a.content}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenAnnouncementModal(a)}
                                className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAnnouncement(a.id, a.title)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-section p-12 text-center">
                      <Megaphone className="size-10 text-muted-foreground/30 mx-auto" />
                      <p className="mt-3 text-sm font-semibold text-muted-foreground">No announcements posted yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* =============== EVENTS TAB =============== */}
              {activeTab === "events" && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Club Events & Workshops</h2>
                      <p className="text-xs text-muted-foreground">
                        Organize, schedule, and publish hackathons, bootcamps, and technical workshops for {clubDisplayName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEventModal()}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft transition-all ${clubTheme.badgeSolid} hover:brightness-110 cursor-pointer`}
                    >
                      <Plus className="size-4" /> Create Event
                    </button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xs">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        placeholder="Search events by title, venue, or mode..."
                        className="w-full rounded-xl border border-border bg-muted/20 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-muted-foreground mr-1">Status:</span>
                      {(["all", "approved", "pending", "draft"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setEventFilter(st)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-colors cursor-pointer ${
                            eventFilter === st
                              ? "bg-brand text-white shadow-2xs"
                              : "border border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {st === "approved" ? "Published" : st === "all" ? "All Events" : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Events Grid */}
                  {(() => {
                    const filteredEvents = eventsList.filter((e) => {
                      const matchesStatus =
                        eventFilter === "all" ? true : (e.status || "approved") === eventFilter;
                      const q = eventSearch.toLowerCase().trim();
                      const matchesSearch =
                        !q ||
                        (e.title || "").toLowerCase().includes(q) ||
                        (e.location || "").toLowerCase().includes(q) ||
                        (e.mode || "").toLowerCase().includes(q) ||
                        (e.about || "").toLowerCase().includes(q);
                      return matchesStatus && matchesSearch;
                    });

                    if (filteredEvents.length === 0) {
                      return (
                        <div className="rounded-2xl border border-dashed border-border bg-section p-12 text-center">
                          <Calendar className="size-10 text-muted-foreground/30 mx-auto" />
                          <p className="mt-3 text-sm font-semibold text-foreground">No events found for {clubDisplayName}</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            Organizers can schedule technical bootcamps, workshops, and hackathons. Published events appear on the public SAC portal.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenEventModal()}
                            className={`mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft transition-all ${clubTheme.badgeSolid} hover:brightness-110 cursor-pointer`}
                          >
                            <Plus className="size-3.5" /> Create First Event
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredEvents.map((evt) => {
                          const highlights = Array.isArray(evt.highlights)
                            ? evt.highlights
                            : typeof evt.highlights === "string"
                            ? (() => {
                                try {
                                  return JSON.parse(evt.highlights);
                                } catch {
                                  return [evt.highlights];
                                }
                              })()
                            : [];

                          const statusBadgeClass =
                            evt.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : evt.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-600 border-slate-200";

                          return (
                            <div
                              key={evt.id || evt.slug}
                              className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-brand/40 flex flex-col justify-between overflow-hidden group"
                            >
                              {evt.image && evt.image !== "/images.jpg" && !evt.image.endsWith("/images.jpg") && (
                                <div className="-mx-5 -mt-5 mb-4 h-36 overflow-hidden relative bg-muted/40">
                                  <img
                                    src={evt.image}
                                    alt={evt.title}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${statusBadgeClass}`}>
                                      {evt.status === "approved" ? "Published" : evt.status || "Approved"}
                                    </span>
                                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                                      {evt.mode || "Offline"}
                                    </span>
                                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                                      {evt.price || "Free"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEventModal(evt)}
                                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-2xs cursor-pointer"
                                      title="Edit Event"
                                    >
                                      <Pencil className="size-3.5 text-brand" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteEvent(evt.id, evt.slug, evt.title)}
                                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors shadow-2xs cursor-pointer"
                                      title="Delete Event"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <h3 className="text-base font-bold text-foreground mb-2 flex items-start gap-2">
                                  <Calendar className={`size-4.5 mt-0.5 shrink-0 ${clubTheme.text}`} />
                                  <span>{evt.title}</span>
                                </h3>

                                <div className="space-y-1.5 mb-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="size-3.5 shrink-0 text-muted-foreground/80" />
                                    <span className="font-semibold text-foreground/80">{evt.dates}</span>
                                    {evt.time && (
                                      <>
                                        <span className="text-muted-foreground/40">•</span>
                                        <Clock className="size-3.5 shrink-0 text-muted-foreground/80" />
                                        <span>{evt.time}</span>
                                      </>
                                    )}
                                  </div>
                                  {evt.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="size-3.5 shrink-0 text-rose-500" />
                                      <span className="truncate">{evt.location}</span>
                                    </div>
                                  )}
                                </div>

                                {evt.about && (
                                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                                    {evt.about}
                                  </p>
                                )}

                                {highlights && highlights.length > 0 && (
                                  <div className="pt-2 border-t border-border/60">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                      Key Highlights:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {highlights.slice(0, 3).map((hl: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className="rounded-lg bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-foreground/90 border border-border"
                                        >
                                          {hl}
                                        </span>
                                      ))}
                                      {highlights.length > 3 && (
                                        <span className="rounded-lg bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                          +{highlights.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="truncate">Organized by: <strong className="text-foreground">{evt.organizer || clubDisplayName}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEventModal(evt)}
                                  className="text-xs font-bold text-brand hover:underline cursor-pointer shrink-0"
                                >
                                  Manage &rarr;
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ============================================================= */}
      {/* MODAL: SUBMISSION REVIEW & GRADING */}
      {/* ============================================================= */}
      {isReviewModalOpen && reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Verify Submission & Allot Marks</h3>
                <p className="text-xs text-muted-foreground">Inspect submitted work, assign points, and provide evaluation remarks</p>
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
              {/* Student & Task Details */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground block">{reviewingSubmission.student_name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      Task: <strong className="text-foreground">{reviewingSubmission.task_title || `Task #${reviewingSubmission.task_id}`}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] font-bold bg-card border border-border px-2 py-0.5 rounded block">
                      {reviewingSubmission.student_roll}
                    </span>
                    <span className="text-[10px] font-bold text-brand mt-0.5 block">
                      Max: {reviewingSubmission.max_score || 100} pts
                    </span>
                  </div>
                </div>

                {reviewingSubmission.submission_url && (
                  <div className="rounded-xl border border-border/60 bg-card p-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Submitted Project / Code URL:
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={reviewingSubmission.submission_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono break-all line-clamp-1"
                      >
                        <ExternalLink className="size-3.5 shrink-0" /> {reviewingSubmission.submission_url}
                      </a>
                      <a
                        href={reviewingSubmission.submission_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 text-[11px] font-bold shrink-0"
                      >
                        <ExternalLink className="size-3" /> Open Work
                      </a>
                    </div>
                  </div>
                )}

                {reviewingSubmission.notes && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Student's Notes:</label>
                    <p className="text-xs text-muted-foreground bg-card p-2.5 rounded-xl border border-border/60">
                      "{reviewingSubmission.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Status and Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Verification Status *</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none font-bold"
                  >
                    <option value="approved">Verified & Approved (Pass)</option>
                    <option value="changes_requested">Changes Requested</option>
                    <option value="under_review">Under Verification</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-foreground">Marks Allotted *</label>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                      / {reviewingSubmission.max_score || 100}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(Number(e.target.value))}
                    min={0}
                    max={reviewingSubmission.max_score || 100}
                    required
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none font-mono font-bold text-base"
                  />
                </div>
              </div>

              {/* Quick preset marks buttons */}
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

              {/* Feedback */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Feedback / Evaluator Remarks</label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Provide comments on code quality, responsiveness, UI execution, or suggestions for next iteration..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              {/* Footer */}
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
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                >
                  <Check className="size-4" /> Save Verification & Allot Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUB-WING CRUD */}
      {isWingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {editingWing ? "Edit Sub-Wing / Track" : "Create New Sub-Wing / Track"}
              </h3>
              <button
                type="button"
                onClick={() => setIsWingModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWing} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                  <span>Select Target Sub-Wing / Track *</span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Choose which wing to configure or assign
                  </span>
                </label>
                <select
                  value={editingWing?.wing_name || wingForm.wing_name}
                  onChange={(e) => {
                    const sel = e.target.value;
                    if (sel === "__new__") {
                      setEditingWing(null);
                      setWingForm((prev) => ({
                        ...prev,
                        wing_name: "",
                        wing_slug: "",
                        description: "",
                      }));
                    } else {
                      const matched = data?.wings?.find(
                        (w) => w.wing_name === sel || w.wing_slug === sel
                      );
                      if (matched) {
                        setEditingWing(matched);
                        setWingForm((prev) => ({
                          ...prev,
                          wing_name: matched.wing_name || "",
                          wing_slug: matched.wing_slug || "",
                          description: matched.description || "",
                          lead_name: prev.lead_name || matched.lead_name || "",
                          lead_roll_number: prev.lead_roll_number || matched.lead_roll_number || "",
                          lead_email: prev.lead_email || matched.lead_email || "",
                          lead_phone: prev.lead_phone || matched.lead_phone || "",
                          lead_year: prev.lead_year || matched.lead_year || "3rd Year",
                        }));
                      } else {
                        setWingForm((prev) => ({ ...prev, wing_name: sel }));
                      }
                    }
                  }}
                  className={`w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none shadow-2xs ${clubTheme.ringFocus} cursor-pointer`}
                >
                  <option value="" disabled>-- Select a Sub-Wing / Track --</option>
                  {data?.wings && data.wings.length > 0 ? (
                    data.wings.map((w) => (
                      <option key={w.id || w.wing_slug || w.wing_name} value={w.wing_name}>
                        {w.wing_name} {w.lead_name ? `(Current Lead: ${w.lead_name})` : "(No Lead Appointed)"}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Web Development Wing">Web Development Wing</option>
                      <option value="Mobile App Development Wing">Mobile App Development Wing</option>
                      <option value="Game Development Wing">Game Development Wing</option>
                      <option value="AI & Machine Learning Wing">AI & Machine Learning Wing</option>
                      <option value="Cloud & DevOps Wing">Cloud & DevOps Wing</option>
                    </>
                  )}
                  <option value="__new__">+ Create New Sub-Wing...</option>
                </select>

                {(!editingWing || wingForm.wing_name === "") && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      New Sub-Wing Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={wingForm.wing_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                        setWingForm({ ...wingForm, wing_name: val, wing_slug: slug });
                      }}
                      placeholder="e.g. Cybersecurity Wing, Robotics Wing"
                      className={`w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground outline-none ${clubTheme.ringFocus}`}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Appoint Club Track Lead (Search or Appoint Member)
                </label>

                {wingForm.lead_name ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7 place-items-center rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xs">
                        <Crown className="size-4" />
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">{wingForm.lead_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {wingForm.lead_roll_number ? `${wingForm.lead_roll_number} • ` : ""}{wingForm.lead_year || "3rd Year"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWingForm({ ...wingForm, lead_name: "", lead_roll_number: "", lead_email: "", lead_phone: "" })}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs cursor-pointer"
                    >
                      Change Lead
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={leadSearchInputRef}
                        type="text"
                        value={leadMemberSearch}
                        onChange={(e) => setLeadMemberSearch(e.target.value)}
                        placeholder="Search enrolled member by name or roll..."
                        className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground outline-none"
                      />
                    </div>

                    {searchedLeadMembers.length > 0 && (
                      <div className="max-h-36 overflow-y-auto rounded-xl border border-border bg-muted/30 p-1 mb-2 space-y-1">
                        {searchedLeadMembers.map((sm) => (
                          <div
                            key={sm.id}
                            onClick={() => handleSelectMemberAsLead(sm)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-card cursor-pointer text-xs transition-colors"
                          >
                            <div>
                              <span className="font-bold text-foreground block">{sm.name}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{sm.roll_number}</span>
                            </div>
                            <span className="text-[10px] font-bold text-brand">+ Select as Lead</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsWingModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                >
                  Save Sub-Wing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL: TASK CRUD */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {editingTask ? "Edit Assignment / Task" : "Create New Assignment / Task"}
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Task 1: Responsive Portfolio or Flutter Counter App"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Max Score</label>
                  <input
                    type="number"
                    value={taskForm.max_score}
                    onChange={(e) => setTaskForm({ ...taskForm, max_score: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ANNOUNCEMENT CRUD */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {editingAnnouncement ? "Edit Announcement" : "Broadcast Club Announcement"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g. Mandatory Track Meetup this Friday"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Notice Content *</label>
                <textarea
                  rows={3}
                  required
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Write message details, venue, or online links..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ROADMAP CRUD */}
      {/* ============================================================= */}
      {isRoadmapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingRoadmap.id ? "Edit Club Roadmap & Curriculum" : "Create New Track Roadmap"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Structure learning phases, modules, and lessons for your club members
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoadmapModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoadmap} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Roadmap Title *</label>
                  <input
                    type="text"
                    required
                    value={editingRoadmap.title}
                    onChange={(e) => setEditingRoadmap({ ...editingRoadmap, title: e.target.value })}
                    placeholder="e.g. Full-Stack Web Engineering 2025-2026"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Sub-Club Wing / Track *</label>
                  <select
                    value={editingRoadmap.sub_club_slug}
                    onChange={(e) => setEditingRoadmap({ ...editingRoadmap, sub_club_slug: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand cursor-pointer"
                  >
                    {data?.wings && data.wings.length > 0 ? (
                      data.wings.map((w) => (
                        <option key={w.wing_slug || w.wing_name} value={w.wing_slug || w.wing_name}>
                          {w.wing_name} ({w.wing_slug})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="web-dev">Web Development Wing (web-dev)</option>
                        <option value="app-dev">Mobile App Development Wing (app-dev)</option>
                        <option value="game-dev">Game Development Wing (game-dev)</option>
                        <option value="ai-dev">AI & ML Wing (ai-dev)</option>
                        <option value="cloud-dev">Cloud & DevOps Wing (cloud-dev)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingRoadmap.description}
                  onChange={(e) => setEditingRoadmap({ ...editingRoadmap, description: e.target.value })}
                  placeholder="Overview of this track curriculum, prerequisite stack, and competencies gained..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none resize-none focus:border-brand"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={editingRoadmap.is_active === 1}
                    onChange={(e) => setEditingRoadmap({ ...editingRoadmap, is_active: e.target.checked ? 1 : 0 })}
                    className="rounded border-border text-brand focus:ring-brand size-4"
                  />
                  <span>Active Roadmap (Visible to enrolled club members)</span>
                </label>
              </div>

              {/* Phases List */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Curriculum Phases ({editingRoadmap.phases?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextOrder = (editingRoadmap.phases?.length || 0) + 1;
                      setEditingRoadmap({
                        ...editingRoadmap,
                        phases: [
                          ...(editingRoadmap.phases || []),
                          {
                            title: `Phase ${nextOrder}: New Topic`,
                            description: "",
                            phase_order: nextOrder,
                            modules: [
                              {
                                title: `Module ${nextOrder}.1: Fundamentals`,
                                description: "",
                                estimated_hours: 8,
                                lessons: [],
                              },
                            ],
                          },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Add Phase
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {editingRoadmap.phases?.map((ph, pIdx) => (
                    <div key={pIdx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={ph.title}
                          onChange={(e) => {
                            const newPhases = [...editingRoadmap.phases];
                            const cur = newPhases[pIdx];
                            if (cur) {
                              cur.title = e.target.value;
                              setEditingRoadmap({ ...editingRoadmap, phases: newPhases });
                            }
                          }}
                          placeholder="Phase Title"
                          className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPhases = editingRoadmap.phases.filter((_, idx) => idx !== pIdx);
                            setEditingRoadmap({ ...editingRoadmap, phases: newPhases });
                          }}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove Phase"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={ph.description}
                        onChange={(e) => {
                          const newPhases = [...editingRoadmap.phases];
                          const cur = newPhases[pIdx];
                          if (cur) {
                            cur.description = e.target.value;
                            setEditingRoadmap({ ...editingRoadmap, phases: newPhases });
                          }
                        }}
                        placeholder="Phase summary / learning objectives"
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground outline-none"
                      />

                      {/* Modules inside phase */}
                      <div className="pl-3 border-l-2 border-border/80 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            Modules ({ph.modules?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPhases = [...editingRoadmap.phases];
                              const cur = newPhases[pIdx];
                              if (cur) {
                                const mOrder = (cur.modules?.length || 0) + 1;
                                cur.modules = [
                                  ...(cur.modules || []),
                                  {
                                    title: `Module ${pIdx + 1}.${mOrder}: Title`,
                                    description: "",
                                    estimated_hours: 6,
                                    lessons: [],
                                  },
                                ];
                                setEditingRoadmap({ ...editingRoadmap, phases: newPhases });
                              }
                            }}
                            className="text-[10px] font-bold text-brand hover:underline"
                          >
                            + Add Module
                          </button>
                        </div>
                        {ph.modules?.map((mod, mIdx) => (
                          <div key={mIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={mod.title}
                              onChange={(e) => {
                                const newPhases = [...editingRoadmap.phases];
                                const curPhase = newPhases[pIdx];
                                const curMod = curPhase?.modules?.[mIdx];
                                if (curMod) {
                                  curMod.title = e.target.value;
                                  setEditingRoadmap({ ...editingRoadmap, phases: newPhases });
                                }
                              }}
                              className="flex-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-foreground outline-none"
                              placeholder="Module Title"
                            />
                            <input
                              type="number"
                              value={mod.estimated_hours}
                              onChange={(e) => {
                                const newPhases = [...editingRoadmap.phases];
                                const curPhase = newPhases[pIdx];
                                const curMod = curPhase?.modules?.[mIdx];
                                if (curMod) {
                                  curMod.estimated_hours = Number(e.target.value);
                                  setEditingRoadmap({ ...editingRoadmap, phases: newPhases });
                                }
                              }}
                              className="w-14 rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] text-center text-foreground outline-none"
                              title="Estimated hours"
                            />
                            <span className="text-[10px] text-muted-foreground">hrs</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newPhases = [...editingRoadmap.phases];
                                const curPhase = newPhases[pIdx];
                                if (curPhase?.modules) {
                                  curPhase.modules = curPhase.modules.filter((_, idx) => idx !== mIdx);
                                  setEditingRoadmap({ ...editingRoadmap, phases: newPhases });
                                }
                              }}
                              className="text-rose-500 hover:text-rose-700"
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsRoadmapModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110 cursor-pointer`}
                >
                  Save Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CLUB EVENT CREATE / EDIT */}
      {/* ============================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleSaveEvent}
            className="w-full max-w-xl rounded-3xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95"
            style={{ height: "85vh", maxHeight: "85vh" }}
          >
            {/* Pinned Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-card z-10">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingEvent?.id ? "Edit Club Event" : "Create New Club Event"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Schedule workshops, hackathons, and bootcamps for {clubDisplayName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div
              className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 focus:outline-none overscroll-contain"
              style={{ overflowY: "auto", flex: "1 1 0%", minHeight: 0 }}
            >
                {/* Event Poster / Banner Upload */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="size-3.5 text-brand" />
                      <span>Event Poster / Photo</span>
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      PNG, JPG, WebP
                    </span>
                  </label>

                  <input
                    type="file"
                    ref={posterFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePosterFileChange}
                  />

                  {editingEvent?.image && editingEvent.image !== "/images.jpg" && !editingEvent.image.endsWith("/images.jpg") ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/40 group">
                      <img
                        src={editingEvent.image}
                        alt="Event poster preview"
                        className="w-full h-40 object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => posterFileInputRef.current?.click()}
                          disabled={isUploadingPoster}
                          className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs shadow-md hover:bg-neutral-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="size-3.5" />
                          {isUploadingPoster ? "Uploading..." : "Change Poster"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEvent((prev) => ({ ...prev, image: "/images.jpg" }))}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-md hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => posterFileInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-brand/60 hover:bg-brand/5 transition-all rounded-2xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <div className="size-10 rounded-full bg-muted group-hover:bg-brand/10 text-muted-foreground group-hover:text-brand flex items-center justify-center transition-colors">
                        {isUploadingPoster ? (
                          <RefreshCw className="size-5 animate-spin" />
                        ) : (
                          <Upload className="size-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {isUploadingPoster ? "Uploading poster..." : "Click to upload Event Poster / Photo"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Recommended ratio 16:9 (JPG, PNG, WebP)
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={editingEvent?.image === "/images.jpg" ? "" : editingEvent?.image || ""}
                      onChange={(e) => setEditingEvent((prev) => ({ ...prev, image: e.target.value || "/images.jpg" }))}
                      placeholder="Or enter direct image URL (https://...)"
                      className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-[11px] text-foreground outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={editingEvent?.title || ""}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Next-Gen Web & AI Hackathon 2026"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Event Dates *</label>
                    <input
                      type="text"
                      required
                      value={editingEvent?.dates || ""}
                      onChange={(e) => setEditingEvent((prev) => ({ ...prev, dates: e.target.value }))}
                      placeholder="e.g. 2025-10-15 to 2025-10-20"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Event Timing</label>
                    <input
                      type="text"
                      value={editingEvent?.time || ""}
                      onChange={(e) => setEditingEvent((prev) => ({ ...prev, time: e.target.value }))}
                      placeholder="e.g. 09:30 AM - 04:30 PM"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Event Mode</label>
                    <select
                      value={editingEvent?.mode || "Offline"}
                      onChange={(e) => setEditingEvent((prev) => ({ ...prev, mode: e.target.value as any }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="Offline">Offline</option>
                      <option value="Online">Online</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Fee / Price</label>
                    <input
                      type="text"
                      value={editingEvent?.price || "Free"}
                      onChange={(e) => setEditingEvent((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="Free or ₹150"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Status</label>
                    <select
                      value={editingEvent?.status || "approved"}
                      onChange={(e) => setEditingEvent((prev) => ({ ...prev, status: e.target.value as any }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="approved">Published (Approved)</option>
                      <option value="pending">Pending Review</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Venue / Location</label>
                    <input
                      type="text"
                      value={editingEvent?.location || ""}
                      onChange={(e) => setEditingEvent((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. SAC Advanced Computing Lab, AITAM"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Organizer Header</label>
                    <input
                      type="text"
                      value={editingEvent?.organizer || ""}
                      onChange={(e) => setEditingEvent((prev) => ({ ...prev, organizer: e.target.value }))}
                      placeholder={`e.g. ${clubDisplayName} & AITAM SAC`}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Event Overview & About *</label>
                  <textarea
                    rows={3}
                    required
                    value={editingEvent?.about || ""}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, about: e.target.value }))}
                    placeholder="Detailed description of the event, objective, hands-on activities, and key takeaways..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none resize-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Key Highlights <span className="text-muted-foreground font-normal">(One bullet per line)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={eventHighlightsInput}
                    onChange={(e) => setEventHighlightsInput(e.target.value)}
                    placeholder="Hands-on coding labs&#10;Certificate of participation upon completion&#10;Mentorship from industry engineers"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none resize-none focus:border-brand font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Prerequisites</label>
                  <input
                    type="text"
                    value={editingEvent?.prerequisites || ""}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, prerequisites: e.target.value }))}
                    placeholder="e.g. Basic understanding of programming. Open to all students."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Pinned Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-border bg-card shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent || isUploadingPoster}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110 disabled:opacity-50 cursor-pointer`}
                >
                  {(isSavingEvent || isUploadingPoster) && <RefreshCw className="size-3.5 animate-spin" />}
                  {editingEvent?.id ? "Update Event" : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        )}
    </div>
  );
}
