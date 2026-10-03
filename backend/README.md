# SAC (Student Activity Center) PHP & MySQL Backend

This is the PHP REST API backend for the AITAM SAC website, designed to run with **XAMPP Apache and MySQL**.

---

## 🚀 Quick Setup with XAMPP

### Step 1: Start XAMPP
1. Open the **XAMPP Control Panel**.
2. Click **Start** on **Apache**.
3. Click **Start** on **MySQL**.

---

### Step 2: Create the Database (`sac_db`)
1. Open your browser and go to: [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
2. Click on the **Import** tab at the top.
3. Click **Choose File** and select:
   `c:\Users\vinod\Downloads\sac\backend\database\schema.sql`
4. Click **Import** (or **Go**) at the bottom.
   
*(Alternatively: Click **New** -> Database name: `sac_db` -> Click the **SQL** tab and paste the contents of `schema.sql` -> Click **Go**)*.

---

### Step 3: Put Backend in XAMPP htdocs
Copy or link the `backend` folder into your XAMPP `htdocs`:
- **Destination folder**: `C:\xampp\htdocs\sac-backend`
- Or directly run this command in PowerShell:
  ```powershell
  Copy-Item -Recurse -Force "c:\Users\vinod\Downloads\sac\backend\*" "C:\xampp\htdocs\sac-backend\"
  ```

---

### Step 4: Test the API in Browser
Open this URL in your browser:
👉 **[http://localhost/sac-backend/api/status.php](http://localhost/sac-backend/api/status.php)**

You should see:
```json
{
  "success": true,
  "message": "SAC PHP Backend is connected to XAMPP MySQL successfully!",
  "database": "sac_db",
  "tables": ["applications", "users"]
}
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status.php` | Health check & MySQL status |
| `POST` | `/api/join.php` | Submit a new club application & auto-provision user |
| `POST` | `/api/login.php` | Sign in with `@adityatekkali.edu.in` email and password |
| `GET` | `/api/applications.php` | List all club applications |

---

## 🔑 Default Accounts (Seed Data)

| Role | Email | Default Password |
|---|---|---|
| **Club Lead** | `lead@adityatekkali.edu.in` | `password123` |
| **Student** | `22a51a0501@adityatekkali.edu.in` | `password123` *(or roll number `22A51A0501`)* |

> **Note for new students who apply on `/join`:**
> When a student submits the Join SAC application form, their account is automatically created with their **Roll Number** as their initial default password!
