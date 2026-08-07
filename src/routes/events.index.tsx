import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Calendar, MapPin, Tag, Sparkles } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Sections";
import { events } from "@/data/sac";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events & Workshops — AITAM Student Activity Center" },
      {
        name: "description",
        content: "Explore upcoming bootcamps, workshops, and technical events hosted by AITAM SAC clubs.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [filter, setFilter] = useState("All");

  const filteredEvents = events.filter((e) => {
    if (filter === "All") return true;
    return e.club.toLowerCase().includes(filter.toLowerCase()) || e.mode.toLowerCase() === filter.toLowerCase();
  });

  const categories = ["All", "Offline", "Salesforce Club", "Robotics Club", "Developers Club", "Security Club"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header Banner */}
      <header className="relative overflow-hidden bg-hero-gradient pt-28 pb-20 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="size-3.5 text-accent" /> Hands-On Learning & Fests
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Events & Workshops
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Participate in real-time bootcamps, competitions, and technical workshops organized by the apex student body of AITAM.
          </p>
        </div>
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-14 w-full"
        >
          <path d="M0,120 C400,10 1040,10 1440,120 Z" fill="hsl(var(--background, 0 0% 100%))" className="fill-background" />
        </svg>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                filter === cat
                  ? "bg-brand-deep text-white shadow-soft"
                  : "bg-secondary text-foreground/70 hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((e, i) => (
            <Reveal key={e.slug} delay={i * 0.08} className="h-full">
              <Link
                to="/events/$slug"
                params={{ slug: e.slug }}
                className="group shadow-soft flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                <div
                  className="flex h-28 items-center justify-center px-6 text-white text-center font-display text-sm font-bold transition-all group-hover:brightness-110"
                  style={{ backgroundColor: e.color }}
                >
                  <span className="line-clamp-2">{e.title}</span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold uppercase tracking-wider text-brand">{e.club}</span>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground">
                        {e.mode}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-brand-deep group-hover:text-brand transition-colors line-clamp-2">
                      {e.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {e.about}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-brand" /> {e.dates.split(" to ")[0]}
                      </span>
                      <span className="font-semibold text-brand-deep flex items-center gap-1">
                        <Tag className="size-3 text-brand" /> {e.price}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-foreground/80 flex items-center gap-1">
                        <MapPin className="size-3 text-brand" /> {e.location.split(",")[0]}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-brand text-[12px] group-hover:translate-x-1 transition-transform">
                        Details <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
