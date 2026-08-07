import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Sections";
import { clubs } from "@/data/sac";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join SAC — AITAM Student Activity Center" },
      {
        name: "description",
        content:
          "Apply to join the AITAM Student Activity Center. Share your name, email, year of study and preferred clubs to get started.",
      },
      { property: "og:title", content: "Join SAC — AITAM Student Activity Center" },
      {
        property: "og:description",
        content: "Become part of AITAM SAC — pick your clubs and start building with us.",
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
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
  year: z.string().min(1, "Select your year of study"),
  clubs: z.array(z.string()).min(1, "Pick at least one club").max(3, "Pick up to 3 clubs"),
});

function JoinPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [year, setYear] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const toggleClub = (slug: string) =>
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ name, email, year, clubs: picked });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setDone(true);
    toast.success("Application received! Our team will reach out on email.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="bg-hero-gradient px-5 pb-16 pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/70">
              Student Activity Center
            </p>
            <h1 className="mt-3 text-4xl font-bold text-primary-foreground md:text-5xl">
              Join SAC
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Tell us a little about yourself and pick the clubs you would like to be part of. Our
              club mentors will get in touch with the next steps.
            </p>
          </div>
        </section>

        <section className="px-5 py-16">
          <div className="mx-auto max-w-3xl">
            {done ? (
              <div className="rounded-2xl bg-card p-10 text-center shadow-card">
                <CheckCircle2 className="mx-auto size-14 text-club-teal" />
                <h2 className="mt-4 text-2xl font-bold text-brand-deep">You're on the list!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thanks {name.split(" ")[0]}, we've noted your interest in{" "}
                  {picked
                    .map((s) => clubs.find((c) => c.slug === s)?.name)
                    .filter(Boolean)
                    .join(", ")}
                  . We'll email you at {email}.
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-deep px-6 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <ArrowLeft className="size-4" /> Back to home
                </Link>
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
                    <label htmlFor="email" className="text-sm font-semibold text-brand-deep">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      maxLength={255}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@aitam.ac.in"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
                    />
                    {errors['email'] && (
                      <p className="mt-1 text-xs text-destructive">{errors['email']}</p>
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
                  <p className="text-sm font-semibold text-brand-deep">
                    Club preferences{" "}
                    <span className="font-normal text-muted-foreground">(choose up to 3)</span>
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {clubs.map((c) => {
                      const active = picked.includes(c.slug);
                      return (
                        <button
                          type="button"
                          key={c.slug}
                          onClick={() => toggleClub(c.slug)}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            active
                              ? "border-transparent text-primary-foreground shadow-soft"
                              : "border-border hover:border-brand"
                          }`}
                          style={active ? { backgroundColor: c.color } : undefined}
                        >
                          <span
                            className={`size-3 shrink-0 rounded-full ${
                              active ? "bg-white" : ""
                            }`}
                            style={active ? undefined : { backgroundColor: c.color }}
                          />
                          <span className="text-sm font-medium">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors['clubs'] && <p className="mt-1 text-xs text-destructive">{errors['clubs']}</p>}
                </div>

                <button
                  type="submit"
                  className="mt-8 w-full rounded-full bg-brand-deep px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
                >
                  Submit application
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
