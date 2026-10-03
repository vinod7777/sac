<?php
// backend/api/upload.php
// REST API endpoint to upload images for events, mentors, and CMS assets

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST to upload images.']);
    exit();
}

if (!isset($_FILES['image']) && !isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No image file uploaded. Please select an image.']);
    exit();
}

$uploadedFile = isset($_FILES['image']) ? $_FILES['image'] : $_FILES['file'];

if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Upload failed with error code: ' . $uploadedFile['error']]);
    exit();
}

// Validate file size (max 8MB)
$maxBytes = 8 * 1024 * 1024;
if ($uploadedFile['size'] > $maxBytes) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds maximum limit of 8MB.']);
    exit();
}

// Validate file extension
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
$originalName = $uploadedFile['name'];
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if (!in_array($extension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file format. Allowed formats: JPG, JPEG, PNG, WEBP, GIF, SVG.'
    ]);
    exit();
}

// Ensure target directory exists in public/uploads
$uploadDir = __DIR__ . '/../../public/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Generate a clean safe filename
$cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
$cleanBase = substr($cleanBase, 0, 30);
$uniqueName = 'img_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
$targetPath = $uploadDir . $uniqueName;

if (move_uploaded_file($uploadedFile['tmp_name'], $targetPath)) {
    $publicUrl = '/uploads/' . $uniqueName;
    echo json_encode([
        'success' => true,
        'message' => 'Image uploaded successfully',
        'url' => $publicUrl,
        'filename' => $uniqueName,
        'size' => $uploadedFile['size']
    ]);
    exit();
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file to destination directory.']);
    exit();
}
