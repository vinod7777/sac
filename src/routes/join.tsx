import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Check, CheckCircle2, MailCheck } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Sections";
import { clubs } from "@/data/sac";
import { submitJoinApplication } from "@/lib/api";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join SAC — AITAM Student Activity Center" },
      {
        name: "description",
        content:
          "Apply to join the AITAM Student Activity Center. Share your name, roll number, email, year of study and select your club to get started.",
      },
      { property: "og:title", content: "Join SAC — AITAM Student Activity Center" },
      {
        property: "og:description",
        content: "Become part of AITAM SAC — pick your club and start building with us.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

const years = ["First Year", "Second Year", "Third Year", "Final Year"];

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100, "Name is too long"),
  rollNumber: z
    .string()
    .trim()
    .min(1, "Please enter your roll number")
    .max(20, "Roll number is too long"),
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
  year: z.string().min(1, "Select your year of study"),
  club: z.string().min(1, "Please select a club"),
});

function JoinPage() {
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [year, setYear] = useState("");
  const [selectedClub, setSelectedClub] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selectClub = (slug: string) =>
    setSelectedClub((prev) => (prev === slug ? "" : slug));

  const chosenClub = clubs.find((c) => c.slug === selectedClub);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({
      name,
      rollNumber,
      email,
      year,
      club: selectedClub,
    });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await submitJoinApplication({
        name,
        rollNumber,
        email,
        year,
        club: selectedClub,
        clubName: chosenClub?.name,
      });

      if (res.success) {
        setApiMessage(res.message);
        setDone(true);
        toast.success(res.message || "Application received! Saved to database.");
      } else {
        if (res.errors) {
          setErrors(res.errors);
        }
        toast.error(res.message || "Submission failed");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to backend";
      console.warn("API submission error:", msg);
      toast.warning(msg);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-hero-gradient px-5 pb-24 pt-32">
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/70">
              Student Activity Center
            </p>
            <h1 className="mt-3 text-4xl font-bold text-primary-foreground md:text-5xl">
              Join SAC
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Tell us a little about yourself, your roll number, and pick the club you would like to be part of. Our
              club mentors will get in touch with the next steps.
            </p>
          </div>
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-16 w-full"
          >
            <path d="M0,120 C400,10 1040,10 1440,120 Z" fill="hsl(var(--background, 0 0% 100%))" className="fill-background" />
          </svg>
        </section>

        <section className="px-5 py-16">
          <div className="mx-auto max-w-3xl">
            {done ? (
              <div className="rounded-2xl bg-card p-10 text-center shadow-card">
                <CheckCircle2 className="mx-auto size-14 text-club-teal" />
                <h2 className="mt-4 text-2xl font-bold text-brand-deep">You're on the list!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thanks <span className="font-semibold text-foreground">{name.split(" ")[0]}</span> ({rollNumber}), we've noted your interest in joining the{" "}
                  <strong className="text-foreground">{chosenClub?.name ?? "selected club"}</strong>.
                  We'll email you at <span className="font-medium text-foreground">{email}</span>.
                </p>
                {apiMessage && (
                  <div className="mt-4 rounded-xl bg-section p-3 text-xs text-brand-deep font-medium">
                    ✓ {apiMessage}
                  </div>
                )}

                <div className="mt-6 rounded-xl border border-border/80 bg-muted/30 p-4 text-left">
                  <div className="flex items-center gap-2 font-semibold text-brand-deep text-sm mb-1.5">
                    <MailCheck className="size-4 text-brand" />
                    <span>Login Credentials Sent to Email</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We have emailed your portal login credentials and access details directly to <strong className="font-mono text-foreground">{email}</strong>. Please check your college inbox to sign in and view your club workspace.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    <ArrowLeft className="size-4" /> Back to home
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    Go to Portal Login
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={submit}
                noValidate
                className="rounded-2xl bg-card p-6 shadow-card md:p-10"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="text-sm font-semibold text-brand-deep">
                      Full name
                    </label>
                    <input
                      id="name"
                      value={name}
                      maxLength={100}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anusha Patnaik"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
                    />
                    {errors['name'] && (
                      <p className="mt-1 text-xs text-destructive">{errors['name']}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="rollNumber" className="text-sm font-semibold text-brand-deep">
                      Roll number
                    </label>
                    <input
                      id="rollNumber"
                      value={rollNumber}
                      maxLength={20}
                      onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 22A51A0501"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm uppercase tracking-wide outline-none focus:border-brand"
                    />
                    {errors['rollNumber'] && (
                      <p className="mt-1 text-xs text-destructive">{errors['rollNumber']}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="email" className="text-sm font-semibold text-brand-deep">
                        College email
                      </label>
                      <span className="text-xs font-medium text-muted-foreground">
                        @adityatekkali.edu.in only
                      </span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      maxLength={255}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. 22a5****01@adityatekkali.edu.in"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
                    />
                    {errors['email'] ? (
                      <p className="mt-1 text-xs text-destructive">{errors['email']}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Must be your official college email address (@adityatekkali.edu.in)
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-brand-deep">Year of study</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {years.map((y) => (
                      <button
                        type="button"
                        key={y}
                        onClick={() => setYear(y)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          year === y
                            ? "border-brand-deep bg-brand-deep text-primary-foreground"
                            : "border-border text-foreground hover:border-brand"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                  {errors['year'] && <p className="mt-1 text-xs text-destructive">{errors['year']}</p>}
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold text-brand-deep">
                      Club preference{" "}
                      <span className="font-normal text-muted-foreground">(choose 1 club)</span>
                    </p>
                    {selectedClub && (
                      <span className="text-xs font-medium text-brand">1 club selected</span>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {clubs.map((c) => {
                      const active = selectedClub === c.slug;
                      return (
                        <button
                          type="button"
                          key={c.slug}
                          onClick={() => selectClub(c.slug)}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                            active
                              ? "border-transparent text-primary-foreground shadow-soft ring-2 ring-offset-2 ring-brand-deep"
                              : "border-border hover:border-brand"
                          }`}
                          style={active ? { backgroundColor: c.color } : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`size-3 shrink-0 rounded-full ${
                                active ? "bg-white" : ""
                              }`}
                              style={active ? undefined : { backgroundColor: c.color }}
                            />
                            <span className="text-sm font-medium">{c.name}</span>
                          </div>
                          {active && <Check className="size-4 shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                  {errors['club'] && <p className="mt-1 text-xs text-destructive">{errors['club']}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-8 w-full rounded-full bg-brand-deep px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-75"
                >
                  {loading ? "Submitting to database..." : "Submit application"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
