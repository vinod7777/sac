// Club Theme Configuration & Color System
// Maps each club to its distinctive branding colors, gradients, and styling badges
// Developer Club: Green / Emerald / Teal
// Photography Club: Black / Slate / Zinc
// Cultural Club: Pink / Rose
// Automobile Club: Rust / Amber / Orange
// Salesforce Club: Orange / Sky
// Robotics Club: Crimson / Red
// Design Club: Plum / Purple
// Security Club: Indigo / Blue

export interface ClubTheme {
  slug: string;
  name: string;
  colorVar: string; // CSS variable or primary color value
  accentColor: string; // Hex color
  gradient: string; // Gradient class for cards / buttons
  bannerGradient: string; // Full hero banner gradient
  activeNav: string; // Active sidebar navigation item classes
  badge: string; // Pill badge with border & light background
  badgeSolid: string; // Solid pill badge
  text: string; // Text color class
  textDark: string; // Darker text color class
  border: string; // Border color class
  ringFocus: string; // Input focus outline
  avatarBg: string; // Avatar container gradient
  iconBg: string; // Icon container classes
  subtleBg: string; // Soft background tint
}

export const CLUB_THEMES: Record<string, ClubTheme> = {
  "developers-club": {
    slug: "developers-club",
    name: "Developers Club",
    colorVar: "var(--club-teal)",
    accentColor: "#059669",
    gradient: "from-emerald-600 to-teal-700",
    bannerGradient: "from-emerald-700 via-teal-700 to-emerald-950",
    activeNav: "bg-gradient-to-r from-emerald-600 to-teal-700 font-semibold text-white shadow-soft",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    badgeSolid: "bg-emerald-600 text-white",
    text: "text-emerald-600",
    textDark: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    ringFocus: "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400",
    avatarBg: "bg-gradient-to-br from-emerald-600 to-teal-700 text-white",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    subtleBg: "bg-emerald-50/60 dark:bg-emerald-950/30",
  },
  "photography-club": {
    slug: "photography-club",
    name: "Photography Club",
    colorVar: "var(--club-slate)",
    accentColor: "#18181b",
    gradient: "from-zinc-900 to-black",
    bannerGradient: "from-zinc-900 via-neutral-900 to-black",
    activeNav: "bg-gradient-to-r from-zinc-900 to-black font-semibold text-white shadow-soft",
    badge: "bg-zinc-900 text-white border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-300",
    badgeSolid: "bg-black text-white",
    text: "text-zinc-900 dark:text-zinc-100",
    textDark: "text-black dark:text-white",
    border: "border-zinc-300 dark:border-zinc-700",
    ringFocus: "focus:border-zinc-800 focus:ring-1 focus:ring-zinc-400",
    avatarBg: "bg-gradient-to-br from-zinc-900 to-black text-white",
    iconBg: "bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    subtleBg: "bg-zinc-100/70 dark:bg-zinc-800/40",
  },
  "cultural-club": {
    slug: "cultural-club",
    name: "Cultural Club",
    colorVar: "var(--club-pink)",
    accentColor: "#db2777",
    gradient: "from-pink-600 to-rose-600",
    bannerGradient: "from-pink-600 via-rose-600 to-purple-800",
    activeNav: "bg-gradient-to-r from-pink-600 to-rose-600 font-semibold text-white shadow-soft",
    badge: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800",
    badgeSolid: "bg-pink-600 text-white",
    text: "text-pink-600",
    textDark: "text-pink-700 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
    ringFocus: "focus:border-pink-500 focus:ring-1 focus:ring-pink-400",
    avatarBg: "bg-gradient-to-br from-pink-600 to-rose-600 text-white",
    iconBg: "bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800",
    subtleBg: "bg-pink-50/60 dark:bg-pink-950/30",
  },
  "automobile-club": {
    slug: "automobile-club",
    name: "Automobile Club",
    colorVar: "var(--club-rust)",
    accentColor: "#d97706",
    gradient: "from-amber-600 to-orange-600",
    bannerGradient: "from-amber-600 via-orange-600 to-red-700",
    activeNav: "bg-gradient-to-r from-amber-600 to-orange-600 font-semibold text-white shadow-soft",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    badgeSolid: "bg-amber-600 text-white",
    text: "text-amber-600",
    textDark: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    ringFocus: "focus:border-amber-500 focus:ring-1 focus:ring-amber-400",
    avatarBg: "bg-gradient-to-br from-amber-600 to-orange-600 text-white",
    iconBg: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    subtleBg: "bg-amber-50/60 dark:bg-amber-950/30",
  },
  "salesforce-club": {
    slug: "salesforce-club",
    name: "Salesforce Club",
    colorVar: "var(--club-orange)",
    accentColor: "#ea580c",
    gradient: "from-orange-500 to-amber-600",
    bannerGradient: "from-orange-500 via-amber-600 to-sky-700",
    activeNav: "bg-gradient-to-r from-orange-500 to-amber-600 font-semibold text-white shadow-soft",
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    badgeSolid: "bg-orange-600 text-white",
    text: "text-orange-600",
    textDark: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    ringFocus: "focus:border-orange-500 focus:ring-1 focus:ring-orange-400",
    avatarBg: "bg-gradient-to-br from-orange-500 to-amber-600 text-white",
    iconBg: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
    subtleBg: "bg-orange-50/60 dark:bg-orange-950/30",
  },
  "robotics-club": {
    slug: "robotics-club",
    name: "Robotics Club",
    colorVar: "var(--club-crimson)",
    accentColor: "#dc2626",
    gradient: "from-rose-600 to-red-700",
    bannerGradient: "from-rose-600 via-red-600 to-orange-700",
    activeNav: "bg-gradient-to-r from-rose-600 to-red-700 font-semibold text-white shadow-soft",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    badgeSolid: "bg-rose-600 text-white",
    text: "text-rose-600",
    textDark: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    ringFocus: "focus:border-rose-500 focus:ring-1 focus:ring-rose-400",
    avatarBg: "bg-gradient-to-br from-rose-600 to-red-700 text-white",
    iconBg: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    subtleBg: "bg-rose-50/60 dark:bg-rose-950/30",
  },
  "design-club": {
    slug: "design-club",
    name: "Design Club",
    colorVar: "var(--club-plum)",
    accentColor: "#9333ea",
    gradient: "from-purple-600 to-violet-700",
    bannerGradient: "from-purple-600 via-violet-600 to-pink-700",
    activeNav: "bg-gradient-to-r from-purple-600 to-violet-700 font-semibold text-white shadow-soft",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    badgeSolid: "bg-purple-600 text-white",
    text: "text-purple-600",
    textDark: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    ringFocus: "focus:border-purple-500 focus:ring-1 focus:ring-purple-400",
    avatarBg: "bg-gradient-to-br from-purple-600 to-violet-700 text-white",
    iconBg: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    subtleBg: "bg-purple-50/60 dark:bg-purple-950/30",
  },
  "security-club": {
    slug: "security-club",
    name: "Security Club",
    colorVar: "var(--club-indigo)",
    accentColor: "#4f46e5",
    gradient: "from-indigo-600 to-blue-700",
    bannerGradient: "from-indigo-600 via-blue-700 to-slate-900",
    activeNav: "bg-gradient-to-r from-indigo-600 to-blue-700 font-semibold text-white shadow-soft",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
    badgeSolid: "bg-indigo-600 text-white",
    text: "text-indigo-600",
    textDark: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    ringFocus: "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400",
    avatarBg: "bg-gradient-to-br from-indigo-600 to-blue-700 text-white",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    subtleBg: "bg-indigo-50/60 dark:bg-indigo-950/30",
  },
};

// Default fallback theme
const DEFAULT_THEME: ClubTheme = {
  slug: "developers-club",
  name: "Developers Club",
  colorVar: "var(--club-teal)",
  accentColor: "#059669",
  gradient: "from-emerald-600 to-teal-700",
  bannerGradient: "from-emerald-700 via-teal-700 to-emerald-950",
  activeNav: "bg-gradient-to-r from-emerald-600 to-teal-700 font-semibold text-white shadow-soft",
  badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  badgeSolid: "bg-emerald-600 text-white",
  text: "text-emerald-600",
  textDark: "text-emerald-700",
  border: "border-emerald-200",
  ringFocus: "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400",
  avatarBg: "bg-gradient-to-br from-emerald-600 to-teal-700 text-white",
  iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
  subtleBg: "bg-emerald-50/60",
};

/**
 * Resolves a ClubTheme object given any club slug.
 * Handles synonyms and custom slugs gracefully.
 */
export function getClubTheme(slug?: string | null): ClubTheme {
  if (!slug) return DEFAULT_THEME;
  const clean = slug.toLowerCase().trim();
  if (CLUB_THEMES[clean]) return CLUB_THEMES[clean]!;

  // Fuzzy match keywords
  if (clean.includes("photo")) return CLUB_THEMES["photography-club"]!;
  if (clean.includes("dev") || clean.includes("code")) return CLUB_THEMES["developers-club"]!;
  if (clean.includes("cultur") || clean.includes("music") || clean.includes("dance")) return CLUB_THEMES["cultural-club"]!;
  if (clean.includes("auto")) return CLUB_THEMES["automobile-club"]!;
  if (clean.includes("sales") || clean.includes("cloud")) return CLUB_THEMES["salesforce-club"]!;
  if (clean.includes("robot") || clean.includes("iot")) return CLUB_THEMES["robotics-club"]!;
  if (clean.includes("design") || clean.includes("creative") || clean.includes("ui")) return CLUB_THEMES["design-club"]!;
  if (clean.includes("sec") || clean.includes("cyber")) return CLUB_THEMES["security-club"]!;

  // Custom club fallback with dynamic display name
  const name = clean
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    ...DEFAULT_THEME,
    slug: clean,
    name,
  };
}
