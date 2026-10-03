<?php
// backend/api/applications.php
// View submitted applications (GET)

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDbConnection();

    $stmt = $pdo->query("
        SELECT id, name, roll_number, email, year_of_study, club_slug, club_name, status, created_at 
        FROM `applications` 
        ORDER BY id DESC
    ");
    $applications = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'count' => count($applications),
        'applications' => $applications
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error retrieving applications: ' . $e->getMessage()
    ]);
}
