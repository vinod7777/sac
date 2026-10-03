import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  ExternalLink,
  FileCheck,
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
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  actOnEventApproval,
  deleteMember,
  fetchClubMembers,
  fetchClubsGovernance,
  fetchLmsAnnouncements,
  fetchLmsEventProposals,
  fetchLmsTasks,
  fetchOrganizerDashboard,
  fetchRoadmaps,
  reviewTaskSubmission,
  saveCmsEvent,
  saveLmsAnnouncement,
  saveMember,
  saveWing,
  updateMemberStatus,
  type ClubMember,
  type ClubOrganizer,
  type ClubWing,
  type LmsAnnouncement,
  type LmsEventProposal,
  type LmsRoadmap,
  type LmsTask,
  type LmsTaskSubmission,
  type OrganizerDashboardData,
} from "@/lib/api";
import { getClubTheme } from "@/lib/clubTheme";

export type MentorTab =
  | "overview"
  | "members"
  | "wings"
  | "evaluations"
  | "events"
  | "curriculum"
  | "announcements"
  | "leadership";

export interface StoredUser {
  id?: number | undefined;
  name?: string | undefined;
  email?: string | undefined;
  rollNumber?: string | undefined;
  roll_number?: string | undefined;
  role?: string | undefined;
  club?: string | undefined;
  year?: string | undefined;
  year_of_study?: string | undefined;
  managed_club?: string | undefined;
  managed_wing?: string | undefined;
}

interface MentorLmsProps {
  user: StoredUser | null;
  managedClub?: string | undefined;
  onLogout?: (() => void) | undefined;
}

export function MentorLms({ user, managedClub, onLogout }: MentorLmsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MentorTab>("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrganizerDashboardData | null>(null);
  const [events, setEvents] = useState<LmsEventProposal[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Member search & filter
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>("all");

  const clubSlug = managedClub || user?.managed_club || user?.club || "developers-club";
  const clubTheme = useMemo(() => getClubTheme(clubSlug), [clubSlug]);
  const clubDisplayName = clubTheme.name;

  const mentorName = user?.name || "Faculty Mentor";
  const mentorEmail = user?.email || "";

  // Load Mentor LMS Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [d, membersList, roadmapsList, tasksList, annList, eventsList, gov] = await Promise.all([
        fetchOrganizerDashboard(clubSlug),
        fetchClubMembers({ club: clubSlug }),
        fetchRoadmaps({ club_slug: clubSlug, all: 1 }),
        fetchLmsTasks({ club_slug: clubSlug }),
        fetchLmsAnnouncements(clubSlug),
        fetchLmsEventProposals(),
        fetchClubsGovernance(),
      ]);

      const allMembers = membersList || d?.members || [];
      const allRoadmaps = roadmapsList || d?.roadmaps || [];
      const allTasks = tasksList || d?.tasks || [];
      const allSubs = d?.submissions || [];
      const allAnn = annList || d?.announcements || [];
      const allWings = gov?.wings?.[clubSlug] || d?.wings || [];

      setData({
        ...d,
        members: allMembers,
        roadmaps: allRoadmaps,
        tasks: allTasks,
        submissions: allSubs,
        announcements: allAnn,
        wings: allWings,
        organizer: gov?.organizers?.[clubSlug] || d?.organizer || null,
        stats: {
          ...d?.stats,
          totalMembers: allMembers.length,
          activeMembers: allMembers.filter((m) => m.status === "active").length,
          pendingMembers: allMembers.filter((m) => m.status === "pending").length,
          suspendedMembers: allMembers.filter((m) => m.status === "suspended").length,
          totalWings: allWings.length,
          totalRoadmaps: allRoadmaps.length,
          totalTasks: allTasks.length,
          totalSubmissions: allSubs.length,
          pendingSubmissions: allSubs.filter((s) => s.status === "submitted" || s.status === "pending").length,
          approvedSubmissions: allSubs.filter((s) => s.status === "approved").length,
          rejectedSubmissions: allSubs.filter((s) => s.status === "rejected").length,
          totalAnnouncements: allAnn.length,
        },
      });

      // Filter events belonging to this club
      const relevantEvents = (eventsList || []).filter(
        (ev) => !ev.club || ev.club.toLowerCase().includes(clubSlug.replace("-", " ").toLowerCase()) || ev.club.toLowerCase().includes("general")
      );
      setEvents(relevantEvents.length > 0 ? relevantEvents : (eventsList || []));
    } catch (e) {
      console.warn("Failed to load Mentor LMS:", e);
      toast.error("Failed to load mentor overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    suspendedMembers: 0,
    totalWings: 0,
    totalRoadmaps: 0,
    totalTasks: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    totalAnnouncements: 0,
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    return data.members.filter((m) => {
      const matchSearch =
        !memberSearch ||
        m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.roll_number?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email?.toLowerCase().includes(memberSearch.toLowerCase());
      const matchStatus = memberStatusFilter === "all" || m.status === memberStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [data?.members, memberSearch, memberStatusFilter]);

  // Filtered submissions for mentor oversight
  const filteredSubmissions = useMemo(() => {
    if (!data?.submissions) return [];
    return data.submissions.filter((s) => {
      let matches = true;
      if (submissionFilter === "pending") matches = s.status === "submitted" || s.status === "pending";
      else if (submissionFilter === "approved") matches = s.status === "approved";
      else if (submissionFilter === "changes_requested") matches = s.status === "changes_requested";

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (s.student_name || "").toLowerCase().includes(q);
        const matchRoll = (s.student_roll || "").toLowerCase().includes(q);
        const matchTask = (s.task_title || "").toLowerCase().includes(q);
        matches = matches && (matchName || matchRoll || matchTask);
      }
      return matches;
    });
  }, [data?.submissions, submissionFilter, searchQuery]);

  // -------------------------------------------------------------
  // MENTOR MEMBER MANAGEMENT (ADD / REMOVE STUDENTS)
  // -------------------------------------------------------------
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: "",
    roll_number: "",
    email: "",
    phone: "",
    year_of_study: "2nd Year",
    department: "CSE",
    wing_name: "",
    status: "active" as "active" | "pending" | "suspended" | "alumni",
  });

  const handleOpenAddMemberModal = () => {
    setMemberForm({
      name: "",
      roll_number: "",
      email: "",
      phone: "",
      year_of_study: "2nd Year",
      department: "CSE",
      wing_name: data?.wings?.[0]?.wing_name || "General Member",
      status: "active",
    });
    setIsAddMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.roll_number.trim()) {
      toast.error("Student Name and Roll Number are required");
      return;
    }
    try {
      const res = await saveMember({
        club_slug: clubSlug,
        ...memberForm,
      });
      if (res.success) {
        toast.success(res.message || `Enrolled ${memberForm.name} to ${clubDisplayName}`);
        setIsAddMemberModalOpen(false);
        await loadData();
      } else {
        toast.error(res.message || "Failed to add member");
      }
    } catch {
      toast.error("Failed to enroll student member");
    }
  };

  const handleDeleteMember = async (m: ClubMember) => {
    if (!m.id) return;
    if (
      !confirm(
        `Are you sure you want to remove ${m.name} (${m.roll_number}) from ${clubDisplayName}? This action is authorized by Faculty Mentor.`
      )
    )
      return;
    try {
      const res = await deleteMember(m.id, {
        roll_number: m.roll_number,
        email: m.email,
      });
      if (res.success) {
        toast.success(res.message || `Removed ${m.name} from club records`);
        await loadData();
      } else {
        toast.error(res.message || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove student member");
    }
  };

  const handleToggleMemberStatus = async (id: number, nextStatus: string) => {
    try {
      const res = await updateMemberStatus(id, nextStatus);
      if (res.success) {
        toast.success(res.message || `Student status updated to ${nextStatus.toUpperCase()}`);
        await loadData();
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // -------------------------------------------------------------
  // MENTOR WING LEAD APPOINTMENT
  // -------------------------------------------------------------
  const [isAppointLeadModalOpen, setIsAppointLeadModalOpen] = useState(false);
  const [leadTargetMember, setLeadTargetMember] = useState<ClubMember | null>(null);
  const [selectedWingId, setSelectedWingId] = useState<number>(0);

  const handleOpenAppointLeadModal = (member: ClubMember) => {
    setLeadTargetMember(member);
    if (data?.wings && data.wings.length > 0) {
      const defaultWing = data.wings.find((w) => w.wing_name === member.wing_name) || data.wings[0];
      setSelectedWingId(defaultWing?.id || 0);
    }
    setIsAppointLeadModalOpen(true);
  };

  const handleConfirmAppointLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadTargetMember || !selectedWingId) {
      toast.error("Please select a valid sub-wing");
      return;
    }
    const targetWing = data?.wings?.find((w) => w.id === selectedWingId);
    if (!targetWing) return;

    try {
      const res = await saveWing({
        id: targetWing.id,
        club_slug: clubSlug,
        wing_name: targetWing.wing_name,
        wing_slug: targetWing.wing_slug || targetWing.wing_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        lead_name: leadTargetMember.name,
        lead_roll_number: leadTargetMember.roll_number,
        lead_email: leadTargetMember.email,
        lead_phone: leadTargetMember.phone,
        lead_year: leadTargetMember.year_of_study || "3rd Year",
      });
      if (res.success) {
        toast.success(
          `Faculty Appointment: ${leadTargetMember.name} appointed as Lead of ${targetWing.wing_name}`
        );
        setIsAppointLeadModalOpen(false);
        await loadData();
      } else {
        toast.error(res.message || "Failed to appoint lead");
      }
    } catch {
      toast.error("Failed to appoint wing lead");
    }
  };

  // -------------------------------------------------------------
  // MENTOR EVENT PROPOSAL & APPROVAL WORKFLOW
  // -------------------------------------------------------------
  const [isProposeEventModalOpen, setIsProposeEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    dates: "",
    time: "10:00 AM - 04:00 PM",
    mode: "Offline" as "Offline" | "Online" | "Hybrid",
    location: "SAC Technical Lab 1",
    price: "Free",
    about: "",
    highlights: "",
  });

  const handleProposeEvent = async (e: React.FormEvent) => {
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
        organizer: `${mentorName} (Faculty Mentor)`,
        about: eventForm.about,
        highlights: eventForm.highlights ? eventForm.highlights.split("\n").filter(Boolean) : [],
        status: "pending",
      });
      if (res.success) {
        toast.success("Event proposed! Sent to CMS Admin for final website publishing.");
        setIsProposeEventModalOpen(false);
        await loadData();
      } else {
        toast.error(res.message || "Failed to propose event");
      }
    } catch {
      toast.error("Failed to propose event");
    }
  };

  const handleAcceptLeadEvent = async (ev: LmsEventProposal) => {
    try {
      const res = await actOnEventApproval({
        event_id: ev.id,
        action_step: "approve_mentor",
        reviewer_name: mentorName,
        reviewer_role: "Faculty Mentor",
        comments: `Accepted by Faculty Mentor (${mentorName}). Forwarded to CMS Admin for final publishing.`,
      });
      if (res.success) {
        toast.success(`Event "${ev.title}" accepted! Forwarded to CMS Admin for publishing.`);
        await loadData();
      } else {
        toast.error(res.message || "Failed to accept event");
      }
    } catch {
      toast.error("Failed to process event approval");
    }
  };

  const handleRejectLeadEvent = async (ev: LmsEventProposal) => {
    const reason = prompt("Enter revision feedback or reason for returning this proposal:", "Needs revised agenda");
    if (reason === null) return;
    try {
      const res = await actOnEventApproval({
        event_id: ev.id,
        action_step: "reject_mentor",
        reviewer_name: mentorName,
        reviewer_role: "Faculty Mentor",
        comments: reason,
      });
      if (res.success) {
        toast.info(`Event proposal returned for revisions.`);
        await loadData();
      } else {
        toast.error(res.message || "Failed to update event");
      }
    } catch {
      toast.error("Failed to update event");
    }
  };

  // -------------------------------------------------------------
  // MENTOR EVALUATION ENDORSEMENT MODAL
  // -------------------------------------------------------------
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<LmsTaskSubmission | null>(null);
  const [mentorScore, setMentorScore] = useState<number>(100);
  const [mentorFeedback, setMentorFeedback] = useState("");
  const [mentorStatus, setMentorStatus] = useState<"approved" | "rejected" | "changes_requested" | "under_review">("approved");

  const handleOpenEndorseModal = (sub: LmsTaskSubmission) => {
    setSelectedSub(sub);
    setMentorScore(sub.score ?? (sub.max_score || 100));
    setMentorStatus(
      sub.status === "rejected" || sub.status === "changes_requested" || sub.status === "under_review"
        ? sub.status
        : "approved"
    );
    setMentorFeedback(sub.feedback ? `[Faculty Endorsement] ${sub.feedback}` : "Excellent work demonstrated in project implementation.");
    setIsEndorseModalOpen(true);
  };

  const handleSaveEndorsement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      const res = await reviewTaskSubmission({
        id: selectedSub.id,
        status: mentorStatus,
        score: mentorScore,
        feedback: mentorFeedback,
        reviewer_name: mentorName,
        reviewer_role: "Faculty Mentor",
      });
      if (res.success) {
        toast.success(res.message || "Evaluation endorsed and marks saved successfully.");
        setIsEndorseModalOpen(false);
        await loadData();
      } else {
        toast.error(res.message || "Failed to save endorsement");
      }
    } catch {
      toast.error("Failed to save endorsement");
    }
  };

  // -------------------------------------------------------------
  // MENTOR ANNOUNCEMENT
  // -------------------------------------------------------------
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPriority, setAnnPriority] = useState<"normal" | "urgent" | "pinned">("pinned");

  const handlePostMentorNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    try {
      const res = await saveLmsAnnouncement({
        club_slug: clubSlug,
        title: `[Faculty Notice] ${annTitle.trim()}`,
        content: annContent.trim(),
        priority: annPriority,
        author_name: mentorName,
        author_role: "Faculty Mentor",
      });
      if (res.success) {
        toast.success(res.message);
        setIsAnnModalOpen(false);
        setAnnTitle("");
        setAnnContent("");
        await loadData();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to post notice");
    }
  };

  const navItems: { tab: MentorTab; label: string; icon: React.ReactNode; badge?: string | number | undefined }[] = [
    { tab: "overview", label: "Executive Overview", icon: <LayoutDashboard className="size-4 shrink-0" /> },
    { tab: "members", label: "Student Members", icon: <Users className="size-4 shrink-0" />, badge: stats.totalMembers },
    { tab: "wings", label: "Sub-Wings & Leads", icon: <Layers className="size-4 shrink-0" />, badge: stats.totalWings },
    { tab: "events", label: "Events & Approvals", icon: <Calendar className="size-4 shrink-0" />, badge: events.length },
    { tab: "evaluations", label: "Grades & Evaluations", icon: <FileCheck className="size-4 shrink-0" />, badge: stats.pendingSubmissions > 0 ? stats.pendingSubmissions : undefined },
    { tab: "curriculum", label: "Roadmaps & Tracks", icon: <Compass className="size-4 shrink-0" />, badge: stats.totalRoadmaps },
    { tab: "announcements", label: "Mentor Broadcasts", icon: <Megaphone className="size-4 shrink-0" />, badge: stats.totalAnnouncements },
    { tab: "leadership", label: "Club Governance", icon: <ShieldCheck className="size-4 shrink-0" /> },
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
              <GraduationCap className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-black tracking-tight text-brand-deep">
                AITAM SAC
              </span>
              <span className={`block text-[10px] font-semibold uppercase tracking-wider ${clubTheme.text}`}>
                Club Mentor LMS
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

        {/* Mentor Profile */}
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className={`grid size-8 place-items-center rounded-full bg-gradient-to-br ${clubTheme.gradient} text-white font-bold text-xs shadow-sm`}>
              {mentorName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{mentorName}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                Faculty Mentor
              </p>
            </div>
          </div>

          <div className="mt-2.5 rounded-xl border border-border bg-muted/40 p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Mentoring:</span>
              <span className={`font-bold ${clubTheme.text}`}>{clubDisplayName}</span>
            </div>
          </div>
        </div>

        {/* Nav List */}
        <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto p-3 text-xs font-medium">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Faculty Mentorship
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

        {/* Footer */}
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

      {/* Main Viewport */}
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
              <h1 className="text-sm font-bold text-foreground">
                {navItems.find((n) => n.tab === activeTab)?.label || "Executive Overview"}
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium">
                {clubDisplayName} • Faculty Mentor Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${clubTheme.badge}`}>
              <GraduationCap className="size-3" />
              {mentorName}
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
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading Mentor Dashboard...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: EXECUTIVE OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Hero Banner */}
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${clubTheme.bannerGradient} p-6 text-white shadow-lg`}>
                    <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-2">
                          <GraduationCap className="size-3" /> Faculty Mentor
                        </div>
                        <h2 className="text-2xl font-black">Welcome, {mentorName}!</h2>
                        <p className="mt-1 text-sm text-white/80 max-w-lg">
                          You have apex academic supervision over {clubDisplayName}. Manage member enrollment, appoint wing leads, endorse evaluation marks, and approve event proposals before final CMS publishing.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("members")}
                          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-900 shadow-soft hover:brightness-105"
                        >
                          Manage Members &rarr;
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("events")}
                          className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                        >
                          Review Events ({events.length})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Enrolled Members", value: stats.totalMembers, sub: `${stats.activeMembers} active students`, icon: <Users className="size-4" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
                      { label: "Sub-Wings", value: stats.totalWings, sub: "Tracks managed", icon: <Layers className="size-4" />, color: "text-purple-600 bg-purple-50 border-purple-200" },
                      { label: "Deliverables Graded", value: stats.approvedSubmissions, sub: `${stats.pendingSubmissions} pending review`, icon: <FileCheck className="size-4" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                      { label: "Club Events", value: events.length, sub: "Workshops proposed", icon: <Calendar className="size-4" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-2xl border ${s.color} p-4 shadow-2xs`}>
                        <div className="flex items-center gap-2 mb-2">
                          {s.icon}
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</span>
                        </div>
                        <p className="text-2xl font-black">{s.value}</p>
                        <p className="text-[11px] font-medium opacity-70 mt-0.5">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick Panels */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Events Pending Mentor Review */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Calendar className="size-4 text-brand" /> Events Pipeline
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("events")}
                          className={`text-[11px] font-bold hover:underline ${clubTheme.text}`}
                        >
                          View All ({events.length}) &rarr;
                        </button>
                      </div>

                      <div className="space-y-2">
                        {events.slice(0, 3).map((ev) => (
                          <div key={ev.id} className="rounded-xl border border-border/60 bg-section p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-foreground block truncate">{ev.title}</span>
                              <span className="text-[10px] text-muted-foreground">{ev.dates} • {ev.mode || "Offline"}</span>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${
                              ev.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {ev.status === "approved" ? "Live on SAC" : "Pending Review"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submissions Requiring Endorsement */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <FileCheck className="size-4 text-emerald-600" /> Evaluations & Marks
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("evaluations")}
                          className={`text-[11px] font-bold hover:underline ${clubTheme.text}`}
                        >
                          View Submissions &rarr;
                        </button>
                      </div>

                      <div className="space-y-2">
                        {data?.submissions && data.submissions.length > 0 ? (
                          data.submissions.slice(0, 3).map((sub) => (
                            <div key={sub.id} className="rounded-xl border border-border/60 bg-section p-3 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground truncate">{sub.student_name} ({sub.student_roll})</p>
                                <p className="text-[10px] text-muted-foreground truncate">{sub.task_title}</p>
                              </div>
                              <span className="text-xs font-bold text-foreground font-mono">
                                {sub.score !== null ? `${sub.score} pts` : "Unscored"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground py-4 text-center">No student submissions recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEMBERS MANAGEMENT (MENTOR ADMISSIONS & REMOVALS) */}
              {activeTab === "members" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Student Members Management</h2>
                      <p className="text-xs text-muted-foreground">
                        Faculty Mentors possess authority to enroll students, remove members, and designate wing leads
                      </p>
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

                      <button
                        type="button"
                        onClick={handleOpenAddMemberModal}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-soft transition-all ${clubTheme.badgeSolid} hover:brightness-110`}
                      >
                        <UserPlus className="size-3.5" /> Add Student Member
                      </button>
                    </div>
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
                            <th className="px-4 py-3 text-left hidden sm:table-cell">Sub-Wing</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Mentor Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {filteredMembers.map((m) => (
                            <tr key={m.id || m.roll_number} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-semibold text-foreground">{m.name}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono font-bold text-[10px] uppercase bg-muted border border-border px-1.5 py-0.5 rounded">
                                  {m.roll_number}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                                <div>{m.email}</div>
                                {m.phone && <div className="text-[10px] text-muted-foreground/80">{m.phone}</div>}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{m.year_of_study}</td>
                              <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{m.wing_name || "—"}</td>
                              <td className="px-4 py-3 text-center">
                                <select
                                  value={m.status}
                                  onChange={(e) => m.id && handleToggleMemberStatus(m.id, e.target.value)}
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold border cursor-pointer ${
                                    m.status === "active"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : m.status === "pending"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : m.status === "suspended"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  <option value="active">Active</option>
                                  <option value="pending">Pending</option>
                                  <option value="suspended">Suspended</option>
                                  <option value="alumni">Alumni</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAppointLeadModal(m)}
                                    className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                                    title={`Appoint ${m.name} as Track Lead`}
                                  >
                                    <Crown className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMember(m)}
                                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                    title={`Remove student ${m.name} from club`}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredMembers.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-xs">
                                No student members found matching criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SUB-WINGS & WING LEADS */}
              {activeTab === "wings" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Sub-Wings & Wing Leads</h2>
                      <p className="text-xs text-muted-foreground">
                        Faculty Mentors can designate or reassign Club Leads for specialized technical tracks
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data?.wings && data.wings.length > 0 ? (
                      data.wings.map((w) => (
                        <div key={w.id} className="rounded-2xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="grid size-10 place-items-center rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
                                <Layers className="size-5" />
                              </div>
                              <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold">
                                {w.wing_slug || "Track"}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-foreground">{w.wing_name}</h3>
                            {w.description && (
                              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{w.description}</p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase">Wing Lead:</span>
                              {w.lead_name ? (
                                <span className="text-xs font-bold text-foreground">{w.lead_name}</span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600">No Lead Appointed</span>
                              )}
                            </div>
                            {w.lead_roll_number && (
                              <p className="text-[10px] font-mono text-muted-foreground">Roll: {w.lead_roll_number} {w.lead_year ? `(${w.lead_year})` : ""}</p>
                            )}
                            {w.lead_email && (
                              <p className="text-[10px] text-muted-foreground truncate">{w.lead_email}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground py-10 text-center col-span-3">No sub-wings recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: EVENTS & APPROVALS (MULTI-TIER WORKFLOW) */}
              {activeTab === "events" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Club Workshops & Multi-Tier Event Approvals</h2>
                      <p className="text-xs text-muted-foreground">
                        Review events proposed by Club Leads and forward to CMS Admin for final website publication
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsProposeEventModalOpen(true)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                    >
                      <Plus className="size-4" /> Propose Faculty Event
                    </button>
                  </div>

                  {/* Multi-Tier Approval Chain Explanation Banner */}
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand block mb-2">
                      Official Event Approval Pipeline:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="font-bold text-foreground block">1. Club Lead Proposes</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Track Lead drafts workshop curriculum, date, and venue requirements.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="font-bold text-foreground block">2. Mentor Review & Acceptance</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Faculty Mentor validates academic value and accepts proposal for institutional clearance.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="font-bold text-foreground block">3. CMS Admin Publishing</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Central SAC Administration ratifies event and publishes it live to the campus portal.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Events List */}
                  <div className="space-y-3">
                    {events.map((ev) => {
                      const isPendingMentor = !ev.status || ev.status === "pending" || ev.approval_stage === "submitted_mentor";
                      const isApprovedMentor = ev.approval_stage === "approved_mentor";
                      const isLive = ev.status === "approved";

                      return (
                        <div key={ev.id} className="rounded-2xl border border-border bg-card p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[10px] font-bold">
                                {ev.club || clubDisplayName}
                              </span>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase ${
                                isLive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isApprovedMentor
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {isLive
                                  ? "Live on SAC Portal"
                                  : isApprovedMentor
                                  ? "Mentor Accepted • Awaiting CMS Admin"
                                  : "Awaiting Mentor Acceptance"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {ev.dates} • {ev.time}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-foreground">{ev.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ev.about}</p>

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap pt-1">
                              <span>Venue: <strong className="text-foreground">{ev.location}</strong></span>
                              <span>Proposer: <strong className="text-foreground">{ev.organizer || "Club Lead"}</strong></span>
                              {ev.price && <span>Entry: <strong className="text-brand">{ev.price}</strong></span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isPendingMentor && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptLeadEvent(ev)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-bold shadow-soft hover:bg-emerald-700 transition-colors"
                                >
                                  <Check className="size-3.5" /> Accept Event
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectLeadEvent(ev)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 px-3 py-2 text-xs font-bold hover:bg-rose-100 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isApprovedMentor && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 text-xs font-bold">
                                <CheckCircle2 className="size-3.5" /> Sent to CMS Admin
                              </span>
                            )}

                            {isLive && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-xs font-bold">
                                <CheckCircle2 className="size-3.5" /> Published
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: EVALUATIONS & MARKS OVERSIGHT */}
              {activeTab === "evaluations" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Student Submissions & Marks Oversight</h2>
                      <p className="text-xs text-muted-foreground">Review grades allotted by student organizers and endorse final marks</p>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student or task..."
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs outline-none shadow-2xs w-full sm:w-64"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {["all", "approved", "pending", "changes_requested"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSubmissionFilter(st)}
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-all ${
                          submissionFilter === st
                            ? `${clubTheme.badgeSolid} text-white`
                            : "bg-card border border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {filteredSubmissions.length > 0 ? (
                      filteredSubmissions.map((s) => (
                        <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">{s.student_name}</span>
                                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">{s.student_roll}</span>
                                <span className="rounded-full bg-brand/10 text-brand px-2 py-0.2 text-[10px] font-bold">{s.task_title}</span>
                                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.2 text-[10px] font-bold border border-emerald-200 uppercase">
                                  {s.status}
                                </span>
                              </div>

                              {s.submission_url && (
                                <a
                                  href={s.submission_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono pt-1"
                                >
                                  <ExternalLink className="size-3" /> {s.submission_url}
                                </a>
                              )}

                              <div className="flex items-center gap-4 text-xs pt-1">
                                {s.score !== null ? (
                                  <span className="font-bold text-foreground">
                                    Allotted Marks: <strong className="text-brand text-sm">{s.score}</strong> / {s.max_score || 100}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-medium">Pending marks allotment</span>
                                )}
                                {s.reviewer_name && (
                                  <span className="text-muted-foreground text-[11px]">
                                    Evaluated by: <strong>{s.reviewer_name}</strong>
                                  </span>
                                )}
                              </div>

                              {s.feedback && <p className="text-xs text-brand font-medium">Feedback: {s.feedback}</p>}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEndorseModal(s)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} shrink-0`}
                            >
                              <Check className="size-4" /> Endorse / Update Marks
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-8">No submissions found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: ROADMAPS & CURRICULUM */}
              {activeTab === "curriculum" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Curriculum & Track Roadmaps</h2>
                      <p className="text-xs text-muted-foreground">Supervise learning paths across all sub-wings and modules</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data?.roadmaps?.map((rm) => (
                      <div key={rm.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase ${clubTheme.badge}`}>
                            {rm.sub_club_slug || "Track"}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">
                            {rm.phases?.length || 0} Phases
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-foreground">{rm.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rm.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: ANNOUNCEMENTS */}
              {activeTab === "announcements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Faculty Mentor Directives & Broadcasts</h2>
                      <p className="text-xs text-muted-foreground">Issue notices, guidelines, and advisories to club members</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAnnModalOpen(true)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid}`}
                    >
                      <Plus className="size-4" /> Issue Mentor Directive
                    </button>
                  </div>

                  <div className="space-y-3">
                    {data?.announcements?.map((a) => (
                      <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                          <span className="text-[10px] font-bold uppercase rounded px-2 py-0.5 bg-muted">{a.priority}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{a.content}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-3 pt-2 border-t border-border/50">
                          Issued by {a.author_name} ({a.author_role})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: LEADERSHIP */}
              {activeTab === "leadership" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-foreground">Club Leadership Structure</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {data?.organizer && (
                      <div className="p-5 rounded-2xl border border-border bg-card shadow-card">
                        <span className="text-[10px] uppercase font-bold text-brand block">Student Club Organizer</span>
                        <h3 className="text-base font-bold text-foreground mt-1">{data.organizer.organizer_name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{data.organizer.organizer_roll_number}</p>
                        <p className="text-xs text-muted-foreground mt-2">{data.organizer.organizer_email}</p>
                      </div>
                    )}
                    {data?.wings?.map((w) => (
                      <div key={w.id} className="p-5 rounded-2xl border border-border bg-card shadow-card">
                        <span className="text-[10px] uppercase font-bold text-purple-600 block">{w.wing_name}</span>
                        <h3 className="text-base font-bold text-foreground mt-1">{w.lead_name || "No lead appointed"}</h3>
                        {w.lead_roll_number && <p className="text-xs text-muted-foreground font-mono">{w.lead_roll_number}</p>}
                        {w.lead_email && <p className="text-xs text-muted-foreground mt-1">{w.lead_email}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL 1: ADD STUDENT MEMBER (MENTOR AUTHORIZATION) */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Enroll Student to {clubDisplayName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Faculty Mentor Admission Authority</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Varma"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">College Roll Number *</label>
                <input
                  type="text"
                  required
                  value={memberForm.roll_number}
                  onChange={(e) => setMemberForm({ ...memberForm, roll_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. 23A51A05C5"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">College Email Address *</label>
                <input
                  type="email"
                  required
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value.toLowerCase() })}
                  placeholder="e.g. 23a51a05c5@adityatekkali.edu.in"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Year of Study</label>
                  <select
                    value={memberForm.year_of_study}
                    onChange={(e) => setMemberForm({ ...memberForm, year_of_study: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Assigned Sub-Wing / Track</label>
                <select
                  value={memberForm.wing_name}
                  onChange={(e) => setMemberForm({ ...memberForm, wing_name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                >
                  <option value="">General Member</option>
                  {data?.wings?.map((w) => (
                    <option key={w.id} value={w.wing_name}>
                      {w.wing_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                >
                  Confirm & Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPOINT AS WING LEAD (MENTOR ACTION) */}
      {isAppointLeadModalOpen && leadTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Appoint Club Wing Lead</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Faculty Mentor Appointment Authority</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAppointLeadModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAppointLead} className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Selected Candidate:</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{leadTargetMember.name}</p>
                <p className="font-mono text-muted-foreground text-[11px]">{leadTargetMember.roll_number} • {leadTargetMember.year_of_study}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Select Sub-Wing to Lead *</label>
                <select
                  value={selectedWingId}
                  onChange={(e) => setSelectedWingId(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                >
                  {data?.wings?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.wing_name} (Current Lead: {w.lead_name || "None"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAppointLeadModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                >
                  Confirm Lead Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PROPOSE EVENT (MENTOR) */}
      {isProposeEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Propose Faculty Club Workshop</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Proposal will be submitted to CMS Admin for website publishing</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProposeEventModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleProposeEvent} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Event / Workshop Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Masterclass on Flutter Architecture & Cloud Sync"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Date</label>
                  <input
                    type="date"
                    value={eventForm.dates}
                    onChange={(e) => setEventForm({ ...eventForm, dates: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Time</label>
                  <input
                    type="text"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    placeholder="10:00 AM - 04:00 PM"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Delivery Mode</label>
                  <select
                    value={eventForm.mode}
                    onChange={(e) => setEventForm({ ...eventForm, mode: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  >
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">Venue / Location</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="SAC Lab 1 / Seminar Hall"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">About / Objectives</label>
                <textarea
                  rows={2}
                  value={eventForm.about}
                  onChange={(e) => setEventForm({ ...eventForm, about: e.target.value })}
                  placeholder="Summary of skills taught, guest speakers, hands-on activities..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Highlights (One per line)</label>
                <textarea
                  rows={2}
                  value={eventForm.highlights}
                  onChange={(e) => setEventForm({ ...eventForm, highlights: e.target.value })}
                  placeholder="Hands-on coding session&#10;Industry mentor Q&A&#10;Participation certificate"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
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
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                >
                  Submit Event to CMS Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ENDORSE MARKS */}
      {isEndorseModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Endorse / Grade Submission</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Faculty Mentor Academic Oversight</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEndorseModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEndorsement} className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-bold text-foreground">{selectedSub.student_name} ({selectedSub.student_roll})</p>
                <p className="text-muted-foreground">Assignment: {selectedSub.task_title}</p>
                {selectedSub.submission_url && (
                  <a
                    href={selectedSub.submission_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-mono text-[11px] hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <ExternalLink className="size-3 shrink-0" /> {selectedSub.submission_url}
                  </a>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Evaluation Status</label>
                <select
                  value={mentorStatus}
                  onChange={(e) => setMentorStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                >
                  <option value="approved">Approved / Verified</option>
                  <option value="changes_requested">Changes Requested</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Marks Allotted (Max: {selectedSub.max_score || 100} pts)
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedSub.max_score || 100}
                  value={mentorScore}
                  onChange={(e) => setMentorScore(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Faculty Mentor Feedback</label>
                <textarea
                  rows={3}
                  value={mentorFeedback}
                  onChange={(e) => setMentorFeedback(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEndorseModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid} hover:brightness-110`}
                >
                  Save Endorsement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: POST DIRECTIVE */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Issue Faculty Directive</h3>
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handlePostMentorNotice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Directive Subject</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Directive Details</label>
                <textarea
                  rows={3}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsAnnModalOpen(false)} className="px-4 py-2 text-xs text-muted-foreground">
                  Cancel
                </button>
                <button type="submit" className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-soft ${clubTheme.badgeSolid}`}>
                  Publish Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
