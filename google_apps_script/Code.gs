/**
 * ==============================================================================
 * AITAM Student Activity Center (SAC) - Automated Member Onboarding Mailer
 * ==============================================================================
 * 
 * Instructions to Deploy:
 * 1. Open https://script.google.com and click "+ New project".
 * 2. Replace all existing code with this file's code.
 * 3. (Optional) Run the `testSendEmail` function once to test and authorize permissions.
 * 4. Click the blue "Deploy" button (top right) -> "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "SAC Member Welcome Mailer".
 * 7. Set "Execute as": "Me (<your-email>)".
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL!
 * 9. Click "Deploy" and copy the Web App URL.
 * 10. Paste that Web App URL into `backend/config/mail_config.php` under `APPS_SCRIPT_URL`.
 * ==============================================================================
 */

function doPost(e) {
  try {
    var data = {};
    
    // Parse incoming request body
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var recipientEmail = data.email ? String(data.email).trim() : "";
    var studentName = data.name ? String(data.name).trim() : "Student";
    var rollNumber = data.rollNumber ? String(data.rollNumber).trim().toUpperCase() : "";
    var clubName = data.clubName ? String(data.clubName).trim() : "Student Activity Center";
    var year = data.year ? String(data.year).trim() : "";
    var portalUrl = data.portalUrl || "http://localhost:5173/login";

    if (!recipientEmail) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Missing recipient email address."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var subject = "Welcome to AITAM SAC! Your Portal Login Credentials";

    var htmlBody = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.8); font-weight: 600;">Aditya Institute of Technology and Management</p>
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Student Activity Center (SAC)</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #e0f2fe;">Welcome to ${clubName}</p>
        </div>

        <!-- Content Body -->
        <div style="padding: 32px 28px; color: #334155; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Dear <strong>${studentName}</strong>,</p>
          
          <p style="font-size: 14px; margin-bottom: 20px;">
            Congratulations! Your registration to join <strong>${clubName}</strong> has been successfully received and recorded in the SAC database. Your student portal access has been provisioned.
          </p>

          <!-- Credentials Card -->
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 22px; margin: 24px 0;">
            <h3 style="margin: 0 0 14px 0; color: #1e3a8a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
               Your SAC Portal Sign-In Credentials
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 7px 0; color: #64748b; width: 140px; font-weight: 500;">Portal Link:</td>
                <td style="padding: 7px 0;">
                  <a href="${portalUrl}" style="color: #2563eb; text-decoration: underline; font-weight: 600;">Sign in to SAC Portal</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Login Role:</td>
                <td style="padding: 7px 0; font-weight: 600; color: #0f172a;">Student Member</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748b; font-weight: 500;">College Email:</td>
                <td style="padding: 7px 0; font-family: monospace, Consolas, Courier; font-weight: 600; color: #0f172a;">${recipientEmail}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Default Password:</td>
                <td style="padding: 7px 0; font-family: monospace, Consolas, Courier; font-weight: 700; font-size: 15px; color: #2563eb; letter-spacing: 0.5px;">${rollNumber}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748b; font-weight: 500;">Year / Branch:</td>
                <td style="padding: 7px 0; color: #334155;">${year || 'Enrolled Student'}</td>
              </tr>
            </table>

            <div style="margin-top: 14px; padding: 10px; background-color: #eff6ff; border-radius: 6px; border-left: 3px solid #2563eb;">
              <p style="margin: 0; font-size: 12px; color: #1e40af;">
                💡 <strong>Important Note:</strong> Your initial password is set to your <strong>Roll Number</strong> (${rollNumber}). Please keep this email safe for future reference.
              </p>
            </div>
          </div>

          <!-- What to expect -->
          <p style="font-size: 13px; color: #475569; margin-bottom: 24px;">
            Once signed in, you will have access to your club LMS workspace, roadmaps, workshop schedules, and active tasks.
          </p>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${portalUrl}" style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Log In to SAC Workspace &rarr;
            </a>
          </div>

          <!-- Sign-off -->
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">Student Activity Center (SAC)</p>
            <p style="margin: 0;">Aditya Institute of Technology and Management (AITAM), Tekkali, AP - 532201</p>
          </div>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: "AITAM Student Activity Center"
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Credentials email sent successfully to " + recipientEmail
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    service: "AITAM SAC Mailer Web App",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this function in Apps Script to verify authorization and test email delivery
 */
function testSendEmail() {
  var testPayload = {
    postData: {
      contents: JSON.stringify({
        name: "Student Tester",
        email: Session.getActiveUser().getEmail(),
        rollNumber: "22A51A0501",
        clubName: "Developers Club",
        year: "Third Year, CSE",
        portalUrl: "http://localhost:5173/login"
      })
    }
  };
  var res = doPost(testPayload);
  Logger.log(res.getContent());
}
