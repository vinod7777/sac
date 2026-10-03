<?php
// backend/api/test_mail.php
// Quick diagnostic tool to test Google Apps Script mail delivery

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail_config.php';

$testEmail = $_GET['email'] ?? '23a51a05c5@adityatekkali.edu.in';
$testName = $_GET['name'] ?? 'SANAPALA Vinod kumar';
$testRoll = $_GET['roll'] ?? '23A51A05C5';

$webhookUrl = defined('APPS_SCRIPT_URL') ? trim(APPS_SCRIPT_URL) : '';

if (empty($webhookUrl)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'APPS_SCRIPT_URL is not set in backend/config/mail_config.php'
    ], JSON_PRETTY_PRINT);
    exit();
}

$payload = [
    'name' => $testName,
    'email' => $testEmail,
    'rollNumber' => $testRoll,
    'clubName' => 'Developers Club',
    'year' => 'Third Year, CSE',
    'portalUrl' => 'http://localhost:5173/login'
];

$result = sendMemberWelcomeEmail($payload);

$diagnosis = ($result['sent'] ?? false) ? 'Credentials email sent successfully via Google Apps Script!' : 'Failed to send email.';
if (isset($result['error'])) {
    $diagnosis .= ' Error: ' . $result['error'];
}

echo json_encode([
    'service' => 'Google Apps Script Mailer',
    'webhook_url' => $webhookUrl,
    'test_recipient' => $testEmail,
    'result' => $result,
    'diagnosis' => $diagnosis
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

