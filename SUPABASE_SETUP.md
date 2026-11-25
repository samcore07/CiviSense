# Supabase Integration Guide for CiviSense

CiviSense is integrated with **Supabase** for PostgreSQL database storage, real-time live GIS incident synchronization, defect photo storage, and authentication with role-based access control (`admin` and `citizen`).

---

## 1. Quick Setup (3 Steps)

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account or sign in.
2. Click **New Project**, name it **`civisense`**, set a database password, and choose your preferred region.

### Step 2: Run the Database Schema
1. In your Supabase project dashboard, open the **SQL Editor** from the left sidebar (or navigate to `https://supabase.com/dashboard/project/_/sql`).
2. Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and paste it into the SQL Editor.
3. Click **Run**.
   - This creates the `profiles` table with automatic signup triggers.
   - Creates the `reports` table with 40m spatial deduplication indexes and full civic defect classification.
   - Creates the `issue-images` public storage bucket.
   - Enables Row Level Security (RLS) policies for transparent public GIS viewing and citizen reporting.
   - Enables Supabase Realtime so map pins and status updates sync across tabs live without page refreshes.
   - Inserts 4 initial seed incidents in Kolkata coordinates.

### Step 3: Add Your Supabase Keys
You can connect Supabase in either of two ways:

#### Option A: Via `.env` File (Recommended for Local Dev)
Create a `.env` file in the `frontend/` directory (or copy `frontend/.env.example` to `frontend/.env`):
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-api-key-here
```
Find these values in your Supabase Dashboard under **Project Settings → API**.

#### Option B: In-App 1-Click Connect
1. Click **Login** in the top-right navbar.
2. In the modal, click **Connect Cloud** in the Supabase status banner.
3. Paste your **Project URL** and **Anon API Key**, then click **Save & Connect**.
4. The app immediately connects and persists credentials in `localStorage` without needing a server restart!

---

## 2. Authentication & Roles (`admin` vs `citizen`)

### User Roles
| Role | Capabilities in CiviSense |
| :--- | :--- |
| **Citizen Reporter** (`citizen`) | • File new civic complaints with GPS coordinates and camera defect photos.<br>• Synthesize automated AI complaint descriptions.<br>• Track real-time status of reported issues on the live GIS map. |
| **Municipal Admin** (`admin`) | • Access the Municipal Operations Console.<br>• Triage incoming defects and view 40m spatial duplicate suppression clusters.<br>• Update complaint lifecycle status (`reported` → `assigned` → `in_progress` → `resolved` → `rejected`).<br>• Filter reports by ward, category, and severity. |

### Sign Up with Roles
1. Open the **Login / Register** modal from the navbar.
2. Click the **Sign Up** tab.
3. Enter your **Full Name**, choose your role (**Citizen Reporter** or **Municipal Admin (GIS)**), enter your **Email** and **Password** (min 6 characters).
4. Click **Complete Registration**. The user is created in Supabase Auth, and an entry is automatically synced to the `public.profiles` table with the selected role.

### Sign In
1. In the **Sign In** tab, enter your registered email and password.
2. CiviSense authenticates against Supabase, retrieves your role (`admin` or `citizen`), and loads your personalized view.

### 1-Click Sandbox Demo Access
The modal also includes **Instant 1-Click Sandbox Login** buttons (`👤 Citizen Demo` and `🏛️ GIS Admin Officer`) for immediate zero-friction testing.

---

## 3. Database Functions Integrated with Supabase

| Function | Implementation | Supabase Resource |
| :--- | :--- | :--- |
| **Fetch Live Reports** | Fetches active civic issues sorted by `created_at DESC` for both the Preface map and Admin Console. | `reports` table |
| **File Issue & Geotag** | Uploads defect photo, runs 40m spatial Haversine check, and stores complaint record. | `reports` table + `issue-images` bucket |
| **Spatial Deduplication** | Detects if another citizen reported the same defect within 40m and links to parent ticket. | `duplicate_of` column |
| **Status Lifecycle Triage** | Updates ticket state (`reported` → `assigned` → `in_progress` → `resolved`). | `reports.status` column |
| **Realtime Live Updates** | Pushes instant map pin and status changes to all open browser windows via WebSockets. | `supabase_realtime` publication |
| **Profiles & RBAC** | Synchronizes user names, emails, and permissions. | `profiles` table |
