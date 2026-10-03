import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { toast } from "sonner";
import { MemberLms } from "@/components/lms/MemberLms";
import { LeadLms } from "@/components/lms/LeadLms";
import { OrganizerLms } from "@/components/lms/OrganizerLms";
import { MentorLms } from "@/components/lms/MentorLms";
import { ArrowRight, Crown, GraduationCap, RefreshCw, ShieldCheck, UserCheck } from "lucide-react";

export const Route = createFileRoute("/lms")({
  head: () => ({
    meta: [
      { title: "Club LMS Portal — AITAM SAC" },
      {
        name: "description",
        content:
          "Student Activity Center Club Learning Management System for Members, Leads, Organizers, and Mentors.",
      },
    ],
  }),
  component: LmsRootPage,
});

export interface StoredUser {
  id?: number;
  name?: string;
  email?: string;
  rollNumber?: string;
  roll_number?: string;
  role?: string;
  actual_role?: string;
  is_organizer?: boolean;
  is_lead?: boolean;
  is_mentor?: boolean;
  club?: string;
  year?: string;
  year_of_study?: string;
  managed_club?: string;
  managed_wing?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onResetView?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LmsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LMS Component Error Boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-3xl border border-destructive/30 bg-card p-8 shadow-card">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Section Temporarily Unavailable</h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {this.state.error?.message || "An error occurred while loading this LMS module. You can reload or reset your view."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  if (this.props.onResetView) this.props.onResetView();
                  window.location.reload();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 transition-all"
              >
                <RefreshCw className="size-3.5" /> Reload View
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const raw = localStorage.getItem("sac_user");
                    if (raw) {
                      const u = JSON.parse(raw);
                      u.role = u.actual_role || "club_organizer";
                      localStorage.setItem("sac_user", JSON.stringify(u));
                    }
                  } catch {}
                  window.location.reload();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
              >
                Reset to Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LmsRootPage() {
  const navigate = useNavigate();

  // Authenticated User from LocalStorage
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("sac_user") : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Determine appointed privilege & active view
  const storedRole = (currentUser?.role || "student").toLowerCase();
  const actualRole = (currentUser?.actual_role || storedRole).toLowerCase();

  const isOrganizer =
    actualRole === "club_organizer" ||
    actualRole === "organizer" ||
    storedRole === "club_organizer" ||
    storedRole === "organizer" ||
    Boolean(currentUser?.is_organizer);

  const isLead =
    actualRole === "club_lead" ||
    actualRole === "lead" ||
    storedRole === "club_lead" ||
    storedRole === "lead" ||
    Boolean(currentUser?.is_lead);

  const isMentor =
    actualRole === "club_mentor" ||
    actualRole === "mentor" ||
    actualRole === "faculty_mentor" ||
    storedRole === "club_mentor" ||
    storedRole === "mentor" ||
    storedRole === "faculty_mentor" ||
    Boolean(currentUser?.is_mentor);

  const hasAppointedPrivilege = isOrganizer || isLead || isMentor;

  const highestAppointedRole = isMentor
    ? "club_mentor"
    : isOrganizer
    ? "club_organizer"
    : isLead
    ? "club_lead"
    : "student";

  const [viewRole, setViewRole] = useState<string>(() => {
    return storedRole;
  });

  useEffect(() => {
    if (!currentUser) {
      toast.info("Please sign in to access the SAC LMS portal.");
      navigate({ to: "/login" });
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("sac_user");
    setCurrentUser(null);
    toast.info("Logged out of LMS portal");
    navigate({ to: "/login" });
  };

  const handleSwitchView = (newRole: string) => {
    setViewRole(newRole);
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      localStorage.setItem("sac_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }
    if (newRole === "student") {
      toast.success("Switched to Member LMS View — you can learn and submit tasks as a club member.");
    } else {
      const label =
        newRole === "club_organizer" || newRole === "organizer"
          ? "Club Organiser Workspace"
          : newRole === "club_lead" || newRole === "lead"
          ? "Wing Lead Workspace"
          : "Mentor Workspace";
      toast.success(`Switched to ${label}`);
    }
  };

  const currentRole = viewRole.toLowerCase();

  return (
    <div className="relative min-h-screen">
      {/* Workspace Switcher Bar for Appointed Organisers & Wing Leads */}
      {hasAppointedPrivilege && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2 text-xs shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground">
              {currentUser?.name || currentUser?.email}:
            </span>
            <span className="text-muted-foreground">
              Appointed as{" "}
              <strong className="text-foreground">
                {highestAppointedRole === "club_organizer"
                  ? "Club Student Organiser"
                  : highestAppointedRole === "club_lead"
                  ? "Club Wing Lead"
                  : "Faculty Mentor"}
              </strong>
            </span>
            <span className="hidden sm:inline-block text-muted-foreground">•</span>
            <span className="hidden sm:inline-block text-muted-foreground">
              Active Mode:{" "}
              <span className="font-bold text-brand uppercase">
                {currentRole === "student"
                  ? "Member LMS View"
                  : currentRole === "club_organizer" || currentRole === "organizer"
                  ? "Organiser Workspace"
                  : currentRole === "club_lead" || currentRole === "lead"
                  ? "Wing Lead Workspace"
                  : "Mentor Workspace"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentRole === "student" ? (
              <button
                type="button"
                onClick={() => handleSwitchView(highestAppointedRole)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1 font-semibold text-white hover:brightness-110 shadow-2xs transition-all"
              >
                {highestAppointedRole === "club_organizer" && <Crown className="size-3.5" />}
                {highestAppointedRole === "club_lead" && <ShieldCheck className="size-3.5" />}
                {highestAppointedRole === "club_mentor" && <GraduationCap className="size-3.5" />}
                <span>
                  Switch to {highestAppointedRole === "club_organizer" ? "Organiser" : highestAppointedRole === "club_lead" ? "Lead" : "Mentor"} Workspace
                </span>
                <ArrowRight className="size-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSwitchView("student")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300/80 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1 font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 shadow-2xs transition-all"
                title="Switch into Member LMS to view roadmaps and lessons as a student"
              >
                <UserCheck className="size-3.5" />
                <span>View Member LMS Page</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Render the matching separate LMS file wrapped in safe boundary */}
      <LmsErrorBoundary onResetView={() => handleSwitchView(highestAppointedRole)}>
        {currentRole === "club_organizer" || currentRole === "organizer" ? (
          <OrganizerLms
            user={currentUser}
            managedClub={currentUser?.managed_club || currentUser?.club || ""}
            onLogout={handleLogout}
          />
        ) : currentRole === "club_lead" || currentRole === "lead" ? (
          <LeadLms
            user={currentUser}
            managedClub={currentUser?.managed_club || currentUser?.club || ""}
            managedWing={currentUser?.managed_wing}
            onLogout={handleLogout}
          />
        ) : currentRole === "club_mentor" || currentRole === "mentor" || currentRole === "faculty_mentor" ? (
          <MentorLms
            user={currentUser}
            managedClub={currentUser?.managed_club || currentUser?.club || ""}
            onLogout={handleLogout}
          />
        ) : (
          <MemberLms user={currentUser} onLogout={handleLogout} />
        )}
      </LmsErrorBoundary>
    </div>
  );
}
