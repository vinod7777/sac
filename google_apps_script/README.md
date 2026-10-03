# Google Apps Script Mailer Setup Guide for SAC

This integration sends automated welcome emails with portal login credentials to students immediately when they fill out the **Join SAC** form.

---

## Quick Setup (Takes 2 Minutes)

### Step 1: Open Google Apps Script
1. Go to [script.google.com](https://script.google.com) (sign in with your Google / College Workspace account).
2. Click **+ New project** (top-left).
3. Name the project `SAC Member Mailer`.

### Step 2: Paste the Script Code
1. Open the file [`google_apps_script/Code.gs`](file:///c:/xampp/htdocs/sac/google_apps_script/Code.gs) in this repository.
2. Copy all of its content.
3. In the Google Apps Script editor, delete any existing code in `Code.gs` and paste the copied code.
4. Click the **Save** icon (diskette).

### Step 3: Test & Authorize (One-Time Permission)
1. In the editor toolbar dropdown, select the function `testSendEmail`.
2. Click **Run**.
3. A popup will appear: "Authorization required". Click **Review permissions**, select your Google account, click **Advanced** -> **Go to SAC Member Mailer (unsafe)**, and click **Allow**.
4. Check your Gmail inbox—you should receive a test credentials email!

### Step 4: Deploy as Web App
1. Click the blue **Deploy** button (top-right) -> **New deployment**.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Fill in the deployment details:
   - **Description**: `SAC Member Welcome Mailer`
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(⚠️ Crucial: must be set to "Anyone" so the backend can call it)*
4. Click **Deploy**.
5. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 5: Save URL in Backend
1. Open [`backend/config/mail_config.php`](file:///c:/xampp/htdocs/sac/backend/config/mail_config.php).
2. Paste your copied URL inside `define('APPS_SCRIPT_URL', '...');`:
   ```php
   define('APPS_SCRIPT_URL', 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec');
   ```

---

## What Happens When a Student Applies?
1. Student submits their name, email, roll number, and selected club at `/join`.
2. Backend records the application and provisions their account in MySQL.
3. Backend instantly triggers the Google Apps Script Web App.
4. Google Apps Script formats a branded email with:
   - Student's name & selected club
   - Portal Login link
   - Username: Student's college email
   - Default Password: Roll Number
5. Student receives their login credentials safely in their private inbox!
