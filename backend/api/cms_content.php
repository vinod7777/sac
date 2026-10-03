<?php
// backend/api/cms_content.php
// REST API endpoint to get and update Landing Page CMS content

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Default landing page data fallback
$defaultContent = [
    'hero' => [
        'headline' => 'Prepares students for success in a changing world.',
        'tagline' => 'Learn . Build . Innovate',
        'subheadline' => 'The apex student body of AITAM — 8 student clubs, industry-led workshops, events and real client projects.'
    ],
    'announcement' => [
        'enabled' => true,
        'badge' => 'New Notice',
        'message' => 'Registrations open for upcoming technical bootcamps & SAC Club Memberships!',
        'link' => '/join',
        'linkText' => 'Apply Now'
    ],
    'about' => [
        'title' => 'About SAC',
        'description' => 'Student Activity Center is the apex student body of AITAM, responsible for formulating the policies pertaining to all the non-academic affairs, resulting in a holistic workspace and culture for students to explore various real time technologies, entrepreneurial activities, alumni interactions etc., laying various paths for students to shape them out into a better individual.'
    ],
    'stats' => [
        ['label' => 'EVENTS', 'value' => 15, 'max' => 40],
        ['label' => 'WEBINARS', 'value' => 14, 'max' => 40],
        ['label' => 'WORKSHOPS', 'value' => 34, 'max' => 40],
        ['label' => 'TRAINED STUDENTS', 'value' => 2766, 'max' => 3000]
    ],
    'testimonials' => [
        [
            'quote' => 'Learning and implementing is my way of gaining knowledge and that is core value of SAC which motivates me to work more.',
            'name' => 'L. Prameela',
            'role' => 'Robotics Trainee'
        ],
        [
            'quote' => 'I am very much excited to learn new things, and I can invest myself very confidently into SAC.',
            'name' => 'Ch. Meghana',
            'role' => 'Web Designing Trainee'
        ],
        [
            'quote' => 'SAC gave me my first real project experience. Building with a team here taught me more than any textbook could.',
            'name' => 'K. Harsha Vardhan',
            'role' => 'Developers Club'
        ],
        [
            'quote' => 'The workshops are hands-on from day one. I walked in curious about robotics and walked out building my own bot.',
            'name' => 'S. Divya Sri',
            'role' => 'Robotics Trainee'
        ]
    ],
    'mentors' => [],
    'clubs' => [
        [
            'name' => 'Cultural Club',
            'slug' => 'cultural-club',
            'mentor' => '',
            'mentorRole' => '',
            'studentOrganizer' => '',
            'studentOrganizerRole' => '',
            'studentMentor' => '',
            'studentMentorRole' => '',
            'about' => 'The Cultural Club is the creative heartbeat of AITAM SAC. It nurtures performers, anchors, designers and storytellers, giving every student a stage to discover confidence and expression.',
            'activities' => ['Annual cultural fest and talent hunts', 'Dance, music and drama troupes', 'Stage management and anchoring training', 'Inter-college cultural competitions'],
            'tagline' => 'We amuse the world',
            'desc' => 'Cultural club aims developing young multimedia specialists.',
            'icon' => 'Music',
            'color' => 'var(--club-pink)',
            'image' => ''
        ],
        [
            'name' => 'Automobile Club',
            'slug' => 'automobile-club',
            'mentor' => '',
            'mentorRole' => '',
            'studentOrganizer' => '',
            'studentOrganizerRole' => '',
            'studentMentor' => '',
            'studentMentorRole' => '',
            'about' => 'The Automobile Club combines design thinking and hands-on workforce skills to build real machines. Members work on karts, EV prototypes and engine systems from concept to track.',
            'activities' => ['Go-kart and e-vehicle build projects', 'Engine teardown and assembly workshops', 'Vehicle dynamics and design sessions', 'National level automotive competitions'],
            'tagline' => 'We move the world',
            'desc' => 'Automobile club combines design and workforce to create innovations.',
            'icon' => 'Car',
            'color' => 'var(--club-rust)',
            'image' => ''
        ],
        [
            'name' => 'Developers Club',
            'slug' => 'developers-club',
            'mentor' => '',
            'mentorRole' => '',
            'studentOrganizer' => '',
            'studentOrganizerRole' => '',
            'studentMentor' => '',
            'studentMentorRole' => '',
            'about' => 'The Developers Club moulds a critical thinker in every novice programmer. From first commit to shipped client product, members learn by building real software with real deadlines.',
            'activities' => ['Full-stack web and app development bootcamps', 'AI/ML and data analytics project tracks', 'Open-source contribution drives', 'Hackathons and client project delivery'],
            'tagline' => 'We develop the world',
            'desc' => 'Developer club moulds critical thinker in every novice programmer.',
            'icon' => 'Code2',
            'color' => 'var(--club-teal)',
            'image' => ''
        ],
        [
            'name' => 'Salesforce Club',
            'slug' => 'salesforce-club',
            'mentor' => '',
            'mentorRole' => '',
            'studentOrganizer' => '',
            'studentOrganizerRole' => '',
            'studentMentor' => '',
            'studentMentorRole' => '',
            'about' => 'The Salesforce Club brings companies and customers together. Members train for globally recognised Salesforce certifications and build CRM solutions used by real organisations.',
            'activities' => ['Salesforce Administrator certification training', 'Apex and Lightning development labs', 'Trailhead superbadge challenges', 'Industry meetups with Salesforce professionals'],
            'tagline' => 'We connect the world',
            'desc' => 'We bring companies and customers together.',
            'icon' => 'Cloud',
            'color' => 'var(--club-orange)',
            'image' => ''
        ],
        [
            'name' => 'Robotics Club',
            'slug' => 'robotics-club',
            'mentor' => '',
            'mentorRole' => '',
            'studentOrganizer' => '',
            'studentOrganizerRole' => '',
            'studentMentor' => '',
            'studentMentorRole' => '',
            'about' => 'The Robotics Club expertises students on robots and automation. Members move from sensors and microcontrollers to fully autonomous machines within a single academic year.',
            'activities' => ['Arduino and embedded systems workshops', 'Line-follower and combat bot builds', 'IoT sensor and automation projects', 'Robotics expos and tech fests'],
            'tagline' => 'We automate the world',
            'desc' => 'Robotics club expertises students on robots and automation.',
            'icon' => 'Bot',
            'color' => 'var(--club-crimson)',
            'image' => ''
        ],
        [
            'name' => 'Design Club',
            'slug' => 'design-club',
            'mentor' => '',
            'mentorRole' => '',
            'studentOrganizer' => '',
            'studentOrganizerRole' => '',
            'studentMentor' => '',
            'studentMentorRole' => '',
            'about' => 'The Design Club crafts the visual identity of every SAC initiative. From event posters to product interfaces, members learn design as a discipline, not decoration.',
            'activities' => ['Brand identity and poster design sprints', 'UI/UX fundamentals and Figma labs', 'Motion graphics and video editing', 'Design support for every SAC event'],
            'tagline' => 'We shape the world',
            'desc' => 'Design club crafts the visual identity of every SAC initiative.',
            'icon' => 'PenTool',
            'color' => 'var(--club-plum)',
            'image' => ''
        ],
        [
            'name' => 'Security Club',
            'slug' => 'security-club',
            'mentor' => '',
            'mentorRole' => '',
            'studentOrganizer' => '',
            'studentOrganizerRole' => '',
            'studentMentor' => '',
            'studentMentorRole' => '',
            'about' => 'The Security Club explores ethical hacking and secure engineering. Members break systems responsibly so they can learn how to build ones that hold up.',
            'activities' => ['Ethical hacking and CTF practice sessions', 'Network and web application security labs', 'Secure coding reviews', 'Cyber awareness drives on campus'],
            'tagline' => 'We protect the world',
            'desc' => 'Security club explores ethical hacking and secure engineering.',
            'icon' => 'ShieldCheck',
            'color' => 'var(--club-indigo)',
            'image' => ''
        ],
        [
            'name' => 'Photography Club',
            'slug' => 'photography-club',
            'mentor' => '',
            'mentorRole' => '',
            'studentOrganizer' => '',
            'studentOrganizerRole' => '',
            'studentMentor' => '',
            'studentMentorRole' => '',
            'about' => 'The Photography Club documents every campus moment through the lens. Members master composition, lighting and post-production while building a professional portfolio.',
            'activities' => ['Campus event coverage and photo walks', 'Lighting, composition and editing workshops', 'Short film and documentary production', 'Annual photo exhibition'],
            'tagline' => 'We frame the world',
            'desc' => 'Photography club documents every campus moment through the lens.',
            'icon' => 'Camera',
            'color' => 'var(--club-slate)',
            'image' => ''
        ]
    ]
];

try {
    $pdo = getDbConnection();

    // Auto-create table if not exists for convenience
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `cms_content` (
            `section_key` VARCHAR(50) PRIMARY KEY,
            `content_json` JSON NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Clean up stale dummy mentors from cms_content table if present
    try {
        $pdo->exec("UPDATE `cms_content` SET `content_json` = '[]' WHERE `section_key` = 'mentors' AND `content_json` LIKE '%J. Suresh Kumar%'");
    } catch (Exception $e) {
        // ignore
    }

    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT `section_key`, `content_json` FROM `cms_content`");
        $rows = $stmt->fetchAll();

        $result = $defaultContent;
        foreach ($rows as $row) {
            $key = $row['section_key'];
            $decoded = json_decode($row['content_json'], true);
            if ($decoded !== null) {
                $result[$key] = $decoded;
            }
        }

        // 1. Fetch real faculty mentors from MySQL `mentors` table (single source of truth)
        try {
            $mStmt = $pdo->query("SELECT id, name, email, phone, department, designation as role, department as area, photo_url as image, club_slug FROM `mentors` ORDER BY id ASC");
            $dbMentors = $mStmt ? $mStmt->fetchAll() : [];
            // If mentors table has no records, return [] (do not display dummy mentors)
            $result['mentors'] = $dbMentors;
        } catch (Exception $e) {
            $result['mentors'] = [];
        }

        // 2. Fetch real club organizers from MySQL `club_organizers` table
        $dbOrganizers = [];
        try {
            $orgStmt = $pdo->query("SELECT * FROM `club_organizers`");
            if ($orgStmt) {
                foreach ($orgStmt->fetchAll() as $row) {
                    $dbOrganizers[$row['club_slug']] = $row;
                }
            }
        } catch (Exception $e) {
            $dbOrganizers = [];
        }

        // 3. Map mentors by club
        $dbClubMentors = [];
        foreach ($result['mentors'] as $dm) {
            if (!empty($dm['club_slug'])) {
                $dbClubMentors[$dm['club_slug']] = $dm;
            }
        }

        // 4. Update clubs array with real DB mentors & organizers (empty if none assigned)
        if (!empty($result['clubs']) && is_array($result['clubs'])) {
            foreach ($result['clubs'] as &$c) {
                $slug = $c['slug'] ?? '';
                // Faculty Mentor from DB
                if (isset($dbClubMentors[$slug])) {
                    $c['mentor'] = $dbClubMentors[$slug]['name'];
                    $c['mentorRole'] = !empty($dbClubMentors[$slug]['designation']) ? $dbClubMentors[$slug]['designation'] : (!empty($dbClubMentors[$slug]['role']) ? $dbClubMentors[$slug]['role'] : 'Faculty Mentor');
                } else {
                    $c['mentor'] = '';
                    $c['mentorRole'] = '';
                }

                // Student Organizer from DB
                if (isset($dbOrganizers[$slug])) {
                    $c['studentOrganizer'] = $dbOrganizers[$slug]['organizer_name'];
                    $c['studentOrganizerRole'] = $dbOrganizers[$slug]['organizer_year'];
                    $c['studentMentor'] = $dbOrganizers[$slug]['organizer_name'];
                    $c['studentMentorRole'] = $dbOrganizers[$slug]['organizer_year'];
                } else {
                    $c['studentOrganizer'] = '';
                    $c['studentOrganizerRole'] = '';
                    $c['studentMentor'] = '';
                    $c['studentMentorRole'] = '';
                }
            }
            unset($c);
        }

        echo json_encode([
            'success' => true,
            'data' => $result
        ]);
        exit();
    }

    if ($method === 'POST' || $method === 'PUT') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!$payload || !is_array($payload)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            exit();
        }

        $stmt = $pdo->prepare("
            INSERT INTO `cms_content` (`section_key`, `content_json`)
            VALUES (:key, :json)
            ON DUPLICATE KEY UPDATE `content_json` = :jsonUpdate
        ");

        $updatedKeys = [];
        foreach ($payload as $key => $content) {
            if (in_array($key, ['hero', 'announcement', 'about', 'stats', 'testimonials', 'partners', 'mentors', 'clubs'])) {
                $jsonString = json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $stmt->execute([
                    ':key' => $key,
                    ':json' => $jsonString,
                    ':jsonUpdate' => $jsonString
                ]);
                $updatedKeys[] = $key;

                // Sync mentors to MySQL mentors table
                if ($key === 'mentors' && is_array($content)) {
                    try {
                        $pdo->exec("DELETE FROM `mentors`");
                        $mInsert = $pdo->prepare("
                            INSERT INTO `mentors` (`name`, `mentor_role`, `designation`, `department`, `photo_url`, `club_slug`)
                            VALUES (:name, :role, :role, :area, :image, :club)
                        ");
                        foreach ($content as $m) {
                            if (!empty($m['name'])) {
                                $mInsert->execute([
                                    ':name' => trim($m['name']),
                                    ':role' => !empty($m['role']) ? trim($m['role']) : 'Faculty Mentor',
                                    ':area' => !empty($m['area']) ? trim($m['area']) : 'SAC Faculty',
                                    ':image' => !empty($m['image']) ? trim($m['image']) : null,
                                    ':club' => !empty($m['club_slug']) ? trim($m['club_slug']) : null,
                                ]);
                            }
                        }
                    } catch (Exception $e) {
                        // ignore
                    }
                }

                // Sync organizers to MySQL club_organizers table
                if ($key === 'clubs' && is_array($content)) {
                    try {
                        $orgUpsert = $pdo->prepare("
                            INSERT INTO `club_organizers` (`club_slug`, `organizer_name`, `organizer_roll_number`, `organizer_email`, `organizer_year`, `organizer_phone`)
                            VALUES (:slug, :name, :roll, :email, :year, :phone)
                            ON DUPLICATE KEY UPDATE `organizer_name` = VALUES(`organizer_name`), `organizer_year` = VALUES(`organizer_year`)
                        ");
                        foreach ($content as $cl) {
                            $cSlug = $cl['slug'] ?? '';
                            $orgName = trim($cl['studentOrganizer'] ?? ($cl['studentMentor'] ?? ''));
                            $orgYear = trim($cl['studentOrganizerRole'] ?? ($cl['studentMentorRole'] ?? ''));
                            if ($cSlug && $orgName) {
                                $orgUpsert->execute([
                                    ':slug' => $cSlug,
                                    ':name' => $orgName,
                                    ':roll' => $cl['organizer_roll_number'] ?? 'N/A',
                                    ':email' => $cl['organizer_email'] ?? ($cSlug . '.organizer@adityatekkali.edu.in'),
                                    ':year' => $orgYear ? $orgYear : 'Student Lead',
                                    ':phone' => $cl['organizer_phone'] ?? null
                                ]);
                            }
                        }
                    } catch (Exception $e) {
                        // ignore
                    }
                }
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Landing page CMS content updated successfully.',
            'updated' => $updatedKeys
        ]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'CMS API error: ' . $e->getMessage(),
        'fallback' => $defaultContent
    ]);
}
