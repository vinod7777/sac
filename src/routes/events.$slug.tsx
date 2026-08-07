import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  UserRound,
  CheckCircle2,
  Tag,
  Sparkles,
  Cloud,
  Bot,
  Code2,
  ShieldCheck,
  Building2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Sections";
import { events } from "@/data/sac";

const icons: Record<string, typeof Code2> = {
  Cloud,
  Bot,
  Code2,
  ShieldCheck,
};

export const Route = createFileRoute("/events/$slug")({
  loader: ({ params }) => {
    const event = events.find((e) => e.slug === params.slug);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Event not found — AITAM SAC" }, { name: "robots", content: "noindex" }] };
    }
    const { event } = loaderData;
    const title = `${event.title} — AITAM Student Activity Center`;
    const description = event.about.slice(0, 155);
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
  component: EventDetail,
  notFoundComponent: EventNotFound,
});

function EventNotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-deep">Event not found</h1>
        <Link to="/events" className="mt-4 inline-block text-sm font-semibold text-brand-deep underline">
          Back to all events
        </Link>
      </div>
    </div>
  );
}

function EventDetail() {
  const { event } = Route.useLoaderData();
  const Icon = icons[event.icon] ?? Calendar;
  const otherEvents = events.filter((e) => e.slug !== event.slug);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <header className="relative overflow-hidden pt-28 pb-24" style={{ backgroundColor: event.color }}>
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 text-white">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[12px] font-semibold backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="size-3.5" /> All Events
          </Link>
          
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <div className="inline-flex rounded-2xl border border-white/30 bg-white/15 p-4 backdrop-blur-md">
              <Icon className="size-10 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  {event.club}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  {event.mode}
                </span>
                <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-deep shadow-sm">
                  Price: {event.price}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">{event.title}</h1>
            </div>
          </div>
          
          <div className="mt-6 grid gap-3 sm:grid-cols-3 border-t border-white/20 pt-6 text-sm text-white/90">
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 shrink-0 text-white/80" />
              <span>{event.dates}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-white/80" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-white/80" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-16 w-full"
        >
          <path d="M0,120 C400,10 1040,10 1440,120 Z" fill="hsl(var(--background, 0 0% 100%))" className="fill-background" />
        </svg>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div className="space-y-10">
            <section>
              <h2 className="font-display text-xl font-bold text-brand-deep flex items-center gap-2">
                <Sparkles className="size-5 text-brand" /> About the Event
              </h2>
              <p className="mt-3 text-base leading-relaxed text-foreground/80">{event.about}</p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold text-brand-deep">Key Highlights</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {event.highlights.map((h: string) => (
                  <li
                    key={h}
                    className="flex items-start gap-3 rounded-xl border border-black/5 bg-card p-4 text-sm text-foreground/80 shadow-soft"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: event.color }} />
                    {h}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold text-brand-deep flex items-center gap-2">
                <BookOpen className="size-5 text-brand" /> Prerequisites & Requirements
              </h2>
              <div className="mt-3 rounded-xl border border-black/5 bg-secondary/50 p-4 text-sm text-foreground/80">
                {event.prerequisites}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <article className="rounded-2xl border border-black/5 bg-card p-6 shadow-soft space-y-4">
              <h3 className="font-display text-base font-bold text-brand-deep border-b border-border pb-3">
                Event Information
              </h3>

              <div className="space-y-3 text-xs text-foreground/80">
                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">Organized By</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="size-3.5 text-brand shrink-0" />
                    {event.organizer}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">Lead Mentor</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <UserRound className="size-3.5 text-brand shrink-0" />
                    {event.mentor} ({event.mentorRole})
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">Mode & Entry</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <Tag className="size-3.5 text-brand shrink-0" />
                    {event.mode} · {event.price} Registration
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/join"
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white shadow-card transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: event.color }}
                >
                  Register Now <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          </div>
        </div>

        {/* Other Events */}
        {otherEvents.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-display text-xl font-bold text-brand-deep">Explore Other Events</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {otherEvents.map((e) => (
                <Link
                  key={e.slug}
                  to="/events/$slug"
                  params={{ slug: e.slug }}
                  className="shadow-soft flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card transition-transform hover:-translate-y-1"
                >
                  <div className="flex h-20 items-center justify-center px-4 text-white text-center font-display text-xs font-bold" style={{ backgroundColor: e.color }}>
                    {e.title}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground">{e.dates}</p>
                      <p className="text-xs font-bold text-brand-deep mt-1">{e.club}</p>
                    </div>
                    <span className="text-[11px] font-bold text-brand flex items-center gap-1 pt-2">
                      View Event <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
