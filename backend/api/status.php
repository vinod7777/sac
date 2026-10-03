<?php
// backend/api/status.php
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDbConnection();
    
    // Check tables in sac_db
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Count records
    $userCount = 0;
    $appCount = 0;
    $eventCount = 0;
    if (in_array('users', $tables)) {
        $userCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
    }
    if (in_array('applications', $tables)) {
        $appCount = (int)$pdo->query("SELECT COUNT(*) FROM `applications`")->fetchColumn();
    }
    if (in_array('cms_events', $tables)) {
        $eventCount = (int)$pdo->query("SELECT COUNT(*) FROM `cms_events`")->fetchColumn();
    }

    echo json_encode([
        'success' => true,
        'message' => 'SAC PHP Backend is connected to XAMPP MySQL successfully!',
        'database' => 'sac_db',
        'tables' => $tables,
        'stats' => [
            'users' => $userCount,
            'applications' => $appCount,
            'events' => $eventCount,
        ],
        'server_time' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error checking database status: ' . $e->getMessage()
    ]);
}
