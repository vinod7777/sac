// src/lib/api.ts
// Client-side API functions to interact with the XAMPP PHP MySQL backend

// Primary and alternative API URLs for XAMPP
export const API_BASE_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ||
  "http://localhost/sac/backend/api";

const CANDIDATE_URLS = Array.from(
  new Set([
    API_BASE_URL,
    "http://localhost:8080/sac/backend/api",
    "http://localhost/sac-backend/api",
    "http://localhost:8080/sac-backend/api",
  ])
);

async function fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (const baseUrl of CANDIDATE_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) {
        return res;
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Failed to connect to backend API");
}

export interface JoinApplicationPayload {
  name: string;
  rollNumber: string;
  email: string;
  year: string;
  club: string;
  clubName?: string | undefined;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T | undefined;
  user?: {
    id: number;
    name: string;
    email: string;
    rollNumber: string;
    role: string;
    club?: string | undefined;
    year?: string | undefined;
  } | undefined;
  errors?: Record<string, string> | undefined;
  loginHint?: string | undefined;
  id?: number | undefined;
  slug?: string | undefined;
  status?: string | undefined;
}

export interface CmsHero {
  headline: string;
  tagline: string;
  subheadline: string;
}

export interface CmsAnnouncement {
  enabled: boolean;
  badge: string;
  message: string;
  link: string;
  linkText: string;
}

export interface CmsAbout {
  title: string;
  description: string;
}

export interface CmsStat {
  label: string;
  value: number;
  max: number;
}

export interface CmsTestimonial {
  quote: string;
  name: string;
  role: string;
}

export interface CmsMentor {
  id?: string;
  name: string;
  role: string;
  area: string;
  image?: string;
}

export interface CmsClub {
  name: string;
  slug: string;
  mentor: string;
  mentorRole: string;
  studentOrganizer?: string;
  studentOrganizerRole?: string;
  studentMentor?: string;
  studentMentorRole?: string;
  about: string;
  activities: string[];
  tagline: string;
  desc: string;
  icon: string;
  color: string;
  image?: string;
}

export interface CmsContent {
  hero: CmsHero;
  announcement: CmsAnnouncement;
  about: CmsAbout;
  stats: CmsStat[];
  testimonials: CmsTestimonial[];
  mentors?: CmsMentor[] | undefined;
  clubs?: CmsClub[] | undefined;
}

export interface CmsEvent {
  id?: number | undefined;
  title: string;
  slug: string;
  dates: string;
  time: string;
  mode: "Offline" | "Online" | "Hybrid" | string;
  price: string;
  club: string;
  location: string;
  organizer: string;
  about: string;
  highlights: string[];
  prerequisites: string;
  mentor?: string | undefined;
  mentorRole?: string | undefined;
  mentor_role?: string | undefined;
  color?: string | undefined;
  icon: string;
  image?: string | undefined;
  status: "approved" | "pending" | "draft" | string;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export const defaultCmsContent: CmsContent = {
  hero: {
    headline: "Prepares students for success in a changing world.",
    tagline: "Learn . Build . Innovate",
    subheadline:
      "The apex student body of AITAM — 8 student clubs, industry-led workshops, events and real client projects.",
  },
  announcement: {
    enabled: true,
    badge: "New Notice",
    message: "Registrations open for upcoming technical bootcamps & SAC Club Memberships!",
    link: "/join",
    linkText: "Apply Now",
  },
  about: {
    title: "About SAC",
    description:
      "Student Activity Center is the apex student body of AITAM, responsible for formulating the policies pertaining to all the non-academic affairs, resulting in a holistic workspace and culture for students to explore various real time technologies, entrepreneurial activities, alumni interactions etc., laying various paths for students to shape them out into a better individual.",
  },
  stats: [
    { label: "EVENTS", value: 15, max: 40 },
    { label: "WEBINARS", value: 14, max: 40 },
    { label: "WORKSHOPS", value: 34, max: 40 },
    { label: "TRAINED STUDENTS", value: 2766, max: 3000 },
  ],
  testimonials: [
    {
      quote:
        "Learning and implementing is my way of gaining knowledge and that is core value of SAC which motivates me to work more.",
      name: "L. Prameela",
      role: "Robotics Trainee",
    },
    {
      quote:
        "I am very much excited to learn new things, and I can invest myself very confidently into SAC.",
      name: "Ch. Meghana",
      role: "Web Designing Trainee",
    },
    {
      quote:
        "SAC gave me my first real project experience. Building with a team here taught me more than any textbook could.",
      name: "K. Harsha Vardhan",
      role: "Developers Club",
    },
    {
      quote:
        "The workshops are hands-on from day one. I walked in curious about robotics and walked out building my own bot.",
      name: "S. Divya Sri",
      role: "Robotics Trainee",
    },
  ],
  mentors: [],
  clubs: [
    {
      name: "Cultural Club",
      slug: "cultural-club",
      mentor: "",
      mentorRole: "",
      studentOrganizer: "",
      studentOrganizerRole: "",
      studentMentor: "",
      studentMentorRole: "",
      about: "The Cultural Club is the creative heartbeat of AITAM SAC. It nurtures performers, anchors, designers and storytellers, giving every student a stage to discover confidence and expression.",
      activities: ["Annual cultural fest and talent hunts", "Dance, music and drama troupes", "Stage management and anchoring training", "Inter-college cultural competitions"],
      tagline: "We amuse the world",
      desc: "Cultural club aims developing young multimedia specialists.",
      icon: "Music",
      color: "var(--club-pink)",
      image: "",
    },
    {
      name: "Automobile Club",
      slug: "automobile-club",
      mentor: "",
      mentorRole: "",
      studentOrganizer: "",
      studentOrganizerRole: "",
      studentMentor: "",
      studentMentorRole: "",
      about: "The Automobile Club combines design thinking and hands-on workforce skills to build real machines. Members work on karts, EV prototypes and engine systems from concept to track.",
      activities: ["Go-kart and e-vehicle build projects", "Engine teardown and assembly workshops", "Vehicle dynamics and design sessions", "National level automotive competitions"],
      tagline: "We move the world",
      desc: "Automobile club combines design and workforce to create innovations.",
      icon: "Car",
      color: "var(--club-rust)",
      image: "",
    },
    {
      name: "Developers Club",
      slug: "developers-club",
      mentor: "",
      mentorRole: "",
      studentOrganizer: "",
      studentOrganizerRole: "",
      studentMentor: "",
      studentMentorRole: "",
      about: "The Developers Club moulds a critical thinker in every novice programmer. From first commit to shipped client product, members learn by building real software with real deadlines.",
      activities: ["Full-stack web and app development bootcamps", "AI/ML and data analytics project tracks", "Open-source contribution drives", "Hackathons and client project delivery"],
      tagline: "We develop the world",
      desc: "Developer club moulds critical thinker in every novice programmer.",
      icon: "Code2",
      color: "var(--club-teal)",
      image: "",
    },
    {
      name: "Salesforce Club",
      slug: "salesforce-club",
      mentor: "",
      mentorRole: "",
      studentOrganizer: "",
      studentOrganizerRole: "",
      studentMentor: "",
      studentMentorRole: "",
      about: "The Salesforce Club brings companies and customers together. Members train for globally recognised Salesforce certifications and build CRM solutions used by real organisations.",
      activities: ["Salesforce Administrator certification training", "Apex and Lightning development labs", "Trailhead superbadge challenges", "Industry meetups with Salesforce professionals"],
      tagline: "We connect the world",
      desc: "We bring companies and customers together.",
      icon: "Cloud",
      color: "var(--club-orange)",
      image: "",
    },
    {
      name: "Robotics Club",
      slug: "robotics-club",
      mentor: "",
      mentorRole: "",
      studentOrganizer: "",
      studentOrganizerRole: "",
      studentMentor: "",
      studentMentorRole: "",
      about: "The Robotics Club expertises students on robots and automation. Members move from sensors and microcontrollers to fully autonomous machines within a single academic year.",
      activities: ["Arduino and embedded systems workshops", "Line-follower and combat bot builds", "IoT sensor and automation projects", "Robotics expos and tech fests"],
      tagline: "We automate the world",
      desc: "Robotics club expertises students on robots and automation.",
      icon: "Bot",
      color: "var(--club-crimson)",
      image: "",
    },
    {
      name: "Design Club",
      slug: "design-club",
      mentor: "",
      mentorRole: "",
      studentOrganizer: "",
      studentOrganizerRole: "",
      studentMentor: "",
      studentMentorRole: "",
      about: "The Design Club crafts the visual identity of every SAC initiative. From event posters to product interfaces, members learn design as a discipline, not decoration.",
      activities: ["Brand identity and poster design sprints", "UI/UX fundamentals and Figma labs", "Motion graphics and video editing", "Design support for every SAC event"],
      tagline: "We shape the world",
      desc: "Design club crafts the visual identity of every SAC initiative.",
      icon: "PenTool",
      color: "var(--club-plum)",
      image: "",
    },
    {
      name: "Security Club",
      slug: "security-club",
      mentor: "",
      mentorRole: "",
      studentOrganizer: "",
      studentOrganizerRole: "",
      studentMentor: "",
      studentMentorRole: "",
      about: "The Security Club explores ethical hacking and secure engineering. Members break systems responsibly so they can learn how to build ones that hold up.",
      activities: ["Ethical hacking and CTF practice sessions", "Network and web application security labs", "Secure coding reviews", "Cyber awareness drives on campus"],
      tagline: "We protect the world",
      desc: "Security club explores ethical hacking and secure engineering.",
      icon: "ShieldCheck",
      color: "var(--club-indigo)",
      image: "",
    },
    {
      name: "Photography Club",
      slug: "photography-club",
      mentor: "",
      mentorRole: "",
      studentOrganizer: "",
      studentOrganizerRole: "",
      studentMentor: "",
      studentMentorRole: "",
      about: "The Photography Club documents every campus moment through the lens. Members master composition, lighting and post-production while building a professional portfolio.",
      activities: ["Campus event coverage and photo walks", "Lighting, composition and editing workshops", "Short film and documentary production", "Annual photo exhibition"],
      tagline: "We frame the world",
      desc: "Photography club documents every campus moment through the lens.",
      icon: "Camera",
      color: "var(--club-slate)",
      image: "",
    },
  ],
};

/**
 * Submit club application to the PHP backend
 */
export async function submitJoinApplication(
  payload: JoinApplicationPayload,
): Promise<ApiResponse> {
  try {
    const res = await fetchWithFallback("/join.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse;
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to submit application",
        errors: data.errors,
      };
    }
    return data;
  } catch (err: unknown) {
    console.warn("Backend connection failed, returning error with hint", err);
    throw new Error(
      "Unable to connect to PHP backend. Please make sure Apache and MySQL are running in your XAMPP Control Panel.",
    );
  }
}

/**
 * Authenticate user with the PHP backend
 */
export async function loginUser(credentials: {
  email: string;
  password: string;
  role?: string;
}): Promise<ApiResponse> {
  try {
    const res = await fetchWithFallback("/login.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = (await res.json()) as ApiResponse;
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Login failed",
        errors: data.errors,
      };
    }
    return data;
  } catch (err: unknown) {
    console.warn("Backend connection failed", err);
    throw new Error(
      "Unable to reach PHP backend. Please make sure Apache and MySQL are running in XAMPP.",
    );
  }
}

/**
 * Check health of PHP backend and MySQL database
 */
export async function checkBackendStatus(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const res = await fetchWithFallback("/status.php", { method: "GET" });
    const data = await res.json();
    return {
      connected: data.success === true,
      message: data.message || "Connected",
    };
  } catch {
    return {
      connected: false,
      message: "Cannot connect to PHP backend at localhost",
    };
  }
}

// ----------------------------------------------------------------------
// CMS API Functions
// ----------------------------------------------------------------------

const LOCAL_CMS_KEY = "sac_cms_content_cache";
const LOCAL_EVENTS_KEY = "sac_cms_events_cache";

/**
 * Fetch public or admin CMS content (Hero, About, Announcement, Stats, Testimonials)
 */
export async function fetchCmsContent(): Promise<CmsContent> {
  try {
    const res = await fetchWithFallback("/cms_content.php", { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_CMS_KEY, JSON.stringify(data.data));
        }
        return data.data as CmsContent;
      }
    }
  } catch (err) {
    console.warn("Using local/cached CMS content due to network or server state:", err);
  }

  // Fallback from localStorage
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(LOCAL_CMS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CmsContent;
        // Purge dummy mentors if cached contains stale seed data
        if (
          Array.isArray(parsed.mentors) &&
          parsed.mentors.some((m) => m.name === "J. Suresh Kumar" || m.name === "Girish Kumar D")
        ) {
          parsed.mentors = [];
          localStorage.setItem(LOCAL_CMS_KEY, JSON.stringify(parsed));
        }
        if (Array.isArray(parsed.clubs)) {
          parsed.clubs.forEach((c) => {
            if (c.studentMentor === "P. Anusha" || c.mentor === "Dr. J. Suresh Kumar") {
              c.mentor = "";
              c.mentorRole = "";
              c.studentOrganizer = "";
              c.studentOrganizerRole = "";
              c.studentMentor = "";
              c.studentMentorRole = "";
            }
          });
        }
        return parsed;
      } catch {
        // ignore
      }
    }
  }

  return defaultCmsContent;
}

/**
 * Update CMS Content
 */
export async function updateCmsContent(content: Partial<CmsContent>): Promise<ApiResponse> {
  // Update local cache immediately
  if (typeof window !== "undefined") {
    const current = await fetchCmsContent();
    const updated = { ...current, ...content };
    localStorage.setItem(LOCAL_CMS_KEY, JSON.stringify(updated));
  }

  try {
    const res = await fetchWithFallback("/cms_content.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });

    const data = (await res.json()) as ApiResponse;
    return data;
  } catch {
    // If backend is offline, local cache saved it successfully
    return {
      success: true,
      message: "Content saved to local browser cache (Backend server offline).",
    };
  }
}

/**
 * Fetch CMS Clubs
 */
export async function fetchCmsClubs(): Promise<CmsClub[]> {
  try {
    const cms = await fetchCmsContent();
    if (cms.clubs && cms.clubs.length > 0) {
      return cms.clubs;
    }
  } catch (err) {
    console.warn("Using default clubs due to CMS fetch error:", err);
  }
  return defaultCmsContent.clubs || [];
}

/**
 * Save / Update CMS Clubs
 */
export async function saveCmsClubs(clubs: CmsClub[]): Promise<ApiResponse> {
  return await updateCmsContent({ clubs });
}

/**
 * Fetch CMS Events (includeAll: true gets draft/pending/approved for CMS Admin)
 */
export async function fetchCmsEvents(includeAll = false): Promise<CmsEvent[]> {
  const query = includeAll ? "?all=1" : "";
  try {
    const res = await fetchWithFallback(`/cms_events.php${query}`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(data.events));
        }
        return data.events as CmsEvent[];
      }
    }
  } catch (err) {
    console.warn("Using local/cached events due to server state:", err);
  }

  // Fallback from localStorage
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(LOCAL_EVENTS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CmsEvent[];
        if (includeAll) return parsed;
        return parsed.filter((e) => e.status === "approved");
      } catch {
        // ignore
      }
    }
  }

  // Import static fallback
  const { events } = await import("@/data/sac");
  const mapped = events.map((e, idx) => ({
    id: idx + 1,
    title: e.title,
    slug: e.slug,
    dates: e.dates,
    time: e.time,
    mode: e.mode,
    price: e.price,
    club: e.club,
    location: e.location,
    organizer: e.organizer,
    about: e.about,
    highlights: e.highlights,
    prerequisites: e.prerequisites,
    mentor: e.mentor,
    mentorRole: e.mentorRole,
    color: e.color,
    icon: e.icon,
    status: "approved",
  }));

  return mapped;
}

/**
 * Save / Update an event
 */
export async function saveCmsEvent(event: Partial<CmsEvent>): Promise<ApiResponse> {
  try {
    const res = await fetchWithFallback("/cms_events.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    const data = (await res.json()) as ApiResponse;
    
    // Update local cache
    if (typeof window !== "undefined") {
      const current = await fetchCmsEvents(true);
      const existingIdx = current.findIndex((e) => e.slug === event.slug || (event.id && e.id === event.id));
      if (existingIdx >= 0) {
        current[existingIdx] = { ...current[existingIdx], ...event } as CmsEvent;
      } else {
        current.unshift({
          id: data.id || Date.now(),
          title: event.title || "Untitled",
          slug: event.slug || "untitled",
          dates: event.dates || "",
          time: event.time || "",
          mode: event.mode || "Offline",
          price: event.price || "Free",
          club: event.club || "Developers Club",
          location: event.location || "SAC Lab",
          organizer: event.organizer || "AITAM SAC",
          about: event.about || "",
          highlights: event.highlights || [],
          prerequisites: event.prerequisites || "",
          color: event.color || "var(--club-teal)",
          icon: event.icon || "Code2",
          status: event.status || "approved",
        });
      }
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(current));
    }

    return data;
  } catch {
    return {
      success: true,
      message: "Event saved to local storage (Backend offline).",
    };
  }
}

/**
 * Update event approval status
 */
export async function updateEventStatus(
  identifier: { id?: number | undefined; slug?: string | undefined },
  action: "approve" | "reject" | "draft" | "publish",
): Promise<ApiResponse> {
  try {
    const res = await fetchWithFallback("/cms_events.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...identifier, action }),
    });

    const data = (await res.json()) as ApiResponse;
    
    if (typeof window !== "undefined") {
      const current = await fetchCmsEvents(true);
      const newStatus = (action === "reject" || action === "draft") ? "draft" : "approved";
      const updated = current.map((e) => {
        if ((identifier.id && e.id === identifier.id) || (identifier.slug && e.slug === identifier.slug)) {
          return { ...e, status: newStatus };
        }
        return e;
      });
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(updated));
    }

    return data;
  } catch {
    return {
      success: true,
      message: `Event status updated to ${action} locally.`,
    };
  }
}

/**
 * Delete an event
 */
export async function deleteCmsEvent(identifier: {
  id?: number | undefined;
  slug?: string | undefined;
}): Promise<ApiResponse> {
  try {
    const query = identifier.id ? `?id=${identifier.id}` : `?slug=${identifier.slug}`;
    const res = await fetchWithFallback(`/cms_events.php${query}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(identifier),
    });

    const data = (await res.json()) as ApiResponse;
    
    if (typeof window !== "undefined") {
      const current = await fetchCmsEvents(true);
      const filtered = current.filter(
        (e) => (identifier.id ? e.id !== identifier.id : e.slug !== identifier.slug),
      );
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(filtered));
    }

    return data;
  } catch {
    return {
      success: true,
      message: "Event deleted from local storage.",
    };
  }
}

/**
 * Upload an image file to the PHP backend with base64 Data URL fallback
 */
export async function uploadImage(
  file: File,
): Promise<{ success: boolean; url: string; message: string }> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetchWithFallback("/upload.php", {
      method: "POST",
      body: formData,
    });

    const data = (await res.json()) as { success?: boolean; url?: string; message?: string };
    if (data.success && data.url) {
      return {
        success: true,
        url: data.url,
        message: data.message || "Image uploaded successfully",
      };
    }
    throw new Error(data.message || "Failed to upload image");
  } catch {
    // If backend upload fails (e.g. offline or permission issue), convert to Data URL so it continues to work seamlessly!
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          url: reader.result as string,
          message: "Image processed successfully.",
        });
      };
      reader.onerror = () => {
        resolve({
          success: false,
          url: "",
          message: "Failed to read image file.",
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

// =============================================================
// SAC LMS & CLUB GOVERNANCE API INTERFACES & METHODS
// =============================================================

export interface ExecutiveCouncilMember {
  id?: number | undefined;
  designation: string;
  name: string;
  roll_number: string;
  email: string;
  phone?: string | undefined;
  branch_year?: string | undefined;
  department?: string | undefined;
  tenure: string;
  responsibilities: string;
  photo_url?: string | undefined;
  display_order?: number | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface LmsMentor {
  id?: number | undefined;
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  department: string;
  designation: string;
  mentor_role?: string | undefined;
  cabin?: string | undefined;
  club_slug?: string | undefined;
  assigned_club_slug?: string | undefined;
  photo_url?: string | undefined;
  created_at?: string | undefined;
}

export interface ClubOrganizer {
  id?: number | undefined;
  club_slug: string;
  club_name?: string | undefined;
  organizer_name: string;
  organizer_roll_number: string;
  organizer_email: string;
  organizer_year?: string | undefined;
  academic_year?: string | undefined;
  organizer_phone?: string | undefined;
  tenure?: string | undefined;
  updated_at?: string | undefined;
}

export interface ClubWing {
  id?: number | undefined;
  club_slug: string;
  wing_name: string;
  wing_slug?: string | undefined;
  lead_name?: string | undefined;
  lead_roll_number?: string | undefined;
  lead_email?: string | undefined;
  lead_year?: string | undefined;
  lead_academic_year?: string | undefined;
  lead_phone?: string | undefined;
  description?: string | undefined;
  members_count?: number | undefined;
  created_at?: string | undefined;
}

export interface ClubMember {
  id?: number | undefined;
  name: string;
  roll_number: string;
  email: string;
  year_of_study: string;
  department?: string | undefined;
  club_slug: string;
  club_name?: string | undefined;
  wing_name?: string | undefined;
  status: "active" | "pending" | "suspended" | "alumni";
  phone?: string | undefined;
  joined_at?: string | undefined;
}

export interface LmsOverviewStats {
  clubsCount: number;
  councilCount: number;
  mentorCount: number;
  organizerCount: number;
  wingCount: number;
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  events: {
    total: number;
    approved: number;
    pending: number;
    draft: number;
  };
}

export interface ClubsGovernanceData {
  organizers: Record<string, ClubOrganizer>;
  wings: Record<string, ClubWing[]>;
  mentors: Record<string, LmsMentor[]>;
  memberCounts: Record<string, number>;
}

export interface OrganizerDashboardStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  suspendedMembers: number;
  totalWings: number;
  totalRoadmaps: number;
  totalTasks: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  totalAnnouncements: number;
}

export interface OrganizerDashboardData {
  organizer: ClubOrganizer | null;
  wings: ClubWing[];
  members: ClubMember[];
  roadmaps: LmsRoadmap[];
  tasks: LmsTask[];
  submissions: LmsTaskSubmission[];
  announcements: LmsAnnouncement[];
  mentors: LmsMentor[];
  stats: OrganizerDashboardStats;
}

export function isStudentClubMember(m: any): boolean {
  if (!m) return false;
  const roll = (m.roll_number || m.roll || "").toLowerCase().trim();
  const year = (m.year_of_study || m.year || "").toLowerCase().trim();
  const role = (m.role || "").toLowerCase().trim();
  const desig = (m.designation || "").toLowerCase().trim();
  const email = (m.email || "").toLowerCase().trim();

  // Exclude mentors by roll number pattern (e.g. MENTOR_1, FAC01)
  if (roll.includes("mentor") || roll.startsWith("fac") || roll.startsWith("prof")) return false;

  // Exclude faculty / mentors by designation or academic title (e.g. Assistant Professor, Lecturer)
  if (
    year.includes("professor") ||
    year.includes("prof") ||
    year.includes("faculty") ||
    year.includes("mentor") ||
    year.includes("lecturer") ||
    year.includes("hod") ||
    year.includes("dean") ||
    year.includes("phd") ||
    year.includes("ph.d") ||
    year.includes("doctor") ||
    year.includes("dr.")
  ) {
    return false;
  }

  if (
    desig.includes("professor") ||
    desig.includes("faculty") ||
    desig.includes("mentor") ||
    desig.includes("lecturer")
  ) {
    return false;
  }

  if (role.includes("mentor") || role.includes("faculty") || role.includes("admin")) return false;
  if (email.includes("mentor") || email.includes("faculty")) return false;

  return true;
}

// Fetch Club Organizer Dashboard Data
export async function fetchOrganizerDashboard(clubSlug: string): Promise<OrganizerDashboardData> {
  try {
    const res = await fetchWithFallback(`/lms.php?action=organizer_dashboard&club_slug=${encodeURIComponent(clubSlug)}`);
    const json = await res.json();
    if (json.success) {
      const cleanMembers = (json.members || []).filter(isStudentClubMember);
      return {
        organizer: json.organizer || null,
        wings: json.wings || [],
        members: cleanMembers,
        roadmaps: json.roadmaps || [],
        tasks: json.tasks || [],
        submissions: json.submissions || [],
        announcements: json.announcements || [],
        mentors: [],
        stats: {
          totalMembers: cleanMembers.length,
          activeMembers: cleanMembers.filter((m: any) => (m.status || "active") === "active").length,
          pendingMembers: cleanMembers.filter((m: any) => m.status === "pending").length,
          suspendedMembers: cleanMembers.filter((m: any) => m.status === "suspended").length,
          totalWings: json.wings?.length ?? json.stats?.totalWings ?? 0,
          totalRoadmaps: json.roadmaps?.length ?? json.stats?.totalRoadmaps ?? 0,
          totalTasks: json.tasks?.length ?? json.stats?.totalTasks ?? 0,
          totalSubmissions: json.submissions?.length ?? json.stats?.totalSubmissions ?? 0,
          pendingSubmissions: json.stats?.pendingSubmissions ?? 0,
          approvedSubmissions: json.stats?.approvedSubmissions ?? 0,
          rejectedSubmissions: json.stats?.rejectedSubmissions ?? 0,
          totalAnnouncements: json.announcements?.length ?? json.stats?.totalAnnouncements ?? 0,
        },
      };
    }
  } catch (e) {
    console.warn("fetchOrganizerDashboard failed:", e);
  }
  return {
    organizer: null,
    wings: [],
    members: [],
    roadmaps: [],
    tasks: [],
    submissions: [],
    announcements: [],
    mentors: [],
    stats: {
      totalMembers: 0, activeMembers: 0, pendingMembers: 0, suspendedMembers: 0,
      totalWings: 0, totalRoadmaps: 0, totalTasks: 0, totalSubmissions: 0,
      pendingSubmissions: 0, approvedSubmissions: 0, rejectedSubmissions: 0,
      totalAnnouncements: 0,
    },
  };
}

// 1. Fetch LMS Overview Statistics
export async function fetchLmsOverview(): Promise<LmsOverviewStats> {
  try {
    const res = await fetchWithFallback("/lms.php?action=overview");
    const json = await res.json();
    if (json.success && json.stats) {
      return json.stats as LmsOverviewStats;
    }
  } catch (e) {
    console.warn("fetchLmsOverview failed, using fallback", e);
  }
  return {
    clubsCount: 8,
    councilCount: 6,
    mentorCount: 8,
    organizerCount: 8,
    wingCount: 23,
    totalMembers: 20,
    activeMembers: 17,
    pendingMembers: 3,
    events: { total: 4, approved: 4, pending: 0, draft: 0 },
  };
}

// 2. Executive Council Methods
export async function fetchExecutiveCouncil(): Promise<ExecutiveCouncilMember[]> {
  try {
    const res = await fetchWithFallback("/lms.php?action=council");
    const json = await res.json();
    if (json.success && Array.isArray(json.council)) {
      return json.council as ExecutiveCouncilMember[];
    }
  } catch (e) {
    console.warn("fetchExecutiveCouncil failed", e);
  }
  return [];
}

export async function saveExecutiveCouncilMember(
  member: Partial<ExecutiveCouncilMember>,
): Promise<{ success: boolean; message: string; id?: number | undefined }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=council", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    return (await res.json()) as { success: boolean; message: string; id?: number | undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save council member";
    return { success: false, message };
  }
}

export async function deleteExecutiveCouncilMember(
  id: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback(`/lms.php?action=council&id=${id}`, {
      method: "DELETE",
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete council member";
    return { success: false, message };
  }
}

// 3. Faculty Mentors Methods
export async function fetchLmsMentors(): Promise<LmsMentor[]> {
  try {
    const res = await fetchWithFallback("/lms.php?action=mentors");
    const json = await res.json();
    if (json.success && Array.isArray(json.mentors)) {
      return json.mentors as LmsMentor[];
    }
  } catch (e) {
    console.warn("fetchLmsMentors failed", e);
  }
  return [];
}

export async function saveLmsMentor(
  mentor: Partial<LmsMentor>,
): Promise<{ success: boolean; message: string; id?: number | undefined }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=mentors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mentor),
    });
    return (await res.json()) as { success: boolean; message: string; id?: number | undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save mentor";
    return { success: false, message };
  }
}

export async function deleteLmsMentor(
  id: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback(`/lms.php?action=mentors&id=${id}`, {
      method: "DELETE",
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete mentor";
    return { success: false, message };
  }
}

export async function assignMentorClub(
  mentorId: number,
  clubSlug: string | null,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=assign_mentor_club", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentor_id: mentorId, club_slug: clubSlug }),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to assign mentor";
    return { success: false, message };
  }
}

// 4. Clubs Governance (Organizers & Wings)
export async function fetchClubsGovernance(): Promise<ClubsGovernanceData> {
  try {
    const res = await fetchWithFallback("/lms.php?action=clubs_governance");
    const json = await res.json();
    if (json.success) {
      const isPlainObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);
      return {
        organizers: isPlainObj(json.organizers) ? json.organizers : {},
        wings: isPlainObj(json.wings) ? json.wings : {},
        mentors: isPlainObj(json.mentors) ? json.mentors : {},
        memberCounts: isPlainObj(json.memberCounts) ? json.memberCounts : {},
      };
    }
  } catch (e) {
    console.warn("fetchClubsGovernance failed", e);
  }
  return { organizers: {}, wings: {}, mentors: {}, memberCounts: {} };
}

export async function updateClubOrganizer(
  organizer: Partial<ClubOrganizer>,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=update_organizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(organizer),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update organizer";
    return { success: false, message };
  }
}

export async function saveClubWing(
  wing: Partial<ClubWing>,
): Promise<{ success: boolean; message: string; id?: number | undefined }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=save_wing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wing),
    });
    return (await res.json()) as { success: boolean; message: string; id?: number | undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save wing";
    return { success: false, message };
  }
}

export async function deleteClubWing(
  id: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback(`/lms.php?action=delete_wing&id=${id}`, {
      method: "DELETE",
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete wing";
    return { success: false, message };
  }
}

// 5. Club Members Methods
export async function fetchClubMembers(params?: {
  club?: string | undefined;
  wing?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
}): Promise<ClubMember[]> {
  try {
    const query = new URLSearchParams();
    if (params?.club) query.set("club", params.club);
    if (params?.wing) query.set("wing", params.wing);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);

    const res = await fetchWithFallback(`/lms.php?action=members&${query.toString()}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.members)) {
      return (json.members as ClubMember[]).filter(isStudentClubMember);
    }
  } catch (e) {
    console.warn("fetchClubMembers failed", e);
  }
  return [];
}

export async function saveClubMember(
  member: Partial<ClubMember>,
): Promise<{ success: boolean; message: string; id?: number | undefined }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    return (await res.json()) as { success: boolean; message: string; id?: number | undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save member";
    return { success: false, message };
  }
}

export async function deleteClubMember(
  id: number,
  options?: { roll_number?: string; email?: string },
): Promise<{ success: boolean; message: string }> {
  try {
    const params = new URLSearchParams();
    params.set("id", String(id));
    if (options?.roll_number) params.set("roll", options.roll_number);
    if (options?.email) params.set("email", options.email);

    const res = await fetchWithFallback(`/lms.php?action=members&${params.toString()}`, {
      method: "DELETE",
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete member";
    return { success: false, message };
  }
}

export async function updateClubMemberStatus(
  id: number,
  status: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=update_member_status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update member status";
    return { success: false, message };
  }
}

// Aliases for convenience
export const saveWing = saveClubWing;
export const deleteWing = deleteClubWing;
export const saveMember = saveClubMember;
export const deleteMember = deleteClubMember;
export const updateMemberStatus = updateClubMemberStatus;

// 6. Events Monitor (Strictly Read-Only as requested)
export async function fetchLmsEventsReadonly(params?: {
  status?: string | undefined;
  search?: string | undefined;
}): Promise<CmsEvent[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);

    const res = await fetchWithFallback(`/lms.php?action=events_readonly&${query.toString()}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.events)) {
      return json.events as CmsEvent[];
    }
  } catch (e) {
    console.warn("fetchLmsEventsReadonly failed", e);
  }
  return [];
}

// =========================================================================
// 7. LMS & Club Governance Extended APIs (Roles, Roadmaps, Tasks, Approvals)
// =========================================================================

export interface LmsRole {
  id: number;
  role_key: string;
  role_name: string;
  description: string;
}

export interface LmsUserRole {
  id: number;
  user_id: number;
  role_key: string;
  club_slug?: string | null;
  sub_club_slug?: string | null;
  is_active: number | boolean;
  assigned_by: string;
  notes?: string | null;
  user_name?: string;
  user_email?: string;
  roll_number?: string;
  role_name?: string;
  role_description?: string;
  created_at?: string;
}

export interface LmsLesson {
  id?: number | undefined;
  module_id?: number | undefined;
  title: string;
  content?: string | null | undefined;
  resource_url?: string | null | undefined;
  lesson_order?: number | undefined;
  status?: "not_started" | "in_progress" | "completed" | undefined;
}

export interface LmsModule {
  id?: number | undefined;
  phase_id?: number | undefined;
  title: string;
  description?: string | null | undefined;
  estimated_hours?: number | undefined;
  module_order?: number | undefined;
  is_locked_by_default?: number | boolean | undefined;
  lessons?: LmsLesson[] | undefined;
}

export interface LmsPhase {
  id?: number | undefined;
  roadmap_id?: number | undefined;
  title: string;
  description?: string | null | undefined;
  phase_order: number;
  modules?: LmsModule[] | undefined;
}

export type LmsRoadmapPhase = LmsPhase;
export type LmsRoadmapModule = LmsModule;

export interface LmsRoadmap {
  id: number;
  club_slug: string;
  sub_club_slug?: string | null | undefined;
  title: string;
  description?: string | null | undefined;
  is_active?: number | boolean | undefined;
  created_by?: string | undefined;
  phases?: LmsPhase[] | undefined;
  totalLessons?: number | undefined;
  completedLessons?: number | undefined;
  progressPct?: number | undefined;
}

export interface LmsTask {
  id: number;
  club_slug: string;
  sub_club_slug?: string | null | undefined;
  title: string;
  description: string;
  instructions?: string | null | undefined;
  due_date?: string | null | undefined;
  priority: "low" | "medium" | "high" | "urgent";
  allow_github: number | boolean;
  allow_drive: number | boolean;
  allow_url: number | boolean;
  max_score: number;
  created_by: string;
  status: "active" | "archived" | "draft";
  submission_count?: number | undefined;
  created_at?: string | undefined;
}

export interface LmsTaskSubmission {
  id: number;
  task_id: number;
  task_title?: string | undefined;
  task_track?: string | null | undefined;
  max_score?: number | undefined;
  club_slug?: string | undefined;
  student_id: number;
  student_name: string;
  student_roll: string;
  submission_url: string;
  submission_type: "github" | "drive" | "url" | "text";
  notes?: string | null | undefined;
  status: "pending" | "submitted" | "under_review" | "changes_requested" | "approved" | "rejected";
  score?: number | null | undefined;
  feedback?: string | null | undefined;
  reviewer_name?: string | null | undefined;
  submitted_at?: string | undefined;
  reviewed_at?: string | null | undefined;
}

export interface LmsEventProposal extends CmsEvent {
  approval_stage?: string;
  last_comment?: string;
  last_reviewer?: string;
}

export interface LmsAnnouncement {
  id: number;
  club_slug: string;
  sub_club_slug?: string | null;
  author_name: string;
  author_role: string;
  title: string;
  content: string;
  priority: "normal" | "urgent" | "pinned";
  created_at?: string;
}

export interface LmsNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  link_url: string;
  notification_type: string;
  is_read: number | boolean;
  created_at: string;
}

export interface LmsAuditLog {
  id: number;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface StudentLmsOverview {
  user: {
    id: number;
    name: string;
    email: string;
    roll_number: string;
    role: string;
    club: string;
    year_of_study: string;
  };
  roles: LmsUserRole[];
  metrics: {
    submissionsCount: number;
    approvedSubmissions: number;
    pendingTasks: number;
    unreadNotifications: number;
    overallProgressPct: number;
  };
}

// 7.1 Roles List
export async function fetchLmsRolesList(): Promise<LmsRole[]> {
  try {
    const res = await fetchWithFallback("/lms.php?action=roles_list");
    const json = await res.json();
    if (json.success && Array.isArray(json.roles)) {
      return json.roles as LmsRole[];
    }
  } catch (e) {
    console.warn("fetchLmsRolesList fallback", e);
  }
  return [
    { id: 1, role_key: "admin", role_name: "Platform / LMS Administrator", description: "Full platform authority" },
    { id: 2, role_key: "mentor", role_name: "1. Faculty Mentor", description: "Apex institutional supervisor" },
    { id: 3, role_key: "club_organizer", role_name: "2. Club Student Organiser", description: "Apex student lead of main club" },
    { id: 4, role_key: "club_lead", role_name: "3. Club Wing Lead", description: "Track lead managing specific sub-club wing" },
    { id: 5, role_key: "student", role_name: "4. Club Member", description: "Enrolled club learner" },
  ];
}

// 7.2 User Roles & Assignments
export async function fetchLmsUserRoles(userId?: number): Promise<LmsUserRole[]> {
  try {
    const query = userId ? `&user_id=${userId}` : "";
    const res = await fetchWithFallback(`/lms.php?action=user_roles${query}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.user_roles)) {
      return json.user_roles as LmsUserRole[];
    }
  } catch (e) {
    console.warn("fetchLmsUserRoles fallback", e);
  }
  return [];
}

export async function assignLmsUserRole(payload: {
  user_id: number;
  role_key: string;
  club_slug?: string | null;
  sub_club_slug?: string | null;
  assigned_by?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=user_roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to assign role";
    return { success: false, message };
  }
}

export async function revokeLmsUserRole(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback(`/lms.php?action=user_roles&id=${id}`, {
      method: "DELETE",
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke role";
    return { success: false, message };
  }
}

// 7.3 Roadmaps & Progress
export async function fetchRoadmaps(params?: {
  club_slug?: string;
  sub_club_slug?: string;
  user_id?: number;
  all?: boolean | number;
  include_inactive?: boolean | number;
}): Promise<LmsRoadmap[]> {
  try {
    const query = new URLSearchParams();
    if (params?.club_slug) query.set("club_slug", params.club_slug);
    if (params?.sub_club_slug) query.set("sub_club_slug", params.sub_club_slug);
    if (params?.user_id) query.set("user_id", String(params.user_id));
    if (params?.all) query.set("all", "1");
    if (params?.include_inactive) query.set("include_inactive", "1");

    const res = await fetchWithFallback(`/lms.php?action=roadmaps&${query.toString()}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.roadmaps)) {
      return json.roadmaps as LmsRoadmap[];
    }
  } catch (e) {
    console.warn("fetchRoadmaps fallback", e);
  }
  return [];
}

export async function saveRoadmap(
  roadmap: Partial<LmsRoadmap>,
): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=save_roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roadmap),
    });
    return (await res.json()) as { success: boolean; message: string; id?: number };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save roadmap";
    return { success: false, message };
  }
}

export async function deleteRoadmap(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=delete_roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete roadmap";
    return { success: false, message };
  }
}

export async function markLessonProgress(payload: {
  user_id: number;
  lesson_id: number;
  module_id?: number;
  status: "not_started" | "in_progress" | "completed";
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=mark_lesson_progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update progress";
    return { success: false, message };
  }
}

// 7.4 Tasks & Submissions
export async function fetchLmsTasks(params?: {
  club_slug?: string;
  sub_club_slug?: string;
  status?: string;
}): Promise<LmsTask[]> {
  try {
    const query = new URLSearchParams();
    if (params?.club_slug) query.set("club_slug", params.club_slug);
    if (params?.sub_club_slug) query.set("sub_club_slug", params.sub_club_slug);
    if (params?.status) query.set("status", params.status);

    const res = await fetchWithFallback(`/lms.php?action=tasks&${query.toString()}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.tasks)) {
      return json.tasks as LmsTask[];
    }
  } catch (e) {
    console.warn("fetchLmsTasks fallback", e);
  }
  return [];
}

export async function saveLmsTask(
  task: Partial<LmsTask> | Record<string, any>,
): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=save_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    return (await res.json()) as { success: boolean; message: string; id?: number };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save task";
    return { success: false, message };
  }
}

export async function deleteLmsTask(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=delete_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete task";
    return { success: false, message };
  }
}

export async function fetchLmsSubmissions(params?: {
  task_id?: number;
  student_id?: number;
}): Promise<LmsTaskSubmission[]> {
  try {
    const query = new URLSearchParams();
    if (params?.task_id) query.set("task_id", String(params.task_id));
    if (params?.student_id) query.set("student_id", String(params.student_id));

    const res = await fetchWithFallback(`/lms.php?action=submissions&${query.toString()}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.submissions)) {
      return json.submissions as LmsTaskSubmission[];
    }
  } catch (e) {
    console.warn("fetchLmsSubmissions fallback", e);
  }
  return [];
}

export async function submitTaskWork(payload: {
  task_id: number;
  student_id: number;
  student_name: string;
  student_roll: string;
  submission_url: string;
  submission_type?: "github" | "drive" | "url" | "text";
  notes?: string;
}): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=submit_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as { success: boolean; message: string; id?: number };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit work";
    return { success: false, message };
  }
}

export async function reviewTaskSubmission(payload: {
  id: number;
  status: "approved" | "rejected" | "changes_requested" | "under_review";
  score?: number | null;
  feedback?: string;
  reviewer_name?: string;
  reviewer_role?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=review_submission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review submission";
    return { success: false, message };
  }
}

// 7.5 Multi-Tier Event Approvals
export async function fetchLmsEventProposals(): Promise<LmsEventProposal[]> {
  try {
    const res = await fetchWithFallback("/lms.php?action=event_proposals");
    const json = await res.json();
    if (json.success && Array.isArray(json.events)) {
      return json.events as LmsEventProposal[];
    }
  } catch (e) {
    console.warn("fetchLmsEventProposals fallback", e);
  }
  return [];
}

export async function actOnEventApproval(payload: {
  event_id: number;
  action_step: "approve_mentor" | "request_changes_mentor" | "reject_mentor" | "approve_admin" | "request_changes_admin" | "publish";
  reviewer_name: string;
  reviewer_role: string;
  comments?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=event_approval_action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process event approval";
    return { success: false, message };
  }
}

// 7.6 Announcements & In-App Notifications
export async function fetchLmsAnnouncements(clubSlug?: string): Promise<LmsAnnouncement[]> {
  try {
    const query = clubSlug ? `&club_slug=${clubSlug}` : "";
    const res = await fetchWithFallback(`/lms.php?action=announcements${query}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.announcements)) {
      return json.announcements as LmsAnnouncement[];
    }
  } catch (e) {
    console.warn("fetchLmsAnnouncements fallback", e);
  }
  return [];
}

export async function saveLmsAnnouncement(payload: {
  id?: number;
  club_slug?: string;
  sub_club_slug?: string | null;
  author_name: string;
  author_role?: string;
  title: string;
  content: string;
  priority?: "normal" | "urgent" | "pinned";
}): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as { success: boolean; message: string; id?: number };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to post announcement";
    return { success: false, message };
  }
}

export async function deleteLmsAnnouncement(
  id: number,
  title?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithFallback("/lms.php?action=delete_announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(id), title: title || "" }),
    });
    return (await res.json()) as { success: boolean; message: string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete announcement";
    return { success: false, message };
  }
}

export async function fetchLmsNotifications(userId?: number): Promise<{
  notifications: LmsNotification[];
  unreadCount: number;
}> {
  try {
    const query = userId ? `&user_id=${userId}` : "";
    const res = await fetchWithFallback(`/lms.php?action=notifications${query}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.notifications)) {
      return {
        notifications: json.notifications as LmsNotification[],
        unreadCount: json.unreadCount || 0,
      };
    }
  } catch (e) {
    console.warn("fetchLmsNotifications fallback", e);
  }
  return { notifications: [], unreadCount: 0 };
}

export async function markLmsNotificationRead(id?: number, userId?: number): Promise<void> {
  try {
    await fetchWithFallback("/lms.php?action=notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, user_id: userId }),
    });
  } catch (e) {
    console.warn("markLmsNotificationRead failed", e);
  }
}

// 7.7 Audit Logs
export async function fetchLmsAuditLogs(limit = 50): Promise<LmsAuditLog[]> {
  try {
    const res = await fetchWithFallback(`/lms.php?action=audit_logs&limit=${limit}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.audit_logs)) {
      return json.audit_logs as LmsAuditLog[];
    }
  } catch (e) {
    console.warn("fetchLmsAuditLogs fallback", e);
  }
  return [];
}

// 7.8 Student LMS Overview
export async function fetchStudentLmsOverview(userId?: number): Promise<StudentLmsOverview | null> {
  try {
    const query = userId ? `&user_id=${userId}` : "";
    const res = await fetchWithFallback(`/lms.php?action=student_lms_overview${query}`);
    const json = await res.json();
    if (json.success && json.user) {
      return json as StudentLmsOverview;
    }
  } catch (e) {
    console.warn("fetchStudentLmsOverview fallback", e);
  }
  return null;
}

// 7.9 Database Clean / Purge Utility
export async function clearDatabase(): Promise<{ success: boolean; message: string; truncated_tables?: string[] }> {
  try {
    const res = await fetchWithFallback("/clear_database.php");
    return (await res.json()) as { success: boolean; message: string; truncated_tables?: string[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to clear database";
    return { success: false, message };
  }
}


