<?php
// backend/api/cms_events.php
// REST API endpoint to manage Campus Events, Bootcamps and Workshops

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();

    // Auto-create table if not exists
    $pdo->exec("
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
    ");

    // Add image column if missing in existing table
    try {
        $pdo->exec("ALTER TABLE `cms_events` ADD COLUMN `image` VARCHAR(255) DEFAULT '/images.jpg'");
    } catch (Exception $ignored) {
        // column already exists
    }

    // Auto-seed default events if table is empty
    $countCheck = (int)$pdo->query("SELECT COUNT(*) FROM `cms_events`")->fetchColumn();
    if ($countCheck === 0) {
        $pdo->exec("
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
              '[\"Official Trailhead Superbadge guidance\", \"Hands-on org configuration and data management labs\", \"Mock certification exams & study vouchers\", \"Direct interaction with Salesforce Certified Professionals\"]',
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
              '[\"Individual hardware component kits provided\", \"Breadboard circuit prototyping & debugging\", \"Real-time sensor data logging & actuation\", \"Team project presentation on Day 6\"]',
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
              '[\"Building RESTful APIs with Node & Express\", \"Modern UI component design with React & Tailwind CSS\", \"Git & GitHub workflow best practices\", \"Live deployment to Vercel and Cloudflare\"]',
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
              '[\"Hands-on CTF (Capture The Flag) competitions\", \"OWASP Top 10 vulnerability exploration\", \"Network packet analysis using Wireshark\", \"Certificate of participation upon completion\"]',
              'Basic networking and operating system concepts.',
              'Girish Kumar D',
              'Incharge S.A.C (Technical)',
              'var(--club-indigo)',
              'ShieldCheck',
              'approved'
            )
        ");
    }

    // -------------------------------------------------------------
    // GET: Retrieve events
    // -------------------------------------------------------------
    if ($method === 'GET') {
        $slug = $_GET['slug'] ?? null;
        $status = $_GET['status'] ?? null;
        $all = isset($_GET['all']) && $_GET['all'] == '1';

        if ($slug) {
            $stmt = $pdo->prepare("SELECT * FROM `cms_events` WHERE `slug` = :slug LIMIT 1");
            $stmt->execute([':slug' => $slug]);
            $event = $stmt->fetch();
            if (!$event) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                exit();
            }
            if ($event['highlights']) {
                $event['highlights'] = json_decode($event['highlights'], true) ?? [];
            }
            $event['image'] = !empty($event['image']) ? $event['image'] : '/images.jpg';
            echo json_encode(['success' => true, 'event' => $event]);
            exit();
        }

        if ($all || $status === 'all') {
            $stmt = $pdo->query("SELECT * FROM `cms_events` ORDER BY id DESC");
        } elseif ($status && in_array($status, ['approved', 'pending', 'draft'])) {
            $stmt = $pdo->prepare("SELECT * FROM `cms_events` WHERE `status` = :status ORDER BY id DESC");
            $stmt->execute([':status' => $status]);
        } else {
            // Default: Public only sees approved events
            $stmt = $pdo->query("SELECT * FROM `cms_events` WHERE `status` = 'approved' ORDER BY id DESC");
        }

        $events = $stmt->fetchAll();
        foreach ($events as &$ev) {
            if (!empty($ev['highlights']) && is_string($ev['highlights'])) {
                $ev['highlights'] = json_decode($ev['highlights'], true) ?? [];
            }
            $ev['image'] = !empty($ev['image']) ? $ev['image'] : '/images.jpg';
        }

        echo json_encode([
            'success' => true,
            'count' => count($events),
            'events' => $events
        ]);
        exit();
    }

    // -------------------------------------------------------------
    // POST: Create Event or Quick Status Change (Approve, Reject, Draft)
    // -------------------------------------------------------------
    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            exit();
        }

        // Quick status update action
        if (isset($data['action']) && in_array($data['action'], ['approve', 'reject', 'draft', 'publish'])) {
            $id = (int)($data['id'] ?? 0);
            $slug = trim($data['slug'] ?? '');
            
            $newStatus = 'approved';
            if ($data['action'] === 'reject' || $data['action'] === 'draft') {
                $newStatus = 'draft';
            } elseif ($data['action'] === 'approve' || $data['action'] === 'publish') {
                $newStatus = 'approved';
            }

            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE `cms_events` SET `status` = :status WHERE `id` = :id");
                $stmt->execute([':status' => $newStatus, ':id' => $id]);
            } elseif (!empty($slug)) {
                $stmt = $pdo->prepare("UPDATE `cms_events` SET `status` = :status WHERE `slug` = :slug");
                $stmt->execute([':status' => $newStatus, ':slug' => $slug]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Event id or slug is required']);
                exit();
            }

            echo json_encode([
                'success' => true,
                'message' => "Event status updated to {$newStatus}.",
                'status' => $newStatus
            ]);
            exit();
        }

        // Create new event
        $title = trim($data['title'] ?? '');
        $slug = trim($data['slug'] ?? '');
        if (empty($slug) && !empty($title)) {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
        }

        if (empty($title) || empty($slug)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Event title and slug are required']);
            exit();
        }

        $dates = trim($data['dates'] ?? date('Y-m-d'));
        $time = trim($data['time'] ?? '09:30 AM - 04:30 PM');
        $mode = in_array($data['mode'] ?? '', ['Offline', 'Online', 'Hybrid']) ? $data['mode'] : 'Offline';
        $price = trim($data['price'] ?? 'Free');
        $club = trim($data['club'] ?? 'General SAC');
        $location = trim($data['location'] ?? 'AITAM Campus');
        $organizer = trim($data['organizer'] ?? 'AITAM Student Activity Center');
        $about = trim($data['about'] ?? '');
        $prerequisites = trim($data['prerequisites'] ?? 'Open to all students.');
        $mentor = trim($data['mentor'] ?? '');
        $mentorRole = trim($data['mentorRole'] ?? $data['mentor_role'] ?? '');
        $color = trim($data['color'] ?? 'var(--club-teal)');
        $icon = trim($data['icon'] ?? 'Calendar');
        $image = trim($data['image'] ?? '/images.jpg');
        if (empty($image)) $image = '/images.jpg';
        $status = in_array($data['status'] ?? '', ['approved', 'pending', 'draft']) ? $data['status'] : 'approved';

        $highlights = $data['highlights'] ?? [];
        if (is_array($highlights)) {
            $highlights = json_encode($highlights, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            $highlights = json_encode([], JSON_UNESCAPED_UNICODE);
        }

        // Check if slug exists to either insert or update
        $existing = $pdo->prepare("SELECT id FROM `cms_events` WHERE `slug` = :slug LIMIT 1");
        $existing->execute([':slug' => $slug]);
        $eventRow = $existing->fetch();

        if ($eventRow) {
            // Update
            $stmt = $pdo->prepare("
                UPDATE `cms_events` SET 
                    `title` = :title,
                    `dates` = :dates,
                    `time` = :time,
                    `mode` = :mode,
                    `price` = :price,
                    `club` = :club,
                    `location` = :location,
                    `organizer` = :organizer,
                    `about` = :about,
                    `highlights` = :highlights,
                    `prerequisites` = :prerequisites,
                    `mentor` = :mentor,
                    `mentor_role` = :mentor_role,
                    `color` = :color,
                    `icon` = :icon,
                    `image` = :image,
                    `status` = :status
                WHERE `id` = :id
            ");
            $stmt->execute([
                ':title' => $title,
                ':dates' => $dates,
                ':time' => $time,
                ':mode' => $mode,
                ':price' => $price,
                ':club' => $club,
                ':location' => $location,
                ':organizer' => $organizer,
                ':about' => $about,
                ':highlights' => $highlights,
                ':prerequisites' => $prerequisites,
                ':mentor' => $mentor,
                ':mentor_role' => $mentorRole,
                ':color' => $color,
                ':icon' => $icon,
                ':image' => $image,
                ':status' => $status,
                ':id' => $eventRow['id']
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Event updated successfully.',
                'id' => (int)$eventRow['id'],
                'slug' => $slug,
                'status' => $status,
                'image' => $image
            ]);
            exit();
        } else {
            // Insert
            $stmt = $pdo->prepare("
                INSERT INTO `cms_events` 
                (`title`, `slug`, `dates`, `time`, `mode`, `price`, `club`, `location`, `organizer`, `about`, `highlights`, `prerequisites`, `mentor`, `mentor_role`, `color`, `icon`, `image`, `status`)
                VALUES 
                (:title, :slug, :dates, :time, :mode, :price, :club, :location, :organizer, :about, :highlights, :prerequisites, :mentor, :mentor_role, :color, :icon, :image, :status)
            ");
            $stmt->execute([
                ':title' => $title,
                ':slug' => $slug,
                ':dates' => $dates,
                ':time' => $time,
                ':mode' => $mode,
                ':price' => $price,
                ':club' => $club,
                ':location' => $location,
                ':organizer' => $organizer,
                ':about' => $about,
                ':highlights' => $highlights,
                ':prerequisites' => $prerequisites,
                ':mentor' => $mentor,
                ':mentor_role' => $mentorRole,
                ':color' => $color,
                ':icon' => $icon,
                ':image' => $image,
                ':status' => $status
            ]);

            $newId = (int)$pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Event created successfully.',
                'id' => $newId,
                'slug' => $slug,
                'status' => $status,
                'image' => $image
            ]);
            exit();
        }
    }

    // -------------------------------------------------------------
    // DELETE: Delete an event
    // -------------------------------------------------------------
    if ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        $slug = trim($_GET['slug'] ?? '');

        if ($id <= 0 && empty($slug)) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            $id = (int)($data['id'] ?? 0);
            $slug = trim($data['slug'] ?? '');
        }

        if ($id > 0) {
            $stmt = $pdo->prepare("DELETE FROM `cms_events` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
        } elseif (!empty($slug)) {
            $stmt = $pdo->prepare("DELETE FROM `cms_events` WHERE `slug` = :slug");
            $stmt->execute([':slug' => $slug]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Event ID or slug is required for deletion.']);
            exit();
        }

        echo json_encode(['success' => true, 'message' => 'Event deleted successfully.']);
        exit();
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'CMS Events error: ' . $e->getMessage()
    ]);
}
