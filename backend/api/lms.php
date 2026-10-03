<?php
// backend/api/lms.php
// SAC LMS & Club Governance REST API

require_once __DIR__ . '/../config/db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'overview';

// Helper to get raw JSON payload
function getJsonPayload() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// Ensure all LMS tables exist automatically
function ensureLmsTables($pdo) {
    static $ensured = false;
    if ($ensured) return;
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `lms_roles` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `role_key` VARCHAR(50) NOT NULL UNIQUE,
            `role_name` VARCHAR(100) NOT NULL,
            `description` VARCHAR(255) DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    ");

    // Check if roles need seeding
    $roleCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_roles`")->fetchColumn();
    if ($roleCount === 0) {
        $pdo->exec("
            INSERT INTO `lms_roles` (`role_key`, `role_name`, `description`) VALUES
            ('admin', 'Platform / LMS Administrator', 'Full platform authority over all clubs, users, approvals, roles, and settings'),
            ('mentor', '1. Faculty Mentor', 'Institutional faculty supervisor guiding clubs, approving events, and overseeing tasks'),
            ('club_organizer', '2. Club Student Organiser', 'Apex student lead heading an entire main club and all its sub-clubs'),
            ('club_lead', '3. Club Wing Lead', 'Student track lead managing a specific sub-club wing and evaluating member tasks'),
            ('student', '4. Club Member', 'Enrolled club member learning from roadmaps and submitting assignments');
        ");
    }

    // Ensure Developers Club sub-wings exist and eliminate duplicates & fake dummy leads
    try {
        // 1. Delete duplicate wings (keep the lowest ID per club_slug + wing_slug / wing_name)
        $pdo->exec("
            DELETE w1 FROM `club_wings` w1
            INNER JOIN `club_wings` w2 
            ON w1.`id` > w2.`id` 
            AND LOWER(TRIM(w1.`club_slug`)) = LOWER(TRIM(w2.`club_slug`))
            AND (
                LOWER(TRIM(w1.`wing_slug`)) = LOWER(TRIM(w2.`wing_slug`))
                OR LOWER(TRIM(w1.`wing_name`)) = LOWER(TRIM(w2.`wing_name`))
            );
        ");

        // 2. Wipe fake dummy leads (User explicitly clarified: NO leads added yet!)
        $pdo->exec("
            UPDATE `club_wings`
            SET `lead_name` = NULL, `lead_roll_number` = NULL, `lead_email` = NULL, `lead_phone` = NULL, `lead_year` = NULL
            WHERE `lead_roll_number` IN ('22A51A0501', '22A51A0502', '22A51A0503', '22A51A0504', '22A51A0505')
               OR `lead_name` IN ('T. Vinay', 'K. Rahul', 'M. Suresh', 'P. Sneha', 'D. Sai Kumar')
               OR `lead_name` LIKE '%Vinay%'
               OR `lead_name` LIKE '%Rahul%'
               OR `lead_name` LIKE '%Suresh%'
               OR `lead_name` LIKE '%Sneha%'
               OR `lead_name` LIKE '%Sai Kumar%';
        ");

        // 3. Ensure the 5 default wings exist (without fake leads)
        $defaultDevWings = [
            [
                'wing_name' => 'Web Development Wing',
                'wing_slug' => 'web-dev',
                'description' => 'Full-stack web application engineering covering HTML5, CSS3, modern JavaScript/TypeScript, React 19, and Node.js APIs.'
            ],
            [
                'wing_name' => 'Mobile App Development Wing',
                'wing_slug' => 'app-dev',
                'description' => 'Cross-platform native mobile applications with Flutter, Dart, state management, and Firebase cloud integrations.'
            ],
            [
                'wing_name' => 'Game Development Wing',
                'wing_slug' => 'game-dev',
                'description' => '2D and 3D game engines, physics simulations, shaders, and interactive gameplay mechanics using Unity and C#.'
            ],
            [
                'wing_name' => 'AI & Machine Learning Wing',
                'wing_slug' => 'ai-dev',
                'description' => 'Machine learning algorithms, deep neural network training, computer vision models, and applied GenAI.'
            ],
            [
                'wing_name' => 'Cloud & DevOps Wing',
                'wing_slug' => 'cloud-dev',
                'description' => 'Containerization with Docker, Kubernetes clusters, CI/CD automated deployment pipelines, and cloud hosting.'
            ],
        ];

        foreach ($defaultDevWings as $dw) {
            $chk = $pdo->prepare("SELECT id FROM `club_wings` WHERE `club_slug` = 'developers-club' AND (`wing_slug` = :wslug OR `wing_name` = :wname) LIMIT 1");
            $chk->execute([':wslug' => $dw['wing_slug'], ':wname' => $dw['wing_name']]);
            if (!$chk->fetch()) {
                $ins = $pdo->prepare("
                    INSERT INTO `club_wings` (`club_slug`, `wing_name`, `wing_slug`, `lead_name`, `lead_roll_number`, `lead_email`, `lead_phone`, `lead_year`, `description`)
                    VALUES ('developers-club', :wname, :wslug, NULL, NULL, NULL, NULL, NULL, :desc)
                ");
                $ins->execute([
                    ':wname' => $dw['wing_name'],
                    ':wslug' => $dw['wing_slug'],
                    ':desc'  => $dw['description']
                ]);
            }
        }
    } catch (Exception $e) {
        // Silently tolerate if table already configured
    }

    // Note: Organizers, Roadmaps, Tasks, Submissions, and Announcements are created organically by LMS Admins, Faculty Mentors, and Leads.
    // Auto-seeding of dummy records is disabled to keep the database completely clean.

    // Ensure Developers Club Roadmaps exist & deduplicate
    try {
        // Deduplicate roadmaps in database by title or sub_club_slug
        $allRms = $pdo->query("SELECT id, title, sub_club_slug, club_slug FROM `lms_roadmaps` ORDER BY id ASC")->fetchAll();
        $seenRms = [];
        $idsToDelete = [];
        foreach ($allRms as $rmRow) {
            $tKey = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $rmRow['title'] ?? '')));
            $sKey = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $rmRow['sub_club_slug'] ?? '')));
            $cKey = strtolower(trim($rmRow['club_slug'] ?? 'developers-club'));
            
            $matchKey1 = !empty($sKey) ? ($cKey . '::' . $sKey) : null;
            $matchKey2 = !empty($tKey) ? ($cKey . '::' . $tKey) : null;

            if (($matchKey1 && isset($seenRms[$matchKey1])) || ($matchKey2 && isset($seenRms[$matchKey2]))) {
                $idsToDelete[] = (int)$rmRow['id'];
            } else {
                if ($matchKey1) $seenRms[$matchKey1] = true;
                if ($matchKey2) $seenRms[$matchKey2] = true;
            }
        }
        if (!empty($idsToDelete)) {
            $inDel = implode(',', $idsToDelete);
            $pdo->exec("DELETE FROM `lms_roadmaps` WHERE `id` IN ($inDel)");
            $pdo->exec("DELETE FROM `lms_roadmap_phases` WHERE `roadmap_id` IN ($inDel)");
        }

        $devRmCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_roadmaps` WHERE `club_slug` IN ('developers-club', 'Developers Club', 'web-dev')")->fetchColumn();
        if ($devRmCount === 0) {
            $pdo->exec("
                INSERT INTO `lms_roadmaps` (`club_slug`, `sub_club_slug`, `title`, `description`, `created_by`, `is_active`) VALUES
                ('developers-club', 'web-dev', 'Full-Stack Web Engineering 2025-2026', 'Comprehensive foundational to production engineering roadmap for modern web apps using React, Node.js, and TypeScript.', 'SANAPALA Vinod kumar (Organizer)', 1);
            ");
            $webRmId = (int)$pdo->lastInsertId();
            if ($webRmId > 0) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_phases` (`roadmap_id`, `title`, `description`, `phase_order`) VALUES
                    ($webRmId, 'Phase 1: Modern Web Foundations & DOM', 'Semantic HTML5, CSS3 responsive grid/flexbox, modern ES6+ JavaScript, and Git workflows.', 1),
                    ($webRmId, 'Phase 2: React & Component Architecture', 'React 19, functional components, hooks, and Tailwind CSS.', 2),
                    ($webRmId, 'Phase 3: Backend APIs & Database Integration', 'RESTful API construction with Node/PHP, database schemas with MySQL, and deployment.', 3);
                ");
                $p1 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $webRmId AND `phase_order` = 1")->fetchColumn();
                $p2 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $webRmId AND `phase_order` = 2")->fetchColumn();
                $p3 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $webRmId AND `phase_order` = 3")->fetchColumn();
                if ($p1) {
                    $pdo->exec("
                        INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
                        ($p1, 'Module 1.1: Git & Version Control Best Practices', 'Git init, branch management, pull requests, and collaborative GitHub etiquette.', 6, 1, 0),
                        ($p1, 'Module 1.2: Modern JavaScript Deep Dive', 'Promises, async/await, closures, fetch API, and TypeScript fundamentals.', 10, 2, 0);
                    ");
                    $m1 = (int)$pdo->query("SELECT id FROM `lms_roadmap_modules` WHERE `phase_id` = $p1 AND `module_order` = 1")->fetchColumn();
                    $m2 = (int)$pdo->query("SELECT id FROM `lms_roadmap_modules` WHERE `phase_id` = $p1 AND `module_order` = 2")->fetchColumn();
                    if ($m1) {
                        $pdo->exec("
                            INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
                            ($m1, 'Git Basics & Commit Hygiene', 'Understand commits, atomic branches, and writing meaningful commit messages for teams.', 'https://git-scm.com/doc', 1),
                            ($m1, 'Setting Up GitHub Classroom / Team Repo', 'Create a clean repository with proper .gitignore and README documentation.', 'https://docs.github.com', 2);
                        ");
                    }
                    if ($m2) {
                        $pdo->exec("
                            INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
                            ($m2, 'ES6 Features: Destructuring, Spread, and Modules', 'Master modern JavaScript syntactical conveniences and clean code modularity.', 'https://javascript.info', 1),
                            ($m2, 'Async Programming: Promises & Async/Await', 'Handling network requests and async side effects cleanly in JS.', 'https://developer.mozilla.org', 2);
                        ");
                    }
                }
                if ($p2) {
                    $pdo->exec("
                        INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
                        ($p2, 'Module 2.1: React State & Lifecycle', 'Component composition, prop drilling mitigation, and side effects.', 12, 1, 0),
                        ($p2, 'Module 2.2: Responsive UI with Tailwind CSS', 'Building modern accessible UIs with design tokens and animations.', 8, 2, 0);
                    ");
                }
                if ($p3) {
                    $pdo->exec("
                        INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`, `is_locked_by_default`) VALUES
                        ($p3, 'Module 3.1: REST API & SQL Database Design', 'Writing secure endpoints, handling CORS, SQL indexing, and relationships.', 14, 1, 1);
                    ");
                }
            }
        }

        $appDevCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_roadmaps` WHERE `sub_club_slug` = 'app-dev'")->fetchColumn();
        if ($appDevCount === 0) {
            $pdo->exec("
                INSERT INTO `lms_roadmaps` (`club_slug`, `sub_club_slug`, `title`, `description`, `created_by`, `is_active`)
                VALUES ('developers-club', 'app-dev', 'Mobile App Development (Flutter & Android)', 'Cross-platform mobile application development with Flutter, Dart, state management, and Firebase cloud integrations.', 'SANAPALA Vinod kumar (Organizer)', 1);
            ");
            $appId = (int)$pdo->lastInsertId();
            $pdo->exec("
                INSERT INTO `lms_roadmap_phases` (`roadmap_id`, `title`, `description`, `phase_order`) VALUES
                ($appId, 'Phase 1: Dart Fundamentals & Widget Trees', 'Dart language semantics, null safety, OOP, and building basic Flutter widget layouts.', 1),
                ($appId, 'Phase 2: State Management & Cloud Services', 'Provider, Riverpod, REST API integration, and Firebase authentication & databases.', 2);
            ");
            $p1 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $appId AND `phase_order` = 1")->fetchColumn();
            $p2 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $appId AND `phase_order` = 2")->fetchColumn();
            if ($p1 && $p2) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES
                    ($p1, 'Module 1.1: Dart Language & OOP Mastery', 'Variables, control flow, functions, async programming, and classes.', 8, 1),
                    ($p1, 'Module 1.2: Flutter UI & Interactive Widgets', 'Scaffold, Column, Row, ListView, Custom Paint, and Material 3 design.', 12, 2),
                    ($p2, 'Module 2.1: Modern State Architecture', 'Managing app state cleanly using Provider and Riverpod.', 10, 1),
                    ($p2, 'Module 2.2: Backend Integration & Firebase', 'REST API networking, JSON parsing, Firestore DB, and push notifications.', 14, 2);
                ");
            }
        }

        $gameDevCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_roadmaps` WHERE `sub_club_slug` = 'game-dev'")->fetchColumn();
        if ($gameDevCount === 0) {
            $pdo->exec("
                INSERT INTO `lms_roadmaps` (`club_slug`, `sub_club_slug`, `title`, `description`, `created_by`, `is_active`)
                VALUES ('developers-club', 'game-dev', 'Game Development & Interactive Simulation (Unity/C#)', '2D and 3D game mechanics, physics simulation, C# scripting, shaders, and level architecture with Unity engine.', 'SANAPALA Vinod kumar (Organizer)', 1);
            ");
            $gameId = (int)$pdo->lastInsertId();
            $pdo->exec("
                INSERT INTO `lms_roadmap_phases` (`roadmap_id`, `title`, `description`, `phase_order`) VALUES
                ($gameId, 'Phase 1: Game Math, Physics & C# Fundamentals', 'Vectors, coordinate geometry, C# event architecture, and Unity physics collisions.', 1),
                ($gameId, 'Phase 2: Gameplay Mechanics & Audio Integration', 'Character controllers, AI pathfinding, camera systems, particle effects, and sound design.', 2);
            ");
            $gp1 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $gameId AND `phase_order` = 1")->fetchColumn();
            if ($gp1) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES
                    ($gp1, 'Module 1.1: C# Scripting & Object Lifecycle', 'Awake, Start, Update, Coroutines, and game object instantiation.', 8, 1),
                    ($gp1, 'Module 1.2: Rigidbody & Collision Physics', 'Colliders, Raycasting, physics materials, and trigger event listeners.', 10, 2);
                ");
            }
        }

        $aiDevCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_roadmaps` WHERE `sub_club_slug` = 'ai-dev'")->fetchColumn();
        if ($aiDevCount === 0) {
            $pdo->exec("
                INSERT INTO `lms_roadmaps` (`club_slug`, `sub_club_slug`, `title`, `description`, `created_by`, `is_active`)
                VALUES ('developers-club', 'ai-dev', 'AI & Machine Learning Engineering', 'Applied machine learning algorithms, deep neural network training, computer vision models, and applied GenAI.', 'SANAPALA Vinod kumar (Organizer)', 1);
            ");
            $aiId = (int)$pdo->lastInsertId();
            $pdo->exec("
                INSERT INTO `lms_roadmap_phases` (`roadmap_id`, `title`, `description`, `phase_order`) VALUES
                ($aiId, 'Phase 1: Python for Data Science & Math Foundations', 'NumPy vectorized arrays, pandas dataframes, linear algebra, and data visualization.', 1),
                ($aiId, 'Phase 2: Classical Machine Learning & Scikit-Learn', 'Supervised regression, classification models, cross-validation, and feature pipelines.', 2),
                ($aiId, 'Phase 3: Deep Learning, PyTorch & LLMs', 'Neural networks, PyTorch tensors, computer vision, and prompt engineering with GenAI.', 3);
            ");
            $ap1 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $aiId AND `phase_order` = 1")->fetchColumn();
            $ap2 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $aiId AND `phase_order` = 2")->fetchColumn();
            $ap3 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $aiId AND `phase_order` = 3")->fetchColumn();
            if ($ap1) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES
                    ($ap1, 'Module 1.1: NumPy, Pandas & Vectorized Operations', 'Array indexing, broadcasting, data cleaning, and statistical aggregations.', 8, 1),
                    ($ap1, 'Module 1.2: Exploratory Data Analysis & Visualization', 'Matplotlib, Seaborn, outlier detection, and data storytelling.', 6, 2);
                ");
                $m1 = (int)$pdo->query("SELECT id FROM `lms_roadmap_modules` WHERE `phase_id` = $ap1 AND `module_order` = 1")->fetchColumn();
                if ($m1) {
                    $pdo->exec("
                        INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
                        ($m1, 'NumPy Fundamentals & Matrix Computations', 'Master multi-dimensional arrays, linear algebra dot products, and vector slicing.', 'https://numpy.org/doc/', 1),
                        ($m1, 'Pandas Data Wrangling & Transformations', 'DataFrames, group-by operations, handling missing values, and time series.', 'https://pandas.pydata.org/docs/', 2);
                    ");
                }
            }
            if ($ap2) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES
                    ($ap2, 'Module 2.1: Supervised Learning & Model Evaluation', 'Linear & Logistic Regression, Decision Trees, Random Forests, and ROC-AUC curves.', 10, 1),
                    ($ap2, 'Module 2.2: Unsupervised Clustering & Dimensionality', 'K-Means, Hierarchical Clustering, and PCA dimensionality reduction.', 8, 2);
                ");
            }
            if ($ap3) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES
                    ($ap3, 'Module 3.1: PyTorch Tensors & Neural Architectures', 'Building multilayer perceptrons, loss functions, optimizers, and backpropagation.', 14, 1),
                    ($ap3, 'Module 3.2: Modern Generative AI & Retrieval Systems', 'Transformer attention mechanisms, LangChain, embeddings, and vector databases.', 12, 2);
                ");
            }
        }

        $cloudDevCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_roadmaps` WHERE `sub_club_slug` = 'cloud-dev'")->fetchColumn();
        if ($cloudDevCount === 0) {
            $pdo->exec("
                INSERT INTO `lms_roadmaps` (`club_slug`, `sub_club_slug`, `title`, `description`, `created_by`, `is_active`)
                VALUES ('developers-club', 'cloud-dev', 'Cloud Architecture & DevOps Engineering', 'Containerization with Docker, Kubernetes clusters, CI/CD automated deployment pipelines, and cloud hosting.', 'SANAPALA Vinod kumar (Organizer)', 1);
            ");
            $cId = (int)$pdo->lastInsertId();
            $pdo->exec("
                INSERT INTO `lms_roadmap_phases` (`roadmap_id`, `title`, `description`, `phase_order`) VALUES
                ($cId, 'Phase 1: Linux CLI & Containerization with Docker', 'Linux system administration, bash scripting, Docker container lifecycle, and images.', 1),
                ($cId, 'Phase 2: Kubernetes Orchestration & Cloud Infrastructure', 'Kubernetes pods, services, ingress controllers, config maps, and cloud IAM.', 2),
                ($cId, 'Phase 3: CI/CD Automation & Observability', 'GitHub Actions workflow automation, zero-downtime releases, Prometheus & Grafana monitoring.', 3);
            ");
            $cp1 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $cId AND `phase_order` = 1")->fetchColumn();
            $cp2 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $cId AND `phase_order` = 2")->fetchColumn();
            $cp3 = (int)$pdo->query("SELECT id FROM `lms_roadmap_phases` WHERE `roadmap_id` = $cId AND `phase_order` = 3")->fetchColumn();
            if ($cp1) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES
                    ($cp1, 'Module 1.1: Linux Shell & System Administration', 'File permissions, process management, bash scripting, and SSH key security.', 8, 1),
                    ($cp1, 'Module 1.2: Docker Containerization & Multi-Stage Builds', 'Writing optimized Dockerfiles, docker compose networks, and volumes.', 10, 2);
                ");
                $m1 = (int)$pdo->query("SELECT id FROM `lms_roadmap_modules` WHERE `phase_id` = $cp1 AND `module_order` = 1")->fetchColumn();
                if ($m1) {
                    $pdo->exec("
                        INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES
                        ($m1, 'Linux Commands & Shell Scripting Mastery', 'Essential Linux toolchain: grep, awk, sed, systemctl, and bash automation scripts.', 'https://ubuntu.com/tutorials', 1),
                        ($m1, 'Docker Fundamentals & Container Best Practices', 'Creating lightweight container images, multi-stage builds, and non-root users.', 'https://docs.docker.com/', 2);
                    ");
                }
            }
            if ($cp2) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES
                    ($cp2, 'Module 2.1: Kubernetes Core Objects & Networking', 'Pods, Deployments, Services, ClusterIP, NodePort, and LoadBalancers.', 12, 1),
                    ($cp2, 'Module 2.2: Cloud Infrastructure on AWS / GCP', 'Compute instances, VPC networks, S3/Cloud Storage buckets, and security groups.', 10, 2);
                ");
            }
            if ($cp3) {
                $pdo->exec("
                    INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES
                    ($cp3, 'Module 3.1: Automated CI/CD with GitHub Actions', 'Configuring lint, test, build, and automated deployment pipelines.', 10, 1),
                    ($cp3, 'Module 3.2: Production Monitoring & Log Aggregation', 'Prometheus metrics scraping, Grafana dashboards, and alert manager rules.', 8, 2);
                ");
            }
        }
    } catch (Exception $e) {
        // Silently tolerate
    }

    // Ensure Developers Club Tasks exist & deduplicate
    try {
        $pdo->exec("
            DELETE t1 FROM `lms_tasks` t1
            INNER JOIN `lms_tasks` t2
            ON t1.`id` > t2.`id`
            AND LOWER(TRIM(t1.`club_slug`)) = LOWER(TRIM(t2.`club_slug`))
            AND LOWER(TRIM(t1.`title`)) = LOWER(TRIM(t2.`title`));
        ");

        $pdo->exec("
            UPDATE `lms_tasks`
            SET `created_by` = 'SANAPALA Vinod kumar (Organizer)'
            WHERE `created_by` LIKE '%Vinay%' OR `created_by` LIKE '%Rahul%' OR `created_by` LIKE '%Lead%';
        ");

        $hasTaskHistory = (int)$pdo->query("
            SELECT COUNT(*) FROM `lms_audit_logs` 
            WHERE `action` IN ('DELETE_TASK', 'CREATE_TASK', 'SAVE_TASK', 'SEED_TASKS')
               OR `entity_type` = 'TASK'
        ")->fetchColumn();

        $devTaskCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_tasks` WHERE `club_slug` IN ('developers-club', 'Developers Club', 'web-dev')")->fetchColumn();
        if (false && $devTaskCount === 0 && $hasTaskHistory === 0) {
            $pdo->exec("
                INSERT INTO `lms_tasks` (`club_slug`, `sub_club_slug`, `title`, `description`, `instructions`, `due_date`, `priority`, `allow_github`, `allow_drive`, `allow_url`, `max_score`, `created_by`, `status`) VALUES
                ('developers-club', 'web-dev', 'Task 1: Responsive Portfolio Landing Page', 'Build and host a responsive personal developer portfolio showcasing your skills, projects, and contact links.', '1. Use semantic HTML and modern CSS.\n2. Must be 100% responsive on mobile, tablet, and desktop.\n3. Push your source code to GitHub and host live on Vercel or Netlify.\n4. Submit your GitHub repository link and live URL.', '2026-10-15', 'high', 1, 1, 1, 100, 'SANAPALA Vinod kumar (Organizer)', 'active'),
                ('developers-club', 'web-dev', 'Task 2: Interactive Task Manager with LocalStorage', 'Create a functional todo and task tracking application with status filters and persistent storage.', '1. Add, edit, delete, and toggle task completion.\n2. Store state in localStorage so tasks persist across page reloads.\n3. Submit your GitHub repository URL.', '2026-10-25', 'medium', 1, 1, 1, 100, 'SANAPALA Vinod kumar (Organizer)', 'active'),
                ('developers-club', 'app-dev', 'Task 3: Flutter Calculator App with State Management', 'Create a clean, responsive calculator application with history tracking.', '1. Build calculator UI with Flutter widgets.\n2. Implement basic math logic and history log.\n3. Submit your GitHub repository.', '2026-11-05', 'medium', 1, 1, 1, 100, 'SANAPALA Vinod kumar (Organizer)', 'active');
            ");
            recordAuditLog($pdo, 'System', 'Platform Admin', 'SEED_TASKS', 'TASK', '1', 'Initial seed of tasks');
        }

        // Seed a sample student submission for verification if empty
        $subCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_task_submissions`")->fetchColumn();
        if (false && $subCount === 0) {
            $taskRow = $pdo->query("SELECT id FROM `lms_tasks` WHERE `club_slug` IN ('developers-club', 'Developers Club', 'web-dev') ORDER BY id ASC LIMIT 1")->fetch();
            if ($taskRow) {
                $tId = (int)$taskRow['id'];
                $stu = $pdo->query("SELECT id, name, roll_number FROM `club_members` WHERE `club_slug` IN ('developers-club', 'Developers Club') LIMIT 1")->fetch();
                $stuId = $stu ? (int)$stu['id'] : 2;
                $stuName = $stu ? $stu['name'] : 'SANAPALA Vinod kumar';
                $stuRoll = $stu ? $stu['roll_number'] : '23A51A05C5';
                $pdo->exec("
                    INSERT INTO `lms_task_submissions` (`task_id`, `student_id`, `student_name`, `student_roll`, `submission_url`, `submission_type`, `notes`, `status`)
                    VALUES ($tId, $stuId, " . $pdo->quote($stuName) . ", " . $pdo->quote($stuRoll) . ", 'https://github.com/aitam-sac/developer-portfolio', 'github', 'Completed responsive personal portfolio with HTML5 and CSS Grid. Hosted live on Vercel with responsive design.', 'submitted')
                ");
            }
        }
    } catch (Exception $e) {
        // Silently tolerate
    }

    // Ensure Developers Club Announcements exist & deduplicate
    try {
        $pdo->exec("
            DELETE a1 FROM `lms_announcements` a1
            INNER JOIN `lms_announcements` a2
            ON a1.`id` > a2.`id`
            AND LOWER(TRIM(a1.`club_slug`)) = LOWER(TRIM(a2.`club_slug`))
            AND LOWER(TRIM(a1.`title`)) = LOWER(TRIM(a2.`title`));
        ");

        $pdo->exec("
            DELETE FROM `lms_announcements`
            WHERE `author_name` IN ('T. Vinay', 'K. Rahul', 'M. Suresh', 'P. Sneha', 'D. Sai Kumar')
               OR `author_name` LIKE '%Vinay%';
        ");

        // Never re-seed default announcements if any announcement has ever been deleted, updated, or posted
        $hasAnnHistory = (int)$pdo->query("
            SELECT COUNT(*) FROM `lms_audit_logs` 
            WHERE `action` IN ('DELETE_ANNOUNCEMENT', 'POST_ANNOUNCEMENT', 'UPDATE_ANNOUNCEMENT', 'SEED_ANNOUNCEMENTS')
               OR `entity_type` = 'ANNOUNCEMENT'
               OR `details` LIKE '%announcement%'
        ")->fetchColumn();

        $totalAnnCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_announcements`")->fetchColumn();
        if (false && $totalAnnCount === 0 && $hasAnnHistory === 0) {
            $pdo->exec("
                INSERT INTO `lms_announcements` (`club_slug`, `sub_club_slug`, `author_name`, `author_role`, `title`, `content`, `priority`) VALUES
                ('developers-club', 'web-dev', 'SANAPALA Vinod kumar', 'Club Organizer', 'Welcome to Developers Club 2025-2026 Cohort!', 'Welcome everyone! In this cohort, we will master Full-Stack Web Development, Mobile Applications, and Game Development. Review your track roadmap and submit tasks on time.', 'pinned');
            ");
            recordAuditLog($pdo, 'System', 'Platform Admin', 'SEED_ANNOUNCEMENTS', 'ANNOUNCEMENT', '1', 'Initial seed of announcements');
        }
    } catch (Exception $e) {
        // Silently tolerate
    }

    // Ensure Platform LMS Admin & CMS Admin exist in users table (No dummy students or faculty mentors are auto-created)
    try {
        $adminCheck = $pdo->prepare("SELECT id FROM `users` WHERE `email` = 'admin@adityatekkali.edu.in' LIMIT 1");
        $adminCheck->execute();
        if (!$adminCheck->fetch()) {
            $adminPassHash = password_hash('password123', PASSWORD_BCRYPT);
            $pdo->prepare("
                INSERT INTO `users` (`name`, `email`, `roll_number`, `password`, `role`, `year_of_study`, `club`)
                VALUES ('SAC LMS Administrator', 'admin@adityatekkali.edu.in', 'SACADMIN01', :pwd, 'admin', 'Faculty / Admin', 'all')
            ")->execute([':pwd' => $adminPassHash]);
        }

        $cmsCheck = $pdo->prepare("SELECT id FROM `users` WHERE `email` = 'cms@adityatekkali.edu.in' LIMIT 1");
        $cmsCheck->execute();
        if (!$cmsCheck->fetch()) {
            $cmsPassHash = password_hash('password123', PASSWORD_BCRYPT);
            $pdo->prepare("
                INSERT INTO `users` (`name`, `email`, `roll_number`, `password`, `role`, `year_of_study`, `club`)
                VALUES ('SAC CMS Administrator', 'cms@adityatekkali.edu.in', 'SACCMS01', :pwd, 'admin', 'Faculty / Admin', 'all')
            ")->execute([':pwd' => $cmsPassHash]);
        }
    } catch (Exception $e) {
        // Continue if table not yet initialized
    }

    $ensured = true;
}

function recordAuditLog($pdo, $actorName, $actorRole, $action, $entityType, $entityId, $details = '') {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO `lms_audit_logs` (`actor_name`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`)
            VALUES (:actor, :role, :action, :type, :id, :details)
        ");
        $stmt->execute([
            ':actor' => $actorName ?: 'System',
            ':role' => $actorRole ?: 'Platform Admin',
            ':action' => $action,
            ':type' => $entityType,
            ':id' => $entityId ?: '',
            ':details' => is_array($details) ? json_encode($details) : (string)$details
        ]);
    } catch (Exception $e) {
        // Logging fail should not break transaction
    }
}

function sendNotification($pdo, $userId, $title, $message, $linkUrl = '/lms', $type = 'general') {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO `lms_notifications` (`user_id`, `title`, `message`, `link_url`, `notification_type`)
            VALUES (:uid, :title, :msg, :link, :type)
        ");
        $stmt->execute([
            ':uid' => (int)$userId,
            ':title' => $title,
            ':msg' => $message,
            ':link' => $linkUrl,
            ':type' => $type
        ]);
    } catch (Exception $e) {
        // continue
    }
}

function normalizeClubSlug($val) {
    if (empty($val)) return 'developers-club';
    $val = strtolower(trim((string)$val));
    $val = str_replace(['_', ' '], '-', $val);
    
    if (strpos($val, 'dev') !== false) return 'developers-club';
    if (strpos($val, 'photo') !== false) return 'photography-club';
    if (strpos($val, 'cultur') !== false) return 'cultural-club';
    if (strpos($val, 'auto') !== false) return 'automobile-club';
    if (strpos($val, 'sales') !== false) return 'salesforce-club';
    if (strpos($val, 'robot') !== false) return 'robotics-club';
    if (strpos($val, 'design') !== false) return 'design-club';
    if (strpos($val, 'sec') !== false || strpos($val, 'cyber') !== false) return 'security-club';
    if (strpos($val, 'cod') !== false) return 'coding-club';
    if (strpos($val, 'ai') !== false) return 'ai-club';
    if (strpos($val, 'iot') !== false) return 'iot-club';
    if (strpos($val, 'cloud') !== false) return 'cloud-devops-club';
    
    return $val;
}

function getClubSlugAliases($slug) {
    $norm = normalizeClubSlug($slug);
    $map = [
        'developers-club' => ['developers-club', 'Developers Club', 'developer-club', 'Developer Club', 'developers', 'developer', 'web-dev'],
        'photography-club' => ['photography-club', 'Photography Club', 'photography', 'photo-club'],
        'cultural-club' => ['cultural-club', 'Cultural Club', 'cultural'],
        'automobile-club' => ['automobile-club', 'Automobile Club', 'automobile', 'auto-club'],
        'salesforce-club' => ['salesforce-club', 'Salesforce Club', 'salesforce'],
        'robotics-club' => ['robotics-club', 'Robotics Club', 'robotics'],
        'design-club' => ['design-club', 'Design Club', 'design'],
        'security-club' => ['security-club', 'Security Club', 'cyber-security-club', 'Cyber Security Club', 'security', 'cyber-security'],
        'coding-club' => ['coding-club', 'Coding Club', 'coding'],
        'ai-club' => ['ai-club', 'AI Club', 'ai-deep-learning-club', 'AI & Deep Learning Club'],
        'iot-club' => ['iot-club', 'IoT Club', 'iot-embedded-systems-club', 'IoT & Embedded Systems Club'],
        'cloud-devops-club' => ['cloud-devops-club', 'Cloud & DevOps Club', 'cloud-club'],
    ];
    return $map[$norm] ?? [$norm, str_replace('-', ' ', $norm), ucwords(str_replace('-', ' ', $norm))];
}

function syncClubMembers($pdo, $filterClubSlug = null) {
    try {
        // 1. Normalize any existing club entries in `users`
        $pdo->exec("
            UPDATE `users` SET `club` = 'developers-club' 
            WHERE (`club` IS NULL OR `club` = '' OR `club` = 'Developers Club' OR `club` = 'developer-club' OR `club` = 'developers') 
              AND (`role` = 'student' OR `role` IS NULL OR `role` = '')
        ");
        
        // 2. Also normalize in `club_members`
        $pdo->exec("
            UPDATE `club_members` SET `club_slug` = 'developers-club' 
            WHERE `club_slug` = 'Developers Club' OR `club_slug` = 'developer-club' OR `club_slug` = 'developers' OR `club_slug` IS NULL OR `club_slug` = ''
        ");

        // 3. Strictly purge any mentors from `club_members`
        $pdo->exec("
            DELETE FROM `club_members` 
            WHERE `email` IN (SELECT `email` FROM `mentors` WHERE `email` IS NOT NULL AND `email` != '')
               OR `email` IN (SELECT `email` FROM `users` WHERE `role` = 'mentor')
               OR `roll_number` IN (SELECT `roll_number` FROM `users` WHERE `role` = 'mentor')
               OR `roll_number` LIKE 'MENTOR%'
               OR `roll_number` LIKE 'FAC%'
               OR `year_of_study` LIKE '%Faculty%'
               OR `year_of_study` LIKE '%Professor%'
               OR `year_of_study` LIKE '%Lecturer%'
        ");

        // 4. Sync registered students from `users` table into `club_members` (strictly students only, no mentors)
        $usersStmt = $pdo->query("
            SELECT id, name, email, roll_number, year_of_study, club 
            FROM `users` 
            WHERE (`role` = 'student' OR `role` IS NULL OR `role` = '')
              AND (`role` != 'mentor' OR `role` IS NULL)
              AND `roll_number` NOT LIKE 'MENTOR%'
              AND `roll_number` NOT LIKE 'FAC%'
              AND `year_of_study` NOT LIKE '%Professor%'
              AND `year_of_study` NOT LIKE '%Faculty%'
              AND `email` NOT IN (SELECT `email` FROM `mentors` WHERE `email` IS NOT NULL AND `email` != '')
        ");
        if ($usersStmt) {
            $students = $usersStmt->fetchAll();
            foreach ($students as $stu) {
                $roll = trim($stu['roll_number'] ?? '');
                if (empty($roll)) continue;
                $cSlug = normalizeClubSlug($stu['club'] ?? '');
                
                if ($filterClubSlug !== null) {
                    $targetNorm = normalizeClubSlug($filterClubSlug);
                    if ($cSlug !== $targetNorm) {
                        continue;
                    }
                }

                $check = $pdo->prepare("SELECT id, club_slug FROM `club_members` WHERE UPPER(`roll_number`) = UPPER(:roll) LIMIT 1");
                $check->execute([':roll' => $roll]);
                $existing = $check->fetch();
                if (!$existing) {
                    $ins = $pdo->prepare("
                        INSERT INTO `club_members` (`name`, `roll_number`, `email`, `year_of_study`, `department`, `club_slug`, `status`, `phone`)
                        VALUES (:name, :roll, :email, :year, 'CSE', :club, 'active', '')
                    ");
                    $ins->execute([
                        ':name' => $stu['name'] ?: 'SAC Member',
                        ':roll' => $roll,
                        ':email' => $stu['email'] ?: '',
                        ':year' => $stu['year_of_study'] ?: 'Second Year',
                        ':club' => $cSlug
                    ]);
                } else {
                    if (empty($existing['club_slug']) || $existing['club_slug'] !== $cSlug) {
                        $upd = $pdo->prepare("UPDATE `club_members` SET `club_slug` = :cslug, `status` = 'active' WHERE `id` = :id");
                        $upd->execute([':cslug' => $cSlug, ':id' => $existing['id']]);
                    }
                }
            }
        }

        // 4. Sync from applications table
        $appStmt = $pdo->query("SELECT name, email, roll_number, year_of_study, club_slug, status FROM `applications`");
        if ($appStmt) {
            $apps = $appStmt->fetchAll();
            foreach ($apps as $a) {
                $aRoll = trim($a['roll_number'] ?? '');
                if (empty($aRoll)) continue;
                $aClub = normalizeClubSlug($a['club_slug'] ?? '');
                if ($filterClubSlug !== null && $aClub !== normalizeClubSlug($filterClubSlug)) {
                    continue;
                }
                $check = $pdo->prepare("SELECT id FROM `club_members` WHERE UPPER(`roll_number`) = UPPER(:roll) LIMIT 1");
                $check->execute([':roll' => $aRoll]);
                if (!$check->fetch()) {
                    $ins = $pdo->prepare("
                        INSERT INTO `club_members` (`name`, `roll_number`, `email`, `year_of_study`, `department`, `club_slug`, `status`, `phone`)
                        VALUES (:name, :roll, :email, :year, 'CSE', :club, :status, '')
                    ");
                    $ins->execute([
                        ':name' => $a['name'],
                        ':roll' => $aRoll,
                        ':email' => $a['email'] ?? '',
                        ':year' => $a['year_of_study'] ?? 'Second Year',
                        ':club' => $aClub,
                        ':status' => ($a['status'] === 'rejected' ? 'suspended' : 'active')
                    ]);
                }
            }
        }
    } catch (Exception $e) {
        // Silently tolerate sync errors
    }
}

try {
    ensureLmsTables($pdo);
    syncClubMembers($pdo);
    switch ($action) {
        case 'clear_database':
            require_once __DIR__ . '/clear_database.php';
            exit();

        // -------------------------------------------------------------
        // 1. Overview Statistics
        // -------------------------------------------------------------
        case 'overview':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed');
            }

            $councilCount = (int)$pdo->query("SELECT COUNT(*) FROM `executive_council`")->fetchColumn();
            $mentorCount = (int)$pdo->query("SELECT COUNT(*) FROM `mentors`")->fetchColumn();
            $organizerCount = (int)$pdo->query("SELECT COUNT(*) FROM `club_organizers`")->fetchColumn();
            $wingCount = (int)$pdo->query("SELECT COUNT(*) FROM `club_wings`")->fetchColumn();
            $memberCount = (int)$pdo->query("SELECT COUNT(*) FROM `club_members`")->fetchColumn();
            $activeMembers = (int)$pdo->query("SELECT COUNT(*) FROM `club_members` WHERE `status` = 'active'")->fetchColumn();
            $pendingMembers = (int)$pdo->query("SELECT COUNT(*) FROM `club_members` WHERE `status` = 'pending'")->fetchColumn();

            // Events overview (read-only)
            $eventsApproved = (int)$pdo->query("SELECT COUNT(*) FROM `cms_events` WHERE `status` = 'approved'")->fetchColumn();
            $eventsPending = (int)$pdo->query("SELECT COUNT(*) FROM `cms_events` WHERE `status` = 'pending'")->fetchColumn();
            $eventsDraft = (int)$pdo->query("SELECT COUNT(*) FROM `cms_events` WHERE `status` = 'draft'")->fetchColumn();
            $totalEvents = $eventsApproved + $eventsPending + $eventsDraft;

            echo json_encode([
                'success' => true,
                'stats' => [
                    'clubsCount' => 8,
                    'councilCount' => $councilCount,
                    'mentorCount' => $mentorCount,
                    'organizerCount' => $organizerCount,
                    'wingCount' => $wingCount,
                    'totalMembers' => $memberCount,
                    'activeMembers' => $activeMembers,
                    'pendingMembers' => $pendingMembers,
                    'events' => [
                        'total' => $totalEvents,
                        'approved' => $eventsApproved,
                        'pending' => $eventsPending,
                        'draft' => $eventsDraft
                    ]
                ]
            ]);
            break;

        // -------------------------------------------------------------
        // 1b. Club Organizer Dashboard (Scoped to managed club)
        // -------------------------------------------------------------
        case 'organizer_dashboard':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed');
            }
            $clubSlug = trim($_GET['club_slug'] ?? '');
            if (empty($clubSlug)) {
                throw new Exception('club_slug is required');
            }
            $normClub = normalizeClubSlug($clubSlug);
            $clubAliases = getClubSlugAliases($normClub);
            $inClause = implode(',', array_fill(0, count($clubAliases), '?'));

            // Run member sync for this club
            syncClubMembers($pdo, $normClub);

            // Club Organizer info
            $orgStmt = $pdo->prepare("SELECT * FROM `club_organizers` WHERE `club_slug` IN ($inClause) LIMIT 1");
            $orgStmt->execute($clubAliases);
            $organizerInfo = $orgStmt->fetch() ?: null;

            // Sub-wings for this club
            $wingsStmt = $pdo->prepare("SELECT * FROM `club_wings` WHERE `club_slug` IN ($inClause) OR `club_slug` LIKE '%developer%' ORDER BY `id` ASC");
            $wingsStmt->execute($clubAliases);
            $rawWings = $wingsStmt->fetchAll();
            $wings = [];
            $seenWingKeys = [];
            foreach ($rawWings as $w) {
                $wKey = strtolower(trim($w['wing_slug'] ?: $w['wing_name']));
                if (!isset($seenWingKeys[$wKey])) {
                    $seenWingKeys[$wKey] = true;
                    $wings[] = $w;
                }
            }

            // Members for this club (strictly student members only, excluding faculty mentors)
            $membersStmt = $pdo->prepare("
                SELECT * FROM `club_members` 
                WHERE `club_slug` IN ($inClause)
                  AND `roll_number` NOT LIKE 'MENTOR%'
                  AND `roll_number` NOT LIKE 'FAC%'
                  AND `year_of_study` NOT LIKE '%Professor%'
                  AND `year_of_study` NOT LIKE '%Faculty%'
                  AND `year_of_study` NOT LIKE '%Lecturer%'
                  AND `email` NOT IN (SELECT `email` FROM `mentors` WHERE `email` IS NOT NULL AND `email` != '')
                  AND `email` NOT IN (SELECT `email` FROM `users` WHERE `role` = 'mentor')
                  AND `roll_number` NOT IN (SELECT `roll_number` FROM `users` WHERE `role` = 'mentor')
                ORDER BY `name` ASC
            ");
            $membersStmt->execute($clubAliases);
            $members = $membersStmt->fetchAll();

            // Fallback / merge: check registered students in `users` table (excluding mentors)
            $existingRolls = array_map(function($m) { return strtoupper(trim($m['roll_number'] ?? '')); }, $members);
            $uStmt = $pdo->prepare("
                SELECT id, name, email, roll_number, year_of_study, club 
                FROM `users` 
                WHERE (`role` = 'student' OR `role` IS NULL OR `role` = '')
                  AND (`role` != 'mentor' OR `role` IS NULL)
                  AND `roll_number` NOT LIKE 'MENTOR%'
                  AND `roll_number` NOT LIKE 'FAC%'
                  AND `year_of_study` NOT LIKE '%Professor%'
                  AND `year_of_study` NOT LIKE '%Faculty%'
                  AND `email` NOT IN (SELECT `email` FROM `mentors` WHERE `email` IS NOT NULL AND `email` != '')
                  AND (`club` IN ($inClause) OR `club` IS NULL OR `club` = '' OR `club` = 'all')
            ");
            $uStmt->execute($clubAliases);
            $userStudents = $uStmt->fetchAll();
            foreach ($userStudents as $us) {
                $uRoll = strtoupper(trim($us['roll_number'] ?? ''));
                if (!empty($uRoll) && !in_array($uRoll, $existingRolls, true)) {
                    $uClub = normalizeClubSlug($us['club'] ?? '');
                    if ($uClub === $normClub || empty($us['club']) || $us['club'] === 'all' || $normClub === 'developers-club') {
                        $members[] = [
                            'id' => (int)$us['id'],
                            'name' => $us['name'],
                            'roll_number' => $us['roll_number'],
                            'email' => $us['email'],
                            'year_of_study' => !empty($us['year_of_study']) ? $us['year_of_study'] : 'Second Year',
                            'department' => 'CSE',
                            'club_slug' => $normClub,
                            'club_name' => ucwords(str_replace('-', ' ', $normClub)),
                            'wing_name' => '',
                            'status' => 'active',
                            'phone' => '',
                            'joined_at' => date('Y-m-d H:i:s'),
                        ];
                        $existingRolls[] = $uRoll;
                    }
                }
            }

            // Also check `applications` table
            $appStmt = $pdo->prepare("SELECT name, email, roll_number, year_of_study, club_slug, status FROM `applications` WHERE `club_slug` IN ($inClause)");
            $appStmt->execute($clubAliases);
            $appRows = $appStmt->fetchAll();
            foreach ($appRows as $ar) {
                $arRoll = strtoupper(trim($ar['roll_number'] ?? ''));
                if (!empty($arRoll) && !in_array($arRoll, $existingRolls, true)) {
                    $members[] = [
                        'id' => 9000 + count($members),
                        'name' => $ar['name'],
                        'roll_number' => $ar['roll_number'],
                        'email' => $ar['email'] ?? '',
                        'year_of_study' => !empty($ar['year_of_study']) ? $ar['year_of_study'] : 'Second Year',
                        'department' => 'CSE',
                        'club_slug' => $normClub,
                        'club_name' => ucwords(str_replace('-', ' ', $normClub)),
                        'wing_name' => '',
                        'status' => ($ar['status'] === 'rejected' ? 'suspended' : 'active'),
                        'phone' => '',
                        'joined_at' => date('Y-m-d H:i:s'),
                    ];
                    $existingRolls[] = $arRoll;
                }
            }

            $activeCount = 0; $pendingCount = 0; $suspendedCount = 0;
            foreach ($members as $m) {
                if ($m['status'] === 'active') $activeCount++;
                elseif ($m['status'] === 'pending') $pendingCount++;
                elseif ($m['status'] === 'suspended') $suspendedCount++;
                else $activeCount++;
            }

            // Roadmaps for this club
            $rmCondition = ($normClub === 'developers-club')
                ? "(`club_slug` IN ($inClause) OR `club_slug` LIKE '%developer%')"
                : "`club_slug` IN ($inClause)";
            $rmStmt = $pdo->prepare("SELECT * FROM `lms_roadmaps` WHERE $rmCondition ORDER BY `id` ASC");
            $rmStmt->execute($clubAliases);
            $rawRoadmaps = $rmStmt->fetchAll();
            $roadmaps = [];
            $seenRmKeys = [];
            foreach ($rawRoadmaps as $rm) {
                $rmKey = strtolower(trim($rm['sub_club_slug'] ?: $rm['title']));
                if (!isset($seenRmKeys[$rmKey])) {
                    $seenRmKeys[$rmKey] = true;
                    $roadmaps[] = $rm;
                }
            }

            // Enrich roadmaps with phases, modules, lessons
            foreach ($roadmaps as &$rm) {
                $phStmt = $pdo->prepare("SELECT * FROM `lms_roadmap_phases` WHERE `roadmap_id` = :rid ORDER BY `phase_order` ASC");
                $phStmt->execute([':rid' => $rm['id']]);
                $rm['phases'] = $phStmt->fetchAll();
                foreach ($rm['phases'] as &$ph) {
                    $modStmt = $pdo->prepare("SELECT * FROM `lms_roadmap_modules` WHERE `phase_id` = :pid ORDER BY `module_order` ASC");
                    $modStmt->execute([':pid' => $ph['id']]);
                    $ph['modules'] = $modStmt->fetchAll();
                    foreach ($ph['modules'] as &$mod) {
                        $lesStmt = $pdo->prepare("SELECT * FROM `lms_roadmap_lessons` WHERE `module_id` = :mid ORDER BY `lesson_order` ASC");
                        $lesStmt->execute([':mid' => $mod['id']]);
                        $mod['lessons'] = $lesStmt->fetchAll();
                    }
                    unset($mod);
                }
                unset($ph);
            }
            unset($rm);

            // Tasks for this club
            $taskStmt = $pdo->prepare("SELECT * FROM `lms_tasks` WHERE `club_slug` IN ($inClause) OR `club_slug` LIKE '%developer%' ORDER BY `created_at` DESC");
            $taskStmt->execute($clubAliases);
            $rawTasks = $taskStmt->fetchAll();
            $tasks = [];
            $seenTaskKeys = [];
            foreach ($rawTasks as $t) {
                $tKey = strtolower(trim($t['title']));
                if (!isset($seenTaskKeys[$tKey])) {
                    $seenTaskKeys[$tKey] = true;
                    $tasks[] = $t;
                }
            }

            // All task submissions from members of this club (enriched with task details)
            $subStmt = $pdo->prepare("
                SELECT ts.*, 
                       COALESCE(t.title, 'Assignment Task') as task_title,
                       COALESCE(t.max_score, 100) as max_score,
                       COALESCE(t.sub_club_slug, 'web-dev') as task_track
                FROM `lms_task_submissions` ts
                LEFT JOIN `lms_tasks` t ON ts.`task_id` = t.`id`
                WHERE t.`club_slug` IN ($inClause) 
                   OR t.`club_slug` LIKE '%developer%'
                   OR ts.`student_roll` IN (SELECT roll_number FROM `club_members` WHERE `club_slug` IN ($inClause))
                ORDER BY ts.`submitted_at` DESC
            ");
            $subStmt->execute(array_merge($clubAliases, $clubAliases));
            $submissions = $subStmt->fetchAll();

            $pendingSubs = 0; $approvedSubs = 0; $rejectedSubs = 0;
            foreach ($submissions as $s) {
                if ($s['status'] === 'pending' || $s['status'] === 'submitted' || $s['status'] === 'under_review') $pendingSubs++;
                elseif ($s['status'] === 'approved') $approvedSubs++;
                elseif ($s['status'] === 'rejected') $rejectedSubs++;
            }

            // Announcements for this club
            $annStmt = $pdo->prepare("SELECT * FROM `lms_announcements` WHERE `club_slug` IN ($inClause) OR `club_slug` LIKE '%developer%' OR `club_slug` IS NULL OR `club_slug` = '' OR `club_slug` = 'all' ORDER BY `priority` = 'pinned' DESC, `created_at` DESC LIMIT 50");
            $annStmt->execute($clubAliases);
            $rawAnnouncements = $annStmt->fetchAll();
            $announcements = [];
            $seenAnnKeys = [];
            foreach ($rawAnnouncements as $a) {
                $aKey = strtolower(trim($a['title']));
                if (!isset($seenAnnKeys[$aKey])) {
                    $seenAnnKeys[$aKey] = true;
                    $announcements[] = $a;
                }
            }

            // Mentors are not managed by club organizers
            $mentors = [];

            echo json_encode([
                'success' => true,
                'organizer' => $organizerInfo,
                'wings' => $wings,
                'members' => $members,
                'roadmaps' => $roadmaps,
                'tasks' => $tasks,
                'submissions' => $submissions,
                'announcements' => $announcements,
                'mentors' => [],
                'stats' => [
                    'totalMembers' => count($members),
                    'activeMembers' => $activeCount,
                    'pendingMembers' => $pendingCount,
                    'suspendedMembers' => $suspendedCount,
                    'totalWings' => count($wings),
                    'totalRoadmaps' => count($roadmaps),
                    'totalTasks' => count($tasks),
                    'totalSubmissions' => count($submissions),
                    'pendingSubmissions' => $pendingSubs,
                    'approvedSubmissions' => $approvedSubs,
                    'rejectedSubmissions' => $rejectedSubs,
                    'totalAnnouncements' => count($announcements)
                ]
            ]);
            break;

        // -------------------------------------------------------------
        // 2. Executive Council (President, VP, Secretary, Joint Sec, Treasurer, Co-Treasurer)
        // -------------------------------------------------------------
        case 'council':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM `executive_council` ORDER BY `display_order` ASC, `id` ASC");
                $council = $stmt->fetchAll();
                echo json_encode(['success' => true, 'council' => $council]);
            } elseif ($method === 'POST') {
                $data = getJsonPayload();
                $id = !empty($data['id']) ? (int)$data['id'] : null;
                $designation = trim($data['designation'] ?? '');
                $name = trim($data['name'] ?? '');
                $rollNumber = strtoupper(trim($data['roll_number'] ?? ''));
                $email = strtolower(trim($data['email'] ?? ''));
                $phone = trim($data['phone'] ?? '');
                $branchYear = trim($data['branch_year'] ?? '');
                $tenure = trim($data['tenure'] ?? '2025-2026');
                $responsibilities = trim($data['responsibilities'] ?? '');
                $displayOrder = (int)($data['display_order'] ?? 0);

                if (empty($designation) || empty($name) || empty($rollNumber) || empty($email)) {
                    http_response_code(422);
                    echo json_encode(['success' => false, 'message' => 'Designation, Name, Roll Number, and Email are required.']);
                    exit();
                }

                if ($id) {
                    $stmt = $pdo->prepare("
                        UPDATE `executive_council` 
                        SET `designation` = :desig, `name` = :name, `roll_number` = :roll, `email` = :email, 
                            `phone` = :phone, `branch_year` = :branch, `tenure` = :tenure, 
                            `responsibilities` = :resp, `display_order` = :disp
                        WHERE `id` = :id
                    ");
                    $stmt->execute([
                        ':desig' => $designation,
                        ':name' => $name,
                        ':roll' => $rollNumber,
                        ':email' => $email,
                        ':phone' => $phone,
                        ':branch' => $branchYear,
                        ':tenure' => $tenure,
                        ':resp' => $responsibilities,
                        ':disp' => $displayOrder,
                        ':id' => $id
                    ]);
                    $message = "Executive officer '$name' ($designation) updated successfully.";
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO `executive_council` 
                        (`designation`, `name`, `roll_number`, `email`, `phone`, `branch_year`, `tenure`, `responsibilities`, `display_order`)
                        VALUES (:desig, :name, :roll, :email, :phone, :branch, :tenure, :resp, :disp)
                    ");
                    $stmt->execute([
                        ':desig' => $designation,
                        ':name' => $name,
                        ':roll' => $rollNumber,
                        ':email' => $email,
                        ':phone' => $phone,
                        ':branch' => $branchYear,
                        ':tenure' => $tenure,
                        ':resp' => $responsibilities,
                        ':disp' => $displayOrder
                    ]);
                    $id = (int)$pdo->lastInsertId();
                    $message = "Executive officer '$name' ($designation) added successfully.";
                }

                echo json_encode(['success' => true, 'message' => $message, 'id' => $id]);
            } elseif ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                if (!$id) {
                    throw new Exception('Missing officer ID');
                }
                $stmt = $pdo->prepare("DELETE FROM `executive_council` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true, 'message' => 'Executive officer removed successfully.']);
            }
            break;

        // -------------------------------------------------------------
        // 3. Faculty Mentors Management & Club Assignment
        // -------------------------------------------------------------
        case 'mentors':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM `mentors` ORDER BY `name` ASC");
                $mentors = $stmt->fetchAll();
                echo json_encode(['success' => true, 'mentors' => $mentors]);
            } elseif ($method === 'POST') {
                $data = getJsonPayload();
                $id = !empty($data['id']) ? (int)$data['id'] : null;
                $name = trim($data['name'] ?? '');
                $email = strtolower(trim($data['email'] ?? ''));
                $phone = trim($data['phone'] ?? '');
                $department = trim($data['department'] ?? 'CSE');
                $designation = trim($data['designation'] ?? 'Assistant Professor');
                $mentorRole = trim($data['mentor_role'] ?? 'Faculty Mentor');
                $clubSlug = !empty($data['club_slug']) ? trim($data['club_slug']) : (!empty($data['assigned_club_slug']) ? trim($data['assigned_club_slug']) : null);

                if (empty($name)) {
                    http_response_code(422);
                    echo json_encode(['success' => false, 'message' => 'Mentor name is required.']);
                    exit();
                }

                if ($id) {
                    $stmt = $pdo->prepare("
                        UPDATE `mentors`
                        SET `name` = :name, `email` = :email, `phone` = :phone, `department` = :dept, 
                            `designation` = :desig, `mentor_role` = :role, `club_slug` = :club
                        WHERE `id` = :id
                    ");
                    $stmt->execute([
                        ':name' => $name,
                        ':email' => $email,
                        ':phone' => $phone,
                        ':dept' => $department,
                        ':desig' => $designation,
                        ':role' => $mentorRole,
                        ':club' => $clubSlug,
                        ':id' => $id
                    ]);
                    $message = "Mentor '$name' updated successfully.";
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO `mentors` (`name`, `email`, `phone`, `department`, `designation`, `mentor_role`, `club_slug`)
                        VALUES (:name, :email, :phone, :dept, :desig, :role, :club)
                    ");
                    $stmt->execute([
                        ':name' => $name,
                        ':email' => $email,
                        ':phone' => $phone,
                        ':dept' => $department,
                        ':desig' => $designation,
                        ':role' => $mentorRole,
                        ':club' => $clubSlug
                    ]);
                    $id = (int)$pdo->lastInsertId();
                    $message = "Mentor '$name' added successfully.";
                }

                // Sync mentor account into users table so they can log in immediately
                if (!empty($email)) {
                    $uCheck = $pdo->prepare("SELECT id FROM `users` WHERE `email` = :email LIMIT 1");
                    $uCheck->execute([':email' => $email]);
                    $existingUser = $uCheck->fetch();
                    $roll = !empty($phone) ? $phone : ('MENTOR_' . $id);

                    if ($existingUser) {
                        $updUser = $pdo->prepare("
                            UPDATE `users`
                            SET `name` = :name, `role` = 'mentor', `club` = :club, `year_of_study` = :desig
                            WHERE `id` = :uid
                        ");
                        $updUser->execute([
                            ':name' => $name,
                            ':club' => $clubSlug ?: 'developers-club',
                            ':desig' => $designation ?: 'Faculty Mentor',
                            ':uid' => (int)$existingUser['id']
                        ]);
                    } else {
                        $defaultHash = password_hash('password123', PASSWORD_BCRYPT);
                        $insUser = $pdo->prepare("
                            INSERT INTO `users` (`name`, `email`, `roll_number`, `password`, `role`, `year_of_study`, `club`)
                            VALUES (:name, :email, :roll, :pwd, 'mentor', :desig, :club)
                        ");
                        $insUser->execute([
                            ':name' => $name,
                            ':email' => $email,
                            ':roll' => $roll,
                            ':pwd' => $defaultHash,
                            ':desig' => $designation ?: 'Faculty Mentor',
                            ':club' => $clubSlug ?: 'developers-club'
                        ]);
                    }
                }

                echo json_encode(['success' => true, 'message' => $message, 'id' => $id]);
            } elseif ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                if (!$id) {
                    throw new Exception('Missing mentor ID');
                }
                $mRow = $pdo->query("SELECT email FROM `mentors` WHERE `id` = $id")->fetch();
                if ($mRow && !empty($mRow['email'])) {
                    $pdo->prepare("DELETE FROM `users` WHERE `email` = :em AND `role` IN ('mentor', 'club_mentor')")->execute([':em' => $mRow['email']]);
                }
                $stmt = $pdo->prepare("DELETE FROM `mentors` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true, 'message' => 'Mentor removed successfully.']);
            }
            break;

        case 'assign_mentor_club':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed');
            }
            $data = getJsonPayload();
            $mentorId = (int)($data['mentor_id'] ?? 0);
            $clubSlug = !empty($data['club_slug']) ? trim($data['club_slug']) : null;

            if (!$mentorId) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Mentor ID is required.']);
                exit();
            }

            $stmt = $pdo->prepare("UPDATE `mentors` SET `club_slug` = :club WHERE `id` = :id");
            $stmt->execute([':club' => $clubSlug, ':id' => $mentorId]);

            // Sync user account club assignment
            $mRow = $pdo->query("SELECT email FROM `mentors` WHERE `id` = $mentorId")->fetch();
            if ($mRow && !empty($mRow['email'])) {
                $pdo->prepare("UPDATE `users` SET `club` = :club WHERE `email` = :em AND `role` IN ('mentor', 'club_mentor')")->execute([
                    ':club' => $clubSlug ?: 'developers-club',
                    ':em' => $mRow['email']
                ]);
            }

            echo json_encode(['success' => true, 'message' => 'Mentor assigned to club successfully.']);
            break;

        // -------------------------------------------------------------
        // 4. Clubs Governance (Student Organizers & Sub-Wings/Leads)
        // -------------------------------------------------------------
        case 'clubs_governance':
            if ($method === 'GET') {
                // Fetch organizers
                $orgStmt = $pdo->query("SELECT * FROM `club_organizers`");
                $organizers = [];
                foreach ($orgStmt->fetchAll() as $row) {
                    $organizers[$row['club_slug']] = $row;
                }

                // Fetch wings with leads (deduplicated)
                $wingStmt = $pdo->query("SELECT * FROM `club_wings` ORDER BY `club_slug`, `id` ASC");
                $wings = [];
                $seenGovWingKeys = [];
                foreach ($wingStmt->fetchAll() as $row) {
                    $cSlug = $row['club_slug'];
                    $wKey = strtolower(trim($row['wing_slug'] ?: $row['wing_name']));
                    if (!isset($seenGovWingKeys[$cSlug][$wKey])) {
                        $seenGovWingKeys[$cSlug][$wKey] = true;
                        $wings[$cSlug][] = $row;
                    }
                }

                // Fetch mentors
                $menStmt = $pdo->query("SELECT * FROM `mentors`");
                $mentors = [];
                foreach ($menStmt->fetchAll() as $row) {
                    if (!empty($row['club_slug'])) {
                        $mentors[$row['club_slug']][] = $row;
                    }
                }

                // Fetch member counts per club
                $countStmt = $pdo->query("SELECT `club_slug`, COUNT(*) as cnt FROM `club_members` GROUP BY `club_slug`");
                $memberCounts = [];
                foreach ($countStmt->fetchAll() as $row) {
                    $memberCounts[$row['club_slug']] = (int)$row['cnt'];
                }

                echo json_encode([
                    'success' => true,
                    'organizers' => (object)$organizers,
                    'wings' => (object)$wings,
                    'mentors' => (object)$mentors,
                    'memberCounts' => (object)$memberCounts
                ]);
            }
            break;

        case 'update_organizer':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed');
            }
            $data = getJsonPayload();
            $clubSlug = trim($data['club_slug'] ?? '');
            $name = trim($data['organizer_name'] ?? '');
            $rollNumber = strtoupper(trim($data['organizer_roll_number'] ?? ''));
            $email = strtolower(trim($data['organizer_email'] ?? ''));
            $year = trim($data['organizer_year'] ?? '');
            $phone = trim($data['organizer_phone'] ?? '');

            if (empty($clubSlug) || empty($name) || empty($rollNumber)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Club slug, organizer name, and roll number are required.']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO `club_organizers` 
                (`club_slug`, `organizer_name`, `organizer_roll_number`, `organizer_email`, `organizer_year`, `organizer_phone`)
                VALUES (:club, :name, :roll, :email, :year, :phone)
                ON DUPLICATE KEY UPDATE 
                    `organizer_name` = VALUES(`organizer_name`),
                    `organizer_roll_number` = VALUES(`organizer_roll_number`),
                    `organizer_email` = VALUES(`organizer_email`),
                    `organizer_year` = VALUES(`organizer_year`),
                    `organizer_phone` = VALUES(`organizer_phone`)
            ");
            $stmt->execute([
                ':club' => $clubSlug,
                ':name' => $name,
                ':roll' => $rollNumber,
                ':email' => $email,
                ':year' => $year,
                ':phone' => $phone
            ]);

            // Synchronize role change in `users` table: member becomes 'club_organizer'
            if (!empty($rollNumber) || !empty($email)) {
                $updUser = $pdo->prepare("
                    UPDATE `users` 
                    SET `role` = 'club_organizer', `club` = :club 
                    WHERE UPPER(`roll_number`) = UPPER(:roll) OR (`email` = :email AND :email != '')
                ");
                $updUser->execute([
                    ':club' => $clubSlug,
                    ':roll' => $rollNumber,
                    ':email' => $email
                ]);
            }

            echo json_encode(['success' => true, 'message' => "Student Organizer for '$clubSlug' updated successfully."]);
            break;

        case 'save_wing':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed');
            }
            $data = getJsonPayload();
            $id = !empty($data['id']) ? (int)$data['id'] : null;
            $clubSlug = trim($data['club_slug'] ?? '');
            $wingName = trim($data['wing_name'] ?? '');
            $wingSlug = trim($data['wing_slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $wingName)));
            $leadName = !empty(trim($data['lead_name'] ?? '')) ? trim($data['lead_name']) : null;
            $leadRoll = !empty(trim($data['lead_roll_number'] ?? '')) ? strtoupper(trim($data['lead_roll_number'])) : null;
            $leadEmail = !empty(trim($data['lead_email'] ?? '')) ? strtolower(trim($data['lead_email'])) : null;
            $leadYear = !empty(trim($data['lead_year'] ?? '')) ? trim($data['lead_year']) : null;
            $leadPhone = !empty(trim($data['lead_phone'] ?? '')) ? trim($data['lead_phone']) : null;
            $desc = trim($data['description'] ?? '');

            if (empty($clubSlug) || empty($wingName)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Club slug and wing name are required.']);
                exit();
            }

            if ($id) {
                $stmt = $pdo->prepare("
                    UPDATE `club_wings`
                    SET `wing_name` = :wname, `wing_slug` = :wslug, `lead_name` = :lname, 
                        `lead_roll_number` = :lroll, `lead_email` = :lemail, `lead_year` = :lyear, 
                        `lead_phone` = :lphone, `description` = :desc
                    WHERE `id` = :id
                ");
                $stmt->execute([
                    ':wname' => $wingName,
                    ':wslug' => $wingSlug,
                    ':lname' => $leadName,
                    ':lroll' => $leadRoll,
                    ':lemail' => $leadEmail,
                    ':lyear' => $leadYear,
                    ':lphone' => $leadPhone,
                    ':desc' => $desc,
                    ':id' => $id
                ]);
                $message = "Sub-wing '$wingName' updated successfully.";
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `club_wings` 
                    (`club_slug`, `wing_name`, `wing_slug`, `lead_name`, `lead_roll_number`, `lead_email`, `lead_year`, `lead_phone`, `description`)
                    VALUES (:club, :wname, :wslug, :lname, :lroll, :lemail, :lyear, :lphone, :desc)
                ");
                $stmt->execute([
                    ':club' => $clubSlug,
                    ':wname' => $wingName,
                    ':wslug' => $wingSlug,
                    ':lname' => $leadName,
                    ':lroll' => $leadRoll,
                    ':lemail' => $leadEmail,
                    ':lyear' => $leadYear,
                    ':lphone' => $leadPhone,
                    ':desc' => $desc
                ]);
                $id = (int)$pdo->lastInsertId();
                $message = "Sub-wing '$wingName' created successfully.";
            }

            // If lead roll number was appointed, associate them with this wing in club_members
            if (!empty($leadRoll)) {
                $updM = $pdo->prepare("UPDATE `club_members` SET `wing_name` = :wname WHERE UPPER(`roll_number`) = UPPER(:roll)");
                $updM->execute([':wname' => $wingName, ':roll' => $leadRoll]);

                // Synchronize role change in `users` table: member becomes 'club_lead'
                $updUser = $pdo->prepare("
                    UPDATE `users` 
                    SET `role` = 'club_lead', `club` = :club 
                    WHERE UPPER(`roll_number`) = UPPER(:roll) OR (`email` = :email AND :email != '')
                ");
                $updUser->execute([
                    ':club' => $clubSlug,
                    ':roll' => $leadRoll,
                    ':email' => $leadEmail ?: ''
                ]);
            }

            echo json_encode(['success' => true, 'message' => $message, 'id' => $id]);
            break;

        case 'delete_wing':
            if ($method !== 'DELETE' && $method !== 'POST') {
                throw new Exception('Method not allowed');
            }
            $data = getJsonPayload();
            $id = (int)($data['id'] ?? ($_GET['id'] ?? ($_POST['id'] ?? 0)));
            if (!$id) {
                throw new Exception('Missing wing ID');
            }
            $stmt = $pdo->prepare("DELETE FROM `club_wings` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(['success' => true, 'message' => 'Sub-wing deleted successfully.']);
            break;

        // -------------------------------------------------------------
        // 5. Student Members Management
        // -------------------------------------------------------------
        case 'members':
            if ($method === 'GET') {
                $club = trim($_GET['club'] ?? '');
                $wing = trim($_GET['wing'] ?? '');
                $status = trim($_GET['status'] ?? '');
                $search = trim($_GET['search'] ?? '');

                if (!empty($club) && $club !== 'all') {
                    $normClub = normalizeClubSlug($club);
                    syncClubMembers($pdo, $normClub);
                    $clubAliases = getClubSlugAliases($normClub);
                } else {
                    syncClubMembers($pdo);
                    $clubAliases = [];
                }

                $query = "SELECT * FROM `club_members` 
                          WHERE 1=1 
                            AND `roll_number` NOT LIKE 'MENTOR%'
                            AND `roll_number` NOT LIKE 'FAC%'
                            AND `year_of_study` NOT LIKE '%Professor%'
                            AND `year_of_study` NOT LIKE '%Faculty%'
                            AND `year_of_study` NOT LIKE '%Lecturer%'
                            AND `email` NOT IN (SELECT `email` FROM `mentors` WHERE `email` IS NOT NULL AND `email` != '')
                            AND `email` NOT IN (SELECT `email` FROM `users` WHERE `role` = 'mentor')
                            AND `roll_number` NOT IN (SELECT `roll_number` FROM `users` WHERE `role` = 'mentor')";
                $params = [];

                if (!empty($clubAliases)) {
                    $inClause = implode(',', array_fill(0, count($clubAliases), '?'));
                    $query .= " AND `club_slug` IN ($inClause)";
                    $params = array_merge($params, $clubAliases);
                }
                if (!empty($wing) && $wing !== 'all') {
                    $query .= " AND `wing_name` = ?";
                    $params[] = $wing;
                }
                if (!empty($status) && $status !== 'all') {
                    $query .= " AND `status` = ?";
                    $params[] = $status;
                }
                if (!empty($search)) {
                    $query .= " AND (`name` LIKE ? OR `roll_number` LIKE ? OR `email` LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }

                $query .= " ORDER BY `id` DESC LIMIT 100";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $members = $stmt->fetchAll();

                // Also merge any registered students from `users` table who might not be in `club_members` yet
                try {
                    $existingRolls = array_map(function($m) { return strtoupper(trim($m['roll_number'] ?? '')); }, $members);
                    $uQuery = "SELECT id, name, email, roll_number, year_of_study, club FROM `users` 
                               WHERE (`role` = 'student' OR `role` IS NULL OR `role` = '') 
                                 AND (`role` != 'mentor' OR `role` IS NULL)
                                 AND `roll_number` NOT LIKE 'MENTOR%'
                                 AND `roll_number` NOT LIKE 'FAC%'
                                 AND `year_of_study` NOT LIKE '%Professor%'
                                 AND `year_of_study` NOT LIKE '%Faculty%'
                                 AND `email` NOT IN (SELECT `email` FROM `mentors` WHERE `email` IS NOT NULL AND `email` != '')";
                    $uParams = [];

                    if (!empty($clubAliases)) {
                        $inClauseU = implode(',', array_fill(0, count($clubAliases), '?'));
                        $uQuery .= " AND (`club` IN ($inClauseU) OR `club` IS NULL OR `club` = '' OR `club` = 'all')";
                        $uParams = array_merge($uParams, $clubAliases);
                    }
                    if (!empty($search)) {
                        $uQuery .= " AND (`name` LIKE ? OR `roll_number` LIKE ? OR `email` LIKE ?)";
                        $uParams[] = "%$search%";
                        $uParams[] = "%$search%";
                        $uParams[] = "%$search%";
                    }
                    $uQuery .= " ORDER BY `id` DESC LIMIT 100";
                    $uStmt = $pdo->prepare($uQuery);
                    $uStmt->execute($uParams);
                    $usersStudents = $uStmt->fetchAll();

                    foreach ($usersStudents as $us) {
                        $roll = strtoupper(trim($us['roll_number'] ?? ''));
                        if (!empty($roll) && !in_array($roll, $existingRolls, true)) {
                            $userClubSlug = normalizeClubSlug($us['club'] ?? '');
                            if (empty($clubAliases) || in_array($userClubSlug, $clubAliases, true) || empty($us['club']) || $us['club'] === 'all' || (isset($normClub) && $normClub === 'developers-club')) {
                                $members[] = [
                                    'id' => (int)$us['id'],
                                    'name' => $us['name'],
                                    'roll_number' => $us['roll_number'],
                                    'email' => $us['email'],
                                    'year_of_study' => !empty($us['year_of_study']) ? $us['year_of_study'] : 'Second Year',
                                    'department' => 'CSE',
                                    'club_slug' => !empty($userClubSlug) ? $userClubSlug : 'developers-club',
                                    'club_name' => ucwords(str_replace('-', ' ', !empty($userClubSlug) ? $userClubSlug : 'developers-club')),
                                    'wing_name' => '',
                                    'status' => 'active',
                                    'phone' => '',
                                    'joined_at' => date('Y-m-d H:i:s'),
                                ];
                                $existingRolls[] = $roll;
                            }
                        }
                    }
                } catch (Exception $e) {
                    // Ignore fallback errors
                }

                $clubNames = [
                    'developers-club' => 'Developers Club',
                    'robotics-club' => 'Robotics Club',
                    'ai-club' => 'AI & Deep Learning Club',
                    'cyber-security-club' => 'Cyber Security Club',
                    'iot-club' => 'IoT & Embedded Systems Club',
                    'cloud-devops-club' => 'Cloud & DevOps Club',
                    'design-club' => 'UI/UX & Creative Club',
                    'coding-club' => 'Competitive Coding Club',
                ];
                foreach ($members as &$m) {
                    $slug = $m['club_slug'] ?? '';
                    if (empty($m['club_name'])) {
                        $m['club_name'] = $clubNames[$slug] ?? ucwords(str_replace('-', ' ', $slug));
                    }
                }
                unset($m);

                echo json_encode(['success' => true, 'members' => $members, 'count' => count($members)]);
            } elseif ($method === 'POST') {
                $data = getJsonPayload();
                $id = !empty($data['id']) ? (int)$data['id'] : null;
                $name = trim($data['name'] ?? '');
                $rollNumber = strtoupper(trim($data['roll_number'] ?? ''));
                $email = strtolower(trim($data['email'] ?? ''));
                $yearOfStudy = trim($data['year_of_study'] ?? 'First Year');
                $department = trim($data['department'] ?? 'CSE');
                $clubSlug = trim($data['club_slug'] ?? 'developers-club');
                $wingName = trim($data['wing_name'] ?? '');
                $status = trim($data['status'] ?? 'active');
                $phone = trim($data['phone'] ?? '');

                // Fast-track: If only updating wing_name for an existing member
                if ($id && !empty($wingName) && empty($name)) {
                    $stmt = $pdo->prepare("UPDATE `club_members` SET `wing_name` = :wing WHERE `id` = :id");
                    $stmt->execute([':wing' => $wingName, ':id' => $id]);
                    echo json_encode(['success' => true, 'message' => "Wing updated to '$wingName'."]);
                    exit();
                }
                if (!empty($rollNumber) && !empty($wingName) && empty($name)) {
                    $stmt = $pdo->prepare("UPDATE `club_members` SET `wing_name` = :wing WHERE UPPER(`roll_number`) = :roll");
                    $stmt->execute([':wing' => $wingName, ':roll' => $rollNumber]);
                    echo json_encode(['success' => true, 'message' => "Wing updated to '$wingName'."]);
                    exit();
                }

                if (empty($name) || empty($rollNumber) || empty($email)) {
                    http_response_code(422);
                    echo json_encode(['success' => false, 'message' => 'Name, roll number, and email are required.']);
                    exit();
                }

                if ($id) {
                    $stmt = $pdo->prepare("
                        UPDATE `club_members`
                        SET `name` = :name, `roll_number` = :roll, `email` = :email, `year_of_study` = :year,
                            `department` = :dept, `club_slug` = :club, `wing_name` = :wing, 
                            `status` = :status, `phone` = :phone
                        WHERE `id` = :id
                    ");
                    $stmt->execute([
                        ':name' => $name,
                        ':roll' => $rollNumber,
                        ':email' => $email,
                        ':year' => $yearOfStudy,
                        ':dept' => $department,
                        ':club' => $clubSlug,
                        ':wing' => $wingName,
                        ':status' => $status,
                        ':phone' => $phone,
                        ':id' => $id
                    ]);
                    $message = "Member '$name' updated successfully.";
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO `club_members` 
                        (`name`, `roll_number`, `email`, `year_of_study`, `department`, `club_slug`, `wing_name`, `status`, `phone`)
                        VALUES (:name, :roll, :email, :year, :dept, :club, :wing, :status, :phone)
                    ");
                    $stmt->execute([
                        ':name' => $name,
                        ':roll' => $rollNumber,
                        ':email' => $email,
                        ':year' => $yearOfStudy,
                        ':dept' => $department,
                        ':club' => $clubSlug,
                        ':wing' => $wingName,
                        ':status' => $status,
                        ':phone' => $phone
                    ]);
                    $id = (int)$pdo->lastInsertId();
                    $message = "Member '$name' enrolled successfully.";
                }

                echo json_encode(['success' => true, 'message' => $message, 'id' => $id]);
            } elseif ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                $roll = strtoupper(trim($_GET['roll'] ?? ''));
                $email = strtolower(trim($_GET['email'] ?? ''));

                if (!$id && empty($roll) && empty($email)) {
                    throw new Exception('Missing member identifier');
                }

                // 1. Fetch details before deletion if not passed
                if ($id && (empty($roll) || empty($email))) {
                    $mStmt = $pdo->prepare("SELECT `roll_number`, `email` FROM `club_members` WHERE `id` = :id");
                    $mStmt->execute([':id' => $id]);
                    $mRow = $mStmt->fetch();
                    if ($mRow) {
                        if (empty($roll)) $roll = strtoupper(trim($mRow['roll_number'] ?? ''));
                        if (empty($email)) $email = strtolower(trim($mRow['email'] ?? ''));
                    } else {
                        // Check users table in case id is from users
                        $uStmt = $pdo->prepare("SELECT `roll_number`, `email` FROM `users` WHERE `id` = :id AND `role` = 'student'");
                        $uStmt->execute([':id' => $id]);
                        $uRow = $uStmt->fetch();
                        if ($uRow) {
                            if (empty($roll)) $roll = strtoupper(trim($uRow['roll_number'] ?? ''));
                            if (empty($email)) $email = strtolower(trim($uRow['email'] ?? ''));
                        }
                    }
                }

                // 2. Delete from `club_members` table
                if ($id) {
                    $delStmt = $pdo->prepare("DELETE FROM `club_members` WHERE `id` = :id");
                    $delStmt->execute([':id' => $id]);
                }
                if (!empty($roll)) {
                    $delRoll = $pdo->prepare("DELETE FROM `club_members` WHERE `roll_number` = :roll");
                    $delRoll->execute([':roll' => $roll]);
                }
                if (!empty($email)) {
                    $delMail = $pdo->prepare("DELETE FROM `club_members` WHERE `email` = :email");
                    $delMail->execute([':email' => $email]);
                }

                // 3. Delete from `users` table (student accounts only)
                if (!empty($roll) || !empty($email)) {
                    $delUser = $pdo->prepare("DELETE FROM `users` WHERE `role` = 'student' AND (`roll_number` = :roll OR `email` = :email)");
                    $delUser->execute([':roll' => $roll, ':email' => $email]);
                } elseif ($id) {
                    $delUser = $pdo->prepare("DELETE FROM `users` WHERE `id` = :id AND `role` = 'student'");
                    $delUser->execute([':id' => $id]);
                }

                // 4. Delete from `applications` table
                if (!empty($roll) || !empty($email)) {
                    $delApp = $pdo->prepare("DELETE FROM `applications` WHERE `roll_number` = :roll OR `email` = :email");
                    $delApp->execute([':roll' => $roll, ':email' => $email]);
                }

                // 5. Clean up task submissions and progress
                if (!empty($roll)) {
                    $delSub = $pdo->prepare("DELETE FROM `lms_task_submissions` WHERE `student_roll` = :roll");
                    $delSub->execute([':roll' => $roll]);

                    $delProg = $pdo->prepare("DELETE FROM `lms_member_progress` WHERE `student_roll` = :roll");
                    $delProg->execute([':roll' => $roll]);
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Member and user account permanently deleted.'
                ]);
                exit();
            }
            break;

        case 'update_member_status':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed');
            }
            $data = getJsonPayload();
            $id = (int)($data['id'] ?? 0);
            $status = trim($data['status'] ?? 'active');

            if (!$id) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Member ID is required.']);
                exit();
            }

            $stmt = $pdo->prepare("UPDATE `club_members` SET `status` = :status WHERE `id` = :id");
            $stmt->execute([':status' => $status, ':id' => $id]);

            echo json_encode(['success' => true, 'message' => "Member status updated to '$status'."]);
            break;

        // -------------------------------------------------------------
        // 6. Events Monitor (Strictly Read-Only as requested)
        // -------------------------------------------------------------
        case 'events_readonly':
            if ($method !== 'GET') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Events are display-only in this portal. Modifying events is restricted.']);
                exit();
            }

            $statusFilter = trim($_GET['status'] ?? 'all');
            $search = trim($_GET['search'] ?? '');

            $query = "SELECT * FROM `cms_events` WHERE 1=1";
            $params = [];

            if (!empty($statusFilter) && $statusFilter !== 'all') {
                $query .= " AND `status` = :status";
                $params[':status'] = $statusFilter;
            }
            if (!empty($search)) {
                $query .= " AND (`title` LIKE :search OR `club` LIKE :search OR `location` LIKE :search OR `organizer` LIKE :search)";
                $params[':search'] = "%$search%";
            }

            $query .= " ORDER BY `created_at` DESC";
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $events = $stmt->fetchAll();

            // Decode JSON highlights
            foreach ($events as &$e) {
                if (!empty($e['highlights']) && is_string($e['highlights'])) {
                    $e['highlights'] = json_decode($e['highlights'], true) ?? [];
                }
            }

            echo json_encode([
                'success' => true,
                'readonly' => true,
                'events' => $events,
                'count' => count($events)
            ]);
            break;

        // -------------------------------------------------------------
        // 7. LMS: User Role Assignments & Scoped Roles
        // -------------------------------------------------------------
        case 'roles_list':
            if ($method !== 'GET') throw new Exception('Method not allowed');
            $stmt = $pdo->query("SELECT * FROM `lms_roles` ORDER BY `id` ASC");
            echo json_encode(['success' => true, 'roles' => $stmt->fetchAll()]);
            break;

        case 'user_roles':
            if ($method === 'GET') {
                $userId = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : null;
                $query = "
                    SELECT ur.*, u.name as user_name, u.email as user_email, u.roll_number, r.role_name, r.description as role_description
                    FROM `lms_user_roles` ur
                    JOIN `users` u ON ur.user_id = u.id
                    JOIN `lms_roles` r ON ur.role_key = r.role_key
                    WHERE ur.is_active = 1
                ";
                $params = [];
                if ($userId) {
                    $query .= " AND ur.user_id = :uid";
                    $params[':uid'] = $userId;
                }
                $query .= " ORDER BY ur.id DESC";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'user_roles' => $stmt->fetchAll()]);
            } elseif ($method === 'POST') {
                $data = getJsonPayload();
                $userId = (int)($data['user_id'] ?? 0);
                $roleKey = trim($data['role_key'] ?? '');
                $clubSlug = !empty($data['club_slug']) ? trim($data['club_slug']) : null;
                $subClubSlug = !empty($data['sub_club_slug']) ? trim($data['sub_club_slug']) : null;
                $assignedBy = trim($data['assigned_by'] ?? 'LMS Admin');
                $notes = trim($data['notes'] ?? '');

                if (!$userId || empty($roleKey)) {
                    http_response_code(422);
                    echo json_encode(['success' => false, 'message' => 'User ID and Role Key are required.']);
                    exit();
                }

                $stmt = $pdo->prepare("
                    INSERT INTO `lms_user_roles` (`user_id`, `role_key`, `club_slug`, `sub_club_slug`, `is_active`, `assigned_by`, `notes`)
                    VALUES (:uid, :rkey, :cslug, :scslug, 1, :aby, :notes)
                ");
                $stmt->execute([
                    ':uid' => $userId,
                    ':rkey' => $roleKey,
                    ':cslug' => $clubSlug,
                    ':scslug' => $subClubSlug,
                    ':aby' => $assignedBy,
                    ':notes' => $notes
                ]);

                // Also update primary user.role if admin or lead
                if (in_array($roleKey, ['admin', 'club_lead', 'lead'])) {
                    $mapped = ($roleKey === 'admin') ? 'admin' : 'lead';
                    $pdo->prepare("UPDATE `users` SET `role` = :r WHERE `id` = :id")->execute([':r' => $mapped, ':id' => $userId]);
                }

                // Send notification to user
                sendNotification($pdo, $userId, 'New Role Assigned', "You have been assigned the role: $roleKey" . ($clubSlug ? " in $clubSlug" : "") . ".", '/lms', 'role');
                recordAuditLog($pdo, $assignedBy, 'Admin', 'ASSIGN_ROLE', 'USER_ROLE', (string)$userId, "Assigned role $roleKey to user $userId");

                echo json_encode(['success' => true, 'message' => 'Role assigned successfully.']);
            } elseif ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                if (!$id) throw new Exception('Missing role assignment ID');
                $stmt = $pdo->prepare("UPDATE `lms_user_roles` SET `is_active` = 0 WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
                recordAuditLog($pdo, 'Admin', 'Admin', 'REVOKE_ROLE', 'USER_ROLE', (string)$id, 'Deactivated role assignment');
                echo json_encode(['success' => true, 'message' => 'Role assignment revoked.']);
            }
            break;

        // -------------------------------------------------------------
        // 8. LMS: Roadmaps, Modules, Lessons & Member Progress
        // -------------------------------------------------------------
        case 'roadmaps':
            if ($method !== 'GET') throw new Exception('Method not allowed');
            $clubSlug = trim($_GET['club_slug'] ?? '');
            $subClubSlug = trim($_GET['sub_club_slug'] ?? '');
            $userId = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : null;
            $includeInactive = !empty($_GET['all']) || !empty($_GET['include_inactive']);

            $rmQuery = "SELECT * FROM `lms_roadmaps` WHERE 1=1";
            if (!$includeInactive) {
                $rmQuery .= " AND `is_active` = 1";
            }
            $params = [];
            if (!empty($clubSlug) && $clubSlug !== 'all') {
                $normClub = normalizeClubSlug($clubSlug);
                $clubAliases = getClubSlugAliases($normClub);
                $inClause = implode(',', array_fill(0, count($clubAliases), '?'));
                if ($normClub === 'developers-club') {
                    $rmQuery .= " AND (`club_slug` IN ($inClause) OR `club_slug` LIKE '%developer%')";
                } else {
                    $rmQuery .= " AND `club_slug` IN ($inClause)";
                }
                $params = array_merge($params, $clubAliases);
            }
            if (!empty($subClubSlug) && $subClubSlug !== 'all') {
                $rmQuery .= " AND (`sub_club_slug` = ? OR `sub_club_slug` IS NULL)";
                $params[] = $subClubSlug;
            }
            $rmQuery .= " ORDER BY `id` ASC";

            $stmt = $pdo->prepare($rmQuery);
            $stmt->execute($params);
            $rawRoadmaps = $stmt->fetchAll();
            $roadmaps = [];
            $seenKeys = [];
            foreach ($rawRoadmaps as $rm) {
                $slugKey = strtolower(trim($rm['sub_club_slug'] ?? ''));
                $titleKey = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $rm['title'] ?? '')));
                
                if (!empty($slugKey) && isset($seenKeys['slug::' . $slugKey])) {
                    continue;
                }
                if (!empty($titleKey) && isset($seenKeys['title::' . $titleKey])) {
                    continue;
                }
                
                if (!empty($slugKey)) $seenKeys['slug::' . $slugKey] = true;
                if (!empty($titleKey)) $seenKeys['title::' . $titleKey] = true;
                
                $roadmaps[] = $rm;
            }

            // Fetch progress map for user if logged in
            $progressMap = [];
            if ($userId) {
                $progStmt = $pdo->prepare("SELECT `lesson_id`, `status` FROM `lms_member_progress` WHERE `user_id` = :uid");
                $progStmt->execute([':uid' => $userId]);
                foreach ($progStmt->fetchAll() as $row) {
                    $progressMap[$row['lesson_id']] = $row['status'];
                }
            }

            // Build hierarchy
            foreach ($roadmaps as &$rm) {
                $pStmt = $pdo->prepare("SELECT * FROM `lms_roadmap_phases` WHERE `roadmap_id` = :rmid ORDER BY `phase_order` ASC");
                $pStmt->execute([':rmid' => $rm['id']]);
                $phases = $pStmt->fetchAll();

                $totalLessons = 0;
                $completedLessons = 0;

                foreach ($phases as &$phase) {
                    $mStmt = $pdo->prepare("SELECT * FROM `lms_roadmap_modules` WHERE `phase_id` = :pid ORDER BY `module_order` ASC");
                    $mStmt->execute([':pid' => $phase['id']]);
                    $modules = $mStmt->fetchAll();

                    foreach ($modules as &$mod) {
                        $lStmt = $pdo->prepare("SELECT * FROM `lms_roadmap_lessons` WHERE `module_id` = :mid ORDER BY `lesson_order` ASC");
                        $lStmt->execute([':mid' => $mod['id']]);
                        $lessons = $lStmt->fetchAll();

                        foreach ($lessons as &$lesson) {
                            $totalLessons++;
                            $lesson['status'] = $progressMap[$lesson['id']] ?? 'not_started';
                            if ($lesson['status'] === 'completed') {
                                $completedLessons++;
                            }
                        }
                        $mod['lessons'] = $lessons;
                    }
                    $phase['modules'] = $modules;
                }
                $rm['phases'] = $phases;
                $rm['totalLessons'] = $totalLessons;
                $rm['completedLessons'] = $completedLessons;
                $rm['progressPct'] = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;
            }

            echo json_encode(['success' => true, 'roadmaps' => $roadmaps]);
            break;

        case 'save_roadmap':
            if ($method !== 'POST') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $id = !empty($data['id']) ? (int)$data['id'] : null;
            $clubSlug = trim($data['club_slug'] ?? 'developers-club');
            $subClubSlug = !empty($data['sub_club_slug']) ? trim($data['sub_club_slug']) : null;
            $title = trim($data['title'] ?? '');
            $desc = trim($data['description'] ?? '');
            $createdBy = trim($data['created_by'] ?? 'Club Organizer');
            $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;

            if (empty($clubSlug) || empty($title)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Club slug and Title are required.']);
                exit();
            }

            if ($id) {
                $stmt = $pdo->prepare("UPDATE `lms_roadmaps` SET `club_slug` = :c, `sub_club_slug` = :sc, `title` = :t, `description` = :d, `is_active` = :act WHERE `id` = :id");
                $stmt->execute([':c' => $clubSlug, ':sc' => $subClubSlug, ':t' => $title, ':d' => $desc, ':act' => $isActive, ':id' => $id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO `lms_roadmaps` (`club_slug`, `sub_club_slug`, `title`, `description`, `is_active`, `created_by`) VALUES (:c, :sc, :t, :d, :act, :by)");
                $stmt->execute([':c' => $clubSlug, ':sc' => $subClubSlug, ':t' => $title, ':d' => $desc, ':act' => $isActive, ':by' => $createdBy]);
                $id = (int)$pdo->lastInsertId();
            }

            // If phases array provided, sync phases, modules, lessons
            if (isset($data['phases']) && is_array($data['phases'])) {
                // Remove existing hierarchy for clean sync
                $pdo->prepare("DELETE l FROM `lms_roadmap_lessons` l JOIN `lms_roadmap_modules` m ON l.module_id = m.id JOIN `lms_roadmap_phases` p ON m.phase_id = p.id WHERE p.roadmap_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE m FROM `lms_roadmap_modules` m JOIN `lms_roadmap_phases` p ON m.phase_id = p.id WHERE p.roadmap_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM `lms_roadmap_phases` WHERE `roadmap_id` = :id")->execute([':id' => $id]);

                $phOrder = 1;
                foreach ($data['phases'] as $ph) {
                    $phTitle = trim($ph['title'] ?? "Phase $phOrder");
                    $phDesc = trim($ph['description'] ?? '');
                    $pStmt = $pdo->prepare("INSERT INTO `lms_roadmap_phases` (`roadmap_id`, `title`, `description`, `phase_order`) VALUES (:rid, :t, :d, :ord)");
                    $pStmt->execute([':rid' => $id, ':t' => $phTitle, ':d' => $phDesc, ':ord' => $phOrder++]);
                    $phaseId = (int)$pdo->lastInsertId();

                    if (!empty($ph['modules']) && is_array($ph['modules'])) {
                        $modOrder = 1;
                        foreach ($ph['modules'] as $mod) {
                            $mTitle = trim($mod['title'] ?? "Module $modOrder");
                            $mDesc = trim($mod['description'] ?? '');
                            $mHours = (int)($mod['estimated_hours'] ?? 8);
                            $mStmt = $pdo->prepare("INSERT INTO `lms_roadmap_modules` (`phase_id`, `title`, `description`, `estimated_hours`, `module_order`) VALUES (:pid, :t, :d, :h, :ord)");
                            $mStmt->execute([':pid' => $phaseId, ':t' => $mTitle, ':d' => $mDesc, ':h' => $mHours, ':ord' => $modOrder++]);
                            $moduleId = (int)$pdo->lastInsertId();

                            if (!empty($mod['lessons']) && is_array($mod['lessons'])) {
                                $lesOrder = 1;
                                foreach ($mod['lessons'] as $les) {
                                    $lTitle = trim($les['title'] ?? "Lesson $lesOrder");
                                    $lContent = trim($les['content'] ?? '');
                                    $lUrl = trim($les['resource_url'] ?? '');
                                    $lStmt = $pdo->prepare("INSERT INTO `lms_roadmap_lessons` (`module_id`, `title`, `content`, `resource_url`, `lesson_order`) VALUES (:mid, :t, :c, :u, :ord)");
                                    $lStmt->execute([':mid' => $moduleId, ':t' => $lTitle, ':c' => $lContent, ':u' => $lUrl, ':ord' => $lesOrder++]);
                                }
                            }
                        }
                    }
                }
            }

            recordAuditLog($pdo, $createdBy, 'Organizer/Lead', 'SAVE_ROADMAP', 'ROADMAP', (string)$id, "Saved roadmap '$title'");
            echo json_encode(['success' => true, 'message' => 'Roadmap saved successfully.', 'id' => $id]);
            break;

        case 'delete_roadmap':
            if ($method !== 'POST' && $method !== 'DELETE') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
            if (!$id) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Roadmap ID is required.']);
                exit();
            }
            $pdo->prepare("DELETE l FROM `lms_roadmap_lessons` l JOIN `lms_roadmap_modules` m ON l.module_id = m.id JOIN `lms_roadmap_phases` p ON m.phase_id = p.id WHERE p.roadmap_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE m FROM `lms_roadmap_modules` m JOIN `lms_roadmap_phases` p ON m.phase_id = p.id WHERE p.roadmap_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM `lms_roadmap_phases` WHERE `roadmap_id` = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM `lms_roadmaps` WHERE `id` = :id")->execute([':id' => $id]);
            echo json_encode(['success' => true, 'message' => 'Roadmap deleted successfully.']);
            break;

        case 'mark_lesson_progress':
            if ($method !== 'POST') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $userId = (int)($data['user_id'] ?? 0);
            $lessonId = (int)($data['lesson_id'] ?? 0);
            $moduleId = !empty($data['module_id']) ? (int)$data['module_id'] : null;
            $status = in_array($data['status'] ?? '', ['not_started', 'in_progress', 'completed']) ? $data['status'] : 'completed';

            if (!$userId || !$lessonId) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'User ID and Lesson ID are required.']);
                exit();
            }

            $completedAt = ($status === 'completed') ? date('Y-m-d H:i:s') : null;
            $stmt = $pdo->prepare("
                INSERT INTO `lms_member_progress` (`user_id`, `module_id`, `lesson_id`, `status`, `completed_at`)
                VALUES (:uid, :mid, :lid, :st, :cat)
                ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `completed_at` = VALUES(`completed_at`)
            ");
            $stmt->execute([':uid' => $userId, ':mid' => $moduleId, ':lid' => $lessonId, ':st' => $status, ':cat' => $completedAt]);

            echo json_encode(['success' => true, 'message' => "Progress updated to '$status'."]);
            break;

        // -------------------------------------------------------------
        // 9. LMS: Tasks and Submissions
        // -------------------------------------------------------------
        case 'tasks':
            if ($method !== 'GET') throw new Exception('Method not allowed');
            $clubSlug = trim($_GET['club_slug'] ?? '');
            $subClubSlug = trim($_GET['sub_club_slug'] ?? '');
            $status = trim($_GET['status'] ?? 'active');

            $query = "SELECT t.*, (SELECT COUNT(*) FROM `lms_task_submissions` WHERE `task_id` = t.id) as submission_count FROM `lms_tasks` t WHERE 1=1";
            $params = [];
            if (!empty($clubSlug) && $clubSlug !== 'all') {
                $query .= " AND t.club_slug = :club";
                $params[':club'] = $clubSlug;
            }
            if (!empty($subClubSlug) && $subClubSlug !== 'all') {
                $query .= " AND (t.sub_club_slug = :subclub OR t.sub_club_slug IS NULL)";
                $params[':subclub'] = $subClubSlug;
            }
            if (!empty($status) && $status !== 'all') {
                $query .= " AND t.status = :st";
                $params[':st'] = $status;
            }
            $query .= " ORDER BY t.id DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'tasks' => $stmt->fetchAll()]);
            break;

        case 'save_task':
            if ($method !== 'POST') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $id = !empty($data['id']) ? (int)$data['id'] : null;
            $clubSlug = trim($data['club_slug'] ?? 'developers-club');
            $subClubSlug = !empty($data['sub_club_slug']) ? trim($data['sub_club_slug']) : null;
            $title = trim($data['title'] ?? '');
            $desc = trim($data['description'] ?? '');
            $instructions = trim($data['instructions'] ?? '');
            $dueDate = !empty($data['due_date']) ? trim($data['due_date']) : null;
            $priority = in_array($data['priority'] ?? '', ['low', 'medium', 'high', 'urgent']) ? $data['priority'] : 'medium';
            $allowGithub = !empty($data['allow_github']) ? 1 : 1;
            $allowDrive = !empty($data['allow_drive']) ? 1 : 1;
            $allowUrl = !empty($data['allow_url']) ? 1 : 1;
            $maxScore = (int)($data['max_score'] ?? 100);
            $createdBy = trim($data['created_by'] ?? 'Club Lead');

            if (empty($title) || empty($desc)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Task title and description are required.']);
                exit();
            }

            if ($id) {
                $stmt = $pdo->prepare("
                    UPDATE `lms_tasks` SET 
                        `club_slug` = :c, `sub_club_slug` = :sc, `title` = :t, `description` = :d,
                        `instructions` = :inst, `due_date` = :dd, `priority` = :pr, `max_score` = :ms
                    WHERE `id` = :id
                ");
                $stmt->execute([
                    ':c' => $clubSlug, ':sc' => $subClubSlug, ':t' => $title, ':d' => $desc,
                    ':inst' => $instructions, ':dd' => $dueDate, ':pr' => $priority, ':ms' => $maxScore, ':id' => $id
                ]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `lms_tasks` 
                    (`club_slug`, `sub_club_slug`, `title`, `description`, `instructions`, `due_date`, `priority`, `allow_github`, `allow_drive`, `allow_url`, `max_score`, `created_by`, `status`)
                    VALUES (:c, :sc, :t, :d, :inst, :dd, :pr, :ag, :ad, :au, :ms, :by, 'active')
                ");
                $stmt->execute([
                    ':c' => $clubSlug, ':sc' => $subClubSlug, ':t' => $title, ':d' => $desc,
                    ':inst' => $instructions, ':dd' => $dueDate, ':pr' => $priority, ':ag' => $allowGithub,
                    ':ad' => $allowDrive, ':au' => $allowUrl, ':ms' => $maxScore, ':by' => $createdBy
                ]);
                $id = (int)$pdo->lastInsertId();
            }

            recordAuditLog($pdo, $createdBy, 'Club Lead', 'SAVE_TASK', 'TASK', (string)$id, "Created/updated task '$title'");
            echo json_encode(['success' => true, 'message' => 'Task saved successfully.', 'id' => $id]);
            break;

        case 'delete_task':
            if ($method !== 'POST' && $method !== 'DELETE') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $id = (int)($data['id'] ?? ($_GET['id'] ?? ($_POST['id'] ?? 0)));
            if (!$id) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Task ID is required.']);
                exit();
            }
            // Delete associated submissions first
            $pdo->prepare("DELETE FROM `lms_task_submissions` WHERE `task_id` = :id")->execute([':id' => $id]);
            // Delete task
            $stmt = $pdo->prepare("DELETE FROM `lms_tasks` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            recordAuditLog($pdo, 'Organizer/Lead', 'Club Lead', 'DELETE_TASK', 'TASK', (string)$id, "Deleted task #$id");
            echo json_encode(['success' => true, 'message' => 'Task deleted successfully.']);
            break;

        case 'submissions':
            if ($method !== 'GET') throw new Exception('Method not allowed');
            $taskId = !empty($_GET['task_id']) ? (int)$_GET['task_id'] : null;
            $studentId = !empty($_GET['student_id']) ? (int)$_GET['student_id'] : null;

            $query = "SELECT s.*, t.title as task_title, t.max_score, t.club_slug FROM `lms_task_submissions` s JOIN `lms_tasks` t ON s.task_id = t.id WHERE 1=1";
            $params = [];
            if ($taskId) {
                $query .= " AND s.task_id = :tid";
                $params[':tid'] = $taskId;
            }
            if ($studentId) {
                $query .= " AND s.student_id = :sid";
                $params[':sid'] = $studentId;
            }
            $query .= " ORDER BY s.id DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'submissions' => $stmt->fetchAll()]);
            break;

        case 'submit_task':
            if ($method !== 'POST') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $taskId = (int)($data['task_id'] ?? 0);
            $studentId = (int)($data['student_id'] ?? 2);
            $studentName = trim($data['student_name'] ?? '');
            $studentRoll = trim($data['student_roll'] ?? '');
            $submissionUrl = trim($data['submission_url'] ?? '');
            $submissionType = in_array($data['submission_type'] ?? '', ['github', 'drive', 'url', 'text']) ? $data['submission_type'] : 'github';
            $notes = trim($data['notes'] ?? '');

            if (!$taskId || empty($submissionUrl)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Task ID and Submission URL/Link are required.']);
                exit();
            }

            // URL Security check
            if (!filter_var($submissionUrl, FILTER_VALIDATE_URL) && !str_starts_with($submissionUrl, 'http://') && !str_starts_with($submissionUrl, 'https://')) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Please provide a valid HTTPS URL (e.g. GitHub or Google Drive link).']);
                exit();
            }

            // Check if already submitted
            $check = $pdo->prepare("SELECT id FROM `lms_task_submissions` WHERE `task_id` = :tid AND `student_id` = :sid LIMIT 1");
            $check->execute([':tid' => $taskId, ':sid' => $studentId]);
            $existing = $check->fetch();

            if ($existing) {
                $stmt = $pdo->prepare("
                    UPDATE `lms_task_submissions` SET
                        `submission_url` = :url, `submission_type` = :stype, `notes` = :notes,
                        `status` = 'submitted'
                    WHERE `id` = :id
                ");
                $stmt->execute([':url' => $submissionUrl, ':stype' => $submissionType, ':notes' => $notes, ':id' => $existing['id']]);
                $subId = (int)$existing['id'];
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `lms_task_submissions` 
                    (`task_id`, `student_id`, `student_name`, `student_roll`, `submission_url`, `submission_type`, `notes`, `status`)
                    VALUES (:tid, :sid, :sname, :sroll, :url, :stype, :notes, 'submitted')
                ");
                $stmt->execute([
                    ':tid' => $taskId, ':sid' => $studentId, ':sname' => $studentName,
                    ':sroll' => $studentRoll, ':url' => $submissionUrl, ':stype' => $submissionType, ':notes' => $notes
                ]);
                $subId = (int)$pdo->lastInsertId();
            }

            recordAuditLog($pdo, $studentName, 'Student', 'SUBMIT_TASK', 'TASK_SUBMISSION', (string)$subId, "Submitted link for task $taskId");
            echo json_encode(['success' => true, 'message' => 'Work submitted successfully! Your submission is now under review.', 'id' => $subId]);
            break;

        case 'review_submission':
            if ($method !== 'POST') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $id = (int)($data['id'] ?? 0);
            $status = in_array($data['status'] ?? '', ['approved', 'rejected', 'changes_requested', 'under_review']) ? $data['status'] : 'approved';
            $score = isset($data['score']) ? (int)$data['score'] : null;
            $feedback = trim($data['feedback'] ?? '');
            $reviewerName = trim($data['reviewer_name'] ?? 'Club Organizer');
            $reviewerRole = trim($data['reviewer_role'] ?? 'Club Organizer');

            if (!$id) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Submission ID is required.']);
                exit();
            }

            $stmt = $pdo->prepare("
                UPDATE `lms_task_submissions` SET
                    `status` = :st, `score` = :sc, `feedback` = :fb, `reviewer_name` = :rev, `reviewed_at` = NOW()
                WHERE `id` = :id
            ");
            $stmt->execute([':st' => $status, ':sc' => $score, ':fb' => $feedback, ':rev' => $reviewerName, ':id' => $id]);

            // Notify student
            $subStmt = $pdo->prepare("SELECT `student_id`, `task_id` FROM `lms_task_submissions` WHERE `id` = :id LIMIT 1");
            $subStmt->execute([':id' => $id]);
            $subRow = $subStmt->fetch();
            if ($subRow && !empty($subRow['student_id'])) {
                $title = ($status === 'approved') ? 'Task Verified & Marks Allotted!' : 'Task Review Updated';
                $scoreNote = ($score !== null ? " ($score marks allotted)" : "");
                sendNotification($pdo, (int)$subRow['student_id'], $title, "Your task submission was verified by $reviewerName: status $status$scoreNote.", '/lms', 'task');
            }

            recordAuditLog($pdo, $reviewerName, $reviewerRole, 'REVIEW_TASK', 'TASK_SUBMISSION', (string)$id, "Verified submission #$id with status $status and allotted $score marks");
            echo json_encode(['success' => true, 'message' => "Submission verified and $score marks allotted successfully."]);
            break;

        // -------------------------------------------------------------
        // 10. LMS: Multi-Tier Event Approvals (Mentor -> Admin -> Publish)
        // -------------------------------------------------------------
        case 'event_proposals':
            if ($method !== 'GET') throw new Exception('Method not allowed');
            $stmt = $pdo->query("
                SELECT e.*, ea.stage as approval_stage, ea.comments as last_comment, ea.reviewer_name as last_reviewer
                FROM `cms_events` e
                LEFT JOIN `lms_event_approvals` ea ON e.id = ea.event_id
                ORDER BY e.id DESC
            ");
            echo json_encode(['success' => true, 'events' => $stmt->fetchAll()]);
            break;

        case 'event_approval_action':
            if ($method !== 'POST') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $eventId = (int)($data['event_id'] ?? 0);
            $actionStep = trim($data['action_step'] ?? '');
            $reviewerName = trim($data['reviewer_name'] ?? 'Faculty Mentor');
            $reviewerRole = trim($data['reviewer_role'] ?? 'Mentor');
            $comments = trim($data['comments'] ?? '');

            if (!$eventId || empty($actionStep)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Event ID and Action Step are required.']);
                exit();
            }

            // Map approval action to stage and event status
            $newStage = 'submitted_mentor';
            $eventStatus = 'pending';

            if ($actionStep === 'approve_mentor') {
                $newStage = 'approved_mentor';
                $eventStatus = 'pending'; // moves to admin
            } elseif ($actionStep === 'request_changes_mentor') {
                $newStage = 'changes_requested';
                $eventStatus = 'draft';
            } elseif ($actionStep === 'reject_mentor') {
                $newStage = 'rejected';
                $eventStatus = 'draft';
            } elseif ($actionStep === 'approve_admin' || $actionStep === 'publish') {
                $newStage = 'approved_admin';
                $eventStatus = 'approved'; // live on site!
            } elseif ($actionStep === 'request_changes_admin') {
                $newStage = 'changes_requested';
                $eventStatus = 'draft';
            }

            // Update cms_events status
            $pdo->prepare("UPDATE `cms_events` SET `status` = :st WHERE `id` = :id")->execute([':st' => $eventStatus, ':id' => $eventId]);

            // Insert into approval history
            $stmt = $pdo->prepare("
                INSERT INTO `lms_event_approvals` (`event_id`, `event_title`, `club_slug`, `proposer_name`, `stage`, `reviewer_name`, `reviewer_role`, `comments`)
                SELECT `id`, `title`, `club`, `organizer`, :stage, :rname, :rrole, :comm FROM `cms_events` WHERE `id` = :id
            ");
            $stmt->execute([':stage' => $newStage, ':rname' => $reviewerName, ':rrole' => $reviewerRole, ':comm' => $comments, ':id' => $eventId]);

            recordAuditLog($pdo, $reviewerName, $reviewerRole, 'EVENT_APPROVAL', 'EVENT', (string)$eventId, "Event $eventId set to $newStage ($eventStatus)");
            echo json_encode(['success' => true, 'message' => "Event stage updated to '$newStage'. Status: $eventStatus."]);
            break;

        // -------------------------------------------------------------
        // 11. LMS: Announcements & In-App Notifications
        // -------------------------------------------------------------
        case 'save_announcement':
        case 'announcements':
            if ($method === 'GET') {
                $clubSlug = trim($_GET['club_slug'] ?? '');
                $query = "SELECT * FROM `lms_announcements` WHERE 1=1";
                $params = [];
                if (!empty($clubSlug) && $clubSlug !== 'all') {
                    $query .= " AND (`club_slug` = :c OR `club_slug` LIKE :clike OR `club_slug` = 'all')";
                    $params[':c'] = $clubSlug;
                    $params[':clike'] = '%' . normalizeClubSlug($clubSlug) . '%';
                }
                $query .= " ORDER BY `priority` = 'pinned' DESC, `id` DESC LIMIT 50";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'announcements' => $stmt->fetchAll()]);
            } elseif ($method === 'POST') {
                $data = getJsonPayload();
                $id = !empty($data['id']) ? (int)$data['id'] : null;
                $clubSlug = trim($data['club_slug'] ?? 'developers-club');
                $subClubSlug = !empty($data['sub_club_slug']) ? trim($data['sub_club_slug']) : null;
                $authorName = trim($data['author_name'] ?? 'Club Lead');
                $authorRole = trim($data['author_role'] ?? 'Club Lead');
                $title = trim($data['title'] ?? '');
                $content = trim($data['content'] ?? '');
                $priority = in_array($data['priority'] ?? '', ['normal', 'urgent', 'pinned']) ? $data['priority'] : 'normal';

                if (empty($title) || empty($content)) {
                    http_response_code(422);
                    echo json_encode(['success' => false, 'message' => 'Title and content are required.']);
                    exit();
                }

                if ($id) {
                    $stmt = $pdo->prepare("
                        UPDATE `lms_announcements` SET
                            `club_slug` = :c, `sub_club_slug` = :sc, `author_name` = :aname,
                            `author_role` = :arole, `title` = :t, `content` = :cont, `priority` = :pr
                        WHERE `id` = :id
                    ");
                    $stmt->execute([':c' => $clubSlug, ':sc' => $subClubSlug, ':aname' => $authorName, ':arole' => $authorRole, ':t' => $title, ':cont' => $content, ':pr' => $priority, ':id' => $id]);
                    recordAuditLog($pdo, $authorName, $authorRole, 'UPDATE_ANNOUNCEMENT', 'ANNOUNCEMENT', (string)$id, "Updated announcement '$title'");
                    echo json_encode(['success' => true, 'message' => 'Announcement updated successfully.', 'id' => $id]);
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO `lms_announcements` (`club_slug`, `sub_club_slug`, `author_name`, `author_role`, `title`, `content`, `priority`)
                        VALUES (:c, :sc, :aname, :arole, :t, :cont, :pr)
                    ");
                    $stmt->execute([':c' => $clubSlug, ':sc' => $subClubSlug, ':aname' => $authorName, ':arole' => $authorRole, ':t' => $title, ':cont' => $content, ':pr' => $priority]);
                    $annId = (int)$pdo->lastInsertId();

                    recordAuditLog($pdo, $authorName, $authorRole, 'POST_ANNOUNCEMENT', 'ANNOUNCEMENT', (string)$annId, "Published announcement '$title'");
                    echo json_encode(['success' => true, 'message' => 'Announcement posted successfully.', 'id' => $annId]);
                }
            }
            break;

        case 'delete_announcement':
            if ($method !== 'POST' && $method !== 'DELETE') throw new Exception('Method not allowed');
            $data = getJsonPayload();
            $id = (int)($data['id'] ?? ($_GET['id'] ?? ($_POST['id'] ?? 0)));
            $title = trim($data['title'] ?? ($_GET['title'] ?? ($_POST['title'] ?? '')));
            
            if (!$id && empty($title)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Announcement ID or Title is required.']);
                exit();
            }

            $deletedCount = 0;
            if ($id) {
                // Fetch title for complete cleanup of any duplicate copies
                $fetchStmt = $pdo->prepare("SELECT `title` FROM `lms_announcements` WHERE `id` = :id");
                $fetchStmt->execute([':id' => $id]);
                $annTitle = $fetchStmt->fetchColumn();
                if ($annTitle && empty($title)) {
                    $title = $annTitle;
                }

                $stmt = $pdo->prepare("DELETE FROM `lms_announcements` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
                $deletedCount += $stmt->rowCount();
            }

            // Also delete by title if provided to wipe any duplicate instances
            if (!empty($title)) {
                $titleStmt = $pdo->prepare("DELETE FROM `lms_announcements` WHERE LOWER(TRIM(`title`)) = LOWER(TRIM(:t))");
                $titleStmt->execute([':t' => $title]);
                $deletedCount += $titleStmt->rowCount();
            }

            // Always record audit log so ensureLmsTables knows this announcement was intentionally deleted
            recordAuditLog($pdo, 'Organizer', 'Club Organizer', 'DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', (string)$id, "Deleted announcement: " . ($title ?: "#$id"));

            echo json_encode(['success' => true, 'message' => 'Announcement deleted successfully.', 'deletedCount' => $deletedCount]);
            break;

        case 'notifications':
            if ($method === 'GET') {
                $userId = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : 2;
                $stmt = $pdo->prepare("SELECT * FROM `lms_notifications` WHERE `user_id` = :uid ORDER BY `id` DESC LIMIT 30");
                $stmt->execute([':uid' => $userId]);
                $notifs = $stmt->fetchAll();
                $unread = 0;
                foreach ($notifs as $n) {
                    if (!$n['is_read']) $unread++;
                }
                echo json_encode(['success' => true, 'notifications' => $notifs, 'unreadCount' => $unread]);
            } elseif ($method === 'POST') {
                $data = getJsonPayload();
                $id = !empty($data['id']) ? (int)$data['id'] : null;
                $userId = !empty($data['user_id']) ? (int)$data['user_id'] : null;

                if ($id) {
                    $pdo->prepare("UPDATE `lms_notifications` SET `is_read` = 1 WHERE `id` = :id")->execute([':id' => $id]);
                } elseif ($userId) {
                    $pdo->prepare("UPDATE `lms_notifications` SET `is_read` = 1 WHERE `user_id` = :uid")->execute([':uid' => $userId]);
                }
                echo json_encode(['success' => true, 'message' => 'Notification marked as read.']);
            }
            break;

        case 'audit_logs':
            if ($method !== 'GET') throw new Exception('Method not allowed');
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 50;
            $stmt = $pdo->prepare("SELECT * FROM `lms_audit_logs` ORDER BY `id` DESC LIMIT :lim");
            $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
            $stmt->execute();
            echo json_encode(['success' => true, 'audit_logs' => $stmt->fetchAll()]);
            break;

        // -------------------------------------------------------------
        // 12. LMS: Personalized Student LMS Overview
        // -------------------------------------------------------------
        case 'student_lms_overview':
            if ($method !== 'GET') throw new Exception('Method not allowed');
            $userId = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : null;
            
            // Get user details
            $user = null;
            if ($userId) {
                $userStmt = $pdo->prepare("SELECT id, name, email, roll_number, role, club, year_of_study FROM `users` WHERE id = :uid LIMIT 1");
                $userStmt->execute([':uid' => $userId]);
                $user = $userStmt->fetch();
            }

            if (!$user) {
                // Find first registered student
                $studentStmt = $pdo->query("SELECT id, name, email, roll_number, role, club, year_of_study FROM `users` WHERE `role` = 'student' LIMIT 1");
                $user = $studentStmt ? $studentStmt->fetch() : null;
            }

            if (!$user) {
                // Fallback to admin or clean template if no student has registered yet
                $adminStmt = $pdo->query("SELECT id, name, email, roll_number, role, club, year_of_study FROM `users` WHERE `role` = 'admin' LIMIT 1");
                $user = $adminStmt ? $adminStmt->fetch() : null;

                if (!$user) {
                    $user = [
                        'id' => 1,
                        'name' => 'SAC Administrator',
                        'email' => 'admin@adityatekkali.edu.in',
                        'roll_number' => 'SACADMIN01',
                        'role' => 'admin',
                        'club' => 'all',
                        'year_of_study' => 'Administrator'
                    ];
                }
            }

            // Get roles assigned
            $rolesStmt = $pdo->prepare("SELECT * FROM `lms_user_roles` WHERE `user_id` = :uid AND `is_active` = 1");
            $rolesStmt->execute([':uid' => $userId]);
            $userRoles = $rolesStmt->fetchAll();

            // Submissions count
            $subCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_task_submissions` WHERE `student_id` = {$user['id']}")->fetchColumn();
            $approvedCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_task_submissions` WHERE `student_id` = {$user['id']} AND `status` = 'approved'")->fetchColumn();

            // Total tasks in club
            $club = $user['club'] ?: 'developers-club';
            $tasksCount = (int)$pdo->query("SELECT COUNT(*) FROM `lms_tasks` WHERE `club_slug` = '$club' AND `status` = 'active'")->fetchColumn();

            // Unread notifications
            $unreadNotifs = (int)$pdo->query("SELECT COUNT(*) FROM `lms_notifications` WHERE `user_id` = {$user['id']} AND `is_read` = 0")->fetchColumn();

            echo json_encode([
                'success' => true,
                'user' => $user,
                'roles' => $userRoles,
                'metrics' => [
                    'submissionsCount' => $subCount,
                    'approvedSubmissions' => $approvedCount,
                    'pendingTasks' => max(0, $tasksCount - $subCount),
                    'unreadNotifications' => $unreadNotifs,
                    'overallProgressPct' => $tasksCount > 0 ? round(($approvedCount / $tasksCount) * 100) : 0
                ]
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Unknown action '$action'"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'LMS Server Error: ' . $e->getMessage()
    ]);
}
