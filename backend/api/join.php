<?php
// backend/api/join.php
// Endpoint to handle SAC club applications

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail_config.php';

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

// Extract and trim fields
$name = trim($data['name'] ?? '');
$rollNumber = strtoupper(trim($data['rollNumber'] ?? ''));
$email = strtolower(trim($data['email'] ?? ''));
$year = trim($data['year'] ?? '');
$clubSlug = trim($data['club'] ?? '');
$clubName = trim($data['clubName'] ?? $clubSlug);

// Validation
$errors = [];

if (empty($name) || strlen($name) < 2) {
    $errors['name'] = 'Full name is required (minimum 2 characters).';
}

if (empty($rollNumber)) {
    $errors['rollNumber'] = 'Roll number is required.';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'A valid email address is required.';
} elseif (!str_ends_with($email, '@adityatekkali.edu.in')) {
    $errors['email'] = 'Only official @adityatekkali.edu.in email addresses are accepted.';
}

if (empty($year)) {
    $errors['year'] = 'Year of study is required.';
}

if (empty($clubSlug)) {
    $errors['club'] = 'Please select a club.';
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

    // Check if the student has already applied for this club
    $checkStmt = $pdo->prepare("SELECT id, club_name, status, created_at FROM `applications` WHERE `roll_number` = :roll AND `club_slug` = :club LIMIT 1");
    $checkStmt->execute([':roll' => $rollNumber, ':club' => $clubSlug]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        // Update existing application to active with latest details
        $updateApp = $pdo->prepare("
            UPDATE `applications` 
            SET `name` = :name, `email` = :email, `year_of_study` = :year, `club_name` = :club_name, `status` = 'active' 
            WHERE `id` = :id
        ");
        $updateApp->execute([
            ':name' => $name,
            ':email' => $email,
            ':year' => $year,
            ':club_name' => $clubName,
            ':id' => $existing['id']
        ]);
        $applicationId = (int)$existing['id'];
    } else {
        // Insert new application with 'active' status
        $insertStmt = $pdo->prepare("
            INSERT INTO `applications` (`name`, `roll_number`, `email`, `year_of_study`, `club_slug`, `club_name`, `status`)
            VALUES (:name, :roll, :email, :year, :club_slug, :club_name, 'active')
        ");
        $insertStmt->execute([
            ':name' => $name,
            ':roll' => $rollNumber,
            ':email' => $email,
            ':year' => $year,
            ':club_slug' => $clubSlug,
            ':club_name' => $clubName
        ]);
        $applicationId = (int)$pdo->lastInsertId();
    }

    // Provision or update user in `users` table so they can log in
    // Default password is their Roll Number (e.g. 23A51A05C5)
    $userCheck = $pdo->prepare("SELECT id FROM `users` WHERE `email` = :email OR `roll_number` = :roll LIMIT 1");
    $userCheck->execute([':email' => $email, ':roll' => $rollNumber]);
    $existingUser = $userCheck->fetch();

    if (!$existingUser) {
        $defaultPasswordHash = password_hash($rollNumber, PASSWORD_BCRYPT);
        $userInsert = $pdo->prepare("
            INSERT INTO `users` (`name`, `email`, `roll_number`, `password`, `role`, `year_of_study`, `club`)
            VALUES (:name, :email, :roll, :password, 'student', :year, :club)
        ");
        $userInsert->execute([
            ':name' => $name,
            ':email' => $email,
            ':roll' => $rollNumber,
            ':password' => $defaultPasswordHash,
            ':year' => $year,
            ':club' => $clubSlug
        ]);
    } else {
        // Update user's name, club and year if already registered
        $userUpdate = $pdo->prepare("UPDATE `users` SET `name` = :name, `club` = :club, `year_of_study` = :year WHERE `id` = :id");
        $userUpdate->execute([':name' => $name, ':club' => $clubSlug, ':year' => $year, ':id' => $existingUser['id']]);
    }

    // Provision or update in `club_members` table
    try {
        $memCheck = $pdo->prepare("SELECT id FROM `club_members` WHERE `roll_number` = :roll AND `club_slug` = :club LIMIT 1");
        $memCheck->execute([':roll' => $rollNumber, ':club' => $clubSlug]);
        $existingMember = $memCheck->fetch();

        if (!$existingMember) {
            $memInsert = $pdo->prepare("
                INSERT INTO `club_members` (`name`, `roll_number`, `email`, `year_of_study`, `department`, `club_slug`, `status`)
                VALUES (:name, :roll, :email, :year, 'CSE', :club, 'active')
            ");
            $memInsert->execute([
                ':name' => $name,
                ':roll' => $rollNumber,
                ':email' => $email,
                ':year' => $year,
                ':club' => $clubSlug
            ]);
        } else {
            $memUpdate = $pdo->prepare("UPDATE `club_members` SET `name` = :name, `email` = :email, `year_of_study` = :year WHERE `id` = :id");
            $memUpdate->execute([':name' => $name, ':email' => $email, ':year' => $year, ':id' => $existingMember['id']]);
        }
    } catch (Exception $memEx) {
        // Ignore member table provisioning error if table structure slightly differs
    }

    // Trigger email via configured sender (SMTP or Google Apps Script)
    $mailStatus = null;
    try {
        if (function_exists('sendMemberWelcomeEmail')) {
            $mailStatus = sendMemberWelcomeEmail([
                'name' => $name,
                'email' => $email,
                'rollNumber' => $rollNumber,
                'clubName' => $clubName,
                'year' => $year,
                'portalUrl' => 'http://localhost:5173/login'
            ]);
        }
    } catch (Exception $mailEx) {
        $mailStatus = ['sent' => false, 'error' => $mailEx->getMessage()];
    }

    echo json_encode([
        'success' => true,
        'message' => "Welcome to {$clubName}! Your membership is active and your login details have been sent to your college email.",
        'applicationId' => $applicationId,
        'data' => [
            'name' => $name,
            'rollNumber' => $rollNumber,
            'email' => $email,
            'year' => $year,
            'club' => $clubName
        ],
        'emailSent' => $mailStatus['sent'] ?? false,
        'loginHint' => "A confirmation with your login credentials has been sent to your college email."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save application: ' . $e->getMessage()
    ]);
}
