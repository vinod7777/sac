import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Code2,
  Compass,
  Cpu,
  Crown,
  ExternalLink,
  FileCheck,
  FolderGit2,
  Gamepad2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  fetchClubsGovernance,
  fetchLmsAnnouncements,
  fetchLmsEventProposals,
  fetchLmsNotifications,
  fetchLmsSubmissions,
  fetchLmsTasks,
  fetchRoadmaps,
  fetchStudentLmsOverview,
  markLessonProgress,
  markLmsNotificationRead,
  submitTaskWork,
  type ClubOrganizer,
  type ClubWing,
  type ClubsGovernanceData,
  type LmsAnnouncement,
  type LmsEventProposal,
  type LmsLesson,
  type LmsMentor,
  type LmsNotification,
  type LmsRoadmap,
  type LmsTask,
  type LmsTaskSubmission,
  type StudentLmsOverview,
} from "@/lib/api";
import { getClubTheme } from "@/lib/clubTheme";

export type MemberNavTab =
  | "overview"
  | "roadmap"
  | "tasks"
  | "submissions"
  | "events"
  | "announcements"
  | "achievements"
  | "club";

export interface StoredUser {
  id?: number;
  name?: string;
  email?: string;
  rollNumber?: string;
  roll_number?: string;
  role?: string;
  club?: string;
  year?: string;
  year_of_study?: string;
  managed_club?: string;
  managed_wing?: string;
}

export interface ClubWingItem {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DEFAULT_CLUB_WINGS_MAP: Record<string, ClubWingItem[]> = {
  "developers-club": [
    {
      slug: "web-dev",
      name: "Web Development Wing",
      description: "Full-stack web application engineering covering HTML5, CSS3, modern JavaScript/TypeScript, React 19, and Node.js APIs.",
      icon: Code2,
    },
    {
      slug: "app-dev",
      name: "Mobile App Development Wing",
      description: "Cross-platform native mobile applications with Flutter, Dart, state management, and Firebase cloud integrations.",
      icon: Smartphone,
    },
    {
      slug: "game-dev",
      name: "Game Development Wing",
      description: "2D and 3D game engines, physics simulations, shaders, and interactive gameplay mechanics using Unity and C#.",
      icon: Gamepad2,
    },
    {
      slug: "ai-dev",
      name: "AI & Machine Learning Wing",
      description: "Machine learning algorithms, deep neural network training, computer vision models, and applied GenAI.",
      icon: Sparkles,
    },
    {
      slug: "cloud-dev",
      name: "Cloud & DevOps Wing",
      description: "Containerization with Docker, Kubernetes clusters, CI/CD automated deployment pipelines, and cloud hosting.",
      icon: Cloud,
    },
  ],
  "robotics-club": [
    {
      slug: "embedded-dev",
      name: "Embedded Systems & Arduino",
      description: "Microcontrollers, sensor interfaces, hardware schematics, and C/C++ firmware programming.",
      icon: Cpu,
    },
    {
      slug: "robotics-dev",
      name: "Autonomous Robotics & ROS",
      description: "Robot Operating System, kinematic modeling, LiDAR SLAM, and autonomous path planning.",
      icon: Compass,
    },
    {
      slug: "iot-dev",
      name: "IoT & Connected Systems",
      description: "Wireless sensor networks, MQTT protocols, cloud telemetry, and smart campus automation.",
      icon: Layers,
    },
  ],
  "security-club": [
    {
      slug: "ethical-hacking",
      name: "Ethical Hacking & Pentesting",
      description: "Web application penetration testing, vulnerability discovery, exploits, and CTF challenges.",
      icon: Shield,
    },
    {
      slug: "network-security",
      name: "Network Defense & SOC",
      description: "Packet inspection, firewall rules, intrusion detection systems, and threat mitigation.",
      icon: Layers,
    },
  ],
  "design-club": [
    {
      slug: "uiux-design",
      name: "UI/UX & Product Design",
      description: "User research, wireframing, interactive prototyping in Figma, and design systems.",
      icon: Sparkles,
    },
    {
      slug: "brand-design",
      name: "Brand & Visual Identity",
      description: "Typography, vector illustration, digital branding, layout composition, and asset design.",
      icon: Award,
    },
  ],
};

export const getWingIcon = (slug?: string, name?: string): React.ComponentType<{ className?: string }> => {
  const s = ((slug || "") + " " + (name || "")).toLowerCase();
  if (s.includes("web") || s.includes("full-stack") || s.includes("frontend") || s.includes("backend")) return Code2;
  if (s.includes("app") || s.includes("mobile") || s.includes("flutter") || s.includes("android") || s.includes("ios")) return Smartphone;
  if (s.includes("game") || s.includes("unity") || s.includes("unreal")) return Gamepad2;
  if (s.includes("ai") || s.includes("machine") || s.includes("ml") || s.includes("data") || s.includes("genai")) return Sparkles;
  if (s.includes("cloud") || s.includes("devops") || s.includes("docker") || s.includes("k8s") || s.includes("kubernetes")) return Cloud;
  if (s.includes("embedded") || s.includes("hardware") || s.includes("arduino") || s.includes("circuit") || s.includes("micro")) return Cpu;
  if (s.includes("security") || s.includes("hack") || s.includes("cyber") || s.includes("defense")) return Shield;
  return Compass;
};

export const getBuiltinRoadmapForWing = (
  wingSlug?: string,
  clubSlug: string = "developers-club",
  _clubName: string = "Developers Club"
): LmsRoadmap => {
  const slug = (wingSlug || "web-dev").toLowerCase();

  if (slug.includes("app") || slug.includes("mobile") || slug.includes("flutter")) {
    return {
      id: 2002,
      club_slug: clubSlug,
      sub_club_slug: "app-dev",
      title: "Mobile App Development (Flutter & Android)",
      description: "Cross-platform mobile application development with Flutter, Dart, state management, and Firebase cloud integrations.",
      is_active: 1,
      created_by: "SAC Faculty / Admin",
      phases: [
        {
          id: 201,
          roadmap_id: 2002,
          phase_order: 1,
          title: "Phase 1: Dart Fundamentals & Widget Trees",
          description: "Dart language semantics, null safety, OOP, and building basic Flutter widget layouts.",
          modules: [
            {
              id: 2011,
              phase_id: 201,
              module_order: 1,
              title: "Module 1.1: Dart Language & OOP Mastery",
              description: "Variables, control flow, functions, async programming, and classes.",
              estimated_hours: 8,
              lessons: [
                {
                  id: 20111,
                  module_id: 2011,
                  lesson_order: 1,
                  title: "Dart Language Fundamentals & Sound Null Safety",
                  content: "Variables, control flow, functions, records, and class inheritance in Dart.",
                  resource_url: "https://dart.dev/guides",
                  status: "not_started",
                },
                {
                  id: 20112,
                  module_id: 2011,
                  lesson_order: 2,
                  title: "Async Programming & Streams in Dart",
                  content: "Futures, async/await, and event streams for real-time mobile apps.",
                  resource_url: "https://dart.dev/codelabs/async-await",
                  status: "not_started",
                },
              ],
            },
            {
              id: 2012,
              phase_id: 201,
              module_order: 2,
              title: "Module 1.2: Flutter UI & Interactive Widgets",
              description: "Scaffold, Column, Row, ListView, Custom Paint, and Material 3 design.",
              estimated_hours: 12,
              lessons: [
                {
                  id: 20121,
                  module_id: 2012,
                  lesson_order: 1,
                  title: "Flutter Core Widgets & Layout Engine",
                  content: "Mastering Container, Flex, Expanded, Stack, and responsive constraints.",
                  resource_url: "https://docs.flutter.dev/ui",
                  status: "not_started",
                },
                {
                  id: 20122,
                  module_id: 2012,
                  lesson_order: 2,
                  title: "Interactive Forms, TextFields & User Gestures",
                  content: "Building validated input forms, gesture detectors, and micro-animations.",
                  resource_url: "https://docs.flutter.dev/ui/interactivity",
                  status: "not_started",
                },
              ],
            },
          ],
        },
        {
          id: 202,
          roadmap_id: 2002,
          phase_order: 2,
          title: "Phase 2: State Management & Cloud Services",
          description: "Provider, Riverpod, REST API integration, and Firebase authentication & databases.",
          modules: [
            {
              id: 2021,
              phase_id: 202,
              module_order: 1,
              title: "Module 2.1: Modern State Architecture (Riverpod)",
              description: "Managing app state cleanly using StateNotifier and Riverpod providers.",
              estimated_hours: 10,
              lessons: [
                {
                  id: 20211,
                  module_id: 2021,
                  lesson_order: 1,
                  title: "Riverpod State Architecture & Dependency Injection",
                  content: "Refactoring state out of UI widgets using Riverpod providers.",
                  resource_url: "https://riverpod.dev",
                  status: "not_started",
                },
              ],
            },
            {
              id: 2022,
              phase_id: 202,
              module_order: 2,
              title: "Module 2.2: Backend Integration & Firebase",
              description: "REST API networking, JSON parsing, Firestore DB, and push notifications.",
              estimated_hours: 14,
              lessons: [
                {
                  id: 20221,
                  module_id: 2022,
                  lesson_order: 1,
                  title: "Firebase Auth, Firestore & Cloud Messaging",
                  content: "Real-time sync, offline caching, and user notification services.",
                  resource_url: "https://firebase.google.com/docs/flutter/setup",
                  status: "not_started",
                },
              ],
            },
          ],
        },
      ],
    };
  }

  if (slug.includes("game") || slug.includes("unity")) {
    return {
      id: 2003,
      club_slug: clubSlug,
      sub_club_slug: "game-dev",
      title: "Game Development & Interactive Simulation (Unity/C#)",
      description: "2D and 3D game mechanics, physics simulation, C# scripting, shaders, and level architecture with Unity engine.",
      is_active: 1,
      created_by: "SAC Faculty / Admin",
      phases: [
        {
          id: 301,
          roadmap_id: 2003,
          phase_order: 1,
          title: "Phase 1: Game Math, Physics & C# Fundamentals",
          description: "Vectors, coordinate geometry, C# event architecture, and Unity physics collisions.",
          modules: [
            {
              id: 3011,
              phase_id: 301,
              module_order: 1,
              title: "Module 1.1: C# Scripting & Object Lifecycle",
              description: "Awake, Start, Update, Coroutines, and game object instantiation.",
              estimated_hours: 8,
              lessons: [
                {
                  id: 30111,
                  module_id: 3011,
                  lesson_order: 1,
                  title: "Unity Component Model & C# Scripting Basics",
                  content: "MonoBehaviour lifecycle methods, transforms, and game loop optimization.",
                  resource_url: "https://docs.unity3d.com/Manual/",
                  status: "not_started",
                },
              ],
            },
            {
              id: 3012,
              phase_id: 301,
              module_order: 2,
              title: "Module 1.2: Rigidbody & Collision Physics",
              description: "Colliders, Raycasting, physics materials, and trigger event listeners.",
              estimated_hours: 10,
              lessons: [
                {
                  id: 30121,
                  module_id: 3012,
                  lesson_order: 1,
                  title: "2D/3D Rigidbody Physics & Collisions",
                  content: "Simulating forces, impulses, velocity clamps, and trigger callback systems.",
                  resource_url: "https://learn.unity.com/",
                  status: "not_started",
                },
              ],
            },
          ],
        },
        {
          id: 302,
          roadmap_id: 2003,
          phase_order: 2,
          title: "Phase 2: Gameplay Mechanics & Audio Integration",
          description: "Character controllers, AI pathfinding, camera systems, particle effects, and sound design.",
          modules: [
            {
              id: 3021,
              phase_id: 302,
              module_order: 1,
              title: "Module 2.1: Character Controllers & Animation Trees",
              description: "Mecanim state machines, blend trees, and input system controls.",
              estimated_hours: 12,
              lessons: [
                {
                  id: 30211,
                  module_id: 3021,
                  lesson_order: 1,
                  title: "Building Smooth 3D Character Movement",
                  content: "Third-person and first-person camera setups with root motion.",
                  resource_url: "https://docs.unity3d.com/Manual/AnimationOverview.html",
                  status: "not_started",
                },
              ],
            },
          ],
        },
      ],
    };
  }

  if (slug.includes("ai") || slug.includes("machine") || slug.includes("ml")) {
    return {
      id: 2004,
      club_slug: clubSlug,
      sub_club_slug: "ai-dev",
      title: "AI & Machine Learning Engineering",
      description: "Applied machine learning algorithms, deep neural network training, computer vision models, and applied GenAI.",
      is_active: 1,
      created_by: "SAC Faculty / Admin",
      phases: [
        {
          id: 401,
          roadmap_id: 2004,
          phase_order: 1,
          title: "Phase 1: Python for Data Science & Math Foundations",
          description: "NumPy vectorized arrays, pandas dataframes, linear algebra, and data visualization.",
          modules: [
            {
              id: 4011,
              phase_id: 401,
              module_order: 1,
              title: "Module 1.1: NumPy, Pandas & Vectorized Operations",
              description: "Array indexing, broadcasting, data cleaning, and statistical aggregations.",
              estimated_hours: 8,
              lessons: [
                {
                  id: 40111,
                  module_id: 4011,
                  lesson_order: 1,
                  title: "NumPy Array Computing & Vectorized Algebra",
                  content: "Matrix dot products, broadcasting rules, and high-performance slicing.",
                  resource_url: "https://numpy.org/doc/",
                  status: "not_started",
                },
                {
                  id: 40112,
                  module_id: 4011,
                  lesson_order: 2,
                  title: "Pandas Data Wrangling & Cleaning",
                  content: "DataFrames, group-by operations, missing value handling, and transformation pipelines.",
                  resource_url: "https://pandas.pydata.org/docs/",
                  status: "not_started",
                },
              ],
            },
          ],
        },
        {
          id: 402,
          roadmap_id: 2004,
          phase_order: 2,
          title: "Phase 2: Classical Machine Learning & Scikit-Learn",
          description: "Supervised regression, classification models, cross-validation, and feature pipelines.",
          modules: [
            {
              id: 4021,
              phase_id: 402,
              module_order: 1,
              title: "Module 2.1: Supervised Learning & Model Evaluation",
              description: "Linear & Logistic Regression, Decision Trees, Random Forests, and ROC-AUC curves.",
              estimated_hours: 10,
              lessons: [
                {
                  id: 40211,
                  module_id: 4021,
                  lesson_order: 1,
                  title: "Building Predictive Pipelines with Scikit-Learn",
                  content: "Train-test splitting, cross-validation, preprocessing scalers, and metric reporting.",
                  resource_url: "https://scikit-learn.org/stable/",
                  status: "not_started",
                },
              ],
            },
          ],
        },
        {
          id: 403,
          roadmap_id: 2004,
          phase_order: 3,
          title: "Phase 3: Deep Learning, PyTorch & LLMs",
          description: "Neural networks, PyTorch tensors, computer vision, and prompt engineering with GenAI.",
          modules: [
            {
              id: 4031,
              phase_id: 403,
              module_order: 1,
              title: "Module 3.1: PyTorch Tensors & Neural Architectures",
              description: "Building multilayer perceptrons, loss functions, optimizers, and backpropagation.",
              estimated_hours: 14,
              lessons: [
                {
                  id: 40311,
                  module_id: 4031,
                  lesson_order: 1,
                  title: "PyTorch Basics & Training Custom Neural Networks",
                  content: "Tensors, autograd, Dataset/DataLoader classes, and model saving.",
                  resource_url: "https://pytorch.org/tutorials/",
                  status: "not_started",
                },
              ],
            },
          ],
        },
      ],
    };
  }

  if (slug.includes("cloud") || slug.includes("devops")) {
    return {
      id: 2005,
      club_slug: clubSlug,
      sub_club_slug: "cloud-dev",
      title: "Cloud Architecture & DevOps Engineering",
      description: "Containerization with Docker, Kubernetes clusters, CI/CD automated deployment pipelines, and cloud hosting.",
      is_active: 1,
      created_by: "SAC Faculty / Admin",
      phases: [
        {
          id: 501,
          roadmap_id: 2005,
          phase_order: 1,
          title: "Phase 1: Linux CLI & Containerization with Docker",
          description: "Linux system administration, bash scripting, Docker container lifecycle, and images.",
          modules: [
            {
              id: 5011,
              phase_id: 501,
              module_order: 1,
              title: "Module 1.1: Linux Shell & System Administration",
              description: "File permissions, process management, bash scripting, and SSH key security.",
              estimated_hours: 8,
              lessons: [
                {
                  id: 50111,
                  module_id: 5011,
                  lesson_order: 1,
                  title: "Linux Command-Line Power User Skills",
                  content: "Bash pipelines, text processing with sed/awk, and system service configuration.",
                  resource_url: "https://ubuntu.com/tutorials",
                  status: "not_started",
                },
              ],
            },
            {
              id: 5012,
              phase_id: 501,
              module_order: 2,
              title: "Module 1.2: Docker Containerization & Multi-Stage Builds",
              description: "Writing optimized Dockerfiles, docker compose networks, and volumes.",
              estimated_hours: 10,
              lessons: [
                {
                  id: 50121,
                  module_id: 5012,
                  lesson_order: 1,
                  title: "Docker Fundamentals & Container Best Practices",
                  content: "Creating lightweight container images, multi-stage builds, and non-root users.",
                  resource_url: "https://docs.docker.com/",
                  status: "not_started",
                },
              ],
            },
          ],
        },
        {
          id: 502,
          roadmap_id: 2005,
          phase_order: 2,
          title: "Phase 2: Kubernetes Orchestration & Cloud Infrastructure",
          description: "Kubernetes pods, services, ingress controllers, config maps, and cloud IAM.",
          modules: [
            {
              id: 5021,
              phase_id: 502,
              module_order: 1,
              title: "Module 2.1: Kubernetes Core Objects & Networking",
              description: "Pods, Deployments, Services, ClusterIP, NodePort, and LoadBalancers.",
              estimated_hours: 12,
              lessons: [
                {
                  id: 50211,
                  module_id: 5021,
                  lesson_order: 1,
                  title: "Deploying Containerized Apps on Kubernetes",
                  content: "Writing deployment manifests, pod replication, health checks, and service mesh.",
                  resource_url: "https://kubernetes.io/docs/",
                  status: "not_started",
                },
              ],
            },
          ],
        },
        {
          id: 503,
          roadmap_id: 2005,
          phase_order: 3,
          title: "Phase 3: CI/CD Automation & Observability",
          description: "GitHub Actions workflow automation, zero-downtime releases, Prometheus & Grafana monitoring.",
          modules: [
            {
              id: 5031,
              phase_id: 503,
              module_order: 1,
              title: "Module 3.1: Automated CI/CD with GitHub Actions",
              description: "Configuring lint, test, build, and automated deployment pipelines.",
              estimated_hours: 10,
              lessons: [
                {
                  id: 50311,
                  module_id: 5031,
                  lesson_order: 1,
                  title: "Building Production CI/CD Pipelines",
                  content: "Automating branch testing, Docker image packaging, and cloud runner deployments.",
                  resource_url: "https://docs.github.com/en/actions",
                  status: "not_started",
                },
              ],
            },
          ],
        },
      ],
    };
  }

  // Default Web Dev / Core Roadmap
  return {
    id: 2001,
    club_slug: clubSlug,
    sub_club_slug: "web-dev",
    title: "Full-Stack Web Engineering 2025-2026",
    description: "Comprehensive foundational to production engineering roadmap for modern web apps using React, Node.js, and TypeScript.",
    is_active: 1,
    created_by: "SAC Faculty / Admin",
    phases: [
      {
        id: 101,
        roadmap_id: 2001,
        phase_order: 1,
        title: "Phase 1: Modern Web Foundations & DOM",
        description: "Semantic HTML5, CSS3 responsive grid/flexbox, modern ES6+ JavaScript, and Git workflows.",
        modules: [
          {
            id: 1011,
            phase_id: 101,
            module_order: 1,
            title: "Module 1.1: Git & Version Control Best Practices",
            description: "Git init, branch management, pull requests, and collaborative GitHub etiquette.",
            estimated_hours: 6,
            lessons: [
              {
                id: 10111,
                module_id: 1011,
                lesson_order: 1,
                title: "Git Basics & Commit Hygiene",
                content: "Understand commits, atomic branches, and writing meaningful commit messages for teams.",
                resource_url: "https://git-scm.com/doc",
                status: "not_started",
              },
              {
                id: 10112,
                module_id: 1011,
                lesson_order: 2,
                title: "Setting Up GitHub Classroom / Team Repo",
                content: "Create a clean repository with proper .gitignore and README documentation.",
                resource_url: "https://docs.github.com",
                status: "not_started",
              },
            ],
          },
          {
            id: 1012,
            phase_id: 101,
            module_order: 2,
            title: "Module 1.2: Modern JavaScript Deep Dive",
            description: "Promises, async/await, closures, fetch API, and TypeScript fundamentals.",
            estimated_hours: 10,
            lessons: [
              {
                id: 10121,
                module_id: 1012,
                lesson_order: 1,
                title: "ES6 Features: Destructuring, Spread, and Modules",
                content: "Master modern JavaScript syntactical conveniences and clean code modularity.",
                resource_url: "https://javascript.info",
                status: "not_started",
              },
              {
                id: 10122,
                module_id: 1012,
                lesson_order: 2,
                title: "Async Programming: Promises & Async/Await",
                content: "Handling network requests and async side effects cleanly in JS.",
                resource_url: "https://developer.mozilla.org",
                status: "not_started",
              },
            ],
          },
        ],
      },
      {
        id: 102,
        roadmap_id: 2001,
        phase_order: 2,
        title: "Phase 2: React & Component Architecture",
        description: "React 19, functional components, hooks, and Tailwind CSS.",
        modules: [
          {
            id: 1021,
            phase_id: 102,
            module_order: 1,
            title: "Module 2.1: React State & Lifecycle",
            description: "Component composition, prop drilling mitigation, and side effects.",
            estimated_hours: 12,
            lessons: [
              {
                id: 10211,
                module_id: 1021,
                lesson_order: 1,
                title: "React Component Patterns & Hooks Mastery",
                content: "useState, useEffect, useMemo, and custom hooks architecture.",
                resource_url: "https://react.dev",
                status: "not_started",
              },
            ],
          },
        ],
      },
      {
        id: 103,
        roadmap_id: 2001,
        phase_order: 3,
        title: "Phase 3: Backend APIs & Database Integration",
        description: "RESTful API construction with Node/PHP, database schemas with MySQL, and deployment.",
        modules: [
          {
            id: 1031,
            phase_id: 103,
            module_order: 1,
            title: "Module 3.1: REST API & SQL Database Design",
            description: "Writing secure endpoints, handling CORS, SQL indexing, and relationships.",
            estimated_hours: 14,
            lessons: [
              {
                id: 10311,
                module_id: 1031,
                lesson_order: 1,
                title: "Designing Scalable REST APIs & Relational Schemas",
                content: "Foreign keys, indexes, authentication middleware, and input sanitization.",
                resource_url: "https://developer.mozilla.org/en-US/docs/Learn/Server-side",
                status: "not_started",
              },
            ],
          },
        ],
      },
    ],
  };
};

interface MemberLmsProps {
  user?: StoredUser | null | undefined;
  onLogout?: (() => void) | undefined;
}

export function MemberLms({ user, onLogout }: MemberLmsProps) {
  const navigate = useNavigate();

  // Active Sidebar Navigation Tab
  const [activeTab, setActiveTab] = useState<MemberNavTab>("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core LMS Data States
  const [overview, setOverview] = useState<StudentLmsOverview | null>(null);
  const [roadmaps, setRoadmaps] = useState<LmsRoadmap[]>([]);
  const [tasks, setTasks] = useState<LmsTask[]>([]);
  const [submissions, setSubmissions] = useState<LmsTaskSubmission[]>([]);
  const [events, setEvents] = useState<LmsEventProposal[]>([]);
  const [announcements, setAnnouncements] = useState<LmsAnnouncement[]>([]);
  const [notifications, setNotifications] = useState<LmsNotification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [governance, setGovernance] = useState<ClubsGovernanceData>({
    organizers: {},
    wings: {},
    mentors: {},
    memberCounts: {},
  });

  // Modal & Interactive States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<LmsTask | null>(null);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitType, setSubmitType] = useState<"github" | "drive" | "url" | "text">("github");
  const [submitNotes, setSubmitNotes] = useState("");
  const [submittingWork, setSubmittingWork] = useState(false);

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>("all");

  // Load LMS Data
  const loadData = async () => {
    setLoading(true);
    try {
      const studentId = user?.id || overview?.user?.id || 1;
      const clubSlug = user?.club || "developers-club";

      const [overviewRes, roadmapsRes, tasksRes, subsRes, eventsRes, annRes, notifRes, govRes] =
        await Promise.all([
          fetchStudentLmsOverview(studentId),
          fetchRoadmaps({ club_slug: clubSlug, user_id: studentId, all: 1 }),
          fetchLmsTasks({ club_slug: clubSlug }),
          fetchLmsSubmissions(),
          fetchLmsEventProposals(),
          fetchLmsAnnouncements(clubSlug),
          fetchLmsNotifications(studentId),
          fetchClubsGovernance(),
        ]);

      if (overviewRes) setOverview(overviewRes);
      setRoadmaps(roadmapsRes);
      setTasks(tasksRes);
      setSubmissions(subsRes);
      setEvents(eventsRes);
      setAnnouncements(annRes);
      setNotifications(notifRes.notifications);
      setUnreadNotifsCount(notifRes.unreadCount);
      if (govRes) setGovernance(govRes);
    } catch (err) {
      console.warn("Error loading Member LMS Data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Derived Values
  const studentName =
    user?.name || overview?.user?.name || "SAC Student Member";
  const studentRoll =
    user?.rollNumber ||
    user?.roll_number ||
    overview?.user?.roll_number ||
    "23A51A05C5";
  const studentEmail =
    user?.email || overview?.user?.email || "student@adityatekkali.edu.in";
  const studentClub =
    user?.club || overview?.user?.club || "developers-club";
  const studentYear =
    user?.year ||
    user?.year_of_study ||
    overview?.user?.year_of_study ||
    "Third Year, CSE";
  const studentWing =
    (user as any)?.wing_name || (overview?.user as any)?.wing_name || "";

  // Multi-Track Specialization state for Student Member
  const [selectedTrackSlug, setSelectedTrackSlug] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(`sac_student_track_${user?.club || "developers-club"}`) || "";
    } catch {
      return "";
    }
  });
  const [showTrackSelector, setShowTrackSelector] = useState<boolean>(false);

  const clubDisplayName = useMemo(() => {
    const rawClub = studentClub || "developers-club";
    const slugMap: Record<string, string> = {
      "developers-club": "Developers Club",
      "robotics-club": "Robotics Club",
      "ai-club": "AI & Deep Learning Club",
      "cyber-security-club": "Cyber Security Club",
      "iot-club": "IoT & Embedded Systems Club",
      "cloud-devops-club": "Cloud & DevOps Club",
      "design-club": "UI/UX & Creative Club",
      "coding-club": "Competitive Coding Club",
    };
    if (slugMap[rawClub]) return slugMap[rawClub];
    return String(rawClub)
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [studentClub]);

  // Real Mentors & Organizer from DB for this club
  const currentClubMentors: LmsMentor[] = useMemo(() => {
    if (!governance.mentors || !governance.mentors[studentClub]) return [];
    return Array.isArray(governance.mentors[studentClub])
      ? governance.mentors[studentClub]
      : [];
  }, [governance.mentors, studentClub]);

  const currentClubOrganizer: ClubOrganizer | null = useMemo(() => {
    if (!governance.organizers || !governance.organizers[studentClub]) return null;
    return governance.organizers[studentClub] || null;
  }, [governance.organizers, studentClub]);

  const currentClubWings: ClubWing[] = useMemo(() => {
    if (!governance.wings || !governance.wings[studentClub]) return [];
    return Array.isArray(governance.wings[studentClub])
      ? governance.wings[studentClub]
      : [];
  }, [governance.wings, studentClub]);

  // 1. All Wings available to this student member in their club
  const availableWings: ClubWingItem[] = useMemo(() => {
    const wingsList: ClubWingItem[] = [];

    // Check live DB wings from governance first
    if (currentClubWings && Array.isArray(currentClubWings) && currentClubWings.length > 0) {
      currentClubWings.forEach((w) => {
        if (!w) return;
        const name = w.wing_name || w.wing_slug || "Technical Wing";
        const slug = w.wing_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const icon = getWingIcon(slug, name);
        wingsList.push({
          slug,
          name,
          description: w.description || `Specialized technical curriculum for ${name}.`,
          icon,
        });
      });
    }

    // Merge standard default wings for this club if not already present
    const defaultWings =
      DEFAULT_CLUB_WINGS_MAP[studentClub] ||
      DEFAULT_CLUB_WINGS_MAP["developers-club"] ||
      [];

    defaultWings.forEach((dw) => {
      if (!dw) return;
      const dwSlug = (dw.slug || "").toLowerCase();
      const dwName = (dw.name || "").toLowerCase();
      const alreadyHas = wingsList.some(
        (w) =>
          (w.slug || "").toLowerCase() === dwSlug ||
          (w.name || "").toLowerCase() === dwName
      );
      if (!alreadyHas) {
        wingsList.push(dw);
      }
    });

    return wingsList;
  }, [currentClubWings, studentClub]);

  // 2. Local completed lessons tracker for instant UI feedback & persistence across sessions
  const [localCompletedLessonIds, setLocalCompletedLessonIds] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set<number>();
    try {
      const saved = localStorage.getItem(`sac_student_completed_lessons_${user?.id || 1}`);
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  const isLessonCompleted = (lesson: LmsLesson): boolean => {
    return lesson.status === "completed" || localCompletedLessonIds.has(lesson.id);
  };

  // 3. Merged Roadmaps: Database Roadmaps enriched with Built-In Fallback Roadmaps for all wings (strictly deduplicated)
  const effectiveRoadmaps: LmsRoadmap[] = useMemo(() => {
    const list: LmsRoadmap[] = [];
    const seenSlugs = new Set<string>();
    const seenTitles = new Set<string>();

    const normalize = (str?: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    // 1. Add database roadmaps, skipping any duplicate tracks
    if (Array.isArray(roadmaps)) {
      roadmaps.forEach((rm) => {
        if (!rm) return;
        const slugKey = normalize(rm.sub_club_slug);
        const titleKey = normalize(rm.title);

        if (slugKey && seenSlugs.has(slugKey)) return;
        if (titleKey && seenTitles.has(titleKey)) return;

        if (slugKey) seenSlugs.add(slugKey);
        if (titleKey) seenTitles.add(titleKey);
        list.push(rm);
      });
    }

    // 2. Add fallback for any available wing not already represented
    if (Array.isArray(availableWings)) {
      availableWings.forEach((wing) => {
        if (!wing) return;
        const wingKey = normalize(wing.slug);
        const nameKey = normalize(wing.name);

        const alreadyHas =
          (wingKey && seenSlugs.has(wingKey)) ||
          list.some((r) => {
            const rSlug = normalize(r.sub_club_slug);
            const rTitle = normalize(r.title);
            return (wingKey && rSlug === wingKey) || (nameKey && rTitle.includes(nameKey));
          });

        if (!alreadyHas) {
          const builtin = getBuiltinRoadmapForWing(wing.slug || "web-dev", studentClub, clubDisplayName);
          if (wingKey) seenSlugs.add(wingKey);
          list.push(builtin);
        }
      });
    }

    return list;
  }, [roadmaps, availableWings, studentClub, clubDisplayName]);

  // 4. Active roadmap resolved according to student's chosen wing track
  const activeRoadmap = useMemo(() => {
    if (!effectiveRoadmaps.length) return null;
    if (selectedTrackSlug) {
      const q = selectedTrackSlug.toLowerCase().trim();
      const found = effectiveRoadmaps.find(
        (r) =>
          (r.sub_club_slug && r.sub_club_slug.toLowerCase() === q) ||
          String(r.id) === q ||
          (r.title && r.title.toLowerCase().includes(q))
      );
      if (found) return found;
    }
    return effectiveRoadmaps[0] || null;
  }, [effectiveRoadmaps, selectedTrackSlug]);

  // 5. Calculate statistics for any wing
  const getWingStats = (wingSlug: string) => {
    const q = (wingSlug || "").toLowerCase().trim();
    const rm = effectiveRoadmaps.find(
      (r) =>
        (r.sub_club_slug && r.sub_club_slug.toLowerCase() === q) ||
        (r.title && r.title.toLowerCase().includes(q))
    );
    if (!rm || !rm.phases) return { total: 6, completed: 0, pct: 0, hours: 24 };
    let total = 0;
    let completed = 0;
    let hours = 0;
    rm.phases.forEach((p) => {
      p.modules?.forEach((m) => {
        hours += m.estimated_hours || 8;
        m.lessons?.forEach((l) => {
          total++;
          if (l.status === "completed" || localCompletedLessonIds.has(l.id)) {
            completed++;
          }
        });
      });
    });
    const safeTotal = Math.max(1, total);
    const pct = total > 0 ? Math.round((completed / safeTotal) * 100) : 0;
    return { total, completed, pct, hours };
  };

  const handleSelectTrack = (trackSlug: string) => {
    const safeSlug = trackSlug || "web-dev";
    setSelectedTrackSlug(safeSlug);
    try {
      localStorage.setItem(`sac_student_track_${studentClub}`, safeSlug);
    } catch {}
    setShowTrackSelector(false);
    const targetWing = availableWings.find(
      (w) => (w.slug || "").toLowerCase() === safeSlug.toLowerCase()
    );
    toast.success(`Active Track switched to ${targetWing?.name || safeSlug}!`);
  };

  // Student's submissions indexed by task ID
  const studentSubmissionsMap = useMemo(() => {
    const map = new Map<number, LmsTaskSubmission>();
    const myId = user?.id || overview?.user?.id;
    const myRoll = String(studentRoll || "").trim().toUpperCase();

    if (Array.isArray(submissions)) {
      submissions.forEach((s) => {
        if (!s) return;
        const matchId = myId && s.student_id === myId;
        const sRoll = s.student_roll ? String(s.student_roll).trim().toUpperCase() : "";
        const matchRoll = Boolean(myRoll && sRoll && sRoll === myRoll);
        if (matchId || matchRoll) {
          map.set(s.task_id, s);
        }
      });
    }
    return map;
  }, [submissions, user?.id, overview?.user?.id, studentRoll]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === "all") return true;
      if (taskFilter === "pending") return !studentSubmissionsMap.has(t.id);
      if (taskFilter === "submitted") return studentSubmissionsMap.has(t.id);
      if (taskFilter === "high") return t.priority === "high" || t.priority === "urgent";
      return true;
    });
  }, [tasks, taskFilter, studentSubmissionsMap]);

  // Handle lesson progress toggle
  const handleToggleLesson = async (lesson: LmsLesson, moduleId?: number) => {
    if (!lesson.id) return;
    const isCurrentlyDone = isLessonCompleted(lesson);
    const nextStatus = isCurrentlyDone ? "not_started" : "completed";

    // Immediate state & local storage update for ultra-smooth UX
    setLocalCompletedLessonIds((prev) => {
      const next = new Set(prev);
      if (nextStatus === "completed") {
        next.add(lesson.id);
      } else {
        next.delete(lesson.id);
      }
      try {
        localStorage.setItem(
          `sac_student_completed_lessons_${user?.id || 1}`,
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });

    try {
      const studentId = user?.id || overview?.user?.id || 1;
      const res = await markLessonProgress({
        user_id: studentId,
        lesson_id: lesson.id,
        ...(moduleId ? { module_id: moduleId } : {}),
        status: nextStatus,
      });
      if (res.success) {
        toast.success(res.message);
        const updated = await fetchRoadmaps({
          club_slug: studentClub,
          user_id: studentId,
          all: 1,
        });
        if (updated && updated.length > 0) {
          setRoadmaps(updated);
        }
      } else {
        toast.info(res.message || "Lesson progress updated locally.");
      }
    } catch {
      // Backend error tolerated (locally saved)
    }
  };

  // Submit task work
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForSubmit) return;

    if (
      !submitUrl.trim().startsWith("http://") &&
      !submitUrl.trim().startsWith("https://")
    ) {
      toast.error(
        "Please enter a valid link starting with https:// (e.g. GitHub repo or Google Drive link)"
      );
      return;
    }

    setSubmittingWork(true);
    try {
      const studentId = user?.id || overview?.user?.id || 1;
      const res = await submitTaskWork({
        task_id: selectedTaskForSubmit.id,
        student_id: studentId,
        student_name: studentName,
        student_roll: studentRoll,
        submission_url: submitUrl.trim(),
        submission_type: submitType,
        notes: submitNotes.trim(),
      });
      if (res.success) {
        toast.success(res.message);
        setIsSubmitModalOpen(false);
        setSubmitUrl("");
        setSubmitNotes("");
        const freshSubs = await fetchLmsSubmissions();
        setSubmissions(freshSubs);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast.error(msg);
    } finally {
      setSubmittingWork(false);
    }
  };

  // Mark notifications read
  const handleMarkNotificationsRead = async () => {
    const studentId = user?.id || overview?.user?.id || 1;
    await markLmsNotificationRead(undefined, studentId);
    setUnreadNotifsCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    toast.success("All notifications marked as read");
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("sac_user");
      toast.info("Logged out of LMS portal");
      navigate({ to: "/login" });
    }
  };

  // Metrics calculation
  const computedTotalLessons = useMemo(() => {
    if (!activeRoadmap?.phases) return 0;
    return activeRoadmap.phases.reduce(
      (acc, p) => acc + (p.modules?.reduce((mAcc, m) => mAcc + (m.lessons?.length || 0), 0) || 0),
      0
    );
  }, [activeRoadmap]);

  const computedCompletedLessons = useMemo(() => {
    if (!activeRoadmap?.phases) return 0;
    return activeRoadmap.phases.reduce(
      (acc, p) =>
        acc +
        (p.modules?.reduce(
          (mAcc, m) =>
            mAcc +
            (m.lessons?.filter(
              (l) => l.status === "completed" || localCompletedLessonIds.has(l.id)
            )?.length || 0),
          0
        ) || 0),
      0
    );
  }, [activeRoadmap, localCompletedLessonIds]);

  const totalLessons = activeRoadmap?.totalLessons || computedTotalLessons || 6;
  const completedLessons = activeRoadmap?.completedLessons ?? computedCompletedLessons;
  const roadmapPct = Math.round((completedLessons / Math.max(1, totalLessons)) * 100);
  const mySubmissionsCount = studentSubmissionsMap.size;
  const approvedSubmissions = Array.from(studentSubmissionsMap.values()).filter(
    (s) => s.status === "approved"
  ).length;

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground font-sans">
      {/* ========================================================================= */}
      {/* ASIDE NAVIGATION BAR (DASHBOARD SIDEBAR) */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card/95 backdrop-blur-md transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 px-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-brand-deep text-white shadow-soft">
              <Code2 className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-black tracking-tight text-brand-deep">
                AITAM SAC
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Student Member LMS
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Aside Nav List */}
        <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto p-3 text-xs font-medium">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Learning Workspace
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab("overview");
              setIsMobileNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
              activeTab === "overview"
                ? "bg-brand-deep font-semibold text-white shadow-soft"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="size-4 shrink-0" />
            <span className="flex-1">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("roadmap");
              setIsMobileNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
              activeTab === "roadmap"
                ? "bg-brand-deep font-semibold text-white shadow-soft"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <Compass className="size-4 shrink-0" />
            <span className="flex-1">Learning Roadmap</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "roadmap"
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {completedLessons}/{totalLessons}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("tasks");
              setIsMobileNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
              activeTab === "tasks"
                ? "bg-brand-deep font-semibold text-white shadow-soft"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <FileCheck className="size-4 shrink-0" />
            <span className="flex-1">Assignments</span>
            {tasks.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "tasks"
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tasks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("submissions");
              setIsMobileNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
              activeTab === "submissions"
                ? "bg-brand-deep font-semibold text-white shadow-soft"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <FolderGit2 className="size-4 shrink-0" />
            <span className="flex-1">My Submissions</span>
            {mySubmissionsCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "submissions"
                    ? "bg-white/20 text-white"
                    : "bg-teal-500/10 text-teal-700 dark:text-teal-400"
                }`}
              >
                {mySubmissionsCount}
              </span>
            )}
          </button>

          <div className="pt-3 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Club Community
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab("events");
              setIsMobileNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
              activeTab === "events"
                ? "bg-brand-deep font-semibold text-white shadow-soft"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <Calendar className="size-4 shrink-0" />
            <span className="flex-1">Workshops & Events</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("announcements");
              setIsMobileNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
              activeTab === "announcements"
                ? "bg-brand-deep font-semibold text-white shadow-soft"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <Megaphone className="size-4 shrink-0" />
            <span className="flex-1">Announcements</span>
            {announcements.length > 0 && (
              <span className="rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 px-1.5 py-0.2 text-[10px] font-bold">
                {announcements.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("achievements");
              setIsMobileNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
              activeTab === "achievements"
                ? "bg-brand-deep font-semibold text-white shadow-soft"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <Award className="size-4 shrink-0" />
            <span className="flex-1">Credentials & Badges</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("club");
              setIsMobileNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
              activeTab === "club"
                ? "bg-brand-deep font-semibold text-white shadow-soft"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <Users className="size-4 shrink-0" />
            <span className="flex-1">Club & Mentors</span>
          </button>

          {/* Admin Backdoor ONLY for Admin users */}
          {isAdmin && (
            <div className="pt-3 border-t border-border/60 mt-3">
              <Link
                to="/admin/lms"
                className="flex w-full items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-left font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-500/20 transition-all"
              >
                <Shield className="size-4 shrink-0" />
                <span>Open Admin Portal</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Aside Bottom Actions */}
        <div className="shrink-0 mt-auto border-t border-border/80 p-3 space-y-1 bg-card/95">
          <Link
            to="/"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to SAC Home
          </Link>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileNavOpen && (
        <div
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top App Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/90 px-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground capitalize">
                  {activeTab === "overview" && "Dashboard Overview"}
                  {activeTab === "roadmap" && "Learning Roadmap & Curriculum"}
                  {activeTab === "tasks" && "Practical Tasks & Assignments"}
                  {activeTab === "submissions" && "My Project Submissions"}
                  {activeTab === "events" && "Club Workshops & Conclaves"}
                  {activeTab === "announcements" && "Club Notices & Broadcasts"}
                  {activeTab === "achievements" && "Credentials & Achievements"}
                  {activeTab === "club" && `${clubDisplayName} Leadership`}
                </h1>
                <span className="rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Member LMS
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                AITAM Student Activity Center • Enrolled: {clubDisplayName}{studentWing ? ` (${studentWing})` : ""}
              </p>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative grid size-9 place-items-center rounded-xl border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Notifications"
              >
                <Bell className="size-4.5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-4.5 place-items-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-card text-foreground animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-bold text-xs">Notifications ({notifications.length})</span>
                    {unreadNotifsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkNotificationsRead}
                        className="text-[11px] text-brand font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="mt-2 max-h-72 overflow-y-auto space-y-2 divide-y divide-border/50 text-xs">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-muted-foreground">
                        No notifications right now
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="pt-2 first:pt-0">
                          <p className="font-semibold text-foreground">{n.title}</p>
                          <p className="text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-muted-foreground/70 mt-1 block font-mono">
                            {n.created_at}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Student User Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
              <span className="size-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="font-medium text-foreground">{studentName.split(" ")[0]}</span>
              <span className="text-muted-foreground">({studentRoll})</span>
            </div>

            {/* Quick Sign Out Header Button */}
            <button
              type="button"
              onClick={handleLogoutClick}
              className="flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors shadow-2xs"
              title="Sign Out of LMS"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl">
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {/* ========================================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Welcome Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white shadow-soft md:p-8">
                <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md mb-3">
                      <Code2 className="size-3.5 text-teal-300" /> {clubDisplayName}{studentWing ? ` • ${studentWing}` : ""}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                      Welcome back, {studentName}!
                    </h2>
                    <p className="mt-1 text-xs text-white/80 md:text-sm max-w-xl leading-relaxed">
                      Your learning roadmap, task submissions, and workshop schedule are up to date. Keep pushing code and building real-world projects.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("roadmap")}
                      className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-brand-deep shadow-sm hover:brightness-105 transition-all"
                    >
                      Continue Roadmap &rarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("tasks")}
                      className="rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
                    >
                      View Assignments
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Stat Cards Ribbon */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Roadmap Progress</span>
                    <Compass className="size-4 text-brand" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">{roadmapPct}%</span>
                    <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                      {completedLessons}/{totalLessons} Lessons
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${roadmapPct}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Submissions Graded</span>
                    <FolderGit2 className="size-4 text-purple-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">
                      {approvedSubmissions} / {mySubmissionsCount}
                    </span>
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      Evaluated
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground font-medium">
                    Average Score: 95/100
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Pending Tasks</span>
                    <FileCheck className="size-4 text-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">
                      {Math.max(0, tasks.length - mySubmissionsCount)}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      To Submit
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground font-medium">
                    Next deadline: Oct 15
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Club Conclaves</span>
                    <Calendar className="size-4 text-blue-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">
                      {events.filter((e) => e.status === "approved").length}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Upcoming
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground font-medium">
                    Attendance: Verified
                  </p>
                </div>
              </div>

              {/* 2-Column Overview Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Current Learning Track Preview */}
                  {/* Current Learning Track Preview & Wing Switcher */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/80">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <Compass className="size-3" /> Active Wing Roadmap
                          </span>
                          <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                            {roadmapPct}% Completed ({completedLessons}/{totalLessons} Lessons)
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          {activeRoadmap?.title || "Full-Stack Web Engineering"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {activeRoadmap?.description || "Select and follow your specialized wing curriculum."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("roadmap")}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline shrink-0"
                      >
                        Full Syllabus &rarr;
                      </button>
                    </div>

                    {/* Quick Wing Switcher Pills on Overview Tab */}
                    {availableWings.length > 1 && (
                      <div className="py-3 border-b border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Switch Active Wing Roadmap:
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {availableWings.length} Wings Available
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {availableWings.map((w) => {
                            const isCurrent =
                              (activeRoadmap?.sub_club_slug || "").toLowerCase() === (w.slug || "").toLowerCase();
                            const WingIcon = w.icon;
                            const stats = getWingStats(w.slug);
                            return (
                              <button
                                key={w.slug || w.name}
                                type="button"
                                onClick={() => handleSelectTrack(w.slug)}
                                className={`group flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border ${
                                  isCurrent
                                    ? "bg-brand text-white border-brand shadow-xs"
                                    : "bg-muted/30 text-foreground border-border/70 hover:bg-card hover:border-brand/50"
                                }`}
                              >
                                <WingIcon className="size-3.5" />
                                <span>{(w.name || "Wing").replace(" Wing", "")}</span>
                                <span
                                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                                    isCurrent ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {stats.pct}%
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 space-y-3">
                      {activeRoadmap?.phases?.[0]?.modules?.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-xl border border-border/70 bg-muted/20 p-4 transition-all hover:bg-muted/40"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{m.title}</span>
                            <span className="rounded bg-section px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {m.estimated_hours}h est.
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {m.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Tasks Widget */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center justify-between pb-4 border-b border-border/80">
                      <div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <FileCheck className="size-4.5 text-brand" /> Pending Assignments
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Submit your source code or repository links for evaluation
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("tasks")}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        View All ({tasks.length}) &rarr;
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {tasks.slice(0, 2).map((t) => {
                        const sub = studentSubmissionsMap.get(t.id);
                        return (
                          <div
                            key={t.id}
                            className="rounded-xl border border-border/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20"
                          >
                            <div>
                              <span className="rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                {t.priority} Priority
                              </span>
                              <h4 className="text-sm font-bold text-foreground mt-1">{t.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Due: {t.due_date || "Open"} • Max: {t.max_score} pts
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaskForSubmit(t);
                                if (sub) {
                                  setSubmitUrl(sub.submission_url);
                                  setSubmitType(sub.submission_type);
                                  setSubmitNotes(sub.notes || "");
                                } else {
                                  setSubmitUrl("");
                                  setSubmitNotes("");
                                }
                                setIsSubmitModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:brightness-110 shrink-0"
                            >
                              {sub ? "Update Link" : "Submit Work"} <ArrowRight className="size-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Latest Notices Card */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center justify-between pb-4 border-b border-border/80">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Megaphone className="size-4.5 text-brand" /> Club Notices
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("announcements")}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        All Notices &rarr;
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {announcements.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-6">
                          No notices posted yet
                        </p>
                      ) : (
                        announcements.slice(0, 3).map((a) => (
                          <div
                            key={a.id}
                            className="rounded-xl border border-border/60 bg-muted/20 p-3.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">{a.title}</span>
                              {a.priority === "pinned" && (
                                <span className="rounded bg-brand/10 text-brand px-1.5 py-0.2 text-[9px] font-bold uppercase">
                                  Pinned
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {a.content}
                            </p>
                            <span className="text-[10px] text-muted-foreground/70 mt-2 block font-medium">
                              By {a.author_name} ({a.author_role})
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Mentorship & Leadership Card */}
                  {(currentClubMentors.length > 0 || currentClubOrganizer) && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border/80">
                        <GraduationCap className="size-4.5 text-brand" /> Club Leadership & Mentors
                      </h3>
                      <div className="mt-4 space-y-3">
                        {currentClubMentors.map((m) => (
                          <div
                            key={m.id || m.name}
                            className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 border border-border/50"
                          >
                            <div className="grid size-10 place-items-center rounded-full bg-blue-500/10 text-blue-600 font-bold text-sm">
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{m.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {m.designation || m.mentor_role || "Faculty Mentor"}
                                {m.department ? ` • ${m.department}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}

                        {currentClubOrganizer && (
                          <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 border border-border/50">
                            <div className={`grid size-10 place-items-center rounded-full font-bold text-sm text-white bg-gradient-to-br ${getClubTheme(studentClub).gradient} shadow-2xs`}>
                              {currentClubOrganizer.organizer_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {currentClubOrganizer.organizer_name} ({currentClubOrganizer.organizer_roll_number})
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${getClubTheme(studentClub).badge}`}>
                                  <Crown className="size-2.5" /> Student Organizer
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  • {currentClubOrganizer.organizer_year || "Club Head"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LEARNING ROADMAP */}
          {/* ========================================================================= */}
          {activeTab === "roadmap" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* VIEW MODE 1: ALL WINGS COMPARISON GRID */}
              {showTrackSelector ? (
                <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card animate-in fade-in duration-200">
                  <div className="text-center max-w-2xl mx-auto mb-8">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-3">
                      <Layers className="size-3.5" /> All Specialization Tracks
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                      Compare All Wing Curricula
                    </h2>
                    <p className="mt-2 text-xs md:text-sm text-muted-foreground">
                      Each wing in {clubDisplayName} provides a dedicated multi-phase learning path. Choose any wing to make it your primary learning track.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {effectiveRoadmaps.map((rm) => {
                      const isSelected = activeRoadmap?.id === rm.id;
                      const subSlug = (rm.sub_club_slug || "").toLowerCase();
                      const TrackIcon = getWingIcon(subSlug, rm.title);
                      const totalMods = rm.phases?.reduce((acc, p) => acc + (p.modules?.length || 0), 0) || 0;
                      const totalHours =
                        rm.phases?.reduce(
                          (acc, p) =>
                            acc + (p.modules?.reduce((mAcc, m) => mAcc + (m.estimated_hours || 0), 0) || 0),
                          0
                        ) || 24;
                      const stats = getWingStats(subSlug);

                      return (
                        <div
                          key={rm.id}
                          onClick={() => handleSelectTrack(rm.sub_club_slug || String(rm.id))}
                          className={`group relative flex flex-col justify-between rounded-2xl border-2 p-6 transition-all cursor-pointer hover:shadow-lg ${
                            isSelected
                              ? "border-brand bg-brand/5 shadow-soft ring-2 ring-brand/20"
                              : "border-border/80 bg-section/40 hover:border-brand/40 hover:bg-card"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div
                                className={`grid size-12 place-items-center rounded-2xl transition-transform group-hover:scale-105 ${
                                  isSelected ? "bg-brand text-white shadow-2xs" : "bg-brand/10 text-brand"
                                }`}
                              >
                                <TrackIcon className="size-6" />
                              </div>
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                  <Check className="size-3" /> Active Track
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                              {rm.sub_club_slug ? rm.sub_club_slug.replace("-", " ") : "Specialization"}
                            </span>
                            <h3 className="text-base font-bold text-foreground group-hover:text-brand transition-colors mt-0.5">
                              {rm.title}
                            </h3>
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                              {rm.description || "Master core principles, modern patterns, and practical industry workflows."}
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-border/60">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 font-medium">
                              <span>{rm.phases?.length || 0} Phases • {totalMods} Modules</span>
                              <span>~{totalHours}h duration</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                              <span className="text-muted-foreground">Completion Progress:</span>
                              <span className="text-brand">{stats.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
                              <div
                                className="h-full bg-brand transition-all duration-500 rounded-full"
                                style={{ width: `${stats.pct}%` }}
                              />
                            </div>
                            <button
                              type="button"
                              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all shadow-2xs ${
                                isSelected
                                  ? "bg-brand text-white"
                                  : "bg-card border border-border group-hover:border-brand group-hover:bg-brand group-hover:text-white"
                              }`}
                            >
                              <span>{isSelected ? "Continue This Track" : "Choose Specialization"}</span>
                              <ArrowRight className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => setShowTrackSelector(false)}
                      className="text-xs font-bold text-brand hover:underline underline-offset-4"
                    >
                      &larr; Return to Active Roadmap ({activeRoadmap?.title})
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW MODE 2: ACTIVE WING ROADMAP CURRICULUM */
                <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card">
                  {/* Active Roadmap Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                          <Compass className="size-3" />{" "}
                          {activeRoadmap?.sub_club_slug
                            ? activeRoadmap.sub_club_slug.toUpperCase().replace("-", " ") + " WING"
                            : "ACTIVE SPECIALIZATION"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 px-2.5 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="size-3" /> Fully Open Track
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowTrackSelector(true)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-brand/40 transition-colors shadow-2xs"
                        >
                          <ArrowUpDown className="size-3 text-brand" />
                          <span>Switch Wing ({availableWings.length} Wings)</span>
                        </button>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                        <Compass className="size-5 md:size-6 text-brand shrink-0" />
                        <span>{activeRoadmap?.title || "Full-Stack Web Engineering"}</span>
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                        {activeRoadmap?.description ||
                          "Check off completed lessons to update your permanent learning progress."}
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                      <span className="text-xs font-bold text-brand bg-brand/10 px-3.5 py-1.5 rounded-full shadow-2xs">
                        {completedLessons} of {totalLessons} Lessons Completed ({roadmapPct}%)
                      </span>
                      <div className="w-36 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-teal-500 transition-all duration-500 rounded-full"
                          style={{ width: `${roadmapPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phases List */}
                  <div className="mt-6 space-y-6">
                    {activeRoadmap?.phases?.map((phase) => (
                      <div
                        key={phase.id}
                        className="rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/60">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                              Phase {phase.phase_order}
                            </span>
                            <h4 className="text-base font-bold text-foreground mt-0.5">
                              {phase.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {phase.description}
                            </p>
                          </div>
                          <span className="self-start sm:self-center rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground shrink-0">
                            {phase.modules?.length || 0} Modules
                          </span>
                        </div>

                        {/* Modules inside Phase */}
                        <div className="mt-4 space-y-4">
                          {phase.modules?.map((mod) => (
                            <div
                              key={mod.id}
                              className="rounded-xl border border-border/70 bg-muted/20 p-4 transition-all hover:border-border"
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-bold text-foreground">{mod.title}</h5>
                                <span className="text-xs text-muted-foreground font-medium bg-section px-2 py-0.5 rounded border border-border/60">
                                  {mod.estimated_hours || 8}h duration
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>

                              {/* Lessons Checklist */}
                              <div className="mt-3 space-y-2 pt-3 border-t border-border/50">
                                {mod.lessons?.map((les) => {
                                  const done = isLessonCompleted(les);
                                  return (
                                    <div
                                      key={les.id}
                                      className={`flex items-center justify-between rounded-lg p-2.5 border text-xs transition-colors ${
                                        done
                                          ? "bg-teal-500/5 border-teal-500/20"
                                          : "bg-card border-border/60 hover:border-brand/40"
                                      }`}
                                    >
                                      <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                                        <input
                                          type="checkbox"
                                          checked={done}
                                          onChange={() => handleToggleLesson(les, mod.id)}
                                          className="size-4 rounded border-border accent-teal-600"
                                        />
                                        <span
                                          className={`font-medium ${
                                            done
                                              ? "line-through text-muted-foreground"
                                              : "text-foreground"
                                          }`}
                                        >
                                          {les.title}
                                        </span>
                                      </label>

                                      {les.resource_url && (
                                        <a
                                          href={les.resource_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 rounded bg-section px-2 py-1 text-[11px] font-semibold text-brand hover:underline border border-border/70 shrink-0 ml-2"
                                        >
                                          Docs <ExternalLink className="size-3" />
                                        </a>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ASSIGNMENTS & TASKS */}
          {/* ========================================================================= */}
          {activeTab === "tasks" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <FileCheck className="size-5 text-brand" /> Practical Track Assignments
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Hands-on coding challenges and real-world project tasks assigned by club leads.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setTaskFilter("all")}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        taskFilter === "all" ? "bg-card text-brand shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      All ({tasks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("pending")}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        taskFilter === "pending" ? "bg-card text-brand shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("submitted")}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        taskFilter === "submitted" ? "bg-card text-brand shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Submitted
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No assignments found matching filter.
                    </div>
                  ) : (
                    filteredTasks.map((t) => {
                      const userSub = studentSubmissionsMap.get(t.id);
                      return (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-brand/30 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {t.sub_club_slug && (
                                  <span className="rounded bg-brand/10 text-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                    {t.sub_club_slug.replace("-", " ")}
                                  </span>
                                )}
                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    t.priority === "high" || t.priority === "urgent"
                                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                      : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                  }`}
                                >
                                  {t.priority} Priority
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                  Due: {t.due_date || "No deadline"}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-foreground">{t.title}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {t.description}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="rounded-lg bg-section px-3 py-1 text-xs font-bold text-brand">
                                {t.max_score} Points
                              </span>
                            </div>
                          </div>

                          {/* Instructions block */}
                          {t.instructions && (
                            <div className="mt-3 rounded-xl bg-muted/30 p-3 text-xs text-foreground/90 border border-border/50">
                              <p className="font-bold text-brand mb-1">Assignment Instructions:</p>
                              <p className="whitespace-pre-line text-muted-foreground">
                                {t.instructions}
                              </p>
                            </div>
                          )}

                          {/* Action footer */}
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                            <div>
                              {userSub ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                      userSub.status === "approved"
                                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-400"
                                        : userSub.status === "changes_requested"
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                        : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                    }`}
                                  >
                                    Status: {userSub.status.toUpperCase()}
                                  </span>
                                  {userSub.score !== null && (
                                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                      Score: {userSub.score}/{t.max_score}
                                      {userSub.reviewer_name && (
                                        <span className="text-[10px] text-muted-foreground font-normal ml-1">
                                          (by {userSub.reviewer_name})
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                  <Clock className="size-3.5" /> Pending Submission
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaskForSubmit(t);
                                if (userSub) {
                                  setSubmitUrl(userSub.submission_url);
                                  setSubmitType(userSub.submission_type);
                                  setSubmitNotes(userSub.notes || "");
                                } else {
                                  setSubmitUrl("");
                                  setSubmitNotes("");
                                }
                                setIsSubmitModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-brand-deep px-4 py-2 text-xs font-semibold text-white shadow-soft hover:brightness-110"
                            >
                              {userSub ? "Update Submission Link" : "Submit Assignment"} &rarr;
                            </button>
                          </div>

                          {/* Review feedback */}
                          {userSub?.feedback && (
                            <div className="mt-3 rounded-lg bg-teal-500/10 border border-teal-500/30 p-3 text-xs">
                              <span className="font-bold text-teal-800 dark:text-teal-300 block mb-0.5">
                                Evaluator Feedback {userSub.reviewer_name ? `(${userSub.reviewer_name})` : ""}:
                              </span>
                              <p className="text-teal-900 dark:text-teal-100">{userSub.feedback}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MY SUBMISSIONS */}
          {/* ========================================================================= */}
          {activeTab === "submissions" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="pb-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FolderGit2 className="size-5 text-brand" /> My Submitted Projects & Tasks
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    History of all assignments submitted by you, review status, and evaluation notes.
                  </p>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="py-3 px-4 rounded-l-lg">Task / Assignment</th>
                        <th className="py-3 px-4">Repository / Project Link</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4 rounded-r-lg">Review Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {Array.from(studentSubmissionsMap.values()).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            You have not submitted any assignments yet.
                          </td>
                        </tr>
                      ) : (
                        Array.from(studentSubmissionsMap.values()).map((sub) => (
                          <tr key={sub.id} className="hover:bg-muted/30">
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {sub.task_title || `Assignment #${sub.task_id}`}
                            </td>
                            <td className="py-3.5 px-4">
                              <a
                                href={sub.submission_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline max-w-[220px] truncate"
                              >
                                {sub.submission_type.toUpperCase()}: {sub.submission_url}{" "}
                                <ExternalLink className="size-3 shrink-0" />
                              </a>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  sub.status === "approved"
                                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-400"
                                    : sub.status === "changes_requested"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                    : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                }`}
                              >
                                {sub.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {sub.score !== null ? (
                                <div>
                                  <span className="text-teal-600 dark:text-teal-400 font-bold">{sub.score} pts</span>
                                  {sub.reviewer_name && (
                                    <div className="text-[10px] text-muted-foreground font-normal">
                                      by {sub.reviewer_name}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground font-normal">Pending Evaluation</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground">
                              {sub.feedback ? (
                                <div className="space-y-0.5">
                                  <p className="text-foreground">{sub.feedback}</p>
                                  {sub.reviewed_at && (
                                    <span className="text-[10px] text-muted-foreground block">
                                      Verified on {new Date(sub.reviewed_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                "Awaiting evaluation by mentor / organizer"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: EVENTS & WORKSHOPS */}
          {/* ========================================================================= */}
          {activeTab === "events" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="pb-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Calendar className="size-5 text-brand" /> Upcoming Club Workshops & Conclaves
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Participate in hands-on technical bootcamps, hackathons, and guest seminars.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {events.filter((e) => e.status === "approved").length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">
                      No upcoming club workshops scheduled at this time.
                    </div>
                  ) : (
                    events
                      .filter((e) => e.status === "approved")
                      .map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-brand/40 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <span className="rounded bg-brand/10 text-brand px-2 py-0.5 font-bold">
                                {ev.club || "Developers Club"}
                              </span>
                              <span>{ev.dates || "Upcoming"}</span>
                            </div>
                            <h4 className="text-base font-bold text-foreground">{ev.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                              {ev.about || "Interactive workshop organized by the club track."}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Venue: <strong className="text-foreground">{ev.location || "SAC Hub"}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1 text-teal-600 font-bold">
                              <CheckCircle2 className="size-3.5" /> Enrolled
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: ANNOUNCEMENTS */}
          {/* ========================================================================= */}
          {activeTab === "announcements" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="pb-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="size-5 text-brand" /> Club Notices & Official Broadcasts
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official updates from Faculty Mentors and Student Track Leads.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {announcements.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No notices currently published for this club.
                    </div>
                  ) : (
                    announcements.map((a) => (
                      <div
                        key={a.id}
                        className={`rounded-2xl border p-5 transition-all ${
                          a.priority === "pinned"
                            ? "border-brand/40 bg-brand/5 shadow-xs"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                            {a.title}
                          </h4>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              a.priority === "pinned"
                                ? "bg-brand text-white"
                                : a.priority === "urgent"
                                ? "bg-rose-500 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {a.priority}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 mt-2 leading-relaxed whitespace-pre-line">
                          {a.content}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            Posted by: <strong>{a.author_name}</strong> ({a.author_role})
                          </span>
                          <span className="font-mono">{a.created_at}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: ACHIEVEMENTS & CREDENTIALS */}
          {/* ========================================================================= */}
          {activeTab === "achievements" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-10 sm:p-14 shadow-card text-center relative overflow-hidden">
                <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
                  <div className="size-16 rounded-2xl bg-brand/10 border border-brand/20 grid place-items-center text-brand mb-4 shadow-sm">
                    <Award className="size-8" />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 mb-3">
                    <Sparkles className="size-3.5" /> Coming Soon
                  </span>

                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    Track Credentials & Skill Badges
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Verified club credentials, milestone certifications, and wing skill badges are currently in development. You will be able to earn and showcase verified badges here soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: CLUB & MENTOR INFO */}
          {/* ========================================================================= */}
          {activeTab === "club" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="pb-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Users className="size-5 text-brand" /> {clubDisplayName} — Profile & Leadership
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Student Activity Center technical club details, wing leads, and official mentor registry.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Registry Info */}
                  <div
                    className={`rounded-2xl border border-border bg-muted/20 p-5 space-y-3 ${
                      currentClubMentors.length === 0 && !currentClubOrganizer ? "md:col-span-2" : ""
                    }`}
                  >
                    <h4 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
                      My Student Record
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Full Name:</span>
                        <span className="font-bold text-foreground">{studentName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Roll Number:</span>
                        <span className="font-mono font-bold text-brand">{studentRoll}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">College Email:</span>
                        <span className="font-mono text-foreground">{studentEmail}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Year / Branch:</span>
                        <span className="font-medium text-foreground">{studentYear}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Enrolled Club:</span>
                        <span className="font-semibold text-foreground">{clubDisplayName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Active Track:</span>
                        <span className="font-semibold text-teal-600">{studentWing || "General Member"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Club Leadership */}
                  {(currentClubMentors.length > 0 || currentClubOrganizer) ? (
                    <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
                        Club Mentorship & Contacts
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        {currentClubMentors.map((m) => (
                          <div key={m.id || m.name} className="rounded-lg bg-card p-3 border border-border/60">
                            <span className="text-[10px] uppercase font-bold text-brand block">Faculty Mentor</span>
                            <p className="font-bold text-foreground text-sm">{m.name}</p>
                            <p className="text-muted-foreground text-[11px]">
                              {m.designation || m.mentor_role || "Faculty Mentor"}
                              {m.department ? `, ${m.department}` : ""}
                            </p>
                            {m.email && <p className="text-muted-foreground text-[11px] mt-0.5">{m.email}</p>}
                          </div>
                        ))}
                        {currentClubOrganizer && (
                          <div className="rounded-lg bg-card p-3 border border-border/60">
                            <span className={`text-[10px] uppercase font-bold block ${getClubTheme(studentClub).text}`}>
                              Student Organizer
                            </span>
                            <p className="font-bold text-foreground text-sm">
                              {currentClubOrganizer.organizer_name} ({currentClubOrganizer.organizer_roll_number})
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                              {currentClubOrganizer.organizer_year || "Club Head"}
                            </p>
                            {currentClubOrganizer.organizer_email && (
                              <p className="text-muted-foreground text-[11px] mt-0.5">
                                {currentClubOrganizer.organizer_email}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Sub-Wings & Wing Leads */}
                {currentClubWings.length > 0 && (
                  <div className="mt-6 border-t border-border pt-6">
                    <h4 className="text-sm font-bold text-foreground mb-3">
                      Active Sub-Wings & Wing Leads
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {currentClubWings.map((w) => (
                        <div key={w.id || w.wing_name} className="rounded-xl border border-border bg-muted/20 p-4">
                          <p className="text-xs font-bold text-foreground">{w.wing_name}</p>
                          {w.lead_name ? (
                            <div className="mt-2 text-[11px]">
                              <span className="text-[10px] uppercase font-bold text-teal-600 block">Wing Lead</span>
                              <p className="font-semibold text-foreground">{w.lead_name}</p>
                              {w.lead_roll_number && (
                                <p className="font-mono text-muted-foreground text-[10px]">{w.lead_roll_number}</p>
                              )}
                              {w.lead_email && (
                                <p className="text-muted-foreground text-[10px] truncate">{w.lead_email}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground mt-1 italic">No lead appointed</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT ASSIGNMENT WORK */}
      {/* ========================================================================= */}
      {isSubmitModalOpen && selectedTaskForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-card text-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Submit Assignment</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {selectedTaskForSubmit.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Submission Type
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSubmitType("github")}
                    className={`rounded-lg py-2 border text-center transition-all ${
                      submitType === "github"
                        ? "bg-brand text-white border-brand shadow-xs"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    GitHub Repo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitType("drive")}
                    className={`rounded-lg py-2 border text-center transition-all ${
                      submitType === "drive"
                        ? "bg-brand text-white border-brand shadow-xs"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    Google Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitType("url")}
                    className={`rounded-lg py-2 border text-center transition-all ${
                      submitType === "url"
                        ? "bg-brand text-white border-brand shadow-xs"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    Live Web URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Submission URL (Must start with https://)
                </label>
                <input
                  type="url"
                  required
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  placeholder={
                    submitType === "github"
                      ? "https://github.com/username/project-repo"
                      : submitType === "drive"
                      ? "https://drive.google.com/file/d/..."
                      : "https://my-app.vercel.app"
                  }
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Notes / Explanation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="Key features built, challenges solved, or testing instructions..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWork}
                  className="rounded-full bg-brand-deep px-6 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 disabled:opacity-50"
                >
                  {submittingWork ? "Submitting..." : "Confirm & Submit Work"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
