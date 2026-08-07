import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Camera,
  CalendarDays,
  Car,
  Cloud,
  Code2,
  Music,
  PenTool,
  Rocket,
  ShieldCheck,
  Video,
  Wrench,
  ArrowRight,
  ArrowLeft,
  Quote,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import aboutArt from "@/assets/hero-illustration.png";
import aitamLogo from "@/assets/aitam-logo.png";
import { Reveal } from "./Reveal";
import {
  clubs,
  pillars,
  stats,
  events,
  testimonials,
  mentors,
  clients,
  partners,
} from "@/data/sac";

const icons: Record<string, React.ElementType> = {
  Bot,
  Camera,
  CalendarDays,
  Car,
  Cloud,
  Code2,
  Music,
  PenTool,
  Rocket,
  ShieldCheck,
  Video,
  Wrench,
};

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <h2 className="section-title text-center text-xl tracking-[0.08em] sm:text-2xl">{children}</h2>
    </Reveal>
  );
}

export function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold text-brand-deep sm:text-4xl">About SAC</h2>
        <div className="mt-6 grid items-start gap-6 md:grid-cols-[1.5fr_1fr]">
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Student Activity Center is the apex student body of AITAM, responsible for formulating the
            policies pertaining to all the non-academic affairs, resulting in a holistic workspace and
            culture for students to explore various real time technologies, entrepreneurial
            activities, alumni interactions etc., laying various paths for students to shape them out
            into a better individual.
          </p>
          <img
            src={aboutArt}
            alt="Two students collaborating at a desk"
            width={1024}
            height={768}
            loading="lazy"
            className="mx-auto w-full max-w-xs"
          />
        </div>
      </Reveal>
    </section>
  );
}

export function Clubs() {
  const [active, setActive] = useState(2);
  const trackRef = useRef<HTMLDivElement>(null);
  const total = clubs.length;
  const gap = 28;
  const cardWidth = 250;
  const centerOffset = (trackRef.current?.clientWidth ?? 0) / 2 - cardWidth / 2;

  const select = (i: number) => {
    setActive(i);
  };

  const move = (dir: number) => {
    setActive((prev) => (prev + dir + total) % total);
  };

  const wrapOffset = (i: number) => {
    let offset = i - active;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    return offset;
  };

  return (
    <section id="clubs" className="scroll-mt-24 overflow-hidden py-16 bg-gradient-to-b from-white via-[#faf8ff] to-white">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal>
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-brand/70">Discover Our Community</span>
            <Heading>Our Clubs</Heading>
            <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-brand to-brand-light" />
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.2}>
      <div className="relative mx-auto mt-10 max-w-7xl px-5">
        <button
          aria-label="Previous clubs"
          onClick={() => move(-1)}
          className="absolute -left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-3 text-brand-deep shadow-soft ring-1 ring-brand/10 backdrop-blur-sm transition-all hover:scale-110 hover:shadow-card hover:bg-white lg:left-4"
        >
          <ArrowLeft className="size-5" />
        </button>
        <button
          aria-label="Next clubs"
          onClick={() => move(1)}
          className="absolute -right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-3 text-brand-deep shadow-soft ring-1 ring-brand/10 backdrop-blur-sm transition-all hover:scale-110 hover:shadow-card hover:bg-white lg:right-4"
        >
          <ArrowRight className="size-5" />
        </button>

        <div
          ref={trackRef}
          className="relative flex h-[440px] items-center justify-center [perspective:1400px]"
          style={{ touchAction: "pan-y" }}
        >
          {clubs.map((c, i) => {
            const Icon = icons[c.icon] ?? Code2;
            const offset = wrapOffset(i);
            const abs = Math.abs(offset);
            const z = offset === 0 ? 70 : 35 - abs * 16;
            const scale = offset === 0 ? 1.14 : 0.9 - abs * 0.06;
            const rotateY = offset * 10;
            const translateX = offset * (cardWidth + gap) * 0.82;
            const opacity = abs > 3 ? 0 : 1 - abs * 0.22;
            const isActive = i === active;

            return (
              <Link
                key={c.name}
                to="/clubs/$slug"
                params={{ slug: c.slug }}
                onClick={() => select(i)}
                style={{
                  backgroundColor: c.color,
                  transform: `translateX(calc(-50% + ${translateX}px)) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex: total - abs,
                }}
                className={`absolute left-1/2 top-1/2 -mt-[180px] flex w-[250px] shrink-0 cursor-pointer flex-col justify-between rounded-[2rem] p-6 text-white shadow-2xl transition-all duration-700 ease-out will-change-transform hover:[transform:translateX(calc(-50%_+_${translateX}px))_translateZ(${z + 15}px)_rotateY(${rotateY}deg)_scale(${scale + 0.02})] ${
                  isActive ? "shadow-[0_35px_70px_-25px_rgba(0,0,0,0.4)]" : ""
                }`}
              >
                {/* Decorative gradient glow */}
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/20 via-transparent to-black/10" />
                <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

                {isActive && (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-[11px] font-bold tracking-wider text-[var(--club-teal)] shadow-lg uppercase">
                    Featured
                  </div>
                )}

                <div className="relative z-10">
                  <div className="mb-4 inline-flex rounded-2xl border border-white/30 bg-white/15 p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-md">
                    <Icon className="size-8 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-bold leading-tight tracking-tight">{c.name}</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/90">{c.desc}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                    <Quote className="size-3 text-white/70" />
                    <span className="text-[11px] font-semibold text-white/95">{c.tagline}</span>
                  </div>
                </div>
                <div className="relative z-10 mt-5 flex items-center justify-between border-t border-white/15 pt-4">
                  <span className="text-[11px] font-medium text-white/80">View More</span>
                  <div className="rounded-full bg-white/20 p-1.5 transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="size-4 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {clubs.map((c, i) => (
            <button
              key={i}
              aria-label={`Go to club ${i + 1}`}
              onClick={() => select(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === active ? "w-8 bg-brand-deep shadow-[0_0_12px_rgba(86,40,129,0.4)]" : "w-2.5 bg-brand-deep/20 hover:bg-brand-deep/40"
              }`}
            />
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}


export function WhatWeDo() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-0">
        {/* Section Heading */}
        <div className="mb-0 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            What We Do
          </h2>
        </div>

        {/* Pillars */}
        <div className="space-y-0 ">
          {pillars.map((p, i) => {
            const Icon = icons[p.icon] ?? Video;
            const panelRight = i % 2 === 0;
            const columns = panelRight
              ? "md:grid-cols-[minmax(0,1fr)_auto]"
              : "md:grid-cols-[auto_minmax(0,1fr)]";

            const panel = (
              <div
                key={`panel-${p.title}`}
                style={{
                  backgroundImage: `url(${p.tone})`,
                }}
                className="shadow-card  flex h-[220px] w-[350px] flex-col items-center justify-center rounded-lg text-primary-foreground"
              >
                <Icon className="size-7 opacity-90" />

                <h3 className="text-center font-display text-xl font-semibold sm:text-2xl">
                  {p.title}
                </h3>

                <span className="inline-flex items-center gap-1 text-sm opacity-90">
                  View More
                  <ArrowRight className="size-4" />
                </span>
              </div>
            );

            const text = (
              <div
                key={`text-${p.title}`}
                className="flex items-start  w-full"
              >
                <p className="text-sm text-muted-foreground sm:text-base">
                  {p.desc}
                </p>
              </div>
            );

            return (
              <Reveal
                key={p.title}
                delay={i * 0.2}
              >
                <div className={`grid items-center gap-10    ${columns}`}>
                  {panelRight ? (
                    <>
                      {text}
                      <div className="flex justify-start md:justify-end">
                        {panel}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-start md:justify-start">
                        {panel}
                      </div>
                      {text}
                    </>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Ring({ value, max, label, suffix = "" }: { value: number; max: number; label: string; suffix?: string }) {
  const [n, setN] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const R = 52;
  const C = 2 * Math.PI * R;
  const pct = Math.min(n / max, 1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (hasAnimated) return;
        setHasAnimated(true);
        const start = performance.now();
        const duration = 2200;
        const tick = (t: number) => {
          const p = Math.min((t - start) / duration, 1);
          // easeOutExpo
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          setN(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative size-36">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            className="transition-all duration-75"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-2xl font-semibold text-brand-deep">
          {n.toLocaleString()}
          {suffix}
        </span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function Stats() {
  return (
    <section id="stats" className="scroll-mt-24 py-14">
      <Heading>Activities Done By SAC</Heading>
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-10 px-5 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.2}>
            <Ring value={s.value} max={s.max} label={s.label} suffix={s.value >= 1000 ? "+" : ""} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}


export function Events() {
  return (
    <section id="events" className="scroll-mt-24 bg-section py-14">
      <Heading>New Events</Heading>
      <div className="mx-auto mt-10 grid max-w-5xl gap-5 px-5 md:grid-cols-3">
        {events.slice(0, 3).map((e, i) => (
          <Reveal key={e.slug || e.title} delay={i * 0.1} className="h-full">
            <Link
              to="/events/$slug"
              params={{ slug: e.slug }}
              className="shadow-soft flex h-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card group"
            >
              <div
                className="flex h-24 items-center justify-center px-4 text-center font-display text-sm font-semibold text-primary-foreground line-clamp-2 transition-all group-hover:brightness-110"
                style={{ backgroundColor: e.color || "var(--brand)" }}
              >
                <span>{e.title}</span>
              </div>
              <div className="flex flex-1 flex-col justify-between space-y-2 p-4">
                <div>
                  <h3 className="font-display text-[13px] font-semibold text-brand-deep group-hover:text-brand transition-colors line-clamp-2">{e.title}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {e.dates} · {e.club}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 text-[11px]">
                  <span className="font-semibold text-brand">Price : {e.price}</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-secondary-foreground">
                    {e.mode}
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 rounded border border-brand px-4 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-primary-foreground"
        >
          View More <ArrowRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}

export function Testimonials() {
  const [perView, setPerView] = useState(2);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const apply = () => setPerView(window.innerWidth < 640 ? 1 : 2);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const pages = Math.max(1, Math.ceil(testimonials.length / perView));

  useEffect(() => {
    setIndex((i) => Math.min(i, pages - 1));
  }, [pages]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !visible) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % pages), 5000);
    return () => clearInterval(t);
  }, [paused, visible, pages]);

  const go = (dir: number) => setIndex((i) => (i + dir + pages) % pages);

  return (
    <section id="testimonials" className="scroll-mt-24 py-14">
      <Heading>What Our Students Say</Heading>
      <Reveal delay={0.2}>
      <div
        ref={ref}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className={`relative mx-auto mt-10 max-w-4xl px-10 transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <button
          aria-label="Previous testimonials"
          onClick={() => go(-1)}
          className="absolute left-0 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-brand-deep/70 shadow-soft transition-all hover:scale-110 hover:text-brand sm:grid"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          aria-label="Next testimonials"
          onClick={() => go(1)}
          className="absolute right-0 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-brand-deep/70 shadow-soft transition-all hover:scale-110 hover:text-brand sm:grid"
        >
          <ArrowRight className="size-4" />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {Array.from({ length: pages }).map((_, p) => (
              <div
                key={p}
                className="grid w-full shrink-0 gap-5 px-1 sm:grid-cols-2"
              >
                {testimonials.slice(p * perView, p * perView + perView).map((t, i) => (
                  <figure
                    key={t.name}
                    style={{ transitionDelay: `${i * 90}ms` }}
                    className={`shadow-soft rounded-lg border border-border bg-card p-6 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${
                      p === index ? "translate-y-0 opacity-100" : "translate-y-3 opacity-40"
                    }`}
                  >
                    <Quote className="mx-auto size-5 text-brand" />
                    <p className="mt-3 font-display text-[13px] font-semibold text-brand-deep">
                      AITAM SAC
                    </p>
                    <blockquote className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-5 flex items-center justify-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-secondary">
                        <User className="size-4 text-brand" />
                      </span>
                      <span className="text-left">
                        <span className="block text-[12px] font-semibold text-brand-deep">
                          {t.name}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, p) => (
            <button
              key={p}
              aria-label={`Go to testimonial slide ${p + 1}`}
              onClick={() => setIndex(p)}
              className={`h-2 rounded-full transition-all duration-300 ${
                p === index ? "w-6 bg-brand" : "w-2 bg-brand/25 hover:bg-brand/50"
              }`}
            />
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}

export function Mentors() {
  return (
    <section id="mentors" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14">
      <Reveal>
        <h2 className="font-display text-lg font-semibold text-brand">Mentors</h2>
        <div className="mt-2 h-px w-full bg-brand-deep/60" />
      </Reveal>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {mentors.map((m, i) => (
          <Reveal key={m.name} delay={i * 0.1}>
            <article
              className="shadow-soft overflow-hidden rounded-lg border border-border bg-card transition-transform hover:-translate-y-1"
            >
              <div className="grid h-36 place-items-center bg-secondary">
                <span className="grid size-16 place-items-center rounded-full bg-brand/10 font-display text-lg font-semibold text-brand">
                  {m.name
                    .replace(/[^A-Za-z. ]/g, "")
                    .split(/[. ]+/)
                    .filter(Boolean)
                    .slice(-2)
                    .map((p) => p[0])
                    .join("")}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-display text-[13px] font-semibold text-brand-deep">{m.name}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">{m.role}</p>
                <p className="text-[11px] text-muted-foreground">{m.area}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LogoRow({ items }: { items: string[] }) {
  return (
    <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-4 px-5 sm:grid-cols-4">
      {items.map((c, i) => (
        <Reveal key={c} delay={i * 0.05}>
          <div
            className="shadow-soft grid h-20 place-items-center rounded border border-border bg-card px-3 text-center font-display text-[11px] font-semibold text-brand-deep"
          >
            {c}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function Logos() {
  return (
    <section id="partners" className="scroll-mt-24 py-14">
      <Heading>Our Clients</Heading>
      <LogoRow items={clients} />
      <div className="mt-14">
        <Heading>Our Partners</Heading>
        <LogoRow items={partners} />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="bg-hero-gradient scroll-mt-24 text-primary-foreground">
      <Reveal>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
            A proud initiative of
          </p>
          <div className="mt-4 inline-flex items-center justify-center rounded-lg bg-white p-3 shadow-lg">
            <img
              src={aitamLogo}
              alt="Aditya Institute of Technology and Management"
              className="h-14 w-auto object-contain"
            />
          </div>
        </div>
        <div>
          <p className="font-display text-sm font-semibold">OUR CLUBS</p>
          <ul className="mt-4 space-y-2 text-[12px] text-primary-foreground/80">
            {clubs.map((c) => (
              <li key={c.name}>
                <Link
                  to="/clubs/$slug"
                  params={{ slug: c.slug }}
                  className="transition-colors hover:text-primary-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-semibold">USEFULL LINKS</p>
          <ul className="mt-4 space-y-2 text-[12px] text-primary-foreground/80">
            {[
              "Activities",
              "Gallery",
              "Our Team",
              "Our Alumni",
              "Verify your certificate",
              "Club registration",
              "LMS SAC",
            ].map((i) => (
              <li key={i} className="transition-colors hover:text-primary-foreground">
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-semibold">CONTACT US</p>
          <ul className="mt-4 space-y-3 text-[12px] text-primary-foreground/80">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Student Activity Center, Aditya Institute of Technology and Management, Tekkali,
                Srikakulam District 532 201.
              </span>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-3.5 shrink-0" />
              <span>sac@adityatekkali.edu.in</span>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-3.5 shrink-0" />
              <span>aitamsac@gmail.com</span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-3.5 shrink-0" />
              <span>+91 92912 90936</span>
            </li>
          </ul>
        </div>
      </div>
      </Reveal>
      <div className="border-t border-primary-foreground/15 py-4 text-center text-[11px] text-primary-foreground/70">
        Designed and developed by AITAM Developers club
      </div>
    </footer>
  );
}
