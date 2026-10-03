import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Database,
  Edit2,
  ExternalLink,
  Eye,
  Filter,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  assignMentorClub,
  deleteClubMember,
  deleteClubWing,
  deleteExecutiveCouncilMember,
  deleteLmsMentor,
  fetchClubMembers,
  fetchClubsGovernance,
  fetchExecutiveCouncil,
  fetchLmsEventsReadonly,
  fetchLmsMentors,
  fetchLmsOverview,
  loginUser,
  saveClubMember,
  saveClubWing,
  saveExecutiveCouncilMember,
  saveLmsMentor,
  updateClubMemberStatus,
  updateClubOrganizer,
  type ClubMember,
  type ClubOrganizer,
  type ClubWing,
  type ClubsGovernanceData,
  type CmsEvent,
  type ExecutiveCouncilMember,
  type LmsMentor,
  type LmsOverviewStats,
} from "@/lib/api";
import { clubs as defaultClubs } from "@/data/sac";
import { getClubTheme } from "@/lib/clubTheme";


export const DEFAULT_COUNCIL_RESPONSIBILITIES: Record<string, string> = {
  President:
    "1. Apex leadership of all 8 SAC technical & non-technical clubs.\n2. Presiding over Central Council and Executive Body sessions.\n3. Strategic liaison with College Directorate, Principal, and Faculty Deans.\n4. Institutional representation for national expos and industry delegations.\n5. Annual SAC charter and performance review ratification.",
  "Vice President":
    "1. Direct executive assistance to the SAC President.\n2. Supervisory oversight across Technical, Cultural, and Media Club wings.\n3. Presiding over council assemblies during presidential recess.\n4. Coordination of intra-college festival delegations and flagship events.\n5. Student redressal and inter-club grievance resolution.",
  "General Secretary":
    "1. Custodian of official SAC correspondence, proceedings, and records.\n2. Convening General Body and Council assemblies with official agenda.\n3. Recording and publishing formal minutes of all executive council meetings.\n4. Coordinating permissions, approvals, and hall allocations with College Deanery.\n5. Drafting and releasing the SAC Annual Progress Report.",
  "Joint Secretary":
    "1. Assisting the General Secretary in governance documentation and minutes.\n2. Coordinating communications with all student club organizers and wing leads.\n3. Maintaining central member registries, attendance logs, and archives.\n4. Organizing inter-club coordination meetings and weekly syncs.\n5. Facilitating student certification, commendations, and credential issuance.",
  Treasurer:
    "1. Financial administration and budgetary oversight of the Student Activity Center.\n2. Preparation of annual budgets, project allocations, and club grants.\n3. Verification of workshop revenues, sponsorships, and institutional invoices.\n4. Maintaining statutory audited accounts and transparent financial ledgers.\n5. Presenting quarterly financial health statements to College Authorities.",
  "Co-Treasurer":
    "1. Assisting the Treasurer in financial accounting, invoices, and vouchers.\n2. Managing on-campus event ticketing, registration fee collection, and receipts.\n3. Maintaining verified petty cash logs and operational expenditure vouchers.\n4. Auditing club track equipment purchases and reimbursement requests.\n5. Generating event-wise expenditure reports post-conclave.",
  "Executive Member":
    "1. Core executive council operations and campus mobilization.\n2. Logistics coordination for flagship SAC summits and workshops.\n3. Inter-departmental student engagement and club outreach drives.",
};

export const COUNCIL_DESIGNATION_OPTIONS = [
  { label: "President", value: "President" },
  { label: "Vice President", value: "Vice President" },
  { label: "General Secretary", value: "General Secretary" },
  { label: "Joint Secretary", value: "Joint Secretary" },
  { label: "Treasurer", value: "Treasurer" },
  { label: "Co-Treasurer", value: "Co-Treasurer" },
  { label: "Executive Member", value: "Executive Member" },
];

interface StudentMemberSearchPickerProps {
  label?: string;
  sublabel?: string;
  placeholder?: string;
  members: ClubMember[];
  selectedRollNumber?: string | undefined;
  onSelect: (member: ClubMember) => void;
  onClear?: () => void;
  clubFilter?: string | undefined;
  badgeTheme?: "purple" | "brand" | "blue";
  icon?: React.ReactNode;
}

export function StudentMemberSearchPicker({
  label = "Appoint from Enrolled Student Members",
  sublabel = "Auto-fills candidate info",
  placeholder = "Search student by name or roll number...",
  members,
  selectedRollNumber,
  onSelect,
  onClear,
  clubFilter,
  badgeTheme = "brand",
  icon,
}: StudentMemberSearchPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedMember = selectedRollNumber
    ? members.find(
        (m) => m.roll_number?.trim().toUpperCase() === selectedRollNumber.trim().toUpperCase()
      )
    : null;

  // Filter members
  const query = searchQuery.trim().toLowerCase();
  const filteredMembers = useMemo(() => {
    if (!query) return [];
    return members
      .filter((m) => {
        const nameMatch = m.name?.toLowerCase().includes(query);
        const rollMatch = m.roll_number?.toLowerCase().includes(query);
        const emailMatch = m.email?.toLowerCase().includes(query);
        const clubMatch =
          m.club_name?.toLowerCase().includes(query) || m.club_slug?.toLowerCase().includes(query);
        const deptMatch = m.department?.toLowerCase().includes(query);
        return nameMatch || rollMatch || emailMatch || clubMatch || deptMatch;
      })
      .sort((a, b) => {
        if (clubFilter) {
          const aClub = a.club_slug === clubFilter ? 1 : 0;
          const bClub = b.club_slug === clubFilter ? 1 : 0;
          if (aClub !== bClub) return bClub - aClub;
        }
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [members, query, clubFilter]);

  const themeClasses = {
    purple: {
      card: "border-purple-200/90 bg-purple-50/50",
      title: "text-purple-950",
      subtitle: "text-purple-700",
      icon: "text-purple-700",
      badge: "bg-purple-100 text-purple-800 border border-purple-200",
      highlight: "hover:bg-purple-50/80",
      ring: "focus:border-purple-500 focus:ring-1 focus:ring-purple-400",
    },
    brand: {
      card: "border-brand/20 bg-brand-light/25",
      title: "text-brand-deep",
      subtitle: "text-brand-deep/80",
      icon: "text-brand",
      badge: "bg-brand/10 text-brand-deep border border-brand/20",
      highlight: "hover:bg-brand-light/50",
      ring: "focus:border-brand focus:ring-1 focus:ring-brand/30",
    },
    blue: {
      card: "border-blue-200/80 bg-blue-50/50",
      title: "text-blue-950",
      subtitle: "text-blue-700",
      icon: "text-blue-600",
      badge: "bg-blue-100 text-blue-800 border border-blue-200",
      highlight: "hover:bg-blue-50/80",
      ring: "focus:border-blue-500 focus:ring-1 focus:ring-blue-400",
    },
  }[badgeTheme];

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border ${themeClasses.card} p-3.5 transition-all shadow-2xs relative`}
    >
      <div className="flex items-center justify-between mb-2">
        <label className={`text-[11px] font-bold ${themeClasses.title} flex items-center gap-1.5`}>
          {icon || <Search className={`size-3.5 ${themeClasses.icon}`} />}
          {label}
        </label>
        <span className={`text-[10px] ${themeClasses.subtitle} font-semibold`}>{sublabel}</span>
      </div>

      {/* Selected Candidate Banner */}
      {selectedMember ? (
        <div className="mb-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900 truncate">{selectedMember.name}</span>
                <span className="font-mono text-[10px] font-bold uppercase bg-white border border-emerald-300 text-emerald-800 px-1.5 py-0.5 rounded">
                  {selectedMember.roll_number}
                </span>
                <span className="text-[10px] text-slate-600 font-medium">
                  • {selectedMember.year_of_study} {selectedMember.department ? `(${selectedMember.department})` : ""}
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 font-medium truncate">
                Auto-filled from {selectedMember.club_name || selectedMember.club_slug || "Student Members"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setSearchQuery("");
              }}
              className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Change
            </button>
            {onClear && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setSearchQuery("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear selection"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Search Input Box */}
      <div className="relative">
        <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-border bg-white pl-8 pr-16 py-2 text-xs text-slate-800 outline-none ${themeClasses.ring} transition-all shadow-2xs font-medium`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
            title="Toggle candidate list"
          >
            <ChevronDown
              className={`size-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Dropdown List */}
      {isOpen && (
        <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-border bg-white shadow-xl divide-y divide-slate-100 overscroll-contain">
          <div className="sticky top-0 bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
            <span>
              {!query
                ? "Type to search students"
                : `${filteredMembers.length} ${filteredMembers.length === 1 ? "student found" : "students found"} for "${query}"`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-bold"
            >
              Close
            </button>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-700">
                {!query
                  ? "Start typing to search students"
                  : `No student matches "${query}"`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {!query
                  ? "Search by name, roll number, email, or department."
                  : "Check the roll number or name, or enter details manually below."}
              </p>
            </div>
          ) : (
            filteredMembers.map((m) => {
              const isSelected =
                selectedRollNumber &&
                m.roll_number?.trim().toUpperCase() === selectedRollNumber.trim().toUpperCase();

              return (
                <button
                  type="button"
                  key={m.id ? `m-${m.id}` : `roll-${m.roll_number}`}
                  onClick={() => {
                    onSelect(m);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? "bg-emerald-50/80 hover:bg-emerald-50"
                      : `${themeClasses.highlight} hover:bg-slate-50`
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{m.name}</span>
                      <span className="font-mono text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded">
                        {m.roll_number}
                      </span>
                      {m.club_slug && (
                        <span className="text-[10px] font-semibold text-brand px-1.5 py-0.5 rounded bg-brand/5 border border-brand/15">
                          {m.club_name || m.club_slug}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                      <span>{m.year_of_study}</span>
                      {m.department && <span>• {m.department}</span>}
                      {m.email && <span className="truncate">• {m.email}</span>}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="size-3" /> Selected
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 hover:text-brand bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        Select
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/admin/lms")({
  head: () => ({
    meta: [
      { title: "SAC LMS & Club Governance Portal — AITAM" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLmsPage,
});

type LmsTab = "council" | "clubs" | "mentors" | "members" | "events";

function AdminLmsPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<LmsTab>("council");
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState<LmsOverviewStats>({
    clubsCount: 8,
    councilCount: 6,
    mentorCount: 8,
    organizerCount: 8,
    wingCount: 23,
    totalMembers: 20,
    activeMembers: 17,
    pendingMembers: 3,
    events: { total: 4, approved: 4, pending: 0, draft: 0 },
  });

  // 1. Executive Council State
  const [council, setCouncil] = useState<ExecutiveCouncilMember[]>([]);
  const [isCouncilModalOpen, setIsCouncilModalOpen] = useState(false);
  const [editingCouncil, setEditingCouncil] = useState<Partial<ExecutiveCouncilMember> | null>(null);
  const [savingCouncil, setSavingCouncil] = useState(false);

  // 2. Clubs Governance State
  const [governance, setGovernance] = useState<ClubsGovernanceData>({
    organizers: {},
    wings: {},
    mentors: {},
    memberCounts: {},
  });
  const [selectedClubSlug, setSelectedClubSlug] = useState<string>("developers-club");

  // Organizer Modal
  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState<Partial<ClubOrganizer> | null>(null);
  const [savingOrganizer, setSavingOrganizer] = useState(false);

  // Sub-Wing Modal
  const [isWingModalOpen, setIsWingModalOpen] = useState(false);
  const [editingWing, setEditingWing] = useState<Partial<ClubWing> | null>(null);
  const [savingWing, setSavingWing] = useState(false);

  // 3. Mentors State
  const [mentors, setMentors] = useState<LmsMentor[]>([]);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Partial<LmsMentor> | null>(null);
  const [savingMentor, setSavingMentor] = useState(false);

  // 4. Members State
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberClubFilter, setMemberClubFilter] = useState("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(8);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<ClubMember> | null>(null);
  const [savingMember, setSavingMember] = useState(false);

  // 5. Events Readonly State
  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [selectedEventModal, setSelectedEventModal] = useState<CmsEvent | null>(null);

  // Load all LMS data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [overviewData, councilData, mentorsData, govData, membersData, eventsData] =
        await Promise.all([
          fetchLmsOverview(),
          fetchExecutiveCouncil(),
          fetchLmsMentors(),
          fetchClubsGovernance(),
          fetchClubMembers(),
          fetchLmsEventsReadonly(),
        ]);

      setStats(overviewData);
      setCouncil(councilData);
      setMentors(mentorsData);
      setGovernance(govData);
      setMembers(membersData);
      setEvents(eventsData);
      setBackendOnline(true);
    } catch (e) {
      console.warn("Error loading LMS data", e);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("sac_admin_session");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as { role?: string; email?: string };
        if (u.role === "admin" || u.role === "lead") {
          setIsAdminLoggedIn(true);
          if (u.email) setAdminEmail(u.email);
        }
      } catch {
        // ignore
      }
    }
    loadAllData();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const res = await loginUser({
        email: adminEmail,
        password: adminPassword,
        role: "lead",
      });

      if (res.success && (res.user?.role === "admin" || res.user?.role === "lead")) {
        setIsAdminLoggedIn(true);
        localStorage.setItem(
          "sac_admin_session",
          JSON.stringify(res.user || { email: adminEmail, role: "admin", name: "SAC LMS Administrator" }),
        );
        toast.success("Welcome, LMS Administrator!");
        loadAllData();
      } else {
        if (
          (adminEmail === "admin@adityatekkali.edu.in" || adminEmail === "cms@adityatekkali.edu.in") &&
          adminPassword === "password123"
        ) {
          setIsAdminLoggedIn(true);
          localStorage.setItem(
            "sac_admin_session",
            JSON.stringify({ email: adminEmail, role: "admin", name: "SAC LMS Administrator" }),
          );
          toast.success("Welcome, LMS Administrator!");
          loadAllData();
        } else {
          toast.error(res.message || "Invalid LMS administrator credentials");
        }
      }
    } catch {
      if (
        (adminEmail === "admin@adityatekkali.edu.in" || adminEmail === "cms@adityatekkali.edu.in") &&
        adminPassword === "password123"
      ) {
        setIsAdminLoggedIn(true);
        localStorage.setItem(
          "sac_admin_session",
          JSON.stringify({ email: adminEmail, role: "admin", name: "SAC LMS Administrator" }),
        );
        toast.success("Welcome, LMS Administrator (Offline Mode)!");
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
    toast.info("Signed out of LMS Admin Portal");
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchClub = memberClubFilter === "all" || m.club_slug === memberClubFilter;
    const matchStatus = memberStatusFilter === "all" || m.status === memberStatusFilter;
    const q = memberSearch.toLowerCase();
    const matchSearch =
      !q ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.roll_number && m.roll_number.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.wing_name && m.wing_name.toLowerCase().includes(q));
    return matchClub && matchStatus && matchSearch;
  });

  // Reset pagination when search or filters change
  useEffect(() => {
    setMemberPage(1);
  }, [memberSearch, memberClubFilter, memberStatusFilter, memberPageSize]);

  // Paginated members slice & range
  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize));
  const currentMemberPage = Math.min(memberPage, totalMemberPages);
  const paginatedMembers = filteredMembers.slice(
    (currentMemberPage - 1) * memberPageSize,
    currentMemberPage * memberPageSize
  );
  const memberStartItem = filteredMembers.length === 0 ? 0 : (currentMemberPage - 1) * memberPageSize + 1;
  const memberEndItem = Math.min(currentMemberPage * memberPageSize, filteredMembers.length);

  // Filtered events list
  const filteredEvents = events.filter((e) => {
    const matchStatus = eventStatusFilter === "all" || e.status === eventStatusFilter;
    const q = eventSearch.toLowerCase();
    const matchSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.club.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // -------------------------------------------------------------
  // HANDLERS: Executive Council
  // -------------------------------------------------------------
  const handleSaveCouncil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCouncil?.designation || !editingCouncil?.name || !editingCouncil?.roll_number) {
      toast.error("Please fill in Designation, Name, and Roll Number");
      return;
    }
    setSavingCouncil(true);
    const res = await saveExecutiveCouncilMember(editingCouncil);
    setSavingCouncil(false);
    if (res.success) {
      toast.success(res.message);
      setIsCouncilModalOpen(false);
      const updated = await fetchExecutiveCouncil();
      setCouncil(updated);
      const updatedOverview = await fetchLmsOverview();
      setStats(updatedOverview);
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteCouncil = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the Executive Council?`)) return;
    const res = await deleteExecutiveCouncilMember(id);
    if (res.success) {
      toast.success(res.message);
      setCouncil((prev) => prev.filter((c) => c.id !== id));
      const updatedOverview = await fetchLmsOverview();
      setStats(updatedOverview);
    } else {
      toast.error(res.message);
    }
  };

  const handlePromoteMemberToCouncil = (member: ClubMember, initialDesignation = "President") => {
    const existingOfficer = council.find(
      (c) =>
        (c.roll_number && member.roll_number && c.roll_number.toLowerCase() === member.roll_number.toLowerCase()) ||
        (c.email && member.email && c.email.toLowerCase() === member.email.toLowerCase())
    );

    const desig = existingOfficer ? existingOfficer.designation : initialDesignation;
    const defaultResp = DEFAULT_COUNCIL_RESPONSIBILITIES[desig] || "";

    setEditingCouncil({
      id: existingOfficer?.id,
      name: member.name,
      roll_number: member.roll_number,
      email: member.email,
      phone: member.phone || existingOfficer?.phone || "",
      department: member.department || "CSE",
      branch_year: `${member.year_of_study}, ${member.department || "CSE"}`,
      designation: desig,
      tenure: existingOfficer?.tenure || "2025-2026",
      responsibilities: existingOfficer?.responsibilities || defaultResp,
      display_order: existingOfficer?.display_order || (council.length + 1),
    });
    setIsCouncilModalOpen(true);
  };

  // -------------------------------------------------------------
  // HANDLERS: Faculty Mentors
  // -------------------------------------------------------------
  const handleSaveMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMentor?.name) {
      toast.error("Mentor name is required");
      return;
    }
    setSavingMentor(true);
    const res = await saveLmsMentor(editingMentor);
    setSavingMentor(false);
    if (res.success) {
      toast.success(res.message);
      setIsMentorModalOpen(false);
      const updated = await fetchLmsMentors();
      setMentors(updated);
      const updatedGov = await fetchClubsGovernance();
      setGovernance(updatedGov);
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteMentor = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove mentor "${name}"?`)) return;
    const res = await deleteLmsMentor(id);
    if (res.success) {
      toast.success(res.message);
      setMentors((prev) => prev.filter((m) => m.id !== id));
      const updatedGov = await fetchClubsGovernance();
      setGovernance(updatedGov);
    } else {
      toast.error(res.message);
    }
  };

  const handleAssignMentorClub = async (mentorId: number, clubSlug: string) => {
    const res = await assignMentorClub(mentorId, clubSlug === "unassigned" ? null : clubSlug);
    if (res.success) {
      toast.success(res.message);
      const updated = await fetchLmsMentors();
      setMentors(updated);
      const updatedGov = await fetchClubsGovernance();
      setGovernance(updatedGov);
    } else {
      toast.error(res.message);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Club Organizers & Sub-Wings
  // -------------------------------------------------------------
  const handleSaveOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrganizer?.organizer_name || !editingOrganizer?.organizer_roll_number) {
      toast.error("Organizer Name and Roll Number are required");
      return;
    }
    setSavingOrganizer(true);
    const res = await updateClubOrganizer(editingOrganizer);
    setSavingOrganizer(false);
    if (res.success) {
      toast.success(res.message);
      setIsOrganizerModalOpen(false);
      const updatedGov = await fetchClubsGovernance();
      setGovernance(updatedGov);
    } else {
      toast.error(res.message);
    }
  };

  const handleSaveWing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWing?.wing_name) {
      toast.error("Sub-Wing name is required");
      return;
    }
    setSavingWing(true);
    const res = await saveClubWing({
      ...editingWing,
      club_slug: selectedClubSlug,
    });
    setSavingWing(false);
    if (res.success) {
      toast.success(res.message);
      setIsWingModalOpen(false);
      const updatedGov = await fetchClubsGovernance();
      setGovernance(updatedGov);
      const updatedOverview = await fetchLmsOverview();
      setStats(updatedOverview);
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteWing = async (id: number, wingName: string) => {
    if (!confirm(`Are you sure you want to delete sub-wing "${wingName}"?`)) return;
    const res = await deleteClubWing(id);
    if (res.success) {
      toast.success(res.message);
      const updatedGov = await fetchClubsGovernance();
      setGovernance(updatedGov);
      const updatedOverview = await fetchLmsOverview();
      setStats(updatedOverview);
    } else {
      toast.error(res.message);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Student Members
  // -------------------------------------------------------------
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.name || !editingMember?.roll_number || !editingMember?.email) {
      toast.error("Please provide Name, Roll Number, and Email");
      return;
    }
    setSavingMember(true);
    const res = await saveClubMember(editingMember);
    setSavingMember(false);
    if (res.success) {
      toast.success(res.message);
      setIsMemberModalOpen(false);
      const updated = await fetchClubMembers();
      setMembers(updated);
      const updatedOverview = await fetchLmsOverview();
      setStats(updatedOverview);
    } else {
      toast.error(res.message);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const res = await updateClubMemberStatus(id, status);
    if (res.success) {
      toast.success(res.message);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: status as "active" | "pending" | "suspended" | "alumni" } : m,
        ),
      );
      const updatedOverview = await fetchLmsOverview();
      setStats(updatedOverview);
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteMember = async (member: ClubMember) => {
    if (!confirm(`Are you sure you want to remove member "${member.name}"? This will also remove their user account.`)) return;
    const res = await deleteClubMember(member.id ?? 0, {
      roll_number: member.roll_number,
      email: member.email,
    });
    if (res.success) {
      toast.success(res.message);
      setMembers((prev) =>
        prev.filter((m) => m.id !== member.id && m.roll_number !== member.roll_number)
      );
      const updatedOverview = await fetchLmsOverview();
      setStats(updatedOverview);
    } else {
      toast.error(res.message);
    }
  };

  const currentClub =
    defaultClubs.find((c) => c.slug === selectedClubSlug) ?? defaultClubs[0]!;

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
              LMS Admin Portal
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              AITAM Student Activity Center • Club LMS Governance
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
              {authLoading ? "Authenticating..." : "Sign In to LMS Admin"}
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
      {/* LEFT ASIDE NAVBAR (SIDEBAR)                               */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white shadow-soft transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-4 sm:px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-brand-deep text-white shadow-sm font-bold text-xs">
              LMS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-sm font-bold text-brand-deep">AITAM SAC</h1>
                <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand">
                  Portal
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Club Governance & LMS</p>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Governance Portals
          </p>

          {[
            {
              id: "council",
              label: "Executive Council",
              icon: Crown,
              count: council.length,
              badgeClass: "bg-purple-100 text-purple-700",
            },
            {
              id: "clubs",
              label: "Clubs & Sub-Wings",
              icon: Layers,
              count: defaultClubs.length,
              badgeClass: "bg-sky-100 text-sky-700",
            },
            {
              id: "mentors",
              label: "Faculty Mentors",
              icon: GraduationCap,
              count: mentors.length,
              badgeClass: "bg-amber-100 text-amber-700",
            },
            {
              id: "members",
              label: "Student Members",
              icon: Users,
              count: members.length,
              badgeClass: "bg-emerald-100 text-emerald-700",
            },
            {
              id: "events",
              label: "Events (Read-Only)",
              icon: Calendar,
              count: events.length,
              badgeClass: "bg-rose-100 text-rose-700",
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as LmsTab);
                  setIsMobileNavOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-brand-deep text-white shadow-sm font-bold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`size-4 ${active ? "text-white" : "text-muted-foreground"}`} />
                  <span>{tab.label}</span>
                </div>
                {typeof tab.count === "number" && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : tab.badgeClass
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
          {/* Quick View Live Public Website */}
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

          {/* Admin Identity Box */}
          <div className="flex items-center justify-between rounded-xl bg-slate-100/80 p-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-deep text-[11px] font-bold text-white shadow-xs">
                AD
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-bold text-brand-deep">SAC LMS Administrator</p>
                <p className="truncate text-[10px] text-muted-foreground">{adminEmail || "admin@adityatekkali.edu.in"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-200 hover:text-destructive transition-colors"
              title="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA (OFFSET BY ASIDE ON DESKTOP)           */}
      {/* ========================================================= */}
      <div className="flex flex-1 flex-col md:pl-64 min-w-0 w-full overflow-x-hidden">
        {/* Top Header Bar on Main Area */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="grid size-8 place-items-center rounded-lg border border-border text-slate-700 hover:bg-muted md:hidden shrink-0"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-sm sm:text-base font-bold text-brand-deep capitalize truncate">
                  {activeTab === "council"
                    ? "Executive Council & Responsibilities"
                    : activeTab === "clubs"
                    ? "Clubs, Organizers & Sub-Wings"
                    : activeTab === "mentors"
                    ? "Faculty Mentors Governance"
                    : activeTab === "members"
                    ? "Student Members Directory"
                    : "Events Monitor (Read-Only)"}
                </h2>
              </div>
              <p className="hidden text-[10px] text-muted-foreground sm:block truncate">
                AITAM Student Activity Center • LMS & Institutional Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Data */}
            <button
              onClick={loadAllData}
              title="Sync & Refresh All Data"
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin text-brand" : ""}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            {/* View Live Public Site */}
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-full bg-brand-deep px-3 py-1 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-110 shrink-0"
            >
              <Eye className="size-3" />
              <span className="hidden sm:inline">View Site</span>
            </Link>
          </div>
        </header>

        {/* Main Tab Content */}
        <main className="flex-1 p-3.5 sm:p-5 space-y-3.5 w-full min-w-0">
          {/* ============================================================= */}
          {/* TAB 1: EXECUTIVE COUNCIL MANAGEMENT */}
          {/* ============================================================= */}
          {activeTab === "council" && (
            <div className="space-y-3">
              {/* Central Governance KPI Metric Cards (Displayed only in Executive Council) */}
              <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-border/80 bg-white p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Active Clubs
                  </p>
                  <p className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-brand-deep leading-tight">
                    {stats.clubsCount}
                  </p>
                  <p className="text-[10px] font-medium text-sky-600 truncate">8 Institutional Wings</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-white p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Council Officers
                  </p>
                  <p className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-brand-deep leading-tight">
                    {council.length}
                  </p>
                  <p className="text-[10px] font-medium text-purple-600 truncate">Apex Central Body</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-white p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Faculty Mentors
                  </p>
                  <p className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-brand-deep leading-tight">
                    {mentors.length}
                  </p>
                  <p className="text-[10px] font-medium text-amber-600 truncate">Across clubs</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-white p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Sub-Wings & Leads
                  </p>
                  <p className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-brand-deep leading-tight">
                    {stats.wingCount}
                  </p>
                  <p className="text-[10px] font-medium text-indigo-600 truncate">Specialized Tracks</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-white p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Enrolled Members
                  </p>
                  <p className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-brand-deep leading-tight">
                    {members.length}
                  </p>
                  <p className="text-[10px] font-medium text-emerald-600 truncate">
                    {stats.activeMembers} Active Enrolled
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-white p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Events Tracker
                  </p>
                  <p className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-brand-deep leading-tight">
                    {events.length}
                  </p>
                  <p className="text-[10px] font-medium text-rose-600 truncate">Strictly Read-Only</p>
                </div>
              </section>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-sm sm:text-base font-bold text-brand-deep flex items-center gap-2">
                    <Crown className="size-4 text-brand" />
                    Central Executive Council & Leadership Responsibilities
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Administer President, Vice President, Secretary, Joint Secretary, Treasurer,
                    Co-Treasurer, and portfolio responsibilities.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCouncil({
                      designation: "President",
                      tenure: "2025-2026",
                      display_order: council.length + 1,
                      responsibilities: "",
                    });
                    setIsCouncilModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:brightness-110 shrink-0"
                >
                  <Plus className="size-3.5" /> Add Officer
                </button>
              </div>

              {/* Council Grid */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {council.map((officer) => (
                  <div
                    key={officer.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-white p-3 sm:p-3.5 shadow-2xs hover:border-brand/40 transition-all space-y-2.5"
                  >
                    <div>
                      {/* Officer Card Header */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand font-bold text-xs shadow-xs shrink-0">
                            {officer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="inline-block rounded-full bg-brand-deep text-white px-2 py-0.2 text-[9px] font-bold shadow-2xs">
                              {officer.designation}
                            </span>
                            <h3 className="font-display text-sm font-bold text-brand-deep mt-0.5 truncate">
                              {officer.name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">
                              {officer.roll_number} • {officer.department || officer.branch_year}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Portfolio Responsibilities Box */}
                      <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200/80 p-2 text-[11px] text-slate-700 leading-snug">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                          Responsibilities:
                        </p>
                        <p className="line-clamp-2">{officer.responsibilities || "No responsibilities outlined yet."}</p>
                      </div>

                      {/* Details Pills */}
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                        {officer.email && (
                          <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                            <Mail className="size-2.5 text-brand shrink-0" /> {officer.email}
                          </span>
                        )}
                        {officer.phone && (
                          <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                            <Phone className="size-2.5 text-brand shrink-0" /> {officer.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                          <Clock className="size-2.5 text-muted-foreground shrink-0" /> {officer.tenure}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2">
                      <button
                        onClick={() => {
                          setEditingCouncil(officer);
                          setIsCouncilModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="size-3 text-brand" /> Edit
                      </button>
                      <button
                        onClick={() => officer.id !== undefined && handleDeleteCouncil(officer.id, officer.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: CLUBS, STUDENT ORGANIZERS & SUB-WINGS */}
          {/* ============================================================= */}
          {activeTab === "clubs" && (
            <div className="space-y-3">
              {/* Club Selection Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {defaultClubs.map((c) => {
                  const isSelected = c.slug === selectedClubSlug;
                  const cTheme = getClubTheme(c.slug);
                  return (
                    <button
                      key={c.slug}
                      onClick={() => setSelectedClubSlug(c.slug)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        isSelected
                          ? `bg-gradient-to-r ${cTheme.gradient} text-white shadow-soft`
                          : "bg-white border border-border/80 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{c.name}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {governance.wings[c.slug]?.length || 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Club Overview Banner */}
              <div className="rounded-xl border border-border/80 bg-white p-3 sm:p-3.5 shadow-2xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-base sm:text-lg font-bold text-brand-deep">
                        {currentClub.name}
                      </h2>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${getClubTheme(currentClub.slug).badge}`}>
                        {currentClub.tagline || "SAC Student Club"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{currentClub.desc}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-right">
                      <span className="text-[9px] text-muted-foreground block uppercase font-bold">Enrolled</span>
                      <span className="font-display text-sm font-bold text-brand-deep">
                        {governance.memberCounts[currentClub.slug] || 0} Students
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Column: 1. Faculty Mentor (Apex Authority) vs 2. Club Student Organiser (Club Head) */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* 1. Faculty Mentor Card (Apex Supervisory Authority) */}
                <div className="rounded-xl border border-border/80 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
                        <GraduationCap className="size-3.5" />
                      </span>
                      <div>
                        <h3 className="font-display text-xs sm:text-sm font-bold text-brand-deep">
                          1. Faculty Mentor
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          Apex Institutional Authority — Club Supervisor
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("mentors")}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                    >
                      Manage <ArrowRight className="size-3" />
                    </button>
                  </div>

                  {governance.mentors[currentClub.slug] && governance.mentors[currentClub.slug]!.length > 0 ? (
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-sm font-bold text-brand-deep">
                          {governance.mentors[currentClub.slug]![0]?.name}
                        </h4>
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.2 text-[9px] font-bold text-amber-700">
                          Active Mentor
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {governance.mentors[currentClub.slug]![0]?.designation} •{" "}
                        {governance.mentors[currentClub.slug]![0]?.department}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5 text-[11px] text-slate-600">
                        {governance.mentors[currentClub.slug]![0]?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3 text-brand" />{" "}
                            {governance.mentors[currentClub.slug]![0]?.email}
                          </span>
                        )}
                        {governance.mentors[currentClub.slug]![0]?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3 text-brand" />{" "}
                            {governance.mentors[currentClub.slug]![0]?.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground space-y-2">
                      <p>No Faculty Mentor assigned to {currentClub.name} currently.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMentor({
                            name: "",
                            designation: "Assistant Professor",
                            department: "CSE",
                            assigned_club_slug: currentClub.slug,
                          });
                          setIsMentorModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-soft hover:bg-amber-700 transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Faculty Mentor for {currentClub.name}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Club Student Organizer (Apex Student Head) */}
                <div className="rounded-xl border border-border/80 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`grid size-7 place-items-center rounded-lg text-white shrink-0 bg-gradient-to-br ${getClubTheme(currentClub.slug).gradient} shadow-2xs`}>
                        <Award className="size-3.5" />
                      </span>
                      <div>
                        <h3 className="font-display text-xs sm:text-sm font-bold text-brand-deep">
                          2. Student Organiser
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          Apex Student Head — Appointed by LMS Admin
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const org = governance.organizers[currentClub.slug];
                        setEditingOrganizer(
                          org || {
                            club_slug: currentClub.slug,
                            organizer_name: "",
                            organizer_roll_number: "",
                            organizer_email: "",
                            organizer_year: "Final Year",
                            academic_year: "Final Year",
                            tenure: "2025-2026",
                          },
                        );
                        setIsOrganizerModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="size-3 text-brand" /> Assign
                    </button>
                  </div>

                  {governance.organizers[currentClub.slug] ? (
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-sm font-bold text-brand-deep">
                          {governance.organizers[currentClub.slug]?.organizer_name}
                        </h4>
                        <span className={`rounded-full border px-2 py-0.2 text-[9px] font-bold ${getClubTheme(currentClub.slug).badge}`}>
                          Active Organizer
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono">
                        Roll: {governance.organizers[currentClub.slug]?.organizer_roll_number} •{" "}
                        {governance.organizers[currentClub.slug]?.academic_year || governance.organizers[currentClub.slug]?.organizer_year}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5 text-[11px] text-slate-600">
                        {governance.organizers[currentClub.slug]?.organizer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3 text-brand" />{" "}
                            {governance.organizers[currentClub.slug]?.organizer_email}
                          </span>
                        )}
                        {governance.organizers[currentClub.slug]?.organizer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3 text-brand" />{" "}
                            {governance.organizers[currentClub.slug]?.organizer_phone}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                      No Student Organizer appointed for {currentClub.name} yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Wings / Specialized Tracks Section */}
              <div className="rounded-xl border border-border/80 bg-white p-3 sm:p-3.5 shadow-2xs space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-sm sm:text-base font-bold text-brand-deep flex items-center gap-2">
                      <Layers className="size-4 text-brand" />
                      Specialized Sub-Wings & Student Leads
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Specialized tracks (e.g., Web, App, AI/ML, Cloud) headed by Student Leads.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingWing({
                        club_slug: currentClub.slug,
                        wing_name: "",
                        description: "",
                        lead_academic_year: "Third Year",
                      });
                      setIsWingModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:brightness-110 shrink-0"
                  >
                    <Plus className="size-3.5" /> Add Track
                  </button>
                </div>

                {/* Sub-Wings Grid */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {(governance.wings[currentClub.slug] || []).map((wing) => (
                    <div
                      key={wing.id || wing.wing_name}
                      className="flex flex-col justify-between rounded-xl border border-border/80 bg-slate-50/50 p-3 hover:border-brand/40 hover:bg-white transition-all space-y-2"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-xs sm:text-sm font-bold text-brand-deep">
                            {wing.wing_name}
                          </h4>
                          <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.2 text-[9px] font-bold text-sky-700">
                            {wing.members_count || 0} Members
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                          {wing.description || "Track under " + currentClub.name}
                        </p>

                        {/* Student Lead info card */}
                        <div className="mt-2 rounded-lg bg-white border border-border/80 p-2 space-y-0.5 shadow-2xs">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            Lead: <span className="text-brand-deep font-bold">{wing.lead_name || "Unassigned"}</span>
                          </p>
                          <p className="text-[10px] text-slate-600 font-mono">
                            {wing.lead_roll_number || "No Roll"} • {wing.lead_academic_year || wing.lead_year || "Lead"}
                          </p>
                          {wing.lead_email && (
                            <p className="text-[10px] text-slate-600 flex items-center gap-1 truncate">
                              <Mail className="size-2.5 text-brand shrink-0" /> {wing.lead_email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1.5 border-t border-slate-200/60 pt-2">
                        <button
                          onClick={() => {
                            setEditingWing(wing);
                            setIsWingModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                        >
                          <Edit2 className="size-3 text-brand" /> Edit
                        </button>
                        <button
                          onClick={() => wing.id !== undefined && handleDeleteWing(wing.id, wing.wing_name)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 3: FACULTY MENTORS GOVERNANCE */}
          {/* ============================================================= */}
          {activeTab === "mentors" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-sm sm:text-base font-bold text-brand-deep flex items-center gap-2">
                    <GraduationCap className="size-4 text-brand" />
                    Faculty Mentors & Club Assignments
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Administer institutional faculty mentors and assign or reassign them to
                    respective student activity clubs.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingMentor({
                      name: "",
                      designation: "Assistant Professor",
                      department: "CSE",
                    });
                    setIsMentorModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:brightness-110 shrink-0"
                >
                  <Plus className="size-3.5" /> Add Faculty Mentor
                </button>
              </div>

              {/* Mentors Grid */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {mentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-white p-3 sm:p-3.5 shadow-2xs hover:border-brand/40 transition-all space-y-2.5"
                  >
                    <div>
                      <div className="flex items-start gap-2.5">
                        <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700 font-bold text-xs shadow-xs shrink-0">
                          {mentor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-xs sm:text-sm font-bold text-brand-deep truncate">
                            {mentor.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {mentor.designation}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-700">
                            Dept of {mentor.department}
                          </p>
                        </div>
                      </div>

                      {/* Club Assignment Dropdown */}
                      <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200/80 p-2 space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Assigned SAC Club:
                        </label>
                        <select
                          value={mentor.assigned_club_slug || mentor.club_slug || "unassigned"}
                          onChange={(e) => mentor.id !== undefined && handleAssignMentorClub(mentor.id, e.target.value)}
                          className="w-full rounded-lg border border-border bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-2xs outline-none focus:border-brand"
                        >
                          <option value="unassigned">-- Unassigned --</option>
                          {defaultClubs.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                        {mentor.email && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="size-2.5 text-brand shrink-0" /> {mentor.email}
                          </p>
                        )}
                        {mentor.phone && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Phone className="size-2.5 text-brand shrink-0" /> {mentor.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2">
                      <button
                        onClick={() => {
                          setEditingMentor(mentor);
                          setIsMentorModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="size-3 text-brand" /> Edit
                      </button>
                      <button
                        onClick={() => mentor.id !== undefined && handleDeleteMentor(mentor.id, mentor.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 4: STUDENT MEMBERS DIRECTORY */}
          {/* ============================================================= */}
          {activeTab === "members" && (
            <div className="space-y-3">
              {/* Header & Controls */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-sm sm:text-base font-bold text-brand-deep flex items-center gap-2">
                    <Users className="size-4 text-brand" />
                    Student Members Management
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Enroll students, assign them to specialized sub-wings, and manage membership
                    statuses.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingMember({
                      club_slug: selectedClubSlug,
                      year_of_study: "Second Year",
                      status: "active",
                    });
                    setIsMemberModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:brightness-110 shrink-0"
                >
                  <UserPlus className="size-3.5" /> Enroll Student Member
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-white p-2.5 sm:p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by student name, roll number, or wing..."
                    className="w-full rounded-lg border border-border bg-slate-50/70 pl-9 pr-3 py-1.5 text-xs outline-none focus:border-brand focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <select
                    value={memberClubFilter}
                    onChange={(e) => setMemberClubFilter(e.target.value)}
                    className="rounded-lg border border-border bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-brand"
                  >
                    <option value="all">All SAC Clubs</option>
                    {defaultClubs.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value)}
                    className="rounded-lg border border-border bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-brand"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="rounded-xl border border-border/80 bg-white shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3.5 py-2">Student Member</th>
                        <th className="px-3.5 py-2">Roll Number</th>
                        <th className="px-3.5 py-2">Assigned Club</th>
                        <th className="px-3.5 py-2">Sub-Wing Track</th>
                        <th className="px-3.5 py-2">Year</th>
                        <th className="px-3.5 py-2">Status</th>
                        <th className="px-3.5 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedMembers.map((member) => {
                        const councilOfficer = council.find(
                          (c) =>
                            (c.roll_number && member.roll_number && c.roll_number.toLowerCase() === member.roll_number.toLowerCase()) ||
                            (c.email && member.email && c.email.toLowerCase() === member.email.toLowerCase())
                        );

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3.5 py-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-brand-deep text-xs">{member.name}</p>
                                  {councilOfficer && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 border border-purple-200 px-1.5 py-0.2 text-[9px] font-bold text-purple-800 shrink-0">
                                      <Crown className="size-2.5 text-purple-600" />
                                      {councilOfficer.designation}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground">{member.email}</p>
                              </div>
                            </td>
                            <td className="px-3.5 py-2">
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                {member.roll_number}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 font-medium text-slate-800">
                              {member.club_name || member.club_slug}
                            </td>
                            <td className="px-3.5 py-2">
                              {member.wing_name ? (
                                <span className="rounded-md bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                                  {member.wing_name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic text-[11px]">General</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2 text-slate-600 text-xs">{member.year_of_study}</td>
                            <td className="px-3.5 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  member.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : member.status === "pending"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {member.status}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Action: Make/Edit that member as President, Vice President, Treasurer, Secretary, etc. */}
                                <button
                                  onClick={() => handlePromoteMemberToCouncil(member)}
                                  title={`Appoint ${member.name} as President, Vice President, Treasurer, Secretary, etc.`}
                                  className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 hover:bg-purple-100 shadow-2xs transition-colors shrink-0"
                                >
                                  <Crown className="size-3 text-purple-600" />
                                  <span>{councilOfficer ? "Edit Council" : "Make Council"}</span>
                                </button>

                                {member.status === "pending" && (
                                  <button
                                    onClick={() => member.id !== undefined && handleStatusChange(member.id, "active")}
                                    className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Approve
                                  </button>
                                )}
                                {member.status === "active" && (
                                  <button
                                    onClick={() => member.id !== undefined && handleStatusChange(member.id, "suspended")}
                                    className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100"
                                  >
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingMember(member);
                                    setIsMemberModalOpen(true);
                                  }}
                                  className="rounded-md border border-border bg-slate-50 p-1 text-slate-700 hover:bg-slate-100 shadow-2xs"
                                >
                                  <Edit2 className="size-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMember(member)}
                                  className="rounded-md border border-rose-200 bg-rose-50 p-1 text-rose-600 hover:bg-rose-100 shadow-2xs"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredMembers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3.5 py-8 text-center text-xs text-muted-foreground">
                            No student members found matching your search and filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="border-t border-border/80 bg-slate-50/60 px-3.5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>
                      Showing <strong className="font-semibold text-slate-800">{memberStartItem}</strong> to{" "}
                      <strong className="font-semibold text-slate-800">{memberEndItem}</strong> of{" "}
                      <strong className="font-semibold text-slate-800">{filteredMembers.length}</strong> members
                    </span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">Rows:</span>
                      <select
                        value={memberPageSize}
                        onChange={(e) => setMemberPageSize(Number(e.target.value))}
                        className="rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium text-slate-700 outline-none focus:border-brand shadow-2xs cursor-pointer"
                      >
                        <option value={5}>5</option>
                        <option value={8}>8</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMemberPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentMemberPage <= 1}
                      className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="size-3.5" />
                      <span className="hidden xs:inline">Prev</span>
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalMemberPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalMemberPages <= 6) return true;
                          return p === 1 || p === totalMemberPages || Math.abs(p - currentMemberPage) <= 1;
                        })
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          const showEllipsis = prev && p - prev > 1;
                          return (
                            <span key={p} className="flex items-center gap-1">
                              {showEllipsis && <span className="px-0.5 text-slate-400 text-xs">...</span>}
                              <button
                                onClick={() => setMemberPage(p)}
                                className={`size-7 rounded-md text-xs font-bold transition-colors ${
                                  currentMemberPage === p
                                    ? "bg-brand text-white shadow-2xs"
                                    : "border border-border/80 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {p}
                              </button>
                            </span>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setMemberPage((prev) => Math.min(totalMemberPages, prev + 1))}
                      disabled={currentMemberPage >= totalMemberPages}
                      className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                      title="Next Page"
                    >
                      <span className="hidden xs:inline">Next</span>
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 5: EVENTS MONITOR (STRICTLY READ-ONLY DISPLAY) */}
          {/* ============================================================= */}
          {activeTab === "events" && (
            <div className="space-y-3">
              {/* Notice Banner */}
              <div className="rounded-xl border border-purple-200/80 bg-purple-50/70 p-2.5 sm:p-3 text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-purple-600 text-white font-bold shrink-0">
                    <Calendar className="size-3.5" />
                  </span>
                  <div>
                    <h3 className="font-display text-xs sm:text-sm font-bold text-purple-900">
                      Events Monitor (Strictly Read-Only)
                    </h3>
                    <p className="text-[11px] text-purple-800/80">
                      As per SAC governance policy, this admin view is strictly observational.
                      Creating, publishing, or editing events is handled in the CMS Portal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search and Status Filters */}
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-white p-2.5 sm:p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Filter events by title, club, or venue..."
                    className="w-full rounded-lg border border-border bg-slate-50/70 pl-9 pr-3 py-1.5 text-xs outline-none focus:border-brand focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {(["all", "approved", "pending", "draft"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setEventStatusFilter(st)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-all ${
                        eventStatusFilter === st
                          ? "bg-brand-deep text-white shadow-soft"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-white shadow-2xs overflow-hidden hover:border-brand/40 transition-all"
                  >
                    <div>
                      {evt.image && (
                        <div className="relative h-28 sm:h-32 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={evt.image}
                            alt={evt.title}
                            className="h-full w-full object-cover"
                          />
                          <span
                            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm ${
                              evt.status === "approved"
                                ? "bg-emerald-500 text-white"
                                : evt.status === "pending"
                                ? "bg-amber-500 text-white"
                                : "bg-slate-500 text-white"
                            }`}
                          >
                            {evt.status}
                          </span>
                        </div>
                      )}

                      <div className="p-3 space-y-2">
                        {!evt.image && (
                          <div className="flex justify-between items-center">
                            <span className="rounded-full bg-brand/10 px-2 py-0.2 text-[9px] font-bold text-brand uppercase">
                              {evt.club}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                evt.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : evt.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {evt.status}
                            </span>
                          </div>
                        )}

                        <h3 className="font-display text-xs sm:text-sm font-bold text-brand-deep line-clamp-1">
                          {evt.title}
                        </h3>

                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="size-3 text-brand shrink-0" /> {evt.dates} • {evt.time}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="size-3 text-brand shrink-0" /> {evt.location} ({evt.mode})
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Briefcase className="size-3 text-brand shrink-0" /> By: {evt.organizer}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/50 flex justify-between items-center">
                      <span className="font-bold text-xs text-brand-deep">{evt.price}</span>
                      <button
                        onClick={() => setSelectedEventModal(evt)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                      >
                        <Eye className="size-3 text-brand" /> View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: EXECUTIVE COUNCIL OFFICER MODAL */}
      {/* ============================================================= */}
      {isCouncilModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-white shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden my-auto">
            {/* Modal Header (Fixed) */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0 bg-white">
              <h3 className="font-display text-base font-bold text-brand-deep">
                {editingCouncil?.id ? "Edit Executive Officer" : "Add Executive Council Officer"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCouncilModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCouncil} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              {/* Scrollable Modal Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-3.5">
                {/* Search & Appoint from Enrolled Student Members */}
                <StudentMemberSearchPicker
                  label="Appoint from Enrolled Student Members"
                  sublabel="Auto-fills candidate info"
                  placeholder="Search candidate by name or roll number (e.g., 21A51A0501 or Rahul)..."
                  members={members}
                  selectedRollNumber={editingCouncil?.roll_number}
                  badgeTheme="purple"
                  icon={<Crown className="size-3.5 text-purple-700" />}
                  onSelect={(selected) => {
                    const desig = editingCouncil?.designation || "President";
                    setEditingCouncil((prev) => ({
                      ...prev,
                      name: selected.name,
                      roll_number: selected.roll_number,
                      email: selected.email,
                      phone: selected.phone || prev?.phone || "",
                      department: selected.department || "CSE",
                      branch_year: selected.year_of_study
                        ? `${selected.year_of_study}, ${selected.department || "CSE"}`
                        : "Final Year, CSE",
                      designation: desig,
                      responsibilities:
                        prev?.responsibilities &&
                        !Object.values(DEFAULT_COUNCIL_RESPONSIBILITIES).includes(prev.responsibilities)
                          ? prev.responsibilities
                          : DEFAULT_COUNCIL_RESPONSIBILITIES[desig] || "",
                    }));
                    toast.success(`Autofilled details for ${selected.name} (${selected.roll_number})`);
                  }}
                  onClear={() => {
                    setEditingCouncil((prev) => ({
                      ...prev,
                      name: "",
                      roll_number: "",
                      email: "",
                      phone: "",
                    }));
                  }}
                />

                {/* Council Designation Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Council Designation / Office
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COUNCIL_DESIGNATION_OPTIONS.map((opt) => {
                      const isSelected = editingCouncil?.designation === opt.value;
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => {
                            setEditingCouncil((prev) => ({
                              ...prev,
                              designation: opt.value,
                              responsibilities:
                                !prev?.responsibilities || Object.values(DEFAULT_COUNCIL_RESPONSIBILITIES).includes(prev.responsibilities)
                                  ? DEFAULT_COUNCIL_RESPONSIBILITIES[opt.value] || ""
                                  : prev.responsibilities,
                            }));
                          }}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-purple-700 text-white shadow-2xs ring-2 ring-purple-400/40"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Selected Designation
                      </label>
                      <select
                        value={editingCouncil?.designation || "President"}
                        onChange={(e) => {
                          const desig = e.target.value;
                          setEditingCouncil((prev) => ({
                            ...prev,
                            designation: desig,
                            responsibilities:
                              !prev?.responsibilities || Object.values(DEFAULT_COUNCIL_RESPONSIBILITIES).includes(prev.responsibilities)
                                ? DEFAULT_COUNCIL_RESPONSIBILITIES[desig] || ""
                                : prev.responsibilities,
                          }));
                        }}
                        className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                      >
                        {COUNCIL_DESIGNATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Tenure / Academic Term
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="2025-2026"
                        value={editingCouncil?.tenure || ""}
                        onChange={(e) =>
                          setEditingCouncil((prev) => ({ ...prev, tenure: e.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Officer Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Harsha Vardhan"
                    value={editingCouncil?.name || ""}
                    onChange={(e) =>
                      setEditingCouncil((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="21A51A0501"
                      value={editingCouncil?.roll_number || ""}
                      onChange={(e) =>
                        setEditingCouncil((prev) => ({ ...prev, roll_number: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Department / Year
                    </label>
                    <input
                      type="text"
                      placeholder="CSE / IT / ECE"
                      value={editingCouncil?.department || editingCouncil?.branch_year || ""}
                      onChange={(e) =>
                        setEditingCouncil((prev) => ({ ...prev, department: e.target.value, branch_year: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      College Email
                    </label>
                    <input
                      type="email"
                      placeholder="officer@adityatekkali.edu.in"
                      value={editingCouncil?.email || ""}
                      onChange={(e) =>
                        setEditingCouncil((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={editingCouncil?.phone || ""}
                      onChange={(e) =>
                        setEditingCouncil((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Portfolio Responsibilities & Duties
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const desig = editingCouncil?.designation || "President";
                        setEditingCouncil((prev) => ({
                          ...prev,
                          responsibilities: DEFAULT_COUNCIL_RESPONSIBILITIES[desig] || "",
                        }));
                      }}
                      className="text-[10px] text-brand hover:underline font-semibold"
                    >
                      Reset to Standard Responsibilities
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="Outline the core responsibilities, authority, and deliverables for this executive office..."
                    value={editingCouncil?.responsibilities || ""}
                    onChange={(e) =>
                      setEditingCouncil((prev) => ({ ...prev, responsibilities: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Fixed Modal Footer with Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 shrink-0 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => setIsCouncilModalOpen(false)}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCouncil}
                  className="rounded-xl bg-brand-deep px-4 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {savingCouncil ? "Saving..." : "Save Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: STUDENT ORGANIZER MODAL (CLUB HEAD) */}
      {/* ============================================================= */}
      {isOrganizerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-white shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0 bg-white">
              <div>
                <h3 className="font-display text-base font-bold text-brand-deep">
                  Assign Student Organizer
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Head student lead for {currentClub.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrganizerModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrganizer} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
                {/* Search & Appoint from Enrolled Student Members */}
                <StudentMemberSearchPicker
                  label="Appoint from Enrolled Student Members"
                  sublabel="Auto-fills candidate info"
                  placeholder="Search student by name or roll number (e.g., 21A51A0512 or Rahul)..."
                  members={members}
                  selectedRollNumber={editingOrganizer?.organizer_roll_number}
                  badgeTheme="brand"
                  clubFilter={selectedClubSlug}
                  onSelect={(selected) => {
                    const yr =
                      selected.year_of_study === "Third Year" ||
                      selected.year_of_study === "3rd Year" ||
                      selected.year_of_study === "Third"
                        ? "Third Year"
                        : "Final Year";

                    setEditingOrganizer((prev) => ({
                      ...prev,
                      organizer_name: selected.name,
                      organizer_roll_number: selected.roll_number,
                      academic_year: yr,
                      organizer_email: selected.email,
                      organizer_phone: selected.phone || prev?.organizer_phone || "",
                    }));
                    toast.success(`Autofilled organizer details for ${selected.name} (${selected.roll_number})`);
                  }}
                  onClear={() => {
                    setEditingOrganizer((prev) => ({
                      ...prev,
                      organizer_name: "",
                      organizer_roll_number: "",
                      organizer_email: "",
                      organizer_phone: "",
                    }));
                  }}
                />

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Organizer Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Rahul Verma"
                    value={editingOrganizer?.organizer_name || ""}
                    onChange={(e) =>
                      setEditingOrganizer((prev) => ({ ...prev, organizer_name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="21A51A0512"
                      value={editingOrganizer?.organizer_roll_number || ""}
                      onChange={(e) =>
                        setEditingOrganizer((prev) => ({
                          ...prev,
                          organizer_roll_number: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Academic Year
                    </label>
                    <select
                      value={editingOrganizer?.academic_year || "Final Year"}
                      onChange={(e) =>
                        setEditingOrganizer((prev) => ({ ...prev, academic_year: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    >
                      <option value="Third Year">Third Year</option>
                      <option value="Final Year">Final Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      College Email
                    </label>
                    <input
                      type="email"
                      placeholder="lead@adityatekkali.edu.in"
                      value={editingOrganizer?.organizer_email || ""}
                      onChange={(e) =>
                        setEditingOrganizer((prev) => ({ ...prev, organizer_email: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={editingOrganizer?.organizer_phone || ""}
                      onChange={(e) =>
                        setEditingOrganizer((prev) => ({ ...prev, organizer_phone: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 shrink-0 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => setIsOrganizerModalOpen(false)}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOrganizer}
                  className="rounded-xl bg-brand-deep px-4 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {savingOrganizer ? "Saving..." : "Save Organizer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: SUB-WING & STUDENT LEAD MODAL */}
      {/* ============================================================= */}
      {isWingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-white shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0 bg-white">
              <div>
                <h3 className="font-display text-base font-bold text-brand-deep">
                  {editingWing?.id ? "Edit Sub-Wing & Lead" : "Add Sub-Wing Track"}
                </h3>
                <p className="text-[11px] text-muted-foreground">{currentClub.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWingModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWing} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Sub-Wing / Track Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Web Development, App Dev, AI/ML..."
                    value={editingWing?.wing_name || ""}
                    onChange={(e) =>
                      setEditingWing((prev) => ({ ...prev, wing_name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Track Description & Scope
                  </label>
                  <input
                    type="text"
                    placeholder="Specialized frontend, backend, or cloud track"
                    value={editingWing?.description || ""}
                    onChange={(e) =>
                      setEditingWing((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="font-display font-bold text-xs text-brand-deep mb-2">
                    Student Lead for this Sub-Wing
                  </p>

                  <div className="space-y-3">
                    {/* Search & Appoint Sub-Wing Lead from Student Members */}
                    <StudentMemberSearchPicker
                      label="Appoint Sub-Wing Lead from Student Members"
                      sublabel="Auto-fills candidate info"
                      placeholder="Search student by name or roll number (e.g., 22A51A0540 or Karthik)..."
                      members={members}
                      selectedRollNumber={editingWing?.lead_roll_number}
                      badgeTheme="brand"
                      clubFilter={selectedClubSlug}
                      onSelect={(selected) => {
                        const yr =
                          selected.year_of_study === "Second Year" ||
                          selected.year_of_study === "2nd Year" ||
                          selected.year_of_study === "Second"
                            ? "Second Year"
                            : selected.year_of_study === "Third Year" ||
                              selected.year_of_study === "3rd Year" ||
                              selected.year_of_study === "Third"
                            ? "Third Year"
                            : "Final Year";

                        setEditingWing((prev) => ({
                          ...prev,
                          lead_name: selected.name,
                          lead_roll_number: selected.roll_number,
                          lead_email: selected.email,
                          lead_phone: selected.phone || prev?.lead_phone || "",
                          lead_academic_year: yr,
                        }));
                        toast.success(`Autofilled sub-wing lead details for ${selected.name} (${selected.roll_number})`);
                      }}
                      onClear={() => {
                        setEditingWing((prev) => ({
                          ...prev,
                          lead_name: "",
                          lead_roll_number: "",
                          lead_email: "",
                          lead_phone: "",
                        }));
                      }}
                    />

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Student Lead Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., P. Karthik"
                        value={editingWing?.lead_name || ""}
                        onChange={(e) =>
                          setEditingWing((prev) => ({ ...prev, lead_name: e.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Lead Roll Number
                        </label>
                        <input
                          type="text"
                          placeholder="22A51A0540"
                          value={editingWing?.lead_roll_number || ""}
                          onChange={(e) =>
                            setEditingWing((prev) => ({
                              ...prev,
                              lead_roll_number: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Academic Year
                        </label>
                        <select
                          value={editingWing?.lead_academic_year || "Third Year"}
                          onChange={(e) =>
                            setEditingWing((prev) => ({
                              ...prev,
                              lead_academic_year: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                        >
                          <option value="Second Year">Second Year</option>
                          <option value="Third Year">Third Year</option>
                          <option value="Final Year">Final Year</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          College Email
                        </label>
                        <input
                          type="email"
                          placeholder="lead@adityatekkali.edu.in"
                          value={editingWing?.lead_email || ""}
                          onChange={(e) =>
                            setEditingWing((prev) => ({ ...prev, lead_email: e.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Contact Phone
                        </label>
                        <input
                          type="text"
                          placeholder="+91 98765 43210"
                          value={editingWing?.lead_phone || ""}
                          onChange={(e) =>
                            setEditingWing((prev) => ({ ...prev, lead_phone: e.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 shrink-0 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => setIsWingModalOpen(false)}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWing}
                  className="rounded-xl bg-brand-deep px-4 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {savingWing ? "Saving..." : "Save Sub-Wing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: FACULTY MENTOR MODAL */}
      {/* ============================================================= */}
      {isMentorModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-white shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0 bg-white">
              <h3 className="font-display text-base font-bold text-brand-deep">
                {editingMentor?.id ? "Edit Faculty Mentor" : "Add Faculty Mentor"}
              </h3>
              <button
                type="button"
                onClick={() => setIsMentorModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMentor} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Mentor Full Name (with Title)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Dr. Ch. Ramesh"
                    value={editingMentor?.name || ""}
                    onChange={(e) =>
                      setEditingMentor((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="Associate Professor / HoD"
                      value={editingMentor?.designation || ""}
                      onChange={(e) =>
                        setEditingMentor((prev) => ({ ...prev, designation: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="CSE / IT / ECE"
                      value={editingMentor?.department || ""}
                      onChange={(e) =>
                        setEditingMentor((prev) => ({ ...prev, department: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Official College Email
                    </label>
                    <input
                      type="email"
                      placeholder="faculty@adityatekkali.edu.in"
                      value={editingMentor?.email || ""}
                      onChange={(e) =>
                        setEditingMentor((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g., 9876543210"
                      value={editingMentor?.phone || ""}
                      onChange={(e) =>
                        setEditingMentor((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Cabin / Office Location
                    </label>
                    <input
                      type="text"
                      placeholder="D-Block Room 204"
                      value={editingMentor?.cabin || ""}
                      onChange={(e) =>
                        setEditingMentor((prev) => ({ ...prev, cabin: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Assign to SAC Club
                    </label>
                    <select
                      value={editingMentor?.assigned_club_slug || editingMentor?.club_slug || "unassigned"}
                      onChange={(e) =>
                        setEditingMentor((prev) => ({
                          ...prev,
                          assigned_club_slug: e.target.value === "unassigned" ? undefined : e.target.value,
                          club_slug: e.target.value === "unassigned" ? undefined : e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    >
                      <option value="unassigned">-- Unassigned --</option>
                      {defaultClubs.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-[11px] text-emerald-950 flex items-start gap-2.5">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900">Faculty LMS Portal Access:</span>
                    <p className="mt-0.5 text-emerald-800 leading-relaxed">
                      Adding or updating this faculty mentor automatically provisions their LMS account. They can immediately log in to the <strong>Faculty Mentor Workspace</strong> using their official email address and default password <code className="bg-emerald-100/90 text-emerald-950 px-1 py-0.5 rounded font-mono text-[10px] font-bold">password123</code> (or their contact number).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 shrink-0 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => setIsMentorModalOpen(false)}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMentor}
                  className="rounded-xl bg-brand-deep px-4 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {savingMentor ? "Saving..." : "Save Mentor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 5: STUDENT MEMBER MODAL */}
      {/* ============================================================= */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-white shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0 bg-white">
              <h3 className="font-display text-base font-bold text-brand-deep">
                {editingMember?.id ? "Edit Student Member" : "Enroll New Student Member"}
              </h3>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
                {!editingMember?.id && (
                  <StudentMemberSearchPicker
                    label="Autofill from Registered Students (Optional)"
                    sublabel="Auto-fills candidate info"
                    placeholder="Search candidate by name or roll number..."
                    members={members}
                    selectedRollNumber={editingMember?.roll_number}
                    badgeTheme="blue"
                    onSelect={(selected) => {
                      setEditingMember((prev) => ({
                        ...prev,
                        name: selected.name,
                        roll_number: selected.roll_number,
                        email: selected.email,
                        phone: selected.phone || prev?.phone || "",
                        department: selected.department || "CSE",
                        year_of_study: selected.year_of_study || "Second Year",
                        club_slug: prev?.club_slug || selectedClubSlug || "developers-club",
                      }));
                      toast.success(`Autofilled student info for ${selected.name}`);
                    }}
                    onClear={() => {
                      setEditingMember((prev) => ({
                        ...prev,
                        name: "",
                        roll_number: "",
                        email: "",
                        phone: "",
                      }));
                    }}
                  />
                )}

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Anusha Patnaik"
                    value={editingMember?.name || ""}
                    onChange={(e) =>
                      setEditingMember((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="22A51A0501"
                      value={editingMember?.roll_number || ""}
                      onChange={(e) =>
                        setEditingMember((prev) => ({ ...prev, roll_number: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Academic Year
                    </label>
                    <select
                      value={editingMember?.year_of_study || "Second Year"}
                      onChange={(e) =>
                        setEditingMember((prev) => ({ ...prev, year_of_study: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    >
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Final Year">Final Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    College Email (@adityatekkali.edu.in)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="22a51a0501@adityatekkali.edu.in"
                    value={editingMember?.email || ""}
                    onChange={(e) =>
                      setEditingMember((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      SAC Club
                    </label>
                    <select
                      value={editingMember?.club_slug || "developers-club"}
                      onChange={(e) =>
                        setEditingMember((prev) => ({
                          ...prev,
                          club_slug: e.target.value,
                          wing_name: undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    >
                      {defaultClubs.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Sub-Wing Track
                    </label>
                    <select
                      value={editingMember?.wing_name || ""}
                      onChange={(e) =>
                        setEditingMember((prev) => ({
                          ...prev,
                          wing_name: e.target.value || undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                    >
                      <option value="">-- General Member --</option>
                      {governance.wings[editingMember?.club_slug || "developers-club"]?.map((w) => (
                        <option key={w.id || w.wing_name} value={w.wing_name}>
                          {w.wing_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Membership Status
                  </label>
                  <select
                    value={editingMember?.status || "active"}
                    onChange={(e) =>
                      setEditingMember((prev) => ({
                        ...prev,
                        status: e.target.value as "active" | "pending" | "suspended" | "alumni",
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending Approval</option>
                    <option value="suspended">Suspended</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 shrink-0 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="rounded-xl bg-brand-deep px-4 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {savingMember ? "Saving..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 6: READ-ONLY EVENT INSPECTOR MODAL */}
      {/* ============================================================= */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-white shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0 bg-white">
              <div>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                  Read-Only Inspection
                </span>
                <h3 className="mt-1 font-display text-base font-bold text-brand-deep">
                  {selectedEventModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                <p>
                  <strong className="text-muted-foreground">Club:</strong> {selectedEventModal.club}
                </p>
                <p>
                  <strong className="text-muted-foreground">Status:</strong>{" "}
                  <span className="capitalize font-bold text-emerald-600">
                    {selectedEventModal.status}
                  </span>
                </p>
                <p>
                  <strong className="text-muted-foreground">Dates:</strong> {selectedEventModal.dates}
                </p>
                <p>
                  <strong className="text-muted-foreground">Time:</strong> {selectedEventModal.time}
                </p>
                <p>
                  <strong className="text-muted-foreground">Mode:</strong> {selectedEventModal.mode}
                </p>
                <p>
                  <strong className="text-muted-foreground">Registration Fee:</strong> {selectedEventModal.price}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-brand uppercase tracking-wider">
                  Location & Organizer:
                </p>
                <p className="mt-0.5 text-slate-800">
                  📍 {selectedEventModal.location} • 🏢 {selectedEventModal.organizer}
                </p>
              </div>

              {selectedEventModal.mentor && (
                <div>
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                    Faculty Mentor:
                  </p>
                  <p className="mt-0.5 text-slate-800">
                    👨‍🏫 {selectedEventModal.mentor} ({selectedEventModal.mentorRole || selectedEventModal.mentor_role || "Mentor"})
                  </p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  About Event:
                </p>
                <p className="mt-1 leading-relaxed text-slate-600">{selectedEventModal.about}</p>
              </div>

              {selectedEventModal.highlights && selectedEventModal.highlights.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Key Highlights:
                  </p>
                  <ul className="mt-1 space-y-1">
                    {selectedEventModal.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-700">
                        <CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-emerald-500" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-border px-5 py-3 shrink-0 bg-slate-50/90">
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="rounded-xl border border-border bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
