<?php
// backend/api/clear_database.php
// Script to completely clear all operational data and reset to a clean database

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $pdo = getDbConnection();
    
    // Disable foreign key constraints during truncate
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    $tablesToTruncate = [
        'lms_task_submissions',
        'lms_tasks',
        'lms_roadmap_lessons',
        'lms_roadmap_modules',
        'lms_roadmap_phases',
        'lms_roadmaps',
        'lms_member_progress',
        'lms_user_roles',
        'lms_announcements',
        'lms_notifications',
        'lms_audit_logs',
        'lms_event_approvals',
        'club_members',
        'club_wings',
        'club_organizers',
        'mentors',
        'executive_council',
        'applications',
        'cms_events',
        'users',
        'lms_roles',
        'cms_content',
    ];

    $cleared = [];
    foreach ($tablesToTruncate as $tbl) {
        try {
            $pdo->exec("TRUNCATE TABLE `$tbl`");
            $cleared[] = $tbl;
        } catch (Exception $e) {
            // If table doesn't exist yet, ignore
            $cleared[] = "$tbl (skipped/not found)";
        }
    }

    // 1. Re-insert core role definitions
    $pdo->exec("
        INSERT INTO `lms_roles` (`role_key`, `role_name`, `description`) VALUES
        ('admin', 'Platform / LMS Administrator', 'Full platform authority over all clubs, users, approvals, roles, and settings'),
        ('mentor', 'Faculty Mentor', 'Official faculty supervisor guiding clubs, approving events, and overseeing tasks'),
        ('executive_lead', 'Executive Lead', 'Senior student council member monitoring cross-club progress and coordination'),
        ('club_organizer', 'Club Organizer', 'Apex student lead heading an entire main club and all its sub-clubs'),
        ('club_lead', 'Club Lead', 'Student track lead managing a specific sub-club wing and evaluating member tasks'),
        ('student', 'Student Member', 'Enrolled club member learning from roadmaps and submitting assignments');
    ");

    // 2. Re-insert only the two required platform administrator accounts
    $adminPasswordHash = password_hash('password123', PASSWORD_BCRYPT);
    $pdo->prepare("
        INSERT INTO `users` (`name`, `email`, `roll_number`, `password`, `role`, `year_of_study`, `club`) VALUES
        ('SAC LMS Administrator', 'admin@adityatekkali.edu.in', 'SACADMIN01', :p1, 'admin', 'Faculty / Admin', 'all'),
        ('SAC CMS Administrator', 'cms@adityatekkali.edu.in', 'SACCMS01', :p2, 'admin', 'Faculty / Admin', 'all')
    ")->execute([
        ':p1' => $adminPasswordHash,
        ':p2' => $adminPasswordHash,
    ]);

    // 3. Reset CMS Content to clean default sections
    $defaultClubsJson = json_encode([
        [
            "name" => "Cultural Club",
            "slug" => "cultural-club",
            "mentor" => "",
            "mentorRole" => "",
            "studentOrganizer" => "",
            "studentOrganizerRole" => "",
            "about" => "The Cultural Club is the creative heartbeat of AITAM SAC.",
            "activities" => ["Annual cultural fest and talent hunts", "Dance, music and drama troupes"],
            "tagline" => "We amuse the world",
            "desc" => "Cultural club aims developing young multimedia specialists.",
            "icon" => "Music",
            "color" => "var(--club-pink)",
            "image" => ""
        ],
        [
            "name" => "Automobile Club",
            "slug" => "automobile-club",
            "mentor" => "",
            "mentorRole" => "",
            "studentOrganizer" => "",
            "studentOrganizerRole" => "",
            "about" => "The Automobile Club combines design thinking and hands-on workforce skills.",
            "activities" => ["Go-kart and e-vehicle build projects", "Engine teardown workshops"],
            "tagline" => "We move the world",
            "desc" => "Automobile club combines design and workforce to create innovations.",
            "icon" => "Car",
            "color" => "var(--club-rust)",
            "image" => ""
        ],
        [
            "name" => "Developers Club",
            "slug" => "developers-club",
            "mentor" => "",
            "mentorRole" => "",
            "studentOrganizer" => "",
            "studentOrganizerRole" => "",
            "about" => "The Developers Club moulds a critical thinker in every novice programmer.",
            "activities" => ["Full-stack web and app development bootcamps", "AI/ML project tracks"],
            "tagline" => "We develop the world",
            "desc" => "Developer club moulds critical thinker in every novice programmer.",
            "icon" => "Code2",
            "color" => "var(--club-teal)",
            "image" => ""
        ],
        [
            "name" => "Salesforce Club",
            "slug" => "salesforce-club",
            "mentor" => "",
            "mentorRole" => "",
            "studentOrganizer" => "",
            "studentOrganizerRole" => "",
            "about" => "The Salesforce Club brings companies and customers together.",
            "activities" => ["Salesforce Administrator certification training", "Trailhead superbadge challenges"],
            "tagline" => "We connect the world",
            "desc" => "We bring companies and customers together.",
            "icon" => "Cloud",
            "color" => "var(--club-orange)",
            "image" => ""
        ],
        [
            "name" => "Robotics Club",
            "slug" => "robotics-club",
            "mentor" => "",
            "mentorRole" => "",
            "studentOrganizer" => "",
            "studentOrganizerRole" => "",
            "about" => "The Robotics Club expertises students on robots and automation.",
            "activities" => ["Arduino and embedded systems workshops", "Line-follower and combat bot builds"],
            "tagline" => "We automate the world",
            "desc" => "Robotics club expertises students on robots and automation.",
            "icon" => "Bot",
            "color" => "var(--club-crimson)",
            "image" => ""
        ],
        [
            "name" => "Design Club",
            "slug" => "design-club",
            "mentor" => "",
            "mentorRole" => "",
            "studentOrganizer" => "",
            "studentOrganizerRole" => "",
            "about" => "The Design Club crafts the visual identity of every SAC initiative.",
            "activities" => ["Brand identity and poster design sprints", "UI/UX fundamentals and Figma labs"],
            "tagline" => "We shape the world",
            "desc" => "Design club crafts the visual identity of every SAC initiative.",
            "icon" => "PenTool",
            "color" => "var(--club-plum)",
            "image" => ""
        ],
        [
            "name" => "Security Club",
            "slug" => "security-club",
            "mentor" => "",
            "mentorRole" => "",
            "studentOrganizer" => "",
            "studentOrganizerRole" => "",
            "about" => "The Security Club explores ethical hacking and secure engineering.",
            "activities" => ["Ethical hacking and CTF practice sessions", "Network security labs"],
            "tagline" => "We protect the world",
            "desc" => "Security club explores ethical hacking and secure engineering.",
            "icon" => "ShieldCheck",
            "color" => "var(--club-indigo)",
            "image" => ""
        ],
        [
            "name" => "Photography Club",
            "slug" => "photography-club",
            "mentor" => "",
            "mentorRole" => "",
            "studentOrganizer" => "",
            "studentOrganizerRole" => "",
            "about" => "The Photography Club documents every campus moment through the lens.",
            "activities" => ["Campus event coverage and photo walks", "Editing workshops"],
            "tagline" => "We frame the world",
            "desc" => "Photography club documents every campus moment through the lens.",
            "icon" => "Camera",
            "color" => "var(--club-gold)",
            "image" => ""
        ],
    ]);

    $cmsSections = [
        'hero' => json_encode([
            'headline' => 'Prepares students for success in a changing world.',
            'tagline' => 'Learn . Build . Innovate',
            'subheadline' => 'The apex student body of AITAM — 8 student clubs, industry-led workshops, events and real client projects.'
        ]),
        'announcement' => json_encode([
            'enabled' => true,
            'badge' => 'New Notice',
            'message' => 'Registrations open for upcoming technical bootcamps & SAC Club Memberships!',
            'link' => '/join',
            'linkText' => 'Apply Now'
        ]),
        'about' => json_encode([
            'title' => 'About SAC',
            'description' => 'Student Activity Center is the apex student body of AITAM, responsible for formulating policies pertaining to student development, technical clubs, and holistic workspace culture.'
        ]),
        'stats' => json_encode([
            ['label' => 'EVENTS', 'value' => 0, 'max' => 40],
            ['label' => 'WEBINARS', 'value' => 0, 'max' => 40],
            ['label' => 'WORKSHOPS', 'value' => 0, 'max' => 40],
            ['label' => 'TRAINED STUDENTS', 'value' => 0, 'max' => 3000],
        ]),
        'testimonials' => json_encode([]),
        'mentors' => json_encode([]),
        'clubs' => $defaultClubsJson,
    ];

    $insCms = $pdo->prepare("INSERT INTO `cms_content` (`section_key`, `content_json`) VALUES (:k, :v)");
    foreach ($cmsSections as $k => $v) {
        $insCms->execute([':k' => $k, ':v' => $v]);
    }

    // 4. Seed standard Club Wings for Developers Club
    $pdo->exec("
        INSERT INTO `club_wings` (`club_slug`, `wing_name`, `wing_slug`, `description`) VALUES
        ('developers-club', 'Web Development Wing', 'web-dev', 'Full-stack web application engineering covering HTML5, CSS3, modern JavaScript/TypeScript, React 19, and Node.js APIs.'),
        ('developers-club', 'Mobile App Development Wing', 'app-dev', 'Cross-platform native mobile applications with Flutter, Dart, state management, and Firebase cloud integrations.'),
        ('developers-club', 'Game Development Wing', 'game-dev', '2D and 3D game engines, physics simulations, shaders, and interactive gameplay mechanics using Unity and C#.'),
        ('developers-club', 'AI & Machine Learning Wing', 'ai-dev', 'Machine learning algorithms, deep neural network training, computer vision models, and applied GenAI.'),
        ('developers-club', 'Cloud & DevOps Wing', 'cloud-dev', 'Containerization with Docker, Kubernetes clusters, CI/CD automated deployment pipelines, and cloud hosting.');
    ");

    // 5. Seed Standard Roadmaps, Phases, and Modules
    $pdo->exec("
        INSERT INTO `lms_roadmaps` (`id`, `club_slug`, `sub_club_slug`, `title`, `description`, `created_by`, `is_active`) VALUES
        (1, 'developers-club', 'web-dev', 'Full-Stack Web Engineering 2025-2026', 'Comprehensive foundational to production engineering roadmap for modern web apps using React, Node.js, and TypeScript.', 'SAC Faculty / Admin', 1),
        (2, 'developers-club', 'app-dev', 'Mobile App Development (Flutter & Android)', 'Cross-platform mobile application development with Flutter, Dart, state management, and Firebase cloud integrations.', 'SAC Faculty / Admin', 1),
        (3, 'developers-club', 'game-dev', 'Game Development & Interactive Simulation (Unity/C#)', '2D and 3D game mechanics, physics simulation, C# scripting, shaders, and level architecture with Unity engine.', 'SAC Faculty / Admin', 1),
        (4, 'developers-club', 'ai-dev', 'AI & Machine Learning Engineering', 'Applied machine learning algorithms, deep neural network training, computer vision models, and applied GenAI.', 'SAC Faculty / Admin', 1),
        (5, 'developers-club', 'cloud-dev', 'Cloud Architecture & DevOps Engineering', 'Containerization with Docker, Kubernetes clusters, CI/CD automated deployment pipelines, and cloud hosting.', 'SAC Faculty / Admin', 1);

        INSERT INTO `lms_roadmap_phases` (`id`, `roadmap_id`, `title`, `description`, `phase_order`) VALUES
        (1, 1, 'Phase 1: Modern Web Foundations & DOM', 'Semantic HTML5, CSS3 responsive grid/flexbox, modern ES6+ JavaScript, and Git workflows.', 1),
        (2, 1, 'Phase 2: React & Component Architecture', 'React 19, functional components, hooks, and Tailwind CSS.', 2),
        (3, 1, 'Phase 3: Backend APIs & Database Integration', 'RESTful API construction with Node/PHP, database schemas with MySQL, and deployment.', 3),
        (4, 2, 'Phase 1: Dart Fundamentals & Widget Trees', 'Dart language semantics, null safety, OOP, and building basic Flutter widget layouts.', 1),
        (5, 2, 'Phase 2: State Management & Cloud Services', 'Provider, Riverpod, REST API integration, and Firebase authentication & databases.', 2);

        INSERT INTO `lms_roadmap_modules` (`id`, `phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
        (1, 1, 'Module 1.1: Git & Version Control Best Practices', 'Git init, branch management, pull requests, and collaborative GitHub etiquette.', 6, 1, 0),
        (2, 1, 'Module 1.2: Modern JavaScript Deep Dive', 'Promises, async/await, closures, fetch API, and TypeScript fundamentals.', 10, 2, 0),
        (3, 2, 'Module 2.1: React State & Lifecycle', 'Component composition, prop drilling mitigation, and side effects.', 12, 1, 0),
        (4, 3, 'Module 3.1: REST API & SQL Database Design', 'Writing secure endpoints, handling CORS, SQL indexing, and relationships.', 14, 1, 0),
        (5, 4, 'Module 1.1: Dart Language & OOP Mastery', 'Variables, control flow, functions, async programming, and classes.', 8, 1, 0),
        (6, 4, 'Module 1.2: Flutter UI & Interactive Widgets', 'Scaffold, Column, Row, ListView, Custom Paint, and Material 3 design.', 12, 2, 0);

        INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
        (1, 'Git Basics & Commit Hygiene', 'Understand commits, atomic branches, and writing meaningful commit messages for teams.', 'https://git-scm.com/doc', 1),
        (1, 'Setting Up GitHub Classroom / Team Repo', 'Create a clean repository with proper .gitignore and README documentation.', 'https://docs.github.com', 2),
        (2, 'ES6 Features: Destructuring, Spread, and Modules', 'Master modern JavaScript syntactical conveniences and clean code modularity.', 'https://javascript.info', 1),
        (2, 'Async Programming: Promises & Async/Await', 'Handling network requests and async side effects cleanly in JS.', 'https://developer.mozilla.org', 2);
    ");

    // Re-enable foreign key constraints
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    echo json_encode([
        'success' => true,
        'message' => 'Database successfully cleared! All operational data deleted. Fresh clean database ready.',
        'truncated_tables' => $cleared,
        'admin_accounts' => [
            'LMS Admin' => 'admin@adityatekkali.edu.in (Password: password123)',
            'CMS Admin' => 'cms@adityatekkali.edu.in (Password: password123)'
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to clear database: ' . $e->getMessage()
    ]);
}
