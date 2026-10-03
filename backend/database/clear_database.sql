-- =============================================================
-- SAC (Student Activity Center) Database Reset & Clean Script
-- Aditya Institute of Technology and Management (AITAM)
-- Database: sac_db
-- =============================================================

USE `sac_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Wipe all operational LMS data
TRUNCATE TABLE `lms_task_submissions`;
TRUNCATE TABLE `lms_tasks`;
TRUNCATE TABLE `lms_roadmap_lessons`;
TRUNCATE TABLE `lms_roadmap_modules`;
TRUNCATE TABLE `lms_roadmap_phases`;
TRUNCATE TABLE `lms_roadmaps`;
TRUNCATE TABLE `lms_member_progress`;
TRUNCATE TABLE `lms_user_roles`;
TRUNCATE TABLE `lms_announcements`;
TRUNCATE TABLE `lms_notifications`;
TRUNCATE TABLE `lms_audit_logs`;
TRUNCATE TABLE `lms_event_approvals`;

-- 2. Wipe club governance, members, leads, organizers, mentors, and council
TRUNCATE TABLE `club_members`;
TRUNCATE TABLE `club_wings`;
TRUNCATE TABLE `club_organizers`;
TRUNCATE TABLE `mentors`;
TRUNCATE TABLE `executive_council`;
TRUNCATE TABLE `applications`;

-- 3. Wipe events
TRUNCATE TABLE `cms_events`;

-- 4. Wipe users table
TRUNCATE TABLE `users`;

-- 5. Wipe and reset roles table
TRUNCATE TABLE `lms_roles`;

INSERT INTO `lms_roles` (`role_key`, `role_name`, `description`) VALUES
('admin', 'Platform / LMS Administrator', 'Full platform authority over all clubs, users, approvals, roles, and settings'),
('mentor', '1. Faculty Mentor', 'Institutional faculty supervisor guiding clubs, approving events, and overseeing tasks'),
('club_organizer', '2. Club Student Organiser', 'Apex student lead heading an entire main club and all its sub-clubs'),
('club_lead', '3. Club Wing Lead', 'Student track lead managing a specific sub-club wing and evaluating member tasks'),
('student', '4. Club Member', 'Enrolled club member learning from roadmaps and submitting assignments');

-- 6. Insert clean master Admin accounts
-- LMS Administrator: admin@adityatekkali.edu.in | Password: password123
-- CMS Administrator: cms@adityatekkali.edu.in   | Password: password123
INSERT INTO `users` (`name`, `email`, `roll_number`, `password`, `role`, `year_of_study`, `club`) VALUES
('SAC LMS Administrator', 'admin@adityatekkali.edu.in', 'SACADMIN01', '$2y$10$S35JhFE/spz7A4vlOXcw0OfVlCdvqRkpQDsW7AV.euNuU6MfXx7jW', 'admin', 'Faculty / Admin', 'all'),
('SAC CMS Administrator', 'cms@adityatekkali.edu.in', 'SACCMS01', '$2y$10$S35JhFE/spz7A4vlOXcw0OfVlCdvqRkpQDsW7AV.euNuU6MfXx7jW', 'admin', 'Faculty / Admin', 'all');

-- 7. Seed standard Club Wings (Wings open to all student members)
INSERT INTO `club_wings` (`club_slug`, `wing_name`, `wing_slug`, `description`) VALUES
('developers-club', 'Web Development Wing', 'web-dev', 'Full-stack web application engineering covering HTML5, CSS3, modern JavaScript/TypeScript, React 19, and Node.js APIs.'),
('developers-club', 'Mobile App Development Wing', 'app-dev', 'Cross-platform native mobile applications with Flutter, Dart, state management, and Firebase cloud integrations.'),
('developers-club', 'Game Development Wing', 'game-dev', '2D and 3D game engines, physics simulations, shaders, and interactive gameplay mechanics using Unity and C#.'),
('developers-club', 'AI & Machine Learning Wing', 'ai-dev', 'Machine learning algorithms, deep neural network training, computer vision models, and applied GenAI.'),
('developers-club', 'Cloud & DevOps Wing', 'cloud-dev', 'Containerization with Docker, Kubernetes clusters, CI/CD automated deployment pipelines, and cloud hosting.');

-- 8. Seed Default Roadmaps for all 5 Wings
INSERT INTO `lms_roadmaps` (`id`, `club_slug`, `sub_club_slug`, `title`, `description`, `created_by`, `is_active`) VALUES
(1, 'developers-club', 'web-dev', 'Full-Stack Web Engineering 2025-2026', 'Comprehensive foundational to production engineering roadmap for modern web apps using React, Node.js, and TypeScript.', 'SAC Faculty / Admin', 1),
(2, 'developers-club', 'app-dev', 'Mobile App Development (Flutter & Android)', 'Cross-platform mobile application development with Flutter, Dart, state management, and Firebase cloud integrations.', 'SAC Faculty / Admin', 1),
(3, 'developers-club', 'game-dev', 'Game Development & Interactive Simulation (Unity/C#)', '2D and 3D game mechanics, physics simulation, C# scripting, shaders, and level architecture with Unity engine.', 'SAC Faculty / Admin', 1),
(4, 'developers-club', 'ai-dev', 'AI & Machine Learning Engineering', 'Applied machine learning algorithms, deep neural network training, computer vision models, and applied GenAI.', 'SAC Faculty / Admin', 1),
(5, 'developers-club', 'cloud-dev', 'Cloud Architecture & DevOps Engineering', 'Containerization with Docker, Kubernetes clusters, CI/CD automated deployment pipelines, and cloud hosting.', 'SAC Faculty / Admin', 1);

-- Web Dev Phases & Modules
INSERT INTO `lms_roadmap_phases` (`id`, `roadmap_id`, `title`, `description`, `phase_order`) VALUES
(1, 1, 'Phase 1: Modern Web Foundations & DOM', 'Semantic HTML5, CSS3 responsive grid/flexbox, modern ES6+ JavaScript, and Git workflows.', 1),
(2, 1, 'Phase 2: React & Component Architecture', 'React 19, functional components, hooks, and Tailwind CSS.', 2),
(3, 1, 'Phase 3: Backend APIs & Database Integration', 'RESTful API construction with Node/PHP, database schemas with MySQL, and deployment.', 3);

INSERT INTO `lms_roadmap_modules` (`id`, `phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
(1, 1, 'Module 1.1: Git & Version Control Best Practices', 'Git init, branch management, pull requests, and collaborative GitHub etiquette.', 6, 1, 0),
(2, 1, 'Module 1.2: Modern JavaScript Deep Dive', 'Promises, async/await, closures, fetch API, and TypeScript fundamentals.', 10, 2, 0),
(3, 2, 'Module 2.1: React State & Lifecycle', 'Component composition, prop drilling mitigation, and side effects.', 12, 1, 0),
(4, 3, 'Module 3.1: REST API & SQL Database Design', 'Writing secure endpoints, handling CORS, SQL indexing, and relationships.', 14, 1, 0);

INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
(1, 'Git Basics & Commit Hygiene', 'Understand commits, atomic branches, and writing meaningful commit messages for teams.', 'https://git-scm.com/doc', 1),
(1, 'Setting Up GitHub Classroom / Team Repo', 'Create a clean repository with proper .gitignore and README documentation.', 'https://docs.github.com', 2),
(2, 'ES6 Features: Destructuring, Spread, and Modules', 'Master modern JavaScript syntactical conveniences and clean code modularity.', 'https://javascript.info', 1),
(2, 'Async Programming: Promises & Async/Await', 'Handling network requests and async side effects cleanly in JS.', 'https://developer.mozilla.org', 2);

-- App Dev Phases & Modules
INSERT INTO `lms_roadmap_phases` (`id`, `roadmap_id`, `title`, `description`, `phase_order`) VALUES
(4, 2, 'Phase 1: Dart Fundamentals & Widget Trees', 'Dart language semantics, null safety, OOP, and building basic Flutter widget layouts.', 1),
(5, 2, 'Phase 2: State Management & Cloud Services', 'Provider, Riverpod, REST API integration, and Firebase authentication & databases.', 2);

INSERT INTO `lms_roadmap_modules` (`id`, `phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
(5, 4, 'Module 1.1: Dart Language & OOP Mastery', 'Variables, control flow, functions, async programming, and classes.', 8, 1, 0),
(6, 4, 'Module 1.2: Flutter UI & Interactive Widgets', 'Scaffold, Column, Row, ListView, Custom Paint, and Material 3 design.', 12, 2, 0),
(7, 5, 'Module 2.1: Modern State Architecture', 'Managing app state cleanly using Provider and Riverpod.', 10, 1, 0);

INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
(5, 'Dart Language Fundamentals & Sound Null Safety', 'Variables, control flow, functions, records, and class inheritance in Dart.', 'https://dart.dev/guides', 1),
(6, 'Flutter Core Widgets & Layout Engine', 'Mastering Container, Flex, Expanded, Stack, and responsive constraints.', 'https://docs.flutter.dev/ui', 1);

-- Game Dev Phases & Modules
INSERT INTO `lms_roadmap_phases` (`id`, `roadmap_id`, `title`, `description`, `phase_order`) VALUES
(6, 3, 'Phase 1: Game Math, Physics & C# Fundamentals', 'Vectors, coordinate geometry, C# event architecture, and Unity physics collisions.', 1),
(7, 3, 'Phase 2: Gameplay Mechanics & Audio Integration', 'Character controllers, AI pathfinding, camera systems, particle effects, and sound design.', 2);

INSERT INTO `lms_roadmap_modules` (`id`, `phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
(8, 6, 'Module 1.1: C# Scripting & Object Lifecycle', 'Awake, Start, Update, Coroutines, and game object instantiation.', 8, 1, 0),
(9, 6, 'Module 1.2: Rigidbody & Collision Physics', 'Colliders, Raycasting, physics materials, and trigger event listeners.', 10, 2, 0);

INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
(8, 'Unity Component Model & C# Scripting Basics', 'MonoBehaviour lifecycle methods, transforms, and game loop optimization.', 'https://docs.unity3d.com/Manual/', 1),
(9, '2D/3D Rigidbody Physics & Collisions', 'Simulating forces, impulses, velocity clamps, and trigger callback systems.', 'https://learn.unity.com/', 1);

-- AI Dev Phases & Modules
INSERT INTO `lms_roadmap_phases` (`id`, `roadmap_id`, `title`, `description`, `phase_order`) VALUES
(8, 4, 'Phase 1: Python for Data Science & Math Foundations', 'NumPy vectorized arrays, pandas dataframes, linear algebra, and data visualization.', 1),
(9, 4, 'Phase 2: Classical Machine Learning & Scikit-Learn', 'Supervised regression, classification models, cross-validation, and feature pipelines.', 2);

INSERT INTO `lms_roadmap_modules` (`id`, `phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
(10, 8, 'Module 1.1: NumPy, Pandas & Vectorized Operations', 'Array indexing, broadcasting, data cleaning, and statistical aggregations.', 8, 1, 0),
(11, 9, 'Module 2.1: Supervised Learning & Model Evaluation', 'Linear & Logistic Regression, Decision Trees, Random Forests, and ROC-AUC curves.', 10, 1, 0);

INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
(10, 'NumPy Array Computing & Vectorized Algebra', 'Matrix dot products, broadcasting rules, and high-performance slicing.', 'https://numpy.org/doc/', 1),
(11, 'Building Predictive Pipelines with Scikit-Learn', 'Train-test splitting, cross-validation, preprocessing scalers, and metric reporting.', 'https://scikit-learn.org/stable/', 1);

-- Cloud Dev Phases & Modules
INSERT INTO `lms_roadmap_phases` (`id`, `roadmap_id`, `title`, `description`, `phase_order`) VALUES
(10, 5, 'Phase 1: Linux CLI & Containerization with Docker', 'Linux system administration, bash scripting, Docker container lifecycle, and images.', 1),
(11, 5, 'Phase 2: Kubernetes Orchestration & Cloud Infrastructure', 'Kubernetes pods, services, ingress controllers, config maps, and cloud IAM.', 2);

INSERT INTO `lms_roadmap_modules` (`id`, `phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
(12, 10, 'Module 1.1: Linux Shell & System Administration', 'File permissions, process management, bash scripting, and SSH key security.', 8, 1, 0),
(13, 11, 'Module 2.1: Kubernetes Core Objects & Networking', 'Pods, Deployments, Services, ClusterIP, NodePort, and LoadBalancers.', 12, 1, 0);

INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
(12, 'Linux Command-Line Power User Skills', 'Bash pipelines, text processing with sed/awk, and system service configuration.', 'https://ubuntu.com/tutorials', 1),
(13, 'Deploying Containerized Apps on Kubernetes', 'Writing deployment manifests, pod replication, health checks, and service mesh.', 'https://kubernetes.io/docs/', 1);

-- 9. Reset CMS Content to clean initial sections
TRUNCATE TABLE `cms_content`;

INSERT INTO `cms_content` (`section_key`, `content_json`) VALUES
('hero', '{"headline": "Prepares students for success in a changing world.", "tagline": "Learn . Build . Innovate", "subheadline": "The apex student body of AITAM — 8 student clubs, industry-led workshops, events and real client projects."}'),
('announcement', '{"enabled": true, "badge": "New Notice", "message": "Registrations open for upcoming technical bootcamps & SAC Club Memberships!", "link": "/join", "linkText": "Apply Now"}'),
('about', '{"title": "About SAC", "description": "Student Activity Center is the apex student body of AITAM, responsible for formulating the policies pertaining to all the non-academic affairs, resulting in a holistic workspace and culture for students to explore various real time technologies, entrepreneurial activities, alumni interactions etc."}'),
('stats', '[{"label": "EVENTS", "value": 0, "max": 40}, {"label": "WEBINARS", "value": 0, "max": 40}, {"label": "WORKSHOPS", "value": 0, "max": 40}, {"label": "TRAINED STUDENTS", "value": 0, "max": 3000}]'),
('testimonials', '[]'),
('mentors', '[]'),
('clubs', '[{"name":"Cultural Club","slug":"cultural-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Cultural Club is the creative heartbeat of AITAM SAC.","activities":["Annual cultural fest and talent hunts","Dance, music and drama troupes"],"tagline":"We amuse the world","desc":"Cultural club aims developing young multimedia specialists.","icon":"Music","color":"var(--club-pink)","image":""},{"name":"Automobile Club","slug":"automobile-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Automobile Club combines design thinking and hands-on workforce skills to build real machines.","activities":["Go-kart and e-vehicle build projects","Engine teardown workshops"],"tagline":"We move the world","desc":"Automobile club combines design and workforce to create innovations.","icon":"Car","color":"var(--club-rust)","image":""},{"name":"Developers Club","slug":"developers-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Developers Club moulds a critical thinker in every novice programmer.","activities":["Full-stack web and app development bootcamps","AI/ML project tracks"],"tagline":"We develop the world","desc":"Developer club moulds critical thinker in every novice programmer.","icon":"Code2","color":"var(--club-teal)","image":""},{"name":"Salesforce Club","slug":"salesforce-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Salesforce Club brings companies and customers together.","activities":["Salesforce Administrator certification training","Trailhead superbadge challenges"],"tagline":"We connect the world","desc":"We bring companies and customers together.","icon":"Cloud","color":"var(--club-orange)","image":""},{"name":"Robotics Club","slug":"robotics-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Robotics Club expertises students on robots and automation.","activities":["Arduino and embedded systems workshops","Line-follower and combat bot builds"],"tagline":"We automate the world","desc":"Robotics club expertises students on robots and automation.","icon":"Bot","color":"var(--club-crimson)","image":""},{"name":"Design Club","slug":"design-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Design Club crafts the visual identity of every SAC initiative.","activities":["Brand identity and poster design sprints","UI/UX fundamentals and Figma labs"],"tagline":"We shape the world","desc":"Design club crafts the visual identity of every SAC initiative.","icon":"PenTool","color":"var(--club-plum)","image":""},{"name":"Security Club","slug":"security-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Security Club explores ethical hacking and secure engineering.","activities":["Ethical hacking and CTF practice sessions","Network security labs"],"tagline":"We protect the world","desc":"Security club explores ethical hacking and secure engineering.","icon":"ShieldCheck","color":"var(--club-indigo)","image":""},{"name":"Photography Club","slug":"photography-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Photography Club documents every campus moment through the lens.","activities":["Campus event coverage and photo walks","Editing workshops"],"tagline":"We frame the world","desc":"Photography club documents every campus moment through the lens.","icon":"Camera","color":"var(--club-gold)","image":""}]');

SET FOREIGN_KEY_CHECKS = 1;

-- Finished: All operational data deleted. Clean database ready for fresh testing!
