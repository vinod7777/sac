import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import whiteLogo from "@/assets/sac-white-logo.png";
import colorLogo from "@/assets/sac-logo.png";
import { scrollToHash, scrollToHashWhenReady } from "@/lib/smooth-scroll";

const links = [
  { label: "Home", href: "top" },
  { label: "About SAC", href: "about" },
  { label: "Clubs", href: "clubs" },
  { label: "What We Do", href: "what-we-do" },
  { label: "Events", href: "events" },
  { label: "Testimonials", href: "testimonials" },
  { label: "Mentors", href: "mentors" },
  { label: "Partners", href: "partners" },
  { label: "Contact us", href: "contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setOpen(false);
    if (onHome) {
      window.history.replaceState(null, "", id === "top" ? "/" : `/#${id}`);
      scrollToHash(`#${id}`);
    } else {
      navigate({ to: "/", hash: id }).then(() => scrollToHashWhenReady(`#${id}`));
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background shadow-soft" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <a href="/" onClick={(e) => go(e, "top")} className="relative flex h-12 items-center">
          <img
            src={whiteLogo}
            alt="Student Activity Center logo"
            className={`h-12 w-auto transition-opacity duration-300 ${
              scrolled ? "opacity-0" : "opacity-100"
            }`}
          />
          <img
            src={colorLogo}
            alt="Student Activity Center logo"
            className={`absolute left-0 top-1/2 h-12 w-auto -translate-y-1/2 transition-opacity duration-300 ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
          />
        </a>

        <div className="hidden items-center gap-1 xl:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={`/#${l.href}`}
              onClick={(e) => go(e, l.href)}
              className={`rounded px-3 py-2 text-[13px] font-medium transition-colors ${
                scrolled
                  ? "text-brand-deep/80 hover:text-brand-deep"
                  : "text-primary-foreground/85 hover:text-primary-foreground"
              }`}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/join"
            className={`ml-2 rounded-full px-5 py-2 text-[13px] font-semibold transition-all duration-300 ${
              scrolled
                ? "bg-brand-deep text-primary-foreground hover:brightness-110"
                : "bg-white text-brand-deep hover:bg-white/90"
            }`}
          >
            Join SAC
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className={`grid size-10 place-items-center rounded-md border xl:hidden ${
            scrolled
              ? "border-brand-deep/30 text-brand-deep"
              : "border-primary-foreground/30 text-primary-foreground"
          }`}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="bg-brand-deep px-5 pb-4 xl:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={`/#${l.href}`}
              onClick={(e) => go(e, l.href)}
              className="block py-2 text-sm text-primary-foreground/85"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/join"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-full bg-white px-5 py-2 text-center text-sm font-semibold text-brand-deep"
          >
            Join SAC
          </Link>
        </div>
      )}
    </header>
  );
}
