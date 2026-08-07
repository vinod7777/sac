import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Camera,
  Car,
  CheckCircle2,
  Cloud,
  Code2,
  GraduationCap,
  Music,
  PenTool,
  Quote,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Sections";
import { clubs } from "@/data/sac";

const icons: Record<string, typeof Code2> = {
  Music,
  Car,
  Code2,
  Cloud,
  Bot,
  PenTool,
  ShieldCheck,
  Camera,
};

export const Route = createFileRoute("/clubs/$slug")({
  loader: ({ params }) => {
    const club = clubs.find((c) => c.slug === params.slug);
    if (!club) throw notFound();
    return { club };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Club not found — AITAM SAC" }, { name: "robots", content: "noindex" }] };
    }
    const { club } = loaderData;
    const title = `${club.name} — AITAM Student Activity Center`;
    const description = club.about.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ClubDetail,
  notFoundComponent: ClubNotFound,
});

function ClubNotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-deep">Club not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-brand-deep underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

function ClubDetail() {
  const { club } = Route.useLoaderData();
  const Icon = icons[club.icon] ?? Code2;
  const others = clubs.filter((c) => c.slug !== club.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <header className="relative overflow-hidden pt-28 pb-24" style={{ backgroundColor: club.color }}>
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 text-white">
          <Link
            to="/"
            hash="clubs"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[12px] font-semibold backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="size-3.5" /> All Clubs
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <div className="inline-flex rounded-2xl border border-white/30 bg-white/15 p-4 backdrop-blur-md">
              <Icon className="size-10" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{club.name}</h1>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/90">
                <Quote className="size-3.5" /> {club.tagline}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/90">{club.desc}</p>
        </div>
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-16 w-full"
        >
          <path d="M0,120 C400,10 1040,10 1440,120 Z" fill="hsl(var(--background, 0 0% 100%))" className="fill-background" />
        </svg>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <section>
          <h2 className="font-display text-xl font-bold text-brand-deep">About the club</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">{club.about}</p>
        </section>

        <section className="mt-12 grid gap-5 sm:grid-cols-2">
          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <span
                className="grid size-12 place-items-center rounded-full text-white"
                style={{ backgroundColor: club.color }}
              >
                <UserRound className="size-6" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">Club Mentor</p>
                <p className="font-display text-base font-bold text-brand-deep">{club.mentor}</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] text-foreground/70">{club.mentorRole}</p>
          </article>

          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <span
                className="grid size-12 place-items-center rounded-full text-white"
                style={{ backgroundColor: club.color }}
              >
                <GraduationCap className="size-6" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">Student Mentor</p>
                <p className="font-display text-base font-bold text-brand-deep">{club.studentMentor}</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] text-foreground/70">{club.studentMentorRole}</p>
          </article>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-brand-deep">What we do</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {club.activities.map((a: string) => (
              <li
                key={a}
                className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-4 text-[13px] text-foreground/75 shadow-soft"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: club.color }} />
                {a}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-brand-deep">Explore other clubs</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {others.map((c) => (
              <Link
                key={c.slug}
                to="/clubs/$slug"
                params={{ slug: c.slug }}
                className="rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: c.color }}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
