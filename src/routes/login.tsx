import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Sections";
import { loginUser } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — AITAM Student Activity Center" },
      {
        name: "description",
        content:
          "Sign in to the AITAM SAC portal with your official college email and password.",
      },
      { property: "og:title", content: "Login — AITAM Student Activity Center" },
      {
        name: "description",
        content: "Access your SAC club memberships, events, and activities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please enter your college email")
    .email("Enter a valid email address")
    .refine(
      (val) => val.endsWith("@adityatekkali.edu.in"),
      { message: "Only @adityatekkali.edu.in email addresses are accepted" },
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState<"student" | "club_lead" | "club_organizer" | "club_mentor">("student");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loggedInUser, setLoggedInUser] = useState<{
    id?: number;
    name?: string | undefined;
    email: string;
    rollNumber?: string | undefined;
    role: string;
    club?: string | undefined;
    year?: string | undefined;
  } | null>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("sac_user") : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      toast.error("Please fix the highlighted fields");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await loginUser({ email, password, role });
      if (res.success && res.user) {
        localStorage.setItem("sac_user", JSON.stringify(res.user));
        setLoggedInUser({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          rollNumber: res.user.rollNumber || (res.user as any).roll_number,
          role: res.user.role || role,
          actual_role: (res.user as any).actual_role,
          is_organizer: (res.user as any).is_organizer,
          is_lead: (res.user as any).is_lead,
          is_mentor: (res.user as any).is_mentor,
          club: res.user.club || (res.user as any).managed_club,
          year: res.user.year || (res.user as any).year_of_study,
        } as any);
        toast.success(res.message || "Welcome back! Signed in successfully.");
      } else {
        if (res.errors) {
          setErrors(res.errors);
        }
        toast.error(res.message || "Invalid credentials");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to backend";
      console.warn("Backend login error:", msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (email && email.endsWith("@adityatekkali.edu.in")) {
      toast.info(`Password reset link sent to ${email}`);
    } else {
      toast.info("Please enter your official @adityatekkali.edu.in email above to reset password");
    }
  };

  const getRoleDisplayName = (r?: string) => {
    switch (r) {
      case "club_mentor":
      case "mentor":
      case "faculty_mentor":
        return "1. Faculty Mentor";
      case "club_organizer":
        return "2. Club Student Organiser";
      case "club_lead":
        return "3. Club Wing Lead";
      default:
        return "4. Club Member";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Header */}
        <section className="relative overflow-hidden bg-hero-gradient px-5 pb-24 pt-32">
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/70">
              Student Activity Center
            </p>
            <h1 className="mt-3 text-4xl font-bold text-primary-foreground md:text-5xl">
              SAC Portal Login
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Sign in with your official college credentials to view club notices, access workspaces, and participate in events.
            </p>
          </div>
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-16 w-full"
          >
            <path
              d="M0,120 C400,10 1040,10 1440,120 Z"
              fill="hsl(var(--background, 0 0% 100%))"
              className="fill-background"
            />
          </svg>
        </section>

        {/* Login Form Section */}
        <section className="px-5 py-16">
          <div className="mx-auto max-w-md">
            {loggedInUser ? (
              <div className="rounded-2xl bg-card p-8 text-center shadow-card md:p-10">
                <CheckCircle2 className="mx-auto size-16 text-club-teal" />
                <h2 className="mt-4 text-2xl font-bold text-brand-deep">Welcome Back!</h2>
                <div className="mt-4 rounded-xl bg-section p-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-brand-deep font-bold text-white">
                      {(loggedInUser.name || loggedInUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {loggedInUser.name || loggedInUser.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {loggedInUser.rollNumber ? `${loggedInUser.rollNumber} • ` : ""}
                        <span className="font-semibold text-brand">
                          {getRoleDisplayName(loggedInUser.role)}
                        </span>
                        {loggedInUser.club ? ` • ${loggedInUser.club}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  You are now signed into the SAC Portal as{" "}
                  <strong>{getRoleDisplayName(loggedInUser.role)}</strong>.
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  <Link
                    to="/lms"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-deep px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-sm"
                  >
                    Open {getRoleDisplayName(loggedInUser.role)} LMS Workspace →
                  </Link>

                  {(loggedInUser.role === "club_organizer" ||
                    loggedInUser.role === "club_lead" ||
                    Boolean((loggedInUser as any).is_organizer) ||
                    Boolean((loggedInUser as any).is_lead) ||
                    (loggedInUser as any).actual_role === "club_organizer" ||
                    (loggedInUser as any).actual_role === "club_lead") && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...loggedInUser, role: "student" };
                        localStorage.setItem("sac_user", JSON.stringify(updated));
                        window.location.href = "/lms";
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-6 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
                    >
                      <UserCheck className="size-4" /> Open Member LMS Page
                    </button>
                  )}
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    <ArrowLeft className="size-4" /> Go to Home
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("sac_user");
                      setLoggedInUser(null);
                      setPassword("");
                      toast.info("Logged out successfully");
                    }}
                    className="rounded-full border border-transparent px-6 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-card p-6 shadow-card md:p-8">
                {/* 4-Role Hierarchy Portal Selector */}
                <div className="mb-6">
                  <div className="mb-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Select LMS Workspace:
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl bg-muted/70 p-1.5 text-xs font-semibold">
                    {/* Faculty Mentor */}
                    <button
                      type="button"
                      onClick={() => setRole("club_mentor")}
                      className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                        role === "club_mentor"
                          ? "bg-card text-emerald-600 font-bold shadow-soft ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      <GraduationCap className="size-3.5 shrink-0" />
                      <span>Mentor</span>
                    </button>

                    {/* Club Student Organiser */}
                    <button
                      type="button"
                      onClick={() => setRole("club_organizer")}
                      className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                        role === "club_organizer"
                          ? "bg-card text-purple-600 font-bold shadow-soft ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      <Crown className="size-3.5 shrink-0" />
                      <span>Organiser</span>
                    </button>

                    {/* Club Wing Lead */}
                    <button
                      type="button"
                      onClick={() => setRole("club_lead")}
                      className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                        role === "club_lead"
                          ? "bg-card text-amber-600 font-bold shadow-soft ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      <ShieldCheck className="size-3.5 shrink-0" />
                      <span>Wing Lead</span>
                    </button>

                    {/* Club Member */}
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                        role === "student"
                          ? "bg-card text-blue-600 font-bold shadow-soft ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      <UserCheck className="size-3.5 shrink-0" />
                      <span>Member</span>
                    </button>
                  </div>

                  <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-[11px] text-slate-700 leading-snug">
                    {role === "club_mentor" && (
                      <p>
                        <strong className="text-emerald-700 font-bold">Faculty Mentor:</strong> Apex supervisory authority. Oversees club operations, accepts event proposals from leads or creates official events, appoints wing leads, and manages club members.
                      </p>
                    )}
                    {role === "club_organizer" && (
                      <p>
                        <strong className="text-purple-700 font-bold">Club Student Organiser:</strong> Appointed exclusively by the LMS Admin. Directs sub-wings, roadmaps, assignments, and appoints wing leads from enrolled members.
                      </p>
                    )}
                    {role === "club_lead" && (
                      <p>
                        <strong className="text-amber-700 font-bold">Club Wing Lead:</strong> Appointed by the Organiser or Mentor for a specific wing. Mentors track learners, grades project code submissions, and proposes events.
                      </p>
                    )}
                    {role === "student" && (
                      <p>
                        <strong className="text-blue-700 font-bold">Club Member:</strong> Enrolled student learner accessing curriculum roadmaps, completing assignments, and submitting project code.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-brand-deep">Sign in to your account</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use your official college email account ending with @adityatekkali.edu.in
                  </p>
                </div>

                <form onSubmit={handleLogin} noValidate className="space-y-5">
                  {/* Email */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="email" className="text-sm font-semibold text-brand-deep">
                        College Email
                      </label>
                      <span className="text-[11px] font-medium text-brand">
                        @adityatekkali.edu.in
                      </span>
                    </div>
                    <div className="relative mt-1.5">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        maxLength={255}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          role === "student"
                            ? "e.g. 23a51a05c5@adityatekkali.edu.in"
                            : role === "club_lead"
                            ? "e.g. lead.cse@adityatekkali.edu.in"
                            : role === "club_organizer"
                            ? "e.g. organizer@adityatekkali.edu.in"
                            : "e.g. mentor@adityatekkali.edu.in"
                        }
                        className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    {errors["email"] ? (
                      <p className="mt-1.5 text-xs text-destructive">{errors["email"]}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Only @adityatekkali.edu.in emails are accepted
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-semibold text-brand-deep">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative mt-1.5">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        maxLength={100}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={role === "student" ? "Enter password or roll number" : "Enter your password"}
                        className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {errors["password"] && (
                      <p className="mt-1.5 text-xs text-destructive">{errors["password"]}</p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="size-4 rounded border-border accent-brand"
                      />
                      Keep me signed in on this device
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-brand-deep px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-110 disabled:opacity-70"
                  >
                    {loading ? "Signing in..." : "Sign in to SAC"}
                  </button>

                  {/* Sign up prompt */}
                  <div className="pt-2 text-center text-xs text-muted-foreground">
                    Don't have a SAC club membership yet?{" "}
                    <Link to="/join" className="font-semibold text-brand hover:underline">
                      Join SAC
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
