import { animate } from "framer-motion";

export const NAV_OFFSET = 80;

export function scrollToHash(hash: string, offset = NAV_OFFSET) {
  if (typeof window === "undefined") return false;
  const id = hash.replace(/^#/, "");
  if (!id) return false;
  
  let targetTop = 0;
  if (id !== "top") {
    const el = document.getElementById(id);
    if (!el) return false;
    targetTop = el.getBoundingClientRect().top + window.scrollY - offset;
  }

  animate(window.scrollY, targetTop, {
    type: "spring",
    stiffness: 80,
    damping: 20,
    mass: 1,
    onUpdate: (latest) => window.scrollTo(0, latest)
  });
  
  return true;
}

/** Retries briefly so it also works right after a route change. */
export function scrollToHashWhenReady(hash: string, tries = 20) {
  if (typeof window === "undefined") return;
  let attempt = 0;
  const tick = () => {
    if (scrollToHash(hash) || attempt++ >= tries) return;
    window.setTimeout(tick, 50);
  };
  tick();
}
