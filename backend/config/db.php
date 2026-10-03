<?php
// backend/config/db.php
// Database Configuration & CORS handler for XAMPP MySQL

// Enable CORS for React frontend (localhost:5173, etc.)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
} else {
    header("Access-Control-Allow-Origin: *");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    http_response_code(200);
    exit(0);
}

header('Content-Type: application/json; charset=UTF-8');

// Default XAMPP MySQL credentials
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'sac_db';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$db_port = getenv('DB_PORT') ?: '3308';

function getDbConnection() {
    global $db_host, $db_name, $db_user, $db_pass, $db_port;
    $ports = array_unique([$db_port, '3308', '3306']);
    $hosts = array_unique([$db_host, '127.0.0.1', 'localhost']);
    $lastError = null;

    foreach ($hosts as $host) {
        foreach ($ports as $port) {
            try {
                $dsn = "mysql:host={$host};port={$port};dbname={$db_name};charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_TIMEOUT            => 2,
                ];
                return new PDO($dsn, $db_user, $db_pass, $options);
            } catch (PDOException $e) {
                $lastError = $e;
            }
        }
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . ($lastError ? $lastError->getMessage() : 'Unknown error'),
        'hint' => 'Make sure MySQL is running in XAMPP Control Panel on port 3308 or 3306 and the database "sac_db" is created.'
    ]);
    exit();
}
