-- SAC (Student Activity Center) Database Schema for XAMPP MySQL
-- Aditya Institute of Technology and Management (AITAM)

CREATE DATABASE IF NOT EXISTS `sac_db` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `sac_db`;

-- -------------------------------------------------------------
-- 1. Users Table (Authentication for Students, Club Leads & Admins)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `roll_number` VARCHAR(30) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'lead', 'admin') NOT NULL DEFAULT 'student',
  `year_of_study` VARCHAR(50) DEFAULT NULL,
  `club` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_roll_number` (`roll_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. Applications Table (Submitted via SAC Join Form)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `roll_number` VARCHAR(30) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `year_of_study` VARCHAR(50) NOT NULL,
  `club_slug` VARCHAR(100) NOT NULL,
  `club_name` VARCHAR(100) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_app_email` (`email`),
  INDEX `idx_app_roll` (`roll_number`),
  INDEX `idx_app_club` (`club_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. Default Seed Accounts
-- Administrator credentials:
-- 1) LMS Administrator: admin@adityatekkali.edu.in | Password: password123
-- 2) CMS Administrator: cms@adityatekkali.edu.in   | Password: password123
-- -------------------------------------------------------------
INSERT INTO `users` (`name`, `email`, `roll_number`, `password`, `role`, `year_of_study`, `club`)
VALUES 
('SAC LMS Administrator', 'admin@adityatekkali.edu.in', 'SACADMIN01', '$2y$10$S35JhFE/spz7A4vlOXcw0OfVlCdvqRkpQDsW7AV.euNuU6MfXx7jW', 'admin', 'Faculty / Admin', 'all'),
('SAC CMS Administrator', 'cms@adityatekkali.edu.in', 'SACCMS01', '$2y$10$S35JhFE/spz7A4vlOXcw0OfVlCdvqRkpQDsW7AV.euNuU6MfXx7jW', 'admin', 'Faculty / Admin', 'all')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- -------------------------------------------------------------
-- 4. CMS Content Table (Landing page sections: hero, stats, about, announcement, testimonials)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cms_content` (
  `section_key` VARCHAR(50) PRIMARY KEY,
  `content_json` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 5. CMS Events Table (Campus workshops, bootcamps & competitions)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cms_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `dates` VARCHAR(100) NOT NULL,
  `time` VARCHAR(100) DEFAULT '09:30 AM - 04:30 PM',
  `mode` ENUM('Offline', 'Online', 'Hybrid') NOT NULL DEFAULT 'Offline',
  `price` VARCHAR(50) NOT NULL DEFAULT 'Free',
  `club` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `organizer` VARCHAR(255) NOT NULL,
  `about` TEXT NOT NULL,
  `highlights` JSON DEFAULT NULL,
  `prerequisites` TEXT DEFAULT NULL,
  `mentor` VARCHAR(100) DEFAULT NULL,
  `mentor_role` VARCHAR(150) DEFAULT NULL,
  `color` VARCHAR(50) DEFAULT 'var(--club-teal)',
  `icon` VARCHAR(50) DEFAULT 'Code2',
  `image` VARCHAR(255) DEFAULT '/images.jpg',
  `status` ENUM('approved', 'pending', 'draft') NOT NULL DEFAULT 'approved',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_event_slug` (`slug`),
  INDEX `idx_event_status` (`status`),
  INDEX `idx_event_club` (`club`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 6. Initial Seed Data for CMS Content
-- -------------------------------------------------------------
INSERT INTO `cms_content` (`section_key`, `content_json`)
VALUES 
('hero', '{"headline": "Prepares students for success in a changing world.", "tagline": "Learn . Build . Innovate", "subheadline": "The apex student body of AITAM — 8 student clubs, industry-led workshops, events and real client projects."}'),
('announcement', '{"enabled": true, "badge": "New Notice", "message": "Registrations open for upcoming technical bootcamps & SAC Club Memberships!", "link": "/join", "linkText": "Apply Now"}'),
('about', '{"title": "About SAC", "description": "Student Activity Center is the apex student body of AITAM, responsible for formulating the policies pertaining to all the non-academic affairs, resulting in a holistic workspace and culture for students to explore various real time technologies, entrepreneurial activities, alumni interactions etc., laying various paths for students to shape them out into a better individual."}'),
('stats', '[{"label": "EVENTS", "value": 15, "max": 40}, {"label": "WEBINARS", "value": 14, "max": 40}, {"label": "WORKSHOPS", "value": 34, "max": 40}, {"label": "TRAINED STUDENTS", "value": 2766, "max": 3000}]'),
('testimonials', '[{"quote": "Learning and implementing is my way of gaining knowledge and that is core value of SAC which motivates me to work more.", "name": "L. Prameela", "role": "Robotics Trainee"}, {"quote": "I am very much excited to learn new things, and I can invest myself very confidently into SAC.", "name": "Ch. Meghana", "role": "Web Designing Trainee"}, {"quote": "SAC gave me my first real project experience. Building with a team here taught me more than any textbook could.", "name": "K. Harsha Vardhan", "role": "Developers Club"}, {"quote": "The workshops are hands-on from day one. I walked in curious about robotics and walked out building my own bot.", "name": "S. Divya Sri", "role": "Robotics Trainee"}]'),
('mentors', '[]'),
('clubs', '[{"name":"Cultural Club","slug":"cultural-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Cultural Club is the creative heartbeat of AITAM SAC. It nurtures performers, anchors, designers and storytellers, giving every student a stage to discover confidence and expression.","activities":["Annual cultural fest and talent hunts","Dance, music and drama troupes","Stage management and anchoring training","Inter-college cultural competitions"],"tagline":"We amuse the world","desc":"Cultural club aims developing young multimedia specialists.","icon":"Music","color":"var(--club-pink)","image":""},{"name":"Automobile Club","slug":"automobile-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Automobile Club combines design thinking and hands-on workforce skills to build real machines. Members work on karts, EV prototypes and engine systems from concept to track.","activities":["Go-kart and e-vehicle build projects","Engine teardown and assembly workshops","Vehicle dynamics and design sessions","National level automotive competitions"],"tagline":"We move the world","desc":"Automobile club combines design and workforce to create innovations.","icon":"Car","color":"var(--club-rust)","image":""},{"name":"Developers Club","slug":"developers-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Developers Club moulds a critical thinker in every novice programmer. From first commit to shipped client product, members learn by building real software with real deadlines.","activities":["Full-stack web and app development bootcamps","AI/ML and data analytics project tracks","Open-source contribution drives","Hackathons and client project delivery"],"tagline":"We develop the world","desc":"Developer club moulds critical thinker in every novice programmer.","icon":"Code2","color":"var(--club-teal)","image":""},{"name":"Salesforce Club","slug":"salesforce-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Salesforce Club brings companies and customers together. Members train for globally recognised Salesforce certifications and build CRM solutions used by real organisations.","activities":["Salesforce Administrator certification training","Apex and Lightning development labs","Trailhead superbadge challenges","Industry meetups with Salesforce professionals"],"tagline":"We connect the world","desc":"We bring companies and customers together.","icon":"Cloud","color":"var(--club-orange)","image":""},{"name":"Robotics Club","slug":"robotics-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Robotics Club expertises students on robots and automation. Members move from sensors and microcontrollers to fully autonomous machines within a single academic year.","activities":["Arduino and embedded systems workshops","Line-follower and combat bot builds","IoT sensor and automation projects","Robotics expos and tech fests"],"tagline":"We automate the world","desc":"Robotics club expertises students on robots and automation.","icon":"Bot","color":"var(--club-crimson)","image":""},{"name":"Design Club","slug":"design-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Design Club crafts the visual identity of every SAC initiative. From event posters to product interfaces, members learn design as a discipline, not decoration.","activities":["Brand identity and poster design sprints","UI/UX fundamentals and Figma labs","Motion graphics and video editing","Design support for every SAC event"],"tagline":"We shape the world","desc":"Design club crafts the visual identity of every SAC initiative.","icon":"PenTool","color":"var(--club-plum)","image":""},{"name":"Security Club","slug":"security-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Security Club explores ethical hacking and secure engineering. Members break systems responsibly so they can learn how to build ones that hold up.","activities":["Ethical hacking and CTF practice sessions","Network and web application security labs","Secure coding reviews","Cyber awareness drives on campus"],"tagline":"We protect the world","desc":"Security club explores ethical hacking and secure engineering.","icon":"ShieldCheck","color":"var(--club-indigo)","image":""},{"name":"Photography Club","slug":"photography-club","mentor":"","mentorRole":"","studentOrganizer":"","studentOrganizerRole":"","studentMentor":"","studentMentorRole":"","about":"The Photography Club documents every campus moment through the lens. Members master composition, lighting and post-production while building a professional portfolio.","activities":["Campus event coverage and photo walks","Lighting, composition and editing workshops","Short film and documentary production","Annual photo exhibition"],"tagline":"We frame the world","desc":"Photography club documents every campus moment through the lens.","icon":"Camera","color":"var(--club-gold)","image":""}]')
ON DUPLICATE KEY UPDATE `content_json` = VALUES(`content_json`);

-- -------------------------------------------------------------
-- 7. Initial Seed Data for CMS Events
-- -------------------------------------------------------------
INSERT INTO `cms_events` (`title`, `slug`, `dates`, `time`, `mode`, `price`, `club`, `location`, `organizer`, `about`, `highlights`, `prerequisites`, `mentor`, `mentor_role`, `color`, `icon`, `status`)
VALUES
(
  'Salesforce Administrator Level - I',
  'salesforce-administrator-level-1',
  '2025-09-15 to 2025-09-20',
  '09:00 AM - 04:00 PM',
  'Offline',
  'Free',
  'Salesforce Club',
  'SAC Lab 2, AITAM Campus',
  'AITAM Student Activity Center & Salesforce Admin Group Srikakulam',
  'An intensive 6-day hands-on bootcamp designed to prepare students for the Salesforce Certified Administrator exam. Participants will gain practical experience in configuring Salesforce applications, managing users, defining security & access controls, and building custom reports & dashboards.',
  '["Official Trailhead Superbadge guidance", "Hands-on org configuration and data management labs", "Mock certification exams & study vouchers", "Direct interaction with Salesforce Certified Professionals"]',
  'Basic knowledge of databases and web applications. Open to all branches.',
  'S. Lahari Chowdary',
  'Mentor — Salesforce',
  'var(--club-orange)',
  'Cloud',
  'approved'
),
(
  'Arduino Sensors and Programming Foundations',
  'arduino-sensors-programming-foundations',
  '2025-08-11 to 2025-08-16',
  '10:00 AM - 04:30 PM',
  'Offline',
  'Free',
  'Robotics Club',
  'Robotics & IoT Innovation Hub, AITAM',
  'AITAM SAC Robotics Club',
  'A practical 1-week workshop focusing on hardware fundamentals, sensor interfacing, and micro-controller C/C++ programming. Students will work with ultrasonic, infrared, and temperature sensors to build real automation prototypes.',
  '["Individual hardware component kits provided", "Breadboard circuit prototyping & debugging", "Real-time sensor data logging & actuation", "Team project presentation on Day 6"]',
  'Basic C programming knowledge recommended.',
  'B. Sandeep',
  'Mentor — Robotics & IoT',
  'var(--club-crimson)',
  'Bot',
  'approved'
),
(
  'Full Stack Web Development Bootcamp',
  'full-stack-web-development-bootcamp',
  '2025-07-28 to 2025-08-02',
  '09:30 AM - 05:00 PM',
  'Offline',
  'Free',
  'Developers Club',
  'SAC Advanced Computing Lab, AITAM',
  'AITAM SAC Developers Club',
  'Learn modern full-stack web development from scratch using React, Node.js, Express, and Tailwind CSS. Shipped products at the end of the workshop will be hosted live on cloud platforms.',
  '["Building RESTful APIs with Node & Express", "Modern UI component design with React & Tailwind CSS", "Git & GitHub workflow best practices", "Live deployment to Vercel and Cloudflare"]',
  'HTML/CSS and JavaScript basics.',
  'Saisateeshwara Reddy',
  'Mentor — Web & App Development',
  'var(--club-teal)',
  'Code2',
  'approved'
),
(
  'Ethical Hacking & Cyber Security Workshop',
  'ethical-hacking-cyber-security-workshop',
  '2025-10-05 to 2025-10-10',
  '10:00 AM - 04:00 PM',
  'Offline',
  'Free',
  'Security Club',
  'Cyber Security Lab, AITAM',
  'AITAM SAC Security Club',
  'Dive deep into web vulnerability assessment, penetration testing, Kali Linux tools, and network defense strategies. Learn ethical hacking techniques to protect digital assets against cyber threats.',
  '["Hands-on CTF (Capture The Flag) competitions", "OWASP Top 10 vulnerability exploration", "Network packet analysis using Wireshark", "Certificate of participation upon completion"]',
  'Basic networking and operating system concepts.',
  'Girish Kumar D',
  'Incharge S.A.C (Technical)',
  'var(--club-indigo)',
  'ShieldCheck',
  'approved'
)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- -------------------------------------------------------------
-- 8. LMS: Executive Council Table (Central Leadership Body)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `executive_council` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `designation` VARCHAR(60) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `roll_number` VARCHAR(30) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `branch_year` VARCHAR(100) NOT NULL,
  `tenure` VARCHAR(50) NOT NULL DEFAULT '2025-2026',
  `responsibilities` TEXT NOT NULL,
  `photo_url` VARCHAR(255) DEFAULT NULL,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ec_desig` (`designation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 9. LMS: Faculty Mentors Table (Clubs Mentors & Incharges)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mentors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `department` VARCHAR(100) NOT NULL,
  `designation` VARCHAR(150) NOT NULL,
  `mentor_role` VARCHAR(150) NOT NULL,
  `club_slug` VARCHAR(100) DEFAULT NULL,
  `photo_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mentor_club` (`club_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 10. LMS: Club Organizers (Student Incharge Managing Entire Club)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `club_organizers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `club_slug` VARCHAR(100) NOT NULL UNIQUE,
  `organizer_name` VARCHAR(100) NOT NULL,
  `organizer_roll_number` VARCHAR(30) NOT NULL,
  `organizer_email` VARCHAR(255) NOT NULL,
  `organizer_year` VARCHAR(50) NOT NULL,
  `organizer_phone` VARCHAR(20) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_org_club` (`club_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 11. LMS: Club Sub-Wings & Student Leads Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `club_wings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `club_slug` VARCHAR(100) NOT NULL,
  `wing_name` VARCHAR(100) NOT NULL,
  `wing_slug` VARCHAR(100) NOT NULL,
  `lead_name` VARCHAR(100) DEFAULT NULL,
  `lead_roll_number` VARCHAR(30) DEFAULT NULL,
  `lead_email` VARCHAR(255) DEFAULT NULL,
  `lead_year` VARCHAR(50) DEFAULT NULL,
  `lead_phone` VARCHAR(20) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_wing_club` (`club_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 12. LMS: Enrolled Club Members Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `club_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `roll_number` VARCHAR(30) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `year_of_study` VARCHAR(50) NOT NULL,
  `department` VARCHAR(50) DEFAULT 'CSE',
  `club_slug` VARCHAR(100) NOT NULL,
  `wing_name` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('active', 'pending', 'suspended', 'alumni') NOT NULL DEFAULT 'active',
  `phone` VARCHAR(20) DEFAULT NULL,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cm_roll` (`roll_number`),
  INDEX `idx_cm_club` (`club_slug`),
  INDEX `idx_cm_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 13. Executive Council Table (Populated by Admin)
-- -------------------------------------------------------------
-- Council officers will be added by the LMS Administrator.


-- -------------------------------------------------------------
-- 14. Faculty Mentors Table (Populated by Admin)
-- -------------------------------------------------------------
-- Mentors will be added by the LMS Administrator.

-- -------------------------------------------------------------
-- 15. Club Organizers (Overall Club Student Heads)
-- -------------------------------------------------------------
-- Student Organizers will be appointed/added by the Administrator.


-- -------------------------------------------------------------
-- 16. Club Sub-Wings & Student Leads (Populated by Admin)
-- -------------------------------------------------------------
-- Sub-wings and student leads will be added by the Administrator.


-- -------------------------------------------------------------
-- 17. Enrolled Club Members Table (Populated by Admin / Joins)
-- -------------------------------------------------------------
-- Student members will be registered or added by the LMS Administrator.

-- -------------------------------------------------------------
-- 18. LMS: Roles Definition Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_key` VARCHAR(50) NOT NULL UNIQUE,
  `role_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lms_roles` (`role_key`, `role_name`, `description`)
VALUES
('admin', 'Platform / LMS Administrator', 'Full platform authority over all clubs, users, approvals, roles, and settings'),
('mentor', 'Faculty Mentor', 'Official faculty supervisor guiding clubs, approving events, and overseeing tasks'),
('executive_lead', 'Executive Lead', 'Senior student council member monitoring cross-club progress and coordination'),
('club_organizer', 'Club Organizer', 'Apex student lead heading an entire main club and all its sub-clubs'),
('club_lead', 'Club Lead', 'Student track lead managing a specific sub-club wing and evaluating member tasks'),
('student', 'Student Member', 'Enrolled club member learning from roadmaps and submitting assignments')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- -------------------------------------------------------------
-- 19. LMS: User Role Assignments (Multi-Role Scoped Support)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_user_roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `role_key` VARCHAR(50) NOT NULL,
  `club_slug` VARCHAR(100) DEFAULT NULL,
  `sub_club_slug` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `assigned_by` VARCHAR(100) DEFAULT 'System',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ur_user` (`user_id`),
  INDEX `idx_ur_role` (`role_key`),
  INDEX `idx_ur_club` (`club_slug`),
  INDEX `idx_ur_subclub` (`sub_club_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 20. LMS: Roadmaps, Phases, Modules & Lessons
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_roadmaps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `club_slug` VARCHAR(100) NOT NULL,
  `sub_club_slug` VARCHAR(100) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(100) DEFAULT 'Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rm_club` (`club_slug`),
  INDEX `idx_rm_subclub` (`sub_club_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lms_roadmap_phases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `roadmap_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `phase_order` INT NOT NULL DEFAULT 1,
  INDEX `idx_ph_rm` (`roadmap_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lms_roadmap_modules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phase_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `estimated_hours` INT DEFAULT 10,
  `module_order` INT NOT NULL DEFAULT 1,
  `is_locked_by_default` TINYINT(1) NOT NULL DEFAULT 0,
  INDEX `idx_mod_ph` (`phase_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lms_roadmap_lessons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `module_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT DEFAULT NULL,
  `resource_url` VARCHAR(500) DEFAULT NULL,
  `lesson_order` INT NOT NULL DEFAULT 1,
  INDEX `idx_les_mod` (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 21. LMS: Member Progress Tracking
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_member_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `module_id` INT DEFAULT NULL,
  `lesson_id` INT DEFAULT NULL,
  `status` ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mp_user` (`user_id`),
  INDEX `idx_mp_mod` (`module_id`),
  INDEX `idx_mp_les` (`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 22. LMS: Tasks and Assignments
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `club_slug` VARCHAR(100) NOT NULL,
  `sub_club_slug` VARCHAR(100) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `instructions` TEXT DEFAULT NULL,
  `due_date` DATE DEFAULT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `allow_github` TINYINT(1) NOT NULL DEFAULT 1,
  `allow_drive` TINYINT(1) NOT NULL DEFAULT 1,
  `allow_url` TINYINT(1) NOT NULL DEFAULT 1,
  `max_score` INT NOT NULL DEFAULT 100,
  `created_by` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('active', 'archived', 'draft') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_task_club` (`club_slug`),
  INDEX `idx_task_subclub` (`sub_club_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 23. LMS: Task Submissions and Grading
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_task_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `student_name` VARCHAR(100) DEFAULT NULL,
  `student_roll` VARCHAR(30) DEFAULT NULL,
  `submission_url` VARCHAR(500) NOT NULL,
  `submission_type` ENUM('github', 'drive', 'url', 'text') NOT NULL DEFAULT 'github',
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('submitted', 'under_review', 'changes_requested', 'approved', 'rejected') NOT NULL DEFAULT 'submitted',
  `score` INT DEFAULT NULL,
  `feedback` TEXT DEFAULT NULL,
  `reviewer_name` VARCHAR(100) DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sub_task` (`task_id`),
  INDEX `idx_sub_stu` (`student_id`),
  INDEX `idx_sub_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 24. LMS: Multi-Tier Event Approval History
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_event_approvals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `event_title` VARCHAR(255) NOT NULL,
  `club_slug` VARCHAR(100) NOT NULL,
  `proposer_name` VARCHAR(100) NOT NULL,
  `stage` ENUM('submitted_mentor', 'approved_mentor', 'submitted_admin', 'approved_admin', 'changes_requested', 'rejected') NOT NULL DEFAULT 'submitted_mentor',
  `reviewer_name` VARCHAR(100) DEFAULT NULL,
  `reviewer_role` VARCHAR(50) DEFAULT NULL,
  `comments` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ea_event` (`event_id`),
  INDEX `idx_ea_stage` (`stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 25. LMS: Announcements
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `club_slug` VARCHAR(100) NOT NULL,
  `sub_club_slug` VARCHAR(100) DEFAULT NULL,
  `author_name` VARCHAR(100) NOT NULL,
  `author_role` VARCHAR(50) NOT NULL DEFAULT 'Club Lead',
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `priority` ENUM('normal', 'urgent', 'pinned') NOT NULL DEFAULT 'normal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ann_club` (`club_slug`),
  INDEX `idx_ann_subclub` (`sub_club_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 26. LMS: Notifications
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `link_url` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `notification_type` VARCHAR(50) NOT NULL DEFAULT 'general',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_user` (`user_id`),
  INDEX `idx_notif_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 27. LMS: Audit Logs
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lms_audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_name` VARCHAR(100) NOT NULL,
  `actor_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(50) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_al_action` (`action`),
  INDEX `idx_al_entity` (`entity_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 28. Initial Seed Data: LMS Roadmaps & Tasks
-- -------------------------------------------------------------
INSERT INTO `lms_roadmaps` (`id`, `club_slug`, `sub_club_slug`, `title`, `description`, `created_by`)
VALUES
(1, 'developers-club', 'web-dev', 'Full-Stack Web Engineering 2025-2026', 'Comprehensive foundational to production engineering roadmap for modern web apps using React, Node.js, and TypeScript.', 'Saisateeshwara Reddy'),
(2, 'developers-club', 'app-dev', 'Cross-Platform Mobile App Architecture', 'Master Flutter and React Native cross-platform mobile development from UI widgets to state management and APIs.', 'Saisateeshwara Reddy'),
(3, 'robotics-club', 'arduino-embedded', 'Embedded Systems & Microcontroller Robotics', 'Learn C/C++ hardware logic, sensor interfacing with AVR and ESP32, and build autonomous robotics systems.', 'B. Sandeep')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `lms_roadmap_phases` (`id`, `roadmap_id`, `title`, `description`, `phase_order`)
VALUES
(1, 1, 'Phase 1: Modern Web Foundations & DOM', 'Semantic HTML5, CSS3 responsive grid/flexbox, modern ES6+ JavaScript, and Git workflows.', 1),
(2, 1, 'Phase 2: React & Component Architecture', 'React 19, functional components, hooks (useState, useEffect, custom hooks), and Tailwind CSS.', 2),
(3, 1, 'Phase 3: Backend APIs & Database Integration', 'RESTful API construction with Node/PHP, database schemas with MySQL, authentication, and deployment.', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `lms_roadmap_modules` (`id`, `phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`)
VALUES
(1, 1, 'Module 1.1: Git & Version Control Best Practices', 'Git init, branch management, pull requests, and collaborative GitHub repository etiquette.', 6, 1, 0),
(2, 1, 'Module 1.2: Modern JavaScript Deep Dive', 'Promises, async/await, closures, fetch API, and TypeScript fundamentals.', 10, 2, 0),
(3, 2, 'Module 2.1: React State & Lifecycle', 'Component composition, prop drilling mitigation, and side-effect handling with TanStack Query.', 12, 1, 0),
(4, 2, 'Module 2.2: Responsive UI with Tailwind CSS', 'Building modern accessible UIs with design tokens, animations, and dark/light palettes.', 8, 2, 0),
(5, 3, 'Module 3.1: REST API & SQL Database Design', 'Writing secure endpoints, handling CORS, SQL indexing, and database relationships.', 14, 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `lms_roadmap_lessons` (`id`, `module_id`, `title`, `content`, `resource_url`, `lesson_order`)
VALUES
(1, 1, 'Git Basics & Commit Hygiene', 'Understand commits, atomic branches, and writing meaningful commit messages for teams.', 'https://git-scm.com/doc', 1),
(2, 1, 'Setting Up GitHub Classroom / Team Repo', 'Create a clean repository with proper .gitignore and README documentation.', 'https://docs.github.com', 2),
(3, 2, 'ES6 Features: Destructuring, Spread, and Modules', 'Master modern JavaScript syntactical conveniences and clean code modularity.', 'https://javascript.info', 1),
(4, 2, 'Async Programming: Promises & Async/Await', 'Handling network requests and async side effects cleanly in JS.', 'https://developer.mozilla.org', 2),
(5, 3, 'Thinking in React Components', 'Break down UI designs into modular, reusable React functional components.', 'https://react.dev', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `lms_tasks` (`id`, `club_slug`, `sub_club_slug`, `title`, `description`, `instructions`, `due_date`, `priority`, `allow_github`, `allow_drive`, `allow_url`, `max_score`, `created_by`, `status`)
VALUES
(
  1,
  'developers-club',
  'web-dev',
  'Task 1: Responsive Portfolio Landing Page',
  'Build and host a responsive personal developer portfolio showcasing your skills, projects, and contact links.',
  '1. Use semantic HTML and modern CSS (Tailwind CSS or Vanilla CSS).\n2. Must be 100% responsive on mobile, tablet, and desktop.\n3. Push your source code to GitHub and host live on GitHub Pages, Vercel, or Netlify.\n4. Submit your GitHub repository link and live URL.',
  '2026-10-15',
  'high',
  1, 1, 1, 100,
  'T. Vinay (Web Dev Lead)',
  'active'
),
(
  2,
  'developers-club',
  'web-dev',
  'Task 2: Interactive Task Manager with LocalStorage',
  'Create a functional todo and task tracking application with status filters and persistent storage.',
  '1. Users should be able to add, edit, delete, and toggle task completion.\n2. Store state in localStorage so tasks persist across page reloads.\n3. Add clean toast notifications for user interactions.\n4. Submit your GitHub repository URL.',
  '2026-10-25',
  'medium',
  1, 1, 1, 100,
  'T. Vinay (Web Dev Lead)',
  'active'
),
(
  3,
  'robotics-club',
  'arduino-embedded',
  'Task 1: Arduino Ultrasonic Obstacle Sensor Simulation',
  'Simulate an obstacle-avoiding bot sensor circuit in Tinkercad or Wokwi and write the micro-controller logic.',
  '1. Wire an HC-SR04 ultrasonic distance sensor with Arduino Uno.\n2. Write code to trigger distance threshold alarms under 15cm.\n3. Submit your Tinkercad/Wokwi circuit share link and code repository.',
  '2026-10-20',
  'high',
  1, 1, 1, 100,
  'K. Tarun (Robotics Lead)',
  'active'
)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Submissions will be populated dynamically as enrolled students submit practical work.

INSERT INTO `lms_announcements` (`club_slug`, `sub_club_slug`, `author_name`, `author_role`, `title`, `content`, `priority`)
VALUES
('developers-club', 'web-dev', 'T. Vinay', 'Web Dev Lead', 'Weekly Code Review Session this Friday', 'Join us in SAC Advanced Computing Lab this Friday at 4:30 PM for code reviews on Task 1 and live Q&A.', 'pinned'),
('developers-club', NULL, 'K. Harsha Vardhan', 'Club Organizer', 'Welcome to SAC Developers Club 2025-26', 'All enrolled members are requested to complete Phase 1 lessons on the SAC LMS roadmap before the semester bootcamp.', 'normal'),
('robotics-club', 'arduino-embedded', 'K. Tarun', 'Robotics Lead', 'Hardware Kits Available at Innovation Hub', 'Members can collect their Arduino prototyping kits from SAC Lab 3 between 10 AM - 1 PM on Saturday.', 'urgent');

INSERT INTO `lms_notifications` (`user_id`, `title`, `message`, `link_url`, `is_read`, `notification_type`)
VALUES
(2, 'Task Submission Approved', 'Your submission for Task 1: Responsive Portfolio Landing Page has been approved with 95/100 points!', '/lms', 0, 'task'),
(2, 'New Task Assigned', 'Task 2: Interactive Task Manager with LocalStorage has been assigned by T. Vinay.', '/lms', 0, 'task'),
(2, 'Welcome to SAC LMS', 'Welcome to the Student Activity Center Learning Management System. Check out your club roadmap to get started.', '/lms', 1, 'general');

INSERT INTO `lms_audit_logs` (`actor_name`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`)
VALUES
('SAC CMS Administrator', 'Platform Admin', 'SEED_INIT', 'LMS_SYSTEM', '1', 'Initial LMS schemas, roadmaps, and initial roles initialized successfully.'),
('T. Vinay', 'Club Lead', 'SUBMISSION_EVALUATED', 'TASK_SUBMISSION', '1', 'Approved submission for Anusha Patnaik (22A51A0501) on Task 1 with score 95.');



