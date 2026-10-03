<?php
// backend/config/mail_config.php
// Google Apps Script Web App Integration for Sending Welcome Emails

define('APPS_SCRIPT_URL', 'https://script.google.com/macros/s/AKfycbwyFlFfbGbDTtHRJv0QpIVOOP2ekmToYjdr16TggBmaybZil8b_aeHxFykZ7ib8PVPOVg/exec');

/**
 * Sends student credentials email via Google Apps Script Web App
 * 
 * @param array $payload ['name' => ..., 'email' => ..., 'rollNumber' => ..., 'clubName' => ..., 'year' => ...]
 * @return array
 */
function sendAppsScriptEmail(array $payload) {
    $webhookUrl = defined('APPS_SCRIPT_URL') ? trim(APPS_SCRIPT_URL) : '';
    
    if (empty($webhookUrl)) {
        return [
            'sent' => false,
            'message' => 'Google Apps Script Web App URL is not set in backend/config/mail_config.php'
        ];
    }

    $jsonPayload = json_encode($payload);

    // Prefer cURL if available
    if (function_exists('curl_init')) {
        $ch = curl_init($webhookUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        // Force HTTP/1.1 to avoid HTTP/2 stream PROTOCOL_ERROR on Windows libcurl
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            // If cURL errored, try stream context fallback
            return sendAppsScriptViaStream($webhookUrl, $jsonPayload);
        }

        $result = json_decode($response, true);
        return [
            'sent' => ($httpCode >= 200 && $httpCode < 400),
            'httpCode' => $httpCode,
            'response' => $result ?: $response
        ];
    } else {
        return sendAppsScriptViaStream($webhookUrl, $jsonPayload);
    }
}

/**
 * Fallback sender using PHP stream context
 */
function sendAppsScriptViaStream($webhookUrl, $jsonPayload) {
    $opts = [
        'http' => [
            'header'  => "Content-type: application/json\r\nContent-length: " . strlen($jsonPayload) . "\r\n",
            'method'  => 'POST',
            'content' => $jsonPayload,
            'timeout' => 12,
            'follow_location' => 1
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ];
    $ctx = stream_context_create($opts);
    $result = @file_get_contents($webhookUrl, false, $ctx);
    return [
        'sent' => ($result !== false),
        'response' => $result ? (json_decode($result, true) ?: $result) : 'Stream request failed'
    ];
}

/**
 * Main email sender function called by backend/api/join.php
 */
function sendMemberWelcomeEmail(array $payload) {
    return sendAppsScriptEmail($payload);
}
