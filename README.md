# 📊 Google Sheets Student Attendance Web App

A beautiful, modern, mobile-responsive **Google Apps Script** web application for managing student attendance. Reads from and writes to Google Sheets. Designed for faculty managing multiple classes, with timetable-linked scheduling, rich analytics, and parent communication tools.

---

## 🗂️ Template — Download & Use

> **Get started in under 10 minutes.** Everything you need is in the [`template/`](template/) folder.

| File | Description |
|:-----|:------------|
| [`template/SETUP_GUIDE.md`](template/SETUP_GUIDE.md) | 📖 Full step-by-step setup guide |
| [`template/Timetable_template.csv`](template/Timetable_template.csv) | 📅 Import into your `Timetable` sheet tab |
| [`template/StudentRoster_template.csv`](template/StudentRoster_template.csv) | 👨‍🎓 Import into each class roster tab |
| [`Code.gs`](Code.gs) | ⚙️ Apps Script backend — paste into your Apps Script editor |
| [`Index.html`](Index.html) | 🖥️ Frontend UI — paste as an HTML file named `Index` |
| [`appsscript.json`](appsscript.json) | 🔧 Apps Script manifest (for `clasp` CLI users) |

### ⚡ Quick Steps
1. Create a new Google Sheet → add a `Timetable` tab → import `Timetable_template.csv`
2. Add a class tab (e.g. `SY CSE H DS I`) → import `StudentRoster_template.csv`
3. Go to **Extensions → Apps Script** → paste `Code.gs` and `Index.html`
4. **Deploy → New Deployment → Web App** → copy the URL → done! 🎉

➡️ **[Read the full setup guide →](template/SETUP_GUIDE.md)**

---


## ✨ Features

### Core Attendance
- **No-Code Setup**: Runs entirely inside Google Workspace — no hosting, servers, or databases required.
- **Vibrant Dark-Mode UI**: Glassmorphic, premium dashboard with smooth animations.
- **Smart Column Detection**: Automatically identifies `Roll Number`, `PRN`, `Name`, `Email`, `Phone`, `Parent Email`, `Parent Phone`, and `Warnings Sent` columns regardless of casing or minor naming differences.
- **Date + Time Session Columns**: Each session is saved as a `YYYY-MM-DD HH:MM AM/PM` column header, supporting multiple sessions per day without conflicts.
- **Bulk Actions**: One-click toggles to mark all students Present or Absent.
- **Real-time Search**: Instantly filter the roster by roll number, PRN, or name.

### 📅 Timetable Integration
- **Timetable Sheet Tab**: A dedicated `Timetable` tab defines your weekly schedule (Day, Start Time, End Time, Class Tab Reference, Classroom).
- **Smart Auto-Selection**: On load, the app reads the current day and time and auto-selects the ongoing class from your timetable and pre-fills the Session Time picker.
- **Session Time Picker**: A text input next to Session Date lets you manually specify or edit session times (e.g., `10:30 AM`).

### 📊 Rich Analytics Dashboard
- **Class Tab** (Trend + Weekday):
  - Present Rate Trend Line Chart across last 10 sessions.
  - Average Attendance Rate by Weekday bar chart.
- **Subjects Tab**: Horizontal bar chart comparing average attendance across all class roster tabs.
- **Honor Roll Tab**: Auto-generated list of students with ≥90% attendance rate, ranked by rate.

### 👤 Student Profile Modal
Clicking on any student card opens a full profile showing:
- PRN (Permanent Registration Number)
- Student Phone Number
- Parent Phone Number
- Official Email
- Parent Email
- Attendance Rate, Total Absences, Warnings Sent counter
- Session-by-session attendance history log (sorted newest first)
- Warning email trigger button for at-risk students

### ⚠️ Warning Email System
- Manually send warning notices to students with low attendance or multiple consecutive absences.
- Select **parent CC** option to include the parent's email in the same notification.
- The `Warnings Sent` column in the sheet is automatically incremented on each successful delivery.

### 📁 CSV Export
- Export a full class roster report as a CSV file — including Roll Number, PRN, Name, Email, Phone, Parent Email, Parent Phone, Warnings Sent, Present/Absent/Late counts, Attendance Rate, and day-by-day history.

### 🔁 Multi-User Sharing (Option A: Template Copy)
- Share your Google Sheet with colleagues using "Anyone with link can copy."
- Colleagues click **File → Make a Copy** — the entire Apps Script is duplicated to their Drive.
- Each faculty member deploys their own personal Web App URL with no quota conflicts.

---

## 🗂️ Spreadsheet Schema

### Tab 1: `Timetable`
| Day | Start Time | End Time | Subject/Class Tab Reference | Classroom |
|:---|:---|:---|:---|:---|
| Monday | 10:30 AM | 11:30 AM | DS-1 Panel H | Room 402 |
| Wednesday | 01:30 PM | 02:30 PM | DS-1 Panel H | Room 402 |
| Friday | 09:00 AM | 10:00 AM | Chemistry Panel B | Lecture Hall 1 |

> The **Subject/Class Tab Reference** must **exactly match** the name of a roster tab.

### Tabs 2+: Class Roster Sheets (e.g. `DS-1 Panel H`)
| A: Roll Number | B: PRN | C: Student Name | D: Official Email | E: Phone Number | F: Parent Email | G: Parent Phone | H: Warnings Sent | I: Conducted Classes | J: Attended Classes | K: Percentage Attendance | L+: Date+Time Sessions |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| S001 | PRN1001 | Alice Smith | alice@edu.in | +91... | parent.alice@mail.com | +91... | 0 | *(formula)* | *(formula)* | *(formula)* | P / A / L |

Columns I, J, K use native Google Sheets formulas:
- **Conducted** = `=COUNTIF(L2:2,"P") + COUNTIF(L2:2,"A") + COUNTIF(L2:2,"L")`
- **Attended** = `=COUNTIF(L2:2,"P") + COUNTIF(L2:2,"L")`
- **Percentage** = `=IF(I2>0, ROUND((J2/I2)*100), 100)`

---

## 🚀 Setup & Deployment (Step-by-Step)

### Step 1: Create Your Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. The app will auto-generate a sample `Timetable` tab and a `DS-1 Panel H` roster tab on first launch.
3. Alternatively, manually create your own tabs following the schema above.

### Step 2: Open Apps Script Editor
1. In your sheet, click **Extensions → Apps Script**.

### Step 3: Paste the Code
1. In `Code.gs`, paste the full contents of [Code.gs](Code.gs).
2. Click **+ Add a file → HTML**, name it exactly **`Index`**, and paste the full contents of [Index.html](Index.html).
3. Click **Save** (Ctrl+S).

### Step 4: Deploy as Web App
1. Click **Deploy → New Deployment**.
2. Choose type: **Web app**.
3. Set **Execute as**: `Me` and **Who has access**: `Anyone`.
4. Click **Deploy** and authorize the app when prompted.
5. Copy the generated **Web App URL** — that's your live attendance dashboard!

### Step 5: Updating After Code Changes
1. Paste updated file contents into the Apps Script editor.
2. Click **Deploy → Manage Deployments → Edit → New Version → Deploy**.

---

## 🤝 Sharing with Colleagues
1. Set your Google Sheet link to "Anyone with link can view/copy."
2. Share the link with your colleague.
3. They click **File → Make a Copy** and deploy their own Web App — zero extra configuration needed!

---

## 🛠️ Tech Stack
- **Backend**: Google Apps Script (JavaScript)
- **Frontend**: Vanilla HTML + CSS + JavaScript
- **Charts**: [Chart.js](https://www.chartjs.org/) (CDN)
- **Fonts**: [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts
- **Data Store**: Google Sheets (via Apps Script API)
