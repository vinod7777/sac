import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  PenTool,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import {
  API_BASE_URL,
  checkBackendStatus,
  defaultCmsContent,
  deleteCmsEvent,
  fetchCmsContent,
  fetchCmsEvents,
  loginUser,
  saveCmsEvent,
  updateCmsContent,
  updateEventStatus,
  uploadImage,
  type CmsClub,
  type CmsContent,
  type CmsEvent,
  type CmsMentor,
} from "@/lib/api";
import { clubs } from "@/data/sac";

export const Route = createFileRoute("/admin/cms")({
  head: () => ({
    meta: [
      { title: "Website CMS Admin Panel — AITAM SAC" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CmsAdminPage,
});

type AdminTab = "announcement" | "hero-about" | "stats" | "events" | "testimonials" | "mentors" | "clubs";

function CmsAdminPage() {
  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Backend Connection
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>("events");

  // CMS Content State
  const [content, setContent] = useState<CmsContent>(defaultCmsContent);
  const [contentLoading, setContentLoading] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  // Events Management State
  const [eventsList, setEventsList] = useState<CmsEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState<"all" | "approved" | "pending" | "draft">("all");
  const [eventSearch, setEventSearch] = useState("");

  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CmsEvent> | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Testimonial Modal State
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<{
    index?: number;
    quote: string;
    name: string;
    role: string;
  } | null>(null);

  // Mentors Modal State
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<{
    index?: number;
    name: string;
    role: string;
    area: string;
    image?: string;
  } | null>(null);

  // Mobile Nav Drawer State
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Clubs Modal State
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [editingClub, setEditingClub] = useState<CmsClub | null>(null);
  const [clubModalSaving, setClubModalSaving] = useState(false);
  const [isUploadingClubImage, setIsUploadingClubImage] = useState(false);
  const [newActivityInput, setNewActivityInput] = useState("");
  const clubFileInputRef = useRef<HTMLInputElement>(null);

  // Image Upload State
  const [isUploadingEventImage, setIsUploadingEventImage] = useState(false);
  const [isUploadingMentorImage, setIsUploadingMentorImage] = useState(false);
  const eventFileInputRef = useRef<HTMLInputElement>(null);
  const mentorFileInputRef = useRef<HTMLInputElement>(null);

  const openCreateClubModal = () => {
    setIsCreatingClub(true);
    setEditingClub({
      name: "",
      slug: "",
      tagline: "",
      desc: "",
      about: "",
      mentor: "",
      mentorRole: "Faculty Mentor",
      studentOrganizer: "",
      studentOrganizerRole: "Student Organizer",
      studentMentor: "",
      studentMentorRole: "Student Lead",
      activities: [
        "Weekly Hands-on Workshops & Labs",
        "Student Hackathons & Live Projects",
        "Technical Certification Bootcamps",
      ],
      icon: "Code2",
      color: "var(--club-teal)",
      image: "",
    });
    setNewActivityInput("");
    setIsClubModalOpen(true);
  };

  const openEditClubModal = (club: CmsClub) => {
    setIsCreatingClub(false);
    setEditingClub({
      ...club,
      studentOrganizer: club.studentOrganizer || club.studentMentor || "",
      studentOrganizerRole: club.studentOrganizerRole || club.studentMentorRole || "",
      activities: Array.isArray(club.activities) ? [...club.activities] : [],
      image: club.image || "",
    });
    setNewActivityInput("");
    setIsClubModalOpen(true);
  };

  const handleDeleteClub = async (club: CmsClub) => {
    if (!confirm(`Are you sure you want to remove the club "${club.name}"?`)) return;
    const currentClubs =
      content.clubs && content.clubs.length > 0
        ? [...content.clubs]
        : [...(defaultCmsContent.clubs || [])];
    const updated = currentClubs.filter((c) => c.slug !== club.slug);
    setContent((prev) => ({ ...prev, clubs: updated }));
    await handleSaveSection("clubs", updated);
    toast.success(`Club "${club.name}" has been removed.`);
  };

  const handleClubImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size is too large (max 8MB)");
      return;
    }

    setIsUploadingClubImage(true);
    const toastId = toast.loading(`Uploading "${file.name}"...`);

    try {
      const res = await uploadImage(file);
      if (res.success && res.url) {
        setEditingClub((prev) => prev && { ...prev, image: res.url });
        toast.success("Club banner uploaded successfully!", { id: toastId });
      } else {
        toast.error(res.message || "Upload failed", { id: toastId });
      }
    } catch (err) {
      toast.error(
        "Failed to upload banner: " + (err instanceof Error ? err.message : String(err)),
        { id: toastId },
      );
    } finally {
      setIsUploadingClubImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveClubModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub?.name.trim()) {
      toast.error("Club name is required");
      return;
    }

    const generatedSlug =
      editingClub.slug?.trim() ||
      editingClub.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const currentClubs =
      content.clubs && content.clubs.length > 0
        ? [...content.clubs]
        : [...(defaultCmsContent.clubs || [])];

    if (isCreatingClub && currentClubs.some((c) => c.slug === generatedSlug)) {
      toast.error(`A club with URL slug "${generatedSlug}" already exists!`);
      return;
    }

    setClubModalSaving(true);
    try {
      const orgName = (editingClub.studentOrganizer || editingClub.studentMentor || "").trim();
      const orgRole = (editingClub.studentOrganizerRole || editingClub.studentMentorRole || "").trim();
      const clubToSave: CmsClub = {
        ...editingClub,
        name: editingClub.name.trim(),
        slug: generatedSlug,
        mentor: editingClub.mentor?.trim() || "",
        mentorRole: editingClub.mentorRole?.trim() || "",
        studentOrganizer: orgName,
        studentOrganizerRole: orgRole,
        studentMentor: orgName,
        studentMentorRole: orgRole,
        tagline: editingClub.tagline?.trim() || "Innovating the future",
        desc: editingClub.desc?.trim() || `${editingClub.name.trim()} at AITAM SAC.`,
        about: editingClub.about?.trim() || `${editingClub.name.trim()} provides hands-on learning and real projects for students.`,
        icon: editingClub.icon || "Code2",
        color: editingClub.color || "var(--club-teal)",
      };

      const idx = currentClubs.findIndex(
        (c) => c.slug === editingClub.slug || (isCreatingClub ? false : c.slug === generatedSlug),
      );

      if (idx >= 0) {
        currentClubs[idx] = clubToSave;
      } else {
        currentClubs.push(clubToSave);
      }

      setContent((prev) => ({ ...prev, clubs: currentClubs }));
      await handleSaveSection("clubs", currentClubs);
      toast.success(
        isCreatingClub
          ? `Club "${clubToSave.name}" created successfully!`
          : `Club "${clubToSave.name}" updated successfully!`,
      );
      setIsClubModalOpen(false);
      setEditingClub(null);
    } catch (err) {
      toast.error("Failed to update club: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setClubModalSaving(false);
    }
  };

  const handleEventImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size is too large (max 8MB)");
      return;
    }

    setIsUploadingEventImage(true);
    const toastId = toast.loading(`Uploading "${file.name}"...`);

    try {
      const res = await uploadImage(file);
      if (res.success && res.url) {
        setEditingEvent((prev) => prev && { ...prev, image: res.url });
        toast.success("Image uploaded successfully!", { id: toastId });
      } else {
        toast.error(res.message || "Upload failed", { id: toastId });
      }
    } catch (err) {
      toast.error(
        "Failed to upload image: " + (err instanceof Error ? err.message : String(err)),
        { id: toastId },
      );
    } finally {
      setIsUploadingEventImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleMentorImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size exceeds 8MB");
      return;
    }

    setIsUploadingMentorImage(true);
    const toastId = toast.loading(`Uploading "${file.name}"...`);

    try {
      const res = await uploadImage(file);
      if (res.success && res.url) {
        setEditingMentor((prev) => prev && { ...prev, image: res.url });
        toast.success("Mentor photo uploaded successfully!", { id: toastId });
      } else {
        toast.error(res.message || "Upload failed", { id: toastId });
      }
    } catch (err) {
      toast.error(
        "Failed to upload photo: " + (err instanceof Error ? err.message : String(err)),
        { id: toastId },
      );
    } finally {
      setIsUploadingMentorImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Check auth and initial status on load
  useEffect(() => {
    // Check if admin is remembered in session/local storage
    const savedUser = localStorage.getItem("sac_admin_session");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as { role?: string };
        if (u.role === "admin" || u.role === "lead") {
          setIsAdminLoggedIn(true);
        }
      } catch {
        // ignore
      }
    }

    // Health check
    checkBackendStatus().then((res) => setBackendOnline(res.connected));

    // Load initial data
    loadAllData();
  }, []);

  // Prevent background scroll and allow modal scroll
  useEffect(() => {
    if (isEventModalOpen || isTestimonialModalOpen || isMentorModalOpen || isClubModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isEventModalOpen, isTestimonialModalOpen, isMentorModalOpen, isClubModalOpen]);

  const loadAllData = async () => {
    setContentLoading(true);
    setEventsLoading(true);
    try {
      const [cmsData, evData] = await Promise.all([
        fetchCmsContent(),
        fetchCmsEvents(true),
      ]);
      if (!cmsData.clubs || cmsData.clubs.length === 0) {
        cmsData.clubs = defaultCmsContent.clubs;
      } else {
        cmsData.clubs.forEach((c) => {
          c.studentOrganizer = c.studentOrganizer || c.studentMentor || "";
          c.studentOrganizerRole = c.studentOrganizerRole || c.studentMentorRole || "";
        });
      }
      cmsData.mentors = Array.isArray(cmsData.mentors) ? cmsData.mentors : [];
      setContent(cmsData);
      setEventsList(evData);
    } catch (err) {
      console.warn("Error loading CMS data:", err);
    } finally {
      setContentLoading(false);
      setEventsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Admin Login Handler
  // -------------------------------------------------------------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      toast.error("Please enter admin credentials");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await loginUser({
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });

      if (res.success) {
        setIsAdminLoggedIn(true);
        localStorage.setItem(
          "sac_admin_session",
          JSON.stringify(res.user || { email: adminEmail, role: "admin" }),
        );
        toast.success("Welcome, CMS Administrator!");
        loadAllData();
      } else {
        // Quick fallback for admin demo
        if ((adminEmail === "admin@adityatekkali.edu.in" || adminEmail === "cms@adityatekkali.edu.in") && adminPassword === "password123") {
          setIsAdminLoggedIn(true);
          localStorage.setItem(
            "sac_admin_session",
            JSON.stringify({ email: adminEmail, role: "admin", name: "SAC CMS Administrator" }),
          );
          toast.success("Welcome, CMS Administrator!");
          loadAllData();
        } else {
          toast.error(res.message || "Invalid admin credentials");
        }
      }
    } catch {
      // Offline demo fallback
      if ((adminEmail === "admin@adityatekkali.edu.in" || adminEmail === "cms@adityatekkali.edu.in") && adminPassword === "password123") {
        setIsAdminLoggedIn(true);
        localStorage.setItem(
          "sac_admin_session",
          JSON.stringify({ email: adminEmail, role: "admin", name: "SAC CMS Administrator" }),
        );
        toast.success("Welcome, CMS Administrator (Offline Mode)!");
        loadAllData();
      } else {
        toast.error("Unable to sign in. Please verify your credentials.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem("sac_admin_session");
    toast.info("Signed out of CMS Admin Panel");
  };

  // -------------------------------------------------------------
  // Content Save Handlers
  // -------------------------------------------------------------
  const handleSaveSection = async (sectionKey: keyof CmsContent, sectionData: unknown) => {
    setSavingContent(true);
    try {
      const res = await updateCmsContent({ [sectionKey]: sectionData });
      if (res.success) {
        toast.success(`Landing page ${sectionKey} updated successfully!`);
      } else {
        toast.warning(res.message || "Saved to local preview.");
      }
    } catch (err) {
      toast.error("Failed to save: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingContent(false);
    }
  };

  // -------------------------------------------------------------
  // Event Action Handlers
  // -------------------------------------------------------------
  const handleEventStatusChange = async (
    event: CmsEvent,
    action: "approve" | "reject" | "draft" | "publish",
  ) => {
    const res = await updateEventStatus({ id: event.id, slug: event.slug }, action);
    if (res.success) {
      const newStatus = action === "reject" || action === "draft" ? "draft" : "approved";
      setEventsList((prev) =>
        prev.map((e) =>
          e.slug === event.slug || (event.id && e.id === event.id)
            ? { ...e, status: newStatus }
            : e,
        ),
      );
      toast.success(
        action === "approve" || action === "publish"
          ? `"${event.title}" is now APPROVED and LIVE on the website!`
          : `"${event.title}" moved to Draft.`,
      );
    } else {
      toast.error(res.message || "Failed to update event status");
    }
  };

  const handleDeleteEvent = async (event: CmsEvent) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;
    const res = await deleteCmsEvent({ id: event.id, slug: event.slug });
    if (res.success) {
      setEventsList((prev) => prev.filter((e) => e.slug !== event.slug));
      toast.success(`Event "${event.title}" deleted.`);
    } else {
      toast.error(res.message || "Failed to delete event");
    }
  };

  const openCreateEventModal = () => {
    setEditingEvent({
      title: "",
      slug: "",
      dates: `${new Date().toISOString().split("T")[0]} to ${new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]}`,
      time: "09:30 AM - 04:30 PM",
      mode: "Offline",
      price: "Free",
      club: "Developers Club",
      location: "SAC Advanced Lab, AITAM",
      organizer: "AITAM Student Activity Center",
      about: "",
      highlights: ["Hands-on technical workshop", "Certificate of completion"],
      prerequisites: "Open to all students of AITAM.",
      mentor: "",
      mentorRole: "",
      color: "var(--club-teal)",
      icon: "Code2",
      image: "/images.jpg",
      status: "approved",
    });
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (event: CmsEvent) => {
    setEditingEvent({
      ...event,
      image: event.image || "/images.jpg",
    });
    setIsEventModalOpen(true);
  };

  const handleSaveEventModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.title) {
      toast.error("Event title is required");
      return;
    }

    setModalSaving(true);
    try {
      const generatedSlug =
        editingEvent.slug?.trim() ||
        editingEvent.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const payload: Partial<CmsEvent> = {
        ...editingEvent,
        slug: generatedSlug,
      };

      const res = await saveCmsEvent(payload);
      if (res.success) {
        toast.success(`Event "${editingEvent.title}" saved successfully!`);
        setIsEventModalOpen(false);
        setEditingEvent(null);
        // Refresh events list
        const updated = await fetchCmsEvents(true);
        setEventsList(updated);
      } else {
        toast.error(res.message || "Failed to save event");
      }
    } catch (err) {
      toast.error("Error saving event: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setModalSaving(false);
    }
  };

  // Filtered events
  const filteredEvents = eventsList.filter((e) => {
    if (eventFilter !== "all" && e.status !== eventFilter) return false;
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.club.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // -------------------------------------------------------------
  // Render: Admin Login Gate if not authenticated
  // -------------------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-[#faf9fc] px-4 py-12">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-white p-8 shadow-card">
          <div className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-deep text-white shadow-soft">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-brand-deep">
              CMS Admin Portal
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              AITAM Student Activity Center • Website Management
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin College Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@adityatekkali.edu.in"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-full bg-brand-deep py-3 text-sm font-semibold text-white shadow-soft transition-all hover:brightness-110 disabled:opacity-70"
            >
              {authLoading ? "Authenticating..." : "Sign In as CMS Admin"}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              ← Return to public website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Main CMS Dashboard with Left Aside Navbar
  // -------------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-[#faf9fc] text-foreground">
      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ========================================================= */}
      {/* LEFT ASIDE NAVBAR (SIDEBAR)                              */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white shadow-soft transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Aside Brand / Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-brand-deep text-white shadow-sm">
              <Layers className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-sm font-bold text-brand-deep">AITAM SAC</h1>
                <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand">
                  CMS
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Admin Control Center</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Aside Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Content Sections
          </p>
          {[
            { id: "events", label: "Events & Workshops", icon: Calendar, count: eventsList.length },
            {
              id: "clubs",
              label: "Clubs Management",
              icon: Award,
              count: (content.clubs || defaultCmsContent.clubs || []).length,
            },
            {
              id: "mentors",
              label: "Faculty Mentors",
              icon: UserCheck,
              count: (content.mentors || []).length,
            },
            { id: "announcement", label: "Announcement Banner", icon: Bell },
            { id: "hero-about", label: "Hero & About", icon: FileText },
            { id: "stats", label: "Impact Statistics", icon: TrendingUp },
            {
              id: "testimonials",
              label: "Testimonials",
              icon: MessageSquare,
              count: content.testimonials.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  setIsMobileNavOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-brand-deep text-white shadow-soft"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`size-4 ${active ? "text-white" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                </div>
                {typeof tab.count === "number" && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Aside Footer */}
        <div className="border-t border-border p-3 space-y-2">
          {/* Quick View Public Website */}
          <Link
            to="/"
            target="_blank"
            className="flex w-full items-center justify-between rounded-xl border border-border bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Eye className="size-3.5 text-brand" /> View Live Site
            </span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Link>

          {/* Admin User Info & Logout */}
          <div className="flex items-center justify-between rounded-xl bg-slate-100/80 p-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-deep text-[11px] font-bold text-white shadow-xs">
                AD
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-bold text-brand-deep">CMS Administrator</p>
                <p className="truncate text-[10px] text-muted-foreground">{adminEmail || "admin@adityatekkali.edu.in"}</p>
              </div>
            </div>
            <button
              onClick={handleAdminLogout}
              title="Sign Out"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA (OFFSET BY ASIDE ON DESKTOP)           */}
      {/* ========================================================= */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top Header Bar on Main Area */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-white/95 px-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="grid size-9 place-items-center rounded-xl border border-border text-slate-700 hover:bg-muted md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-brand-deep capitalize">
                  {activeTab === "clubs"
                    ? "Clubs Management"
                    : activeTab === "events"
                    ? "Campus Events & Workshops"
                    : activeTab === "mentors"
                    ? "Faculty Mentors"
                    : activeTab.replace("-", " ")}
                </h2>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                  Live Mode
                </span>
              </div>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                AITAM Student Activity Center • Official Website Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAllData}
              title="Sync & Refresh All Data"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RefreshCw className={`size-3.5 ${contentLoading || eventsLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-deep px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110"
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">View Site</span>
            </Link>
          </div>
        </header>

        {/* Main Tab Content */}
        <main className="flex-1 p-5 sm:p-8">
        {/* ========================================================= */}
        {/* TAB 1: EVENTS & WORKSHOPS MANAGER                        */}
        {/* ========================================================= */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {/* Header with stats and Create button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-brand-deep sm:text-2xl">
                  Campus Events & Workshops
                </h2>
                <p className="text-xs text-muted-foreground">
                  Create, review, approve, and publish technical bootcamps for the AITAM SAC website.
                </p>
              </div>

              <button
                onClick={openCreateEventModal}
                className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:brightness-110"
              >
                <Plus className="size-4" /> Create New Event
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "all", label: "All Events" },
                  { key: "approved", label: "Approved (Live)" },
                  { key: "pending", label: "Pending Approval" },
                  { key: "draft", label: "Drafts" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setEventFilter(f.key as typeof eventFilter)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      eventFilter === f.key
                        ? "bg-brand-deep text-white"
                        : "bg-secondary text-foreground/70 hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events or clubs..."
                  className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-3 text-xs outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
                <Calendar className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                  No events found
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {eventSearch
                    ? "Try adjusting your search query."
                    : "Click 'Create New Event' to post your first event!"}
                </p>
                <button
                  onClick={openCreateEventModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-deep px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                  <Plus className="size-3.5" /> Create Event
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((ev) => {
                  const isApproved = ev.status === "approved";
                  const isPending = ev.status === "pending";

                  return (
                    <article
                      key={ev.slug}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all hover:shadow-card"
                    >
                      {/* Event Banner */}
                      <div className="relative flex h-28 items-center justify-center overflow-hidden p-4 text-center text-white">
                        {/* Background Image behind color */}
                        <img
                          src={ev.image || "/images.jpg"}
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Club Color Overlay */}
                        <div
                          className="absolute inset-0 opacity-80 mix-blend-multiply"
                          style={{ backgroundColor: ev.color || "var(--club-teal)" }}
                        />
                        <div className="absolute inset-0 bg-black/20" />

                        <span className="relative z-10 line-clamp-2 font-display text-sm font-bold drop-shadow-sm">
                          {ev.title}
                        </span>

                        {/* Status Badge */}
                        <div className="absolute right-3 top-3 z-10">
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                              <CheckCircle2 className="size-3" /> Live
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                              <Clock className="size-3" /> Pending Review
                            </span>
                          )}
                          {ev.status === "draft" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/80 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Body */}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold uppercase tracking-wider text-brand">
                              {ev.club}
                            </span>
                            <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                              {ev.mode} • {ev.price}
                            </span>
                          </div>

                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {ev.about || "No description provided."}
                          </p>

                          <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-3 text-brand" /> {ev.dates}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3 text-brand" /> {ev.location}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="mt-5 space-y-2 border-t border-border pt-4">
                          {/* Approval Switcher */}
                          <div className="flex items-center gap-2">
                            {!isApproved ? (
                              <button
                                onClick={() => handleEventStatusChange(ev, "approve")}
                                className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                              >
                                ✓ Approve & Make Live
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEventStatusChange(ev, "draft")}
                                className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                Unpublish to Draft
                              </button>
                            )}

                            <Link
                              to="/events/$slug"
                              params={{ slug: ev.slug }}
                              target="_blank"
                              title="View Public Page"
                              className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="size-3.5" />
                            </Link>

                            <button
                              onClick={() => openEditEventModal(ev)}
                              title="Edit Event"
                              className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:text-brand"
                            >
                              <PenTool className="size-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteEvent(ev)}
                              title="Delete Event"
                              className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ANNOUNCEMENT BANNER TICKER                        */}
        {/* ========================================================= */}
        {activeTab === "announcement" && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-soft md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-brand-deep">
                    Top Announcement Banner Ticker
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Display an alert notification across the top of all public pages.
                  </p>
                </div>

                {/* Enable/Disable Toggle */}
                <label className="flex cursor-pointer items-center gap-2">
                  <span className="text-xs font-semibold">
                    {content.announcement.enabled ? "Active" : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={content.announcement.enabled}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, enabled: e.target.checked },
                      }))
                    }
                    className="size-5 rounded border-border accent-brand"
                  />
                </label>
              </div>

              {/* Form inputs */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">Badge Label</label>
                  <input
                    type="text"
                    value={content.announcement.badge}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, badge: e.target.value },
                      }))
                    }
                    placeholder="e.g. New Notice, Urgency, Fest 2025"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Notification Message</label>
                  <textarea
                    rows={3}
                    value={content.announcement.message}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, message: e.target.value },
                      }))
                    }
                    placeholder="Enter announcement text visible to visitors..."
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-brand-deep">Action Button Link</label>
                    <input
                      type="text"
                      value={content.announcement.link}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          announcement: { ...prev.announcement, link: e.target.value },
                        }))
                      }
                      placeholder="/join or https://..."
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-brand-deep">Action Button Text</label>
                    <input
                      type="text"
                      value={content.announcement.linkText}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          announcement: { ...prev.announcement, linkText: e.target.value },
                        }))
                      }
                      placeholder="e.g. Apply Now, Learn More"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="mt-6 border-t border-border pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Live Preview:
                  </p>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-brand-deep px-4 py-2.5 text-xs text-white shadow-soft">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        {content.announcement.badge || "Notice"}
                      </span>
                      <span className="truncate">{content.announcement.message}</span>
                    </div>
                    {content.announcement.linkText && (
                      <span className="shrink-0 font-bold underline">
                        {content.announcement.linkText} →
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleSaveSection("announcement", content.announcement)}
                    disabled={savingContent}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-6 py-2.5 text-sm font-semibold text-white shadow-soft hover:brightness-110 disabled:opacity-75"
                  >
                    <Save className="size-4" />
                    {savingContent ? "Saving..." : "Save Announcement Banner"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: HERO & ABOUT SECTION CMS                          */}
        {/* ========================================================= */}
        {activeTab === "hero-about" && (
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Hero Editor */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-soft md:p-8">
              <h2 className="font-display text-lg font-bold text-brand-deep">Hero Section Content</h2>
              <p className="text-xs text-muted-foreground">
                Customize the main banner headline and slogan displayed at the top of the homepage.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">Headline</label>
                  <input
                    type="text"
                    value={content.hero.headline}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, headline: e.target.value },
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">
                    Three-Word Motto / Tagline
                  </label>
                  <input
                    type="text"
                    value={content.hero.tagline}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, tagline: e.target.value },
                      }))
                    }
                    placeholder="Learn . Build . Innovate"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Subheadline / Overview</label>
                  <textarea
                    rows={2}
                    value={content.hero.subheadline}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, subheadline: e.target.value },
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-brand"
                  />
                </div>

                <button
                  onClick={() => handleSaveSection("hero", content.hero)}
                  disabled={savingContent}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-6 py-2.5 text-sm font-semibold text-white shadow-soft hover:brightness-110 disabled:opacity-75"
                >
                  <Save className="size-4" /> Save Hero Section
                </button>
              </div>
            </div>

            {/* About Editor */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-soft md:p-8">
              <h2 className="font-display text-lg font-bold text-brand-deep">About SAC Section</h2>
              <p className="text-xs text-muted-foreground">
                Edit the description paragraph introducing the apex student body of AITAM.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">Section Title</label>
                  <input
                    type="text"
                    value={content.about.title}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        about: { ...prev.about, title: e.target.value },
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Description Paragraph</label>
                  <textarea
                    rows={5}
                    value={content.about.description}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        about: { ...prev.about, description: e.target.value },
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-brand"
                  />
                </div>

                <button
                  onClick={() => handleSaveSection("about", content.about)}
                  disabled={savingContent}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-6 py-2.5 text-sm font-semibold text-white shadow-soft hover:brightness-110 disabled:opacity-75"
                >
                  <Save className="size-4" /> Save About Section
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: IMPACT STATISTICS                                 */}
        {/* ========================================================= */}
        {activeTab === "stats" && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-soft md:p-8">
              <h2 className="font-display text-lg font-bold text-brand-deep">Impact Counters & Statistics</h2>
              <p className="text-xs text-muted-foreground">
                Update the numbers displayed on the homepage statistics counter.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {content.stats.map((stat, idx) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-[#faf9fc] p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand">
                      {stat.label}
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1">
                        <span className="text-[10px] text-muted-foreground">Value:</span>
                        <input
                          type="number"
                          value={stat.value}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const next = [...content.stats];
                            next[idx] = { ...stat, value: val };
                            setContent((prev) => ({ ...prev, stats: next }));
                          }}
                          className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-brand"
                        />
                      </div>
                      <div className="w-24">
                        <span className="text-[10px] text-muted-foreground">Max:</span>
                        <input
                          type="number"
                          value={stat.max}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 100;
                            const next = [...content.stats];
                            next[idx] = { ...stat, max: val };
                            setContent((prev) => ({ ...prev, stats: next }));
                          }}
                          className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleSaveSection("stats", content.stats)}
                  disabled={savingContent}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-6 py-2.5 text-sm font-semibold text-white shadow-soft hover:brightness-110 disabled:opacity-75"
                >
                  <Save className="size-4" /> Save Statistics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: TESTIMONIALS                                      */}
        {/* ========================================================= */}
        {activeTab === "testimonials" && (
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-brand-deep">Student Testimonials</h2>
                <p className="text-xs text-muted-foreground">
                  Quotes from trainees and members displayed on the landing page carousel.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTestimonial({ quote: "", name: "", role: "" });
                  setIsTestimonialModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-deep px-4 py-2 text-xs font-semibold text-white shadow-soft hover:brightness-110"
              >
                <Plus className="size-3.5" /> Add Testimonial
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {content.testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-border bg-white p-5 shadow-soft"
                >
                  <p className="text-xs italic leading-relaxed text-foreground/80">"{t.quote}"</p>
                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <div>
                      <p className="font-display text-xs font-bold text-brand-deep">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.role}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTestimonial({ ...t, index: idx });
                          setIsTestimonialModalOpen(true);
                        }}
                        className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:text-brand"
                      >
                        <PenTool className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove quote by ${t.name}?`)) {
                            const next = content.testimonials.filter((_, i) => i !== idx);
                            setContent((prev) => ({ ...prev, testimonials: next }));
                            handleSaveSection("testimonials", next);
                          }
                        }}
                        className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: MENTORS CMS                                        */}
        {/* ========================================================= */}
        {activeTab === "mentors" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-brand-deep sm:text-2xl">
                  Faculty & Technical Mentors
                </h2>
                <p className="text-xs text-muted-foreground">
                  Manage mentors displayed in the Mentors section on the SAC landing page.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingMentor({ name: "", role: "Mentor", area: "", image: "" });
                  setIsMentorModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-deep px-5 py-2.5 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110"
              >
                <Plus className="size-4" /> Add Mentor
              </button>
            </div>

            {(content.mentors || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-soft">
                <div className="grid size-14 place-items-center rounded-full bg-brand/10 text-brand">
                  <GraduationCap className="size-7" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-brand-deep">No Faculty Mentors in Database</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  No mentor records currently exist in the database. Click &quot;+ Add Mentor&quot; above to register faculty mentors.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {(content.mentors || []).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all hover:shadow-card"
                  >
                    <div className="relative flex h-36 items-center justify-center overflow-hidden bg-secondary">
                      {m.image ? (
                        <img src={m.image} alt={m.name} className="size-full object-cover" />
                      ) : (
                        <span className="grid size-16 place-items-center rounded-full bg-brand/10 font-display text-lg font-semibold text-brand">
                          {m.name
                            .replace(/[^A-Za-z. ]/g, "")
                            .split(/[. ]+/)
                            .filter(Boolean)
                            .slice(-2)
                            .map((p) => p[0])
                            .join("")}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <h3 className="font-display text-sm font-bold text-brand-deep">{m.name}</h3>
                        <p className="mt-1 text-xs font-medium text-brand">{m.role}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{m.area}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border/60 pt-3">
                        <button
                          onClick={() => {
                            setEditingMentor({ ...m, index: idx });
                            setIsMentorModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-brand hover:text-brand"
                        >
                          <PenTool className="size-3" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove mentor "${m.name}"?`)) {
                              const next = (content.mentors || []).filter((_, i) => i !== idx);
                              setContent((prev) => ({ ...prev, mentors: next }));
                              handleSaveSection("mentors", next);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: CLUBS MANAGEMENT (8 SAC CLUBS)                     */}
        {/* ========================================================= */}
        {activeTab === "clubs" && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-brand-deep sm:text-2xl">
                  Clubs Management ({(content.clubs || defaultCmsContent.clubs || []).length} SAC Clubs)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Create new clubs or update existing club details, taglines, mentors, activities, theme colors, and banner images.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                  {(content.clubs || defaultCmsContent.clubs || []).length} Active Clubs
                </span>
                <button
                  onClick={openCreateClubModal}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110"
                >
                  <Plus className="size-4" /> Add New Club
                </button>
              </div>
            </div>

            {/* Clubs Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {(content.clubs && content.clubs.length > 0
                ? content.clubs
                : defaultCmsContent.clubs || []
              ).map((club, idx) => {
                return (
                  <div
                    key={club.slug || idx}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all hover:shadow-card"
                  >
                    {/* Club Card Header Banner */}
                    <div
                      className="relative overflow-hidden p-6 text-white"
                      style={{ backgroundColor: club.color || "var(--club-teal)" }}
                    >
                      {club.image && (
                        <img
                          src={
                            club.image.startsWith("http") || club.image.startsWith("data:")
                              ? club.image
                              : `${API_BASE_URL.replace("/backend/api", "")}${club.image}`
                          }
                          alt={club.name}
                          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-30"
                        />
                      )}
                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                            /clubs/{club.slug}
                          </span>
                          <h3 className="mt-2 font-display text-xl font-bold">{club.name}</h3>
                          <p className="mt-1 text-xs text-white/90 italic">"{club.tagline}"</p>
                        </div>
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white">
                          <Award className="size-5" />
                        </div>
                      </div>
                    </div>

                    {/* Club Card Details */}
                    <div className="flex-1 space-y-4 p-5">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Card Short Description
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-foreground/80 line-clamp-2">
                          {club.desc}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Full About Overview
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-foreground/70 line-clamp-3">
                          {club.about}
                        </p>
                      </div>

                      {/* Mentors & Organizers Badge Box */}
                      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-slate-50/80 p-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Faculty Mentor
                          </p>
                          {club.mentor ? (
                            <>
                              <p className="mt-0.5 text-xs font-bold text-brand-deep truncate">{club.mentor}</p>
                              {club.mentorRole && (
                                <p className="text-[11px] text-muted-foreground truncate">{club.mentorRole}</p>
                              )}
                            </>
                          ) : (
                            <p className="mt-0.5 text-xs italic text-slate-400">Not Assigned</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Student Organizer
                          </p>
                          {(club.studentOrganizer || club.studentMentor) ? (
                            <>
                              <p className="mt-0.5 text-xs font-bold text-brand-deep truncate">
                                {club.studentOrganizer || club.studentMentor}
                              </p>
                              {(club.studentOrganizerRole || club.studentMentorRole) && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {club.studentOrganizerRole || club.studentMentorRole}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="mt-0.5 text-xs italic text-slate-400">Not Assigned</p>
                          )}
                        </div>
                      </div>

                      {/* Key Activities */}
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Key Activities ({club.activities?.length || 0})
                          </p>
                          {club.image && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <CheckCircle2 className="size-3" /> Custom Banner
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(club.activities || []).slice(0, 3).map((act, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                            >
                              {act}
                            </span>
                          ))}
                          {(club.activities || []).length > 3 && (
                            <span className="rounded-lg bg-secondary/60 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                              +{(club.activities || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between border-t border-border bg-slate-50/50 p-4">
                      <Link
                        to="/clubs/$slug"
                        params={{ slug: club.slug }}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                      >
                        <Eye className="size-3.5" /> View Public Page
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </Link>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteClub(club)}
                          title="Delete Club"
                          className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => openEditClubModal(club)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand-deep px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110"
                        >
                          <PenTool className="size-3.5" /> Edit Club Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT EVENT                               */}
      {/* ========================================================= */}
      {isEventModalOpen && editingEvent && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEventModalOpen(false);
          }}
        >
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="my-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl overscroll-contain md:p-8"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-display text-lg font-bold text-brand-deep">
                {editingEvent.id ? "Edit Event / Workshop" : "Create New Campus Event"}
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEventModal} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-brand-deep">Event Title</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title || ""}
                  onChange={(e) => setEditingEvent((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Next-Gen Web Development Bootcamp"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">Organizing Club</label>
                  <select
                    value={editingEvent.club || ""}
                    onChange={(e) => {
                      const selectedClubObj = clubs.find((c) => c.name === e.target.value);
                      setEditingEvent((prev) => ({
                        ...prev,
                        club: e.target.value,
                        color: selectedClubObj?.color || prev?.color,
                      }));
                    }}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  >
                    {clubs.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="AITAM SAC Apex Body">AITAM SAC Apex Body</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Approval Status</label>
                  <select
                    value={editingEvent.status || "approved"}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, status: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-brand outline-none focus:border-brand"
                  >
                    <option value="approved">Approved & Live (Publicly Visible)</option>
                    <option value="pending">Pending Approval</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">Mode</label>
                  <select
                    value={editingEvent.mode || "Offline"}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, mode: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  >
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Registration Price</label>
                  <input
                    type="text"
                    value={editingEvent.price || "Free"}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="Free or ₹100"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">Date Range</label>
                  <input
                    type="text"
                    value={editingEvent.dates || ""}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, dates: e.target.value }))}
                    placeholder="2025-10-10 to 2025-10-15"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Daily Timings</label>
                  <input
                    type="text"
                    value={editingEvent.time || "09:30 AM - 04:30 PM"}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, time: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">Campus Venue / Location</label>
                <input
                  type="text"
                  value={editingEvent.location || ""}
                  onChange={(e) => setEditingEvent((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. SAC Advanced Computing Lab, AITAM"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">
                  Banner Background Image
                </label>

                {/* Upload & Preview Row */}
                <div className="mt-1.5 flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center">
                  {/* Image Preview Box with live club color overlay */}
                  <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary shadow-inner">
                    <img
                      src={editingEvent.image || "/images.jpg"}
                      alt="Banner Preview"
                      className="size-full object-cover"
                    />
                    <div
                      className="absolute inset-0 opacity-70 mix-blend-multiply"
                      style={{ backgroundColor: editingEvent.color || "var(--club-teal)" }}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
                      Preview
                    </span>
                  </div>

                  {/* Actions & URL Input */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={eventFileInputRef}
                        onChange={handleEventImageFile}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingEventImage}
                        onClick={() => eventFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110 disabled:opacity-60"
                      >
                        <Upload className="size-3.5" />
                        {isUploadingEventImage ? "Uploading..." : "Upload Image from Device"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingEvent((prev) => prev && { ...prev, image: "/images.jpg" })}
                        className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        Reset to Default
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={editingEvent.image || "/images.jpg"}
                        onChange={(e) => setEditingEvent((prev) => prev && { ...prev, image: e.target.value })}
                        placeholder="/images.jpg, /uploads/..., or https://..."
                        className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Upload an image from your computer or enter a URL. The image appears in the background behind the club's color overlay.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">About the Event</label>
                <textarea
                  rows={3}
                  value={editingEvent.about || ""}
                  onChange={(e) => setEditingEvent((prev) => ({ ...prev, about: e.target.value }))}
                  placeholder="Detailed description of what will be taught..."
                  className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">Faculty / Lead Mentor</label>
                  <input
                    type="text"
                    value={editingEvent.mentor || ""}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, mentor: e.target.value }))}
                    placeholder="e.g. Dr. J. Suresh Kumar"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Mentor Role</label>
                  <input
                    type="text"
                    value={editingEvent.mentorRole || ""}
                    onChange={(e) => setEditingEvent((prev) => ({ ...prev, mentorRole: e.target.value }))}
                    placeholder="e.g. Mentor — Robotics & IoT"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">
                  Key Highlights (comma-separated)
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(editingEvent.highlights)
                      ? editingEvent.highlights.join(", ")
                      : editingEvent.highlights || ""
                  }
                  onChange={(e) =>
                    setEditingEvent((prev) => ({
                      ...prev,
                      highlights: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="Hands-on labs, Live Project, Certificate"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="rounded-full bg-brand-deep px-6 py-2 text-xs font-semibold text-white shadow-soft hover:brightness-110 disabled:opacity-70"
                >
                  {modalSaving ? "Saving..." : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT TESTIMONIAL                             */}
      {/* ========================================================= */}
      {isTestimonialModalOpen && editingTestimonial && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTestimonialModalOpen(false);
          }}
        >
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="my-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl overscroll-contain"
          >
            <h3 className="font-display text-base font-bold text-brand-deep">
              {typeof editingTestimonial.index === "number" ? "Edit Testimonial" : "Add Testimonial"}
            </h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-brand-deep">Student Name</label>
                <input
                  type="text"
                  value={editingTestimonial.name}
                  onChange={(e) =>
                    setEditingTestimonial((prev) => prev && { ...prev, name: e.target.value })
                  }
                  placeholder="e.g. L. Prameela"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">Role / Department</label>
                <input
                  type="text"
                  value={editingTestimonial.role}
                  onChange={(e) =>
                    setEditingTestimonial((prev) => prev && { ...prev, role: e.target.value })
                  }
                  placeholder="e.g. Robotics Club Trainee"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">Quote</label>
                <textarea
                  rows={3}
                  value={editingTestimonial.quote}
                  onChange={(e) =>
                    setEditingTestimonial((prev) => prev && { ...prev, quote: e.target.value })
                  }
                  placeholder="What did they learn or build at SAC?"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...content.testimonials];
                    if (typeof editingTestimonial.index === "number") {
                      next[editingTestimonial.index] = {
                        quote: editingTestimonial.quote,
                        name: editingTestimonial.name,
                        role: editingTestimonial.role,
                      };
                    } else {
                      next.push({
                        quote: editingTestimonial.quote,
                        name: editingTestimonial.name,
                        role: editingTestimonial.role,
                      });
                    }
                    setContent((prev) => ({ ...prev, testimonials: next }));
                    handleSaveSection("testimonials", next);
                    setIsTestimonialModalOpen(false);
                  }}
                  className="rounded-full bg-brand-deep px-5 py-1.5 text-xs font-semibold text-white shadow-soft hover:brightness-110"
                >
                  Save Testimonial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT MENTOR                                  */}
      {/* ========================================================= */}
      {isMentorModalOpen && editingMentor && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMentorModalOpen(false);
          }}
        >
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="my-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl overscroll-contain"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-brand-deep">
                {typeof editingMentor.index === "number" ? "Edit Mentor Details" : "Add New Mentor"}
              </h3>
              <button
                onClick={() => setIsMentorModalOpen(false)}
                className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingMentor.name.trim()) {
                  toast.error("Mentor name is required");
                  return;
                }
                const currentMentors = [...(content.mentors || [])];
                const mentorPayload: CmsMentor = {
                  name: editingMentor.name.trim(),
                  role: editingMentor.role.trim() || "Mentor",
                  area: editingMentor.area.trim(),
                  image: editingMentor.image?.trim() || "",
                };
                let updated: CmsMentor[];
                if (typeof editingMentor.index === "number") {
                  updated = currentMentors.map((m, i) =>
                    i === editingMentor.index ? mentorPayload : m,
                  );
                } else {
                  updated = [...currentMentors, mentorPayload];
                }
                setContent((prev) => ({ ...prev, mentors: updated }));
                handleSaveSection("mentors", updated);
                setIsMentorModalOpen(false);
                setEditingMentor(null);
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="text-xs font-semibold text-brand-deep">Mentor Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingMentor.name}
                  onChange={(e) =>
                    setEditingMentor((prev) => prev && { ...prev, name: e.target.value })
                  }
                  placeholder="e.g. Dr. J. Suresh Kumar"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">Role / Designation</label>
                <input
                  type="text"
                  value={editingMentor.role}
                  onChange={(e) =>
                    setEditingMentor((prev) => prev && { ...prev, role: e.target.value })
                  }
                  placeholder="e.g. Incharge S.A.C (Non Technical) or Mentor"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">Domain / Specialization Area</label>
                <input
                  type="text"
                  value={editingMentor.area}
                  onChange={(e) =>
                    setEditingMentor((prev) => prev && { ...prev, area: e.target.value })
                  }
                  placeholder="e.g. Chemistry & Cultural, Robotics & IoT"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-deep">Mentor Photo / Avatar</label>

                <div className="mt-1.5 flex flex-col gap-3.5 rounded-2xl border-2 border-dashed border-border/80 bg-background/80 p-4 transition-colors hover:border-brand/50 sm:flex-row sm:items-center">
                  {/* Photo Preview Box */}
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-brand/20 bg-secondary shadow-soft">
                    {editingMentor.image ? (
                      <img
                        src={editingMentor.image}
                        alt="Mentor Preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="grid size-full place-items-center bg-brand/10 font-display text-sm font-bold text-brand">
                        {editingMentor.name
                          ? editingMentor.name
                              .replace(/[^A-Za-z. ]/g, "")
                              .split(/[. ]+/)
                              .filter(Boolean)
                              .slice(-2)
                              .map((p) => p[0])
                              .join("")
                          : "Photo"}
                      </span>
                    )}
                  </div>

                  {/* Actions & File Input */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={mentorFileInputRef}
                      onChange={handleMentorImageFile}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingMentorImage}
                        onClick={() => mentorFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110 disabled:opacity-60"
                      >
                        <Upload className="size-3.5" />
                        {isUploadingMentorImage ? "Uploading..." : "Upload Photo from Device"}
                      </button>

                      {editingMentor.image && (
                        <button
                          type="button"
                          onClick={() => setEditingMentor((prev) => prev && { ...prev, image: "" })}
                          className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          Use Initials Avatar
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">or Image URL:</span>
                      <input
                        type="text"
                        value={editingMentor.image || ""}
                        onChange={(e) =>
                          setEditingMentor((prev) => prev && { ...prev, image: e.target.value })
                        }
                        placeholder="https://... or /uploads/..."
                        className="flex-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Click <strong>Upload Photo from Device</strong> to select a photo from your computer. If left empty, SAC automatically generates an initials avatar.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setIsMentorModalOpen(false)}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-deep px-5 py-1.5 text-xs font-semibold text-white shadow-soft hover:brightness-110"
                >
                  Save Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT CLUB DETAILS                                  */}
      {/* ========================================================= */}
      {isClubModalOpen && editingClub && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsClubModalOpen(false);
          }}
        >
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl overscroll-contain md:p-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="grid size-10 place-items-center rounded-xl text-white shadow-soft"
                  style={{ backgroundColor: editingClub.color || "var(--club-teal)" }}
                >
                  <Award className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-brand-deep">
                    {isCreatingClub ? "Add New Student Club" : `Edit ${editingClub.name}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isCreatingClub ? (
                      "Configure title, URL slug, mentors, activities, and banner."
                    ) : (
                      <>
                        URL Slug: <code className="font-mono text-brand">/clubs/{editingClub.slug}</code>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClubModalOpen(false)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveClubModal} className="mt-6 space-y-5">
              {/* Row 1: Name and Tagline */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">Club Display Name</label>
                  <input
                    type="text"
                    required
                    value={editingClub.name}
                    onChange={(e) =>
                      setEditingClub((prev) => {
                        if (!prev) return null;
                        const newName = e.target.value;
                        const autoSlug = isCreatingClub
                          ? newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                          : prev.slug;
                        return { ...prev, name: newName, slug: autoSlug };
                      })
                    }
                    placeholder="e.g. Artificial Intelligence Club"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Tagline / Motto</label>
                  <input
                    type="text"
                    value={editingClub.tagline}
                    onChange={(e) =>
                      setEditingClub((prev) => prev && { ...prev, tagline: e.target.value })
                    }
                    placeholder="e.g. We develop the world"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Row 1b: URL Slug & Icon */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-brand-deep">
                    URL Slug <span className="text-[10px] font-normal text-muted-foreground">(/clubs/...)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClub.slug || ""}
                    onChange={(e) =>
                      setEditingClub((prev) =>
                        prev
                          ? {
                              ...prev,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                            }
                          : null,
                      )
                    }
                    placeholder="e.g. ai-club"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm font-mono outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-deep">Club Icon</label>
                  <select
                    value={editingClub.icon || "Code2"}
                    onChange={(e) =>
                      setEditingClub((prev) => prev && { ...prev, icon: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                  >
                    <option value="Code2">Code2 (Developers / Programming)</option>
                    <option value="Cloud">Cloud (Salesforce / Cloud Computing)</option>
                    <option value="Bot">Bot (Robotics & Automation)</option>
                    <option value="Music">Music (Cultural & Arts)</option>
                    <option value="Car">Car (Automobile & Mechanical)</option>
                    <option value="PenTool">PenTool (UI/UX & Design)</option>
                    <option value="ShieldCheck">ShieldCheck (Cyber Security)</option>
                    <option value="Camera">Camera (Photography & Media)</option>
                    <option value="Award">Award (General Honors)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Short Description */}
              <div>
                <label className="text-xs font-semibold text-brand-deep">
                  Card Short Description (Home & Lists)
                </label>
                <textarea
                  rows={2}
                  value={editingClub.desc}
                  onChange={(e) =>
                    setEditingClub((prev) => prev && { ...prev, desc: e.target.value })
                  }
                  placeholder="Short tagline summary displayed on home cards"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              {/* Row 3: Full About Section */}
              <div>
                <label className="text-xs font-semibold text-brand-deep">
                  Full Club Overview (Club Page /clubs/{editingClub.slug})
                </label>
                <textarea
                  rows={4}
                  value={editingClub.about}
                  onChange={(e) =>
                    setEditingClub((prev) => prev && { ...prev, about: e.target.value })
                  }
                  placeholder="Detailed paragraph explaining the club mission, projects, and activities"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              {/* Row 4: Theme Color & Presets */}
              <div>
                <label className="text-xs font-semibold text-brand-deep">Club Theme Color</label>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={editingClub.color}
                    onChange={(e) =>
                      setEditingClub((prev) => prev && { ...prev, color: e.target.value })
                    }
                    placeholder="var(--club-teal) or #008080"
                    className="w-48 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono outline-none focus:border-brand"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: "Teal", val: "var(--club-teal)", bg: "#00838f" },
                      { label: "Orange", val: "var(--club-orange)", bg: "#ff7043" },
                      { label: "Crimson", val: "var(--club-crimson)", bg: "#d81b60" },
                      { label: "Pink", val: "var(--club-pink)", bg: "#ec407a" },
                      { label: "Rust", val: "var(--club-rust)", bg: "#d97706" },
                      { label: "Plum", val: "var(--club-plum)", bg: "#7b1fa2" },
                      { label: "Indigo", val: "var(--club-indigo)", bg: "#3949ab" },
                      { label: "Slate", val: "var(--club-slate)", bg: "#475569" },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.val}
                        onClick={() =>
                          setEditingClub((prev) => prev && { ...prev, color: c.val })
                        }
                        className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          editingClub.color === c.val ? "border-black scale-110 shadow-sm" : "border-white"
                        }`}
                        style={{ backgroundColor: c.bg }}
                        title={`${c.label} (${c.val})`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 5: Faculty Mentor & Student Organizer */}
              <div className="grid gap-4 rounded-xl border border-border/80 bg-slate-50/70 p-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-deep">
                    Faculty Mentor
                  </h4>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Faculty Mentor Name</label>
                    <input
                      type="text"
                      value={editingClub.mentor || ""}
                      onChange={(e) =>
                        setEditingClub((prev) => prev && { ...prev, mentor: e.target.value })
                      }
                      placeholder="e.g. Faculty Mentor Name"
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Designation / Role</label>
                    <input
                      type="text"
                      value={editingClub.mentorRole || ""}
                      onChange={(e) =>
                        setEditingClub((prev) => prev && { ...prev, mentorRole: e.target.value })
                      }
                      placeholder="e.g. Mentor — Web & App Development"
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-deep">
                    Student Organizer
                  </h4>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Student Organizer Name</label>
                    <input
                      type="text"
                      value={editingClub.studentOrganizer || editingClub.studentMentor || ""}
                      onChange={(e) =>
                        setEditingClub((prev) =>
                          prev && {
                            ...prev,
                            studentOrganizer: e.target.value,
                            studentMentor: e.target.value,
                          },
                        )
                      }
                      placeholder="e.g. K. Harsha Vardhan"
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Organizer Academic Year & Branch</label>
                    <input
                      type="text"
                      value={editingClub.studentOrganizerRole || editingClub.studentMentorRole || ""}
                      onChange={(e) =>
                        setEditingClub((prev) =>
                          prev && {
                            ...prev,
                            studentOrganizerRole: e.target.value,
                            studentMentorRole: e.target.value,
                          },
                        )
                      }
                      placeholder="e.g. Final Year, CSE"
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Key Activities List */}
              <div>
                <label className="text-xs font-semibold text-brand-deep">
                  What We Do / Key Activities (Bullet Points)
                </label>
                <div className="mt-2 space-y-2">
                  {(editingClub.activities || []).map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={act}
                        onChange={(e) => {
                          const updated = [...(editingClub.activities || [])];
                          updated[idx] = e.target.value;
                          setEditingClub((prev) => prev && { ...prev, activities: updated });
                        }}
                        className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingClub.activities || []).filter((_, i) => i !== idx);
                          setEditingClub((prev) => prev && { ...prev, activities: updated });
                        }}
                        className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add New Activity Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newActivityInput}
                      onChange={(e) => setNewActivityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newActivityInput.trim()) {
                          e.preventDefault();
                          setEditingClub((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  activities: [...(prev.activities || []), newActivityInput.trim()],
                                }
                              : null,
                          );
                          setNewActivityInput("");
                        }
                      }}
                      placeholder="Add another activity item... (Press Enter or Click +)"
                      className="flex-1 rounded-lg border border-dashed border-border bg-secondary/50 px-3 py-1.5 text-xs outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newActivityInput.trim()) return;
                        setEditingClub((prev) =>
                          prev
                            ? {
                                ...prev,
                                activities: [...(prev.activities || []), newActivityInput.trim()],
                              }
                            : null,
                        );
                        setNewActivityInput("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-deep px-3 py-1.5 text-xs font-semibold text-white shadow-soft hover:brightness-110"
                    >
                      <Plus className="size-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 7: Banner Image Upload */}
              <div>
                <label className="text-xs font-semibold text-brand-deep">
                  Club Banner / Background Image
                </label>
                <div className="mt-1.5 flex flex-col gap-3.5 rounded-2xl border-2 border-dashed border-border/80 bg-background/80 p-4 transition-colors hover:border-brand/50 sm:flex-row sm:items-center">
                  {/* Banner Preview */}
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary shadow-soft">
                    {editingClub.image ? (
                      <img
                        src={
                          editingClub.image.startsWith("http") || editingClub.image.startsWith("data:")
                            ? editingClub.image
                            : `${API_BASE_URL.replace("/backend/api", "")}${editingClub.image}`
                        }
                        alt="Club Banner Preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div
                        className="grid size-full place-items-center text-center text-white"
                        style={{ backgroundColor: editingClub.color || "var(--club-teal)" }}
                      >
                        <span className="text-[10px] font-bold">Theme Color Banner</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & File Input */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={clubFileInputRef}
                      onChange={handleClubImageFile}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingClubImage}
                        onClick={() => clubFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110 disabled:opacity-60"
                      >
                        <Upload className="size-3.5" />
                        {isUploadingClubImage ? "Uploading..." : "Upload Banner from Device"}
                      </button>

                      {editingClub.image && (
                        <button
                          type="button"
                          onClick={() => setEditingClub((prev) => prev && { ...prev, image: "" })}
                          className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          Remove Custom Image
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        or Image URL:
                      </span>
                      <input
                        type="text"
                        value={editingClub.image || ""}
                        onChange={(e) =>
                          setEditingClub((prev) => prev && { ...prev, image: e.target.value })
                        }
                        placeholder="https://... or /images.jpg"
                        className="flex-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  The image displays behind the club theme color in the public banner of <code>/clubs/{editingClub.slug}</code> and inside CMS club cards.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsClubModalOpen(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clubModalSaving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-deep px-6 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110 disabled:opacity-60"
                >
                  <Save className="size-3.5" />
                  {clubModalSaving
                    ? "Saving..."
                    : isCreatingClub
                    ? "Create & Add Club"
                    : "Save Club Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
