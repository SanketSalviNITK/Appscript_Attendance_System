# 📋 Template Setup Guide

This folder contains the CSV templates and setup instructions to get the **Student Attendance App** running on your Google Account in under 10 minutes.

---

## 📁 Files in This Folder

| File | Purpose |
|:-----|:--------|
| `Timetable_template.csv` | Sample weekly timetable — import into your sheet's `Timetable` tab |
| `StudentRoster_template.csv` | Sample student roster — import into each class tab (e.g. `SY CSE H DS I`) |

---

## 🚀 Quick Start (Step-by-Step)

### Step 1 — Create a New Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **new blank spreadsheet**.
2. Rename it to something like `Attendance System — AY 2025-26`.

---

### Step 2 — Set Up the Timetable Tab

1. Rename the default `Sheet1` tab to exactly: **`Timetable`**
2. Click **File → Import → Upload** and upload `Timetable_template.csv`
3. Choose **"Replace current sheet"** and click Import

> ⚠️ **IMPORTANT:** After importing, select the **Start Time** and **End Time** columns (B and C).  
> Go to **Format → Number → Plain text** before typing or editing any times.  
> This prevents Google Sheets from converting `10:30 AM` into a date/time value.

Your `Timetable` tab should look like this:

| Day | Start Time | End Time | Subject/Class Tab Reference | Classroom |
|:----|:-----------|:---------|:---------------------------|:----------|
| Monday | 09:30 AM | 10:30 AM | SY CSE H DS I | Room 101 |
| Wednesday | 10:30 AM | 11:30 AM | SY CSE H DS I | Room 101 |

> The **Subject/Class Tab Reference** column value must **exactly match** the name of the corresponding roster sheet tab (including spaces, capitalisation, and punctuation).

---

### Step 3 — Set Up Each Class Roster Tab

For each class/subject in your timetable, create a separate sheet tab:

1. Click the **`+`** button at the bottom to add a new tab.
2. **Rename it exactly** to match the `Subject/Class Tab Reference` value in your Timetable (e.g. `SY CSE H DS I`).
3. Click **File → Import → Upload** and upload `StudentRoster_template.csv`.
4. Choose **"Replace current sheet"** and click Import.
5. **Delete the sample student rows** (rows 2–6) and enter your actual students.

#### Add the Attendance Formulas (Columns I, J, K)

After entering your students, add these formulas to each row:

| Column | Formula (replace `2` with your row number) |
|:-------|:-------------------------------------------|
| **I** (Conducted) | `=COUNTIF(L2:2,"P")+COUNTIF(L2:2,"A")+COUNTIF(L2:2,"L")` |
| **J** (Attended)  | `=COUNTIF(L2:2,"P")+COUNTIF(L2:2,"L")` |
| **K** (Percentage)| `=IF(I2>0,ROUND((J2/I2)*100),100)` |

Copy these formulas down for every student row.

> The app will append attendance session columns from **Column L onwards** automatically when you submit attendance.

---

### Step 4 — Add the Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**.
2. A new Apps Script project opens. You will see a `Code.gs` file.
3. **Select all** the existing content in `Code.gs` and **delete it**.
4. Go to the GitHub repo and **copy the full contents** of [`Code.gs`](../Code.gs).
5. **Paste** it into the Apps Script editor and press **Ctrl+S** to save.

#### Add the HTML Frontend

1. Click **`+` (Add a file) → HTML**.
2. Name the file exactly: **`Index`** (no `.html` extension — Apps Script adds it automatically).
3. **Select all** in the new `Index.html` tab and **delete it**.
4. Go to the GitHub repo and **copy the full contents** of [`Index.html`](../Index.html).
5. **Paste** and press **Ctrl+S**.

#### Add the Manifest (optional, for `clasp` users)

If you are using [clasp](https://github.com/google/clasp) (Google's CLI for Apps Script):
- Copy [`appsscript.json`](../appsscript.json) to your local project folder.
- Run `clasp push` to upload all files at once.

---

### Step 5 — Deploy as a Web App

1. In the Apps Script editor, click **Deploy → New Deployment**.
2. Click the ⚙️ gear icon and choose **Web app**.
3. Set:
   - **Description**: `Attendance System v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` (for colleagues on any Google account)
4. Click **Deploy** and **Authorize** when prompted.
5. Copy the generated **Web App URL** — this is your live attendance dashboard! 🎉

---

### Step 6 — First Launch (Run Template Setup)

On first open, the app auto-detects your sheets and populates the timetable. If your Timetable tab has broken time values (showing `Dec 30 1899`), run these one-time fixes from the Apps Script editor:

1. In the function dropdown, select **`fixTimetableCells`** → click ▶ **Run**
2. Then select **`fixBrokenDateHeaders`** → click ▶ **Run**

---

## 🤝 Sharing with Colleagues

1. In your Google Sheet, click **Share** → set to **"Anyone with the link"** can **view**.
2. Share the link with colleagues.
3. They click **File → Make a Copy** — the entire sheet + Apps Script is duplicated to their Google Drive.
4. They follow **Steps 4–5** above to deploy their own personal Web App.

Each colleague gets their own independent copy — no data mixing, no quota conflicts.

---

## ❓ Troubleshooting

| Problem | Solution |
|:--------|:---------|
| Times show as `Sat Dec 30 1899...` | Run `fixTimetableCells` from Apps Script editor |
| Session date columns show `1899` | Run `fixBrokenDateHeaders` from Apps Script editor |
| "No student rosters found" error | Ensure at least one tab name matches a `Subject/Class Tab Reference` in Timetable |
| Email warnings not sending | Check Gmail send quota; authorize the script's Gmail permission |
| App shows blank / doesn't load | Redeploy with a **New Version** in Manage Deployments |
