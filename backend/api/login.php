<?php
// backend/api/login.php
// Endpoint for Student & Club Lead authentication

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit();
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

$email = strtolower(trim($data['email'] ?? ''));
$password = trim($data['password'] ?? '');
$requestedRole = trim($data['role'] ?? 'student');

// Validation
$errors = [];

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'A valid college email address is required.';
} elseif (!str_ends_with($email, '@adityatekkali.edu.in')) {
    $errors['email'] = 'Only official @adityatekkali.edu.in email addresses are accepted.';
}

if (empty($password)) {
    $errors['password'] = 'Password is required.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Validation failed',
        'errors' => $errors
    ]);
    exit();
}

try {
    $pdo = getDbConnection();

    // 1. Check in `users` table
    $stmt = $pdo->prepare("SELECT id, name, email, roll_number, password, role, club, year_of_study FROM `users` WHERE `email` = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if ($user) {
        $passwordValid = false;

        // Check bcrypt hash
        if (password_verify($password, $user['password'])) {
            $passwordValid = true;
        } 
        // Fallback: If password entered matches user's roll number (case-insensitive)
        elseif (strtoupper($password) === strtoupper($user['roll_number'])) {
            $passwordValid = true;
        }
        // Fallback: Default test/dev passwords
        elseif ($password === 'password123' || $password === 'admin123' || $password === 'mentor123' || $password === 'lead123') {
            $passwordValid = true;
        }

        if (!$passwordValid) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Incorrect password. Please verify your credentials or use your roll number.'
            ]);
            exit();
        }

        // Determine authorized roles from database records
        $isMentor = false;
        $mentorClub = null;
        if ($user['role'] === 'mentor' || $user['role'] === 'club_mentor') {
            $isMentor = true;
            $mentorClub = $user['club'];
        }
        $menCheck = $pdo->prepare("SELECT `club_slug` FROM `mentors` WHERE `email` = :email LIMIT 1");
        $menCheck->execute([':email' => $email]);
        $menRow = $menCheck->fetch();
        if ($menRow) {
            $isMentor = true;
            $mentorClub = $menRow['club_slug'] ?: $mentorClub;
        }

        $isOrganizer = false;
        $orgClub = null;
        if ($user['role'] === 'club_organizer') {
            $isOrganizer = true;
            $orgClub = $user['club'];
        }
        $orgCheck = $pdo->prepare("SELECT `club_slug` FROM `club_organizers` WHERE UPPER(`organizer_roll_number`) = UPPER(:roll) OR `organizer_email` = :email LIMIT 1");
        $orgCheck->execute([':roll' => $user['roll_number'], ':email' => $email]);
        $orgRow = $orgCheck->fetch();
        if ($orgRow && !empty($orgRow['club_slug'])) {
            $isOrganizer = true;
            $orgClub = $orgRow['club_slug'];
        }

        $isLead = false;
        $leadClub = null;
        $leadWing = null;
        if ($user['role'] === 'club_lead') {
            $isLead = true;
            $leadClub = $user['club'];
        }
        $leadCheck = $pdo->prepare("SELECT `club_slug`, `wing_slug`, `wing_name` FROM `club_wings` WHERE UPPER(`lead_roll_number`) = UPPER(:roll) OR `lead_email` = :email LIMIT 1");
        $leadCheck->execute([':roll' => $user['roll_number'], ':email' => $email]);
        $leadRow = $leadCheck->fetch();
        if ($leadRow) {
            $isLead = true;
            $leadClub = $leadRow['club_slug'] ?: $leadClub;
            $leadWing = $leadRow['wing_slug'] ?? $leadRow['wing_name'];
        }

        $effectiveRole = 'student';
        $managedClub = $user['club'] ?: 'developers-club';
        $managedWing = null;

        // Strict role validation based on user selection:
        // A student member CANNOT log in as Organizer, Lead, or Mentor until officially appointed/granted!
        if ($requestedRole === 'club_mentor' || $requestedRole === 'mentor' || $requestedRole === 'faculty_mentor') {
            if (!$isMentor && $user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access Denied: You are not authorized as a Faculty Mentor. Only institutional faculty mentors appointed by the Admin can access the Mentor Workspace.'
                ]);
                exit();
            }
            $effectiveRole = 'club_mentor';
            $managedClub = $mentorClub ?: ($user['club'] ?: 'developers-club');
            $managedWing = null;
        } elseif ($requestedRole === 'club_organizer') {
            if (!$isOrganizer && $user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access Denied: You have not been appointed as a Club Organiser. Only the LMS Administrator can appoint an enrolled member as the Club Organiser.'
                ]);
                exit();
            }
            $effectiveRole = 'club_organizer';
            $managedClub = $orgClub ?: ($user['club'] ?: 'developers-club');
            $managedWing = null;
        } elseif ($requestedRole === 'club_lead') {
            if (!$isLead && !$isOrganizer && !$isMentor && $user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access Denied: You have not been assigned as a Club Wing Lead. A Club Organiser or Faculty Mentor must assign you as a Wing Lead first.'
                ]);
                exit();
            }
            $effectiveRole = 'club_lead';
            $managedClub = $leadClub ?: ($user['club'] ?: 'developers-club');
            $managedWing = $leadWing;
        } elseif ($requestedRole === 'student') {
            $effectiveRole = 'student';
            $managedClub = $user['club'] ?: 'developers-club';
            $managedWing = null;
        } else {
            // Auto-detect based on strict hierarchy order:
            // 1. Faculty Mentor -> 2. Club Organiser -> 3. Club Wing Lead -> 4. Club Member
            if ($user['role'] === 'admin') {
                $effectiveRole = 'admin';
            } elseif ($isMentor) {
                $effectiveRole = 'club_mentor';
                $managedClub = $mentorClub ?: ($user['club'] ?: 'developers-club');
            } elseif ($isOrganizer) {
                $effectiveRole = 'club_organizer';
                $managedClub = $orgClub ?: ($user['club'] ?: 'developers-club');
            } elseif ($isLead) {
                $effectiveRole = 'club_lead';
                $managedClub = $leadClub ?: ($user['club'] ?: 'developers-club');
                $managedWing = $leadWing;
            } else {
                $effectiveRole = 'student';
                $managedClub = $user['club'] ?: 'developers-club';
            }
        }

        $actualRole = $user['role'];
        if ($user['role'] === 'admin') $actualRole = 'admin';
        elseif ($isMentor) $actualRole = 'club_mentor';
        elseif ($isOrganizer) $actualRole = 'club_organizer';
        elseif ($isLead) $actualRole = 'club_lead';

        // Return user info (excluding password hash)
        echo json_encode([
            'success' => true,
            'message' => 'Welcome back! Signed in successfully.',
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'rollNumber' => $user['roll_number'],
                'role' => $effectiveRole,
                'actual_role' => $actualRole,
                'is_organizer' => $isOrganizer,
                'is_lead' => $isLead,
                'is_mentor' => $isMentor,
                'club' => $managedClub,
                'year' => $user['year_of_study'],
                'managed_club' => $managedClub,
                'managed_wing' => $managedWing
            ]
        ]);
        exit();
    }

    // 2. Check in `mentors` table for Faculty Mentors who are not in users table
    $mentorStmt = $pdo->prepare("SELECT id, name, email, phone, department, designation, mentor_role, club_slug FROM `mentors` WHERE `email` = :email LIMIT 1");
    $mentorStmt->execute([':email' => $email]);
    $mentor = $mentorStmt->fetch();

    if ($mentor) {
        $emailPrefix = explode('@', $email)[0];
        $mentorPassValid = (
            (!empty($mentor['phone']) && $password === $mentor['phone']) ||
            strtoupper($password) === strtoupper($emailPrefix) ||
            $password === 'password123' ||
            $password === 'mentor123' ||
            $password === 'admin123'
        );

        if ($mentorPassValid) {
            echo json_encode([
                'success' => true,
                'message' => 'Welcome Faculty Mentor! Signed in successfully.',
                'user' => [
                    'id' => (int)$mentor['id'],
                    'name' => $mentor['name'],
                    'email' => $mentor['email'],
                    'rollNumber' => $mentor['phone'] ?: 'FACULTY',
                    'role' => ($requestedRole === 'student') ? 'student' : 'club_mentor',
                    'actual_role' => 'club_mentor',
                    'is_organizer' => false,
                    'is_lead' => false,
                    'is_mentor' => true,
                    'club' => $mentor['club_slug'] ?: 'developers-club',
                    'year' => $mentor['designation'] ?: ($mentor['mentor_role'] ?: 'Faculty Mentor'),
                    'managed_club' => $mentor['club_slug'] ?: 'developers-club',
                    'managed_wing' => null
                ]
            ]);
            exit();
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Incorrect password for Faculty Mentor account. Use your registered contact number or default password.'
            ]);
            exit();
        }
    }

    // 3. Check in `club_organizers` table if not found in users
    $emailPrefix = explode('@', $email)[0];
    $orgStmt = $pdo->prepare("SELECT id, club_slug, organizer_name, organizer_roll_number, organizer_email, organizer_phone, organizer_year FROM `club_organizers` WHERE `organizer_email` = :email OR UPPER(`organizer_roll_number`) = UPPER(:roll) LIMIT 1");
    $orgStmt->execute([':email' => $email, ':roll' => $emailPrefix]);
    $org = $orgStmt->fetch();

    if ($org) {
        if (
            strtoupper($password) === strtoupper($org['organizer_roll_number']) ||
            $password === 'password123' ||
            $password === 'admin123' ||
            $password === 'organizer123'
        ) {
            $effectiveOrgRole = ($requestedRole === 'student') ? 'student' : 'club_organizer';
            echo json_encode([
                'success' => true,
                'message' => 'Welcome Club Organizer! Signed in successfully.',
                'user' => [
                    'id' => (int)$org['id'],
                    'name' => $org['organizer_name'],
                    'email' => $org['organizer_email'] ?: $email,
                    'rollNumber' => $org['organizer_roll_number'],
                    'role' => $effectiveOrgRole,
                    'actual_role' => 'club_organizer',
                    'is_organizer' => true,
                    'is_lead' => false,
                    'is_mentor' => false,
                    'club' => $org['club_slug'],
                    'year' => $org['organizer_year'] ?: 'Final Year',
                    'managed_club' => $org['club_slug'],
                    'managed_wing' => null
                ]
            ]);
            exit();
        }
    }

    // 3b. Check in `club_wings` table if not found in users
    $leadStmt = $pdo->prepare("SELECT id, club_slug, wing_slug, wing_name, lead_name, lead_roll_number, lead_email, lead_phone, lead_year FROM `club_wings` WHERE `lead_email` = :email OR UPPER(`lead_roll_number`) = UPPER(:roll) LIMIT 1");
    $leadStmt->execute([':email' => $email, ':roll' => $emailPrefix]);
    $leadWingRow = $leadStmt->fetch();

    if ($leadWingRow && !empty($leadWingRow['lead_name'])) {
        if (
            (!empty($leadWingRow['lead_roll_number']) && strtoupper($password) === strtoupper($leadWingRow['lead_roll_number'])) ||
            $password === 'password123' ||
            $password === 'lead123' ||
            $password === 'admin123'
        ) {
            $effectiveLeadRole = ($requestedRole === 'student') ? 'student' : 'club_lead';
            echo json_encode([
                'success' => true,
                'message' => 'Welcome Club Wing Lead! Signed in successfully.',
                'user' => [
                    'id' => (int)$leadWingRow['id'],
                    'name' => $leadWingRow['lead_name'],
                    'email' => $leadWingRow['lead_email'] ?: $email,
                    'rollNumber' => $leadWingRow['lead_roll_number'],
                    'role' => $effectiveLeadRole,
                    'actual_role' => 'club_lead',
                    'is_organizer' => false,
                    'is_lead' => true,
                    'is_mentor' => false,
                    'club' => $leadWingRow['club_slug'],
                    'year' => $leadWingRow['lead_year'] ?: 'Third Year',
                    'managed_club' => $leadWingRow['club_slug'],
                    'managed_wing' => $leadWingRow['wing_slug'] ?? $leadWingRow['wing_name']
                ]
            ]);
            exit();
        }
    }

    // 4. Check if user is in `club_members` or `applications` table
    $appStmt = $pdo->prepare("SELECT id, name, email, roll_number, club_slug, department, year_of_study FROM `club_members` WHERE `email` = :email LIMIT 1");
    $appStmt->execute([':email' => $email]);
    $app = $appStmt->fetch();

    if (!$app) {
        $appStmt = $pdo->prepare("SELECT id, name, email, roll_number, club_slug, club_name, year_of_study FROM `applications` WHERE `email` = :email ORDER BY id DESC LIMIT 1");
        $appStmt->execute([':email' => $email]);
        $app = $appStmt->fetch();
    }

    if ($app) {
        // Strict guard: An applicant or student member cannot log in as Mentor, Organizer, or Wing Lead!
        if ($requestedRole === 'club_mentor' || $requestedRole === 'mentor' || $requestedRole === 'faculty_mentor') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access Denied: You are registered as a Student Member, not an authorized Faculty Mentor.'
            ]);
            exit();
        } elseif ($requestedRole === 'club_organizer') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access Denied: You have not been appointed as a Club Organiser. Only the LMS Administrator can promote a member to Club Organiser.'
            ]);
            exit();
        } elseif ($requestedRole === 'club_lead') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access Denied: You have not been assigned as a Club Wing Lead. A Club Organiser or Faculty Mentor must assign you to a wing first.'
            ]);
            exit();
        }

        // Allow login if password matches their roll number or default password
        if (strtoupper($password) === strtoupper($app['roll_number']) || $password === 'password123' || $password === 'student123') {
            $effectiveAppRole = 'student';
            // Create user entry strictly with 'student' role
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $createStmt = $pdo->prepare("
                INSERT INTO `users` (`name`, `email`, `roll_number`, `password`, `role`, `year_of_study`, `club`)
                VALUES (:name, :email, :roll, :password, 'student', :year, :club)
            ");
            $createStmt->execute([
                ':name' => $app['name'],
                ':email' => $app['email'],
                ':roll' => $app['roll_number'],
                ':password' => $hash,
                ':year' => $app['year_of_study'] ?: 'First Year',
                ':club' => $app['club_slug'] ?: 'developers-club'
            ]);
            $newId = (int)$pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Welcome Student Member! Account activated successfully.',
                'user' => [
                    'id' => $newId,
                    'name' => $app['name'],
                    'email' => $app['email'],
                    'rollNumber' => $app['roll_number'],
                    'role' => 'student',
                    'club' => $app['club_slug'] ?: 'developers-club',
                    'year' => $app['year_of_study'] ?: 'First Year',
                    'managed_club' => $app['club_slug'] ?: 'developers-club',
                    'managed_wing' => null
                ]
            ]);
            exit();
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => "Application found! Please enter the default password sent to your college email (your Roll Number)."
            ]);
            exit();
        }
    }

    // 5. Neither user nor applicant found
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'No account found with this email. Please submit an application on the Join SAC page first.'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Login error: ' . $e->getMessage()
    ]);
}
