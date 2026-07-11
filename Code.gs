/**
 * Google Sheets Student Attendance Web App
 * Backend Script (Code.gs)
 */

/**
 * Serves the HTML frontend.
 */
function doGet(e) {
  // Check and create a sample template sheet if the spreadsheet is completely empty
  checkAndCreateTemplate();

  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Student Attendance Dashboard')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Returns a list of all sheet/tab names in the active spreadsheet.
 */
function getSheetsList() {
  try {
    const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    return sheets.map(sheet => sheet.getName()).filter(name => name !== 'Timetable');
  } catch (e) {
    throw new Error('Failed to retrieve sheets: ' + e.message);
  }
}

/**
 * Fetches the student list and list of previous dates for a selected sheet.
 * Automatically identifies columns for Roll Number, Name, and Email.
 */
function getStudents(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Fallback if sheet is not found
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }
    
    if (!sheet) {
      return { sheetName: '', students: [], dates: [] };
    }
    
    const actualSheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    if (lastRow < 1) {
      return { sheetName: actualSheetName, students: [], dates: [] };
    }
    
    const range = sheet.getRange(1, 1, lastRow, lastColumn || 1);
    const values = range.getValues();
    // Apps Script auto-converts date-like strings to Date objects when reading back.
    // Use getDisplayValues() for the header row to get what is actually shown in the cell.
    const displayHeaders = sheet.getRange(1, 1, 1, lastColumn || 1).getDisplayValues()[0];
    const headers = values[0].map((h, i) => {
      if (h instanceof Date) {
        // Fall back to the display value which is the plain text we stored
        return displayHeaders[i] ? displayHeaders[i].toString().trim() : '';
      }
      return h.toString().trim();
    });
    
    // Dynamically identify columns
    let rollColIdx = -1;
    let prnColIdx = -1;
    let nameColIdx = -1;
    let emailColIdx = -1;
    let phoneColIdx = -1;
    let parentEmailColIdx = -1;
    let parentPhoneColIdx = -1;
    let warningColIdx = -1;
    
    // Track formula columns so they are not treated as date columns
    let conductedColIdx = -1;
    let attendedColIdx = -1;
    let rateColIdx = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].toLowerCase();
      if (h.includes('roll') || h.includes('id') || h === 'admission no' || h === 'reg no' || h === 'number') {
        rollColIdx = i;
      } else if (h.includes('prn')) {
        prnColIdx = i;
      } else if (h.includes('name') || h === 'student' || h.includes('full name')) {
        nameColIdx = i;
      } else if (h.includes('parent') && (h.includes('email') || h.includes('mail') || h.includes('guardian'))) {
        parentEmailColIdx = i;
      } else if (h.includes('parent') && (h.includes('phone') || h.includes('mobile') || h.includes('contact'))) {
        parentPhoneColIdx = i;
      } else if (h.includes('phone') || h.includes('mobile') || h.includes('contact')) {
        phoneColIdx = i;
      } else if (h.includes('warning') || h.includes('warn')) {
        warningColIdx = i;
      } else if (h.includes('conducted')) {
        conductedColIdx = i;
      } else if (h.includes('attended')) {
        attendedColIdx = i;
      } else if (h.includes('percentage') || h.includes('rate') || h === '%') {
        rateColIdx = i;
      } else if (h.includes('email') || h.includes('mail')) {
        emailColIdx = i;
      }
    }
    
    // Default fallbacks if header matches fail
    if (rollColIdx === -1) rollColIdx = 0; // Col A
    if (nameColIdx === -1) nameColIdx = 2; // Col C
    
    // Collect date columns (any column that isn't student info or formula columns)
    const dateHeaders = [];
    const dateColIndices = [];
    
    for (let i = 0; i < headers.length; i++) {
      if (i !== rollColIdx && i !== prnColIdx && i !== nameColIdx && i !== emailColIdx && 
          i !== phoneColIdx && i !== parentEmailColIdx && i !== parentPhoneColIdx && 
          i !== warningColIdx && i !== conductedColIdx && i !== attendedColIdx && i !== rateColIdx) {
        if (headers[i]) {
          dateHeaders.push(headers[i]);
          dateColIndices.push(i);
        }
      }
    }
    
    // Process student rows
    const students = [];
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const roll = row[rollColIdx] ? row[rollColIdx].toString().trim() : '';
      const prn = prnColIdx !== -1 && row[prnColIdx] ? row[prnColIdx].toString().trim() : '';
      const name = row[nameColIdx] ? row[nameColIdx].toString().trim() : '';
      const email = emailColIdx !== -1 && row[emailColIdx] ? row[emailColIdx].toString().trim() : '';
      const phone = phoneColIdx !== -1 && row[phoneColIdx] ? row[phoneColIdx].toString().trim() : '';
      const parentEmail = parentEmailColIdx !== -1 && row[parentEmailColIdx] ? row[parentEmailColIdx].toString().trim() : '';
      const parentPhone = parentPhoneColIdx !== -1 && row[parentPhoneColIdx] ? row[parentPhoneColIdx].toString().trim() : '';
      const warningsSent = warningColIdx !== -1 && row[warningColIdx] ? parseInt(row[warningColIdx]) || 0 : 0;
      
      // Skip row if both roll and name are empty
      if (!roll && !name) continue;
      
      const attendance = {};
      dateColIndices.forEach((colIdx, idx) => {
        const dateHeader = dateHeaders[idx];
        attendance[dateHeader] = row[colIdx] ? row[colIdx].toString().trim() : '';
      });
      
      students.push({
        rollNumber: roll,
        prn: prn,
        name: name,
        email: email,
        phone: phone,
        parentEmail: parentEmail,
        parentPhone: parentPhone,
        warningsSent: warningsSent,
        rowNum: r + 1, // 1-indexed row number in the sheet
        attendance: attendance
      });
    }
    
    return {
      sheetName: actualSheetName,
      dates: dateHeaders,
      students: students
    };
  } catch (e) {
    throw new Error('Failed to load student data: ' + e.message);
  }
}

/**
 * Saves attendance data back to the sheet for a specific date.
 * If the date column doesn't exist, it appends it as a new column.
 * Target format for status: "P" (Present), "A" (Absent), "L" (Late).
 * 
 * @param {string} sheetName - Target tab name
 * @param {string} dateString - Format "YYYY-MM-DD"
 * @param {Object} attendanceMap - Key-value pair of { rowNumberString: status }
 */
function saveAttendance(sheetName, dateString, attendanceMap) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }
    
    // IMPORTANT: Google Apps Script auto-converts date-like strings to Date objects.
    // Force it back to a plain string immediately to avoid "Sat Dec 30 1899..." artifacts.
    const dateLabel = String(dateString).trim();
    
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    if (lastRow < 2) {
      throw new Error('No student records found to save attendance.');
    }
    
    // Fetch headers to check if date column already exists
    const headerRange = sheet.getRange(1, 1, 1, lastColumn || 1);
    const headers = headerRange.getValues()[0].map(h => {
      // Headers that were stored as dates also need toString()
      return h instanceof Date
        ? Utilities.formatDate(h, Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : h.toString().trim();
    });
    
    let dateColIdx = headers.indexOf(dateLabel);
    let targetColNum = -1;
    
    if (dateColIdx === -1) {
      // Date column doesn't exist. Add a new column at the end as PLAIN TEXT
      targetColNum = lastColumn + 1;
      const headerCell = sheet.getRange(1, targetColNum);
      headerCell.setNumberFormat('@STRING@');  // Force plain text so Sheets won't parse it
      headerCell.setValue(dateLabel);
    } else {
      // Date column exists. Update existing column
      targetColNum = dateColIdx + 1;
    }
    
    // Build 2D array of attendance values to write in batch
    const valuesToWrite = [];
    for (let r = 2; r <= lastRow; r++) {
      const status = attendanceMap[r.toString()] || '';
      valuesToWrite.push([status]);
    }
    
    // Write the values to the sheet
    sheet.getRange(2, targetColNum, valuesToWrite.length, 1).setValues(valuesToWrite);
    
    return { success: true, date: dateLabel };
  } catch (e) {
    throw new Error('Failed to save attendance: ' + e.message);
  }
}

/**
 * ONE-TIME MIGRATION UTILITY — Fix Timetable time cells
 * Run from Apps Script editor: select fixTimetableCells → click ▶ Run
 *
 * Timetable Start/End Time cells are stored as Date-type values in Google Sheets.
 * Even getDisplayValues() returns the full date string if the cell format is Date/Time.
 * This function reads the raw Date objects, formats them to "10:30 AM" strings,
 * then rewrites the cells as plain text (@STRING@) so they display correctly everywhere.
 */
function fixTimetableCells() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tz = Session.getScriptTimeZone();
    const sheet = ss.getSheetByName('Timetable');

    if (!sheet) {
      SpreadsheetApp.getUi().alert('Timetable sheet not found.');
      return;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      SpreadsheetApp.getUi().alert('Timetable has no data rows.');
      return;
    }

    // Read raw values — Date-type cells come back as JS Date objects
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 5);
    const raw = dataRange.getValues();

    const cleaned = raw.map(row => {
      // Col A: Day name — if stored as a Date, derive the day name from it
      const day = row[0] instanceof Date
        ? Utilities.formatDate(row[0], tz, 'EEEE') // e.g. "Monday"
        : (row[0] || '').toString().trim();

      // Col B: Start Time → "10:30 AM"
      const startTime = row[1] instanceof Date
        ? Utilities.formatDate(row[1], tz, 'hh:mm a').toUpperCase()
        : (row[1] || '').toString().trim();

      // Col C: End Time → "11:30 AM"
      const endTime = row[2] instanceof Date
        ? Utilities.formatDate(row[2], tz, 'hh:mm a').toUpperCase()
        : (row[2] || '').toString().trim();

      const classRef  = (row[3] || '').toString().trim();
      const classroom = (row[4] || '').toString().trim();

      return [day, startTime, endTime, classRef, classroom];
    });

    // Force plain text format before writing so Sheets won't re-parse as dates
    dataRange.setNumberFormat('@STRING@');
    dataRange.setValues(cleaned);

    SpreadsheetApp.getUi().alert(
      '✅ Timetable Fixed',
      `Cleaned ${cleaned.length} row(s). Times are now stored as plain text.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    throw new Error('fixTimetableCells failed: ' + e.message);
  }
}

/**
 * ONE-TIME MIGRATION UTILITY
 * Run this once from the Apps Script editor (select this function → click ▶ Run)
 * to replace all broken "Sat Dec 30 1899..." column headers in every roster sheet
 * with correct date+time strings (YYYY-MM-DD HH:MM AM/PM) reconstructed from
 * the Timetable schedule, starting from 6 July 2026.
 *
 * Safe to run multiple times — it only touches headers that still contain "1899".
 */
function fixBrokenDateHeaders() {
  try {
    const ss   = SpreadsheetApp.getActiveSpreadsheet();
    const tz   = Session.getScriptTimeZone();
    // Lectures started from this date — adjust here if needed
    const startDate = new Date(2026, 6, 6); // July 6, 2026 (month is 0-indexed)

    // ── Build timetable schedule map: classRef → [{dayIndex, startTime}] ────
    const timetableSheet = ss.getSheetByName('Timetable');
    const scheduleMap = {};
    const DAY_INDEX = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };

    if (timetableSheet && timetableSheet.getLastRow() > 1) {
      const ttRows = timetableSheet
        .getRange(2, 1, timetableSheet.getLastRow() - 1, 4)
        .getDisplayValues();

      ttRows.forEach(row => {
        const day      = (row[0] || '').trim().toLowerCase();
        const time     = (row[1] || '').trim();
        const classRef = (row[3] || '').trim();
        if (!day || !classRef || DAY_INDEX[day] === undefined) return;
        if (!scheduleMap[classRef]) scheduleMap[classRef] = [];
        scheduleMap[classRef].push({ dayIndex: DAY_INDEX[day], startTime: time });
      });
    }

    const results = [];

    ss.getSheets()
      .filter(s => s.getName() !== 'Timetable')
      .forEach(sheet => {
        const sheetName = sheet.getName();
        const lastCol   = sheet.getLastColumn();
        if (lastCol < 1) return;

        // Read raw values (Date objects for auto-parsed cells) + display strings
        const rawHdrs  = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const dispHdrs = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];

        // Identify broken columns: raw value is a Date OR display contains "1899"
        const brokenColIndices = rawHdrs
          .map((val, i) => {
            const brokenRaw  = val instanceof Date;
            const brokenDisp = (dispHdrs[i] || '').includes('1899');
            return (brokenRaw || brokenDisp) ? i : -1;
          })
          .filter(i => i !== -1);

        if (brokenColIndices.length === 0) {
          results.push(`✅ ${sheetName}: No broken headers — skipped.`);
          return;
        }

        // ── Generate ordered session dates for this class from the timetable ──
        const schedule = scheduleMap[sheetName] || [];
        const sessions = [];
        const cursor   = new Date(startDate);
        const MAX_DAYS = 365;

        for (let d = 0; d < MAX_DAYS && sessions.length < brokenColIndices.length; d++) {
          const dow     = cursor.getDay();
          const dateStr = Utilities.formatDate(cursor, tz, 'yyyy-MM-dd');

          schedule
            .filter(s => s.dayIndex === dow)
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .forEach(s => {
              if (sessions.length < brokenColIndices.length) {
                sessions.push(`${dateStr} ${s.startTime}`);
              }
            });

          cursor.setDate(cursor.getDate() + 1);
        }

        // Fallback: if no timetable match, assign weekly dates with no time
        if (sessions.length === 0) {
          const fb = new Date(startDate);
          for (let i = 0; i < brokenColIndices.length; i++) {
            sessions.push(Utilities.formatDate(fb, tz, 'yyyy-MM-dd'));
            fb.setDate(fb.getDate() + 7);
          }
        }

        // ── Replace broken headers with corrected date strings ──────────────
        brokenColIndices.forEach((colIdx, i) => {
          const newLabel = sessions[i] ||
            Utilities.formatDate(
              new Date(startDate.getTime() + i * 7 * 86400000), tz, 'yyyy-MM-dd'
            );
          const cell = sheet.getRange(1, colIdx + 1);
          cell.setNumberFormat('@STRING@'); // Store as plain text
          cell.setValue(newLabel);
        });

        results.push(
          `🔧 ${sheetName}: Fixed ${brokenColIndices.length} header(s) → ` +
          sessions.slice(0, brokenColIndices.length).join(' | ')
        );
      });

    Logger.log('fixBrokenDateHeaders results:\n' + results.join('\n'));
    SpreadsheetApp.getUi().alert(
      '✅ Migration Complete',
      results.join('\n'),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return results.join('\n');
  } catch (e) {
    throw new Error('fixBrokenDateHeaders failed: ' + e.message);
  }
}

/**
 * Automatically creates a sample template if the sheet is empty or blank.
 */

function checkAndCreateTemplate() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create Timetable tab if it doesn't exist
    let timetableSheet = ss.getSheetByName('Timetable');
    if (!timetableSheet) {
      timetableSheet = ss.insertSheet('Timetable', 0);
      timetableSheet.getRange('A1:E1').setValues([['Day', 'Start Time', 'End Time', 'Subject/Class Tab Reference', 'Classroom']]);
      
      // Force Start Time (col B) and End Time (col C) to plain text so Sheets
      // never auto-converts them to Time-type cells (which causes Dec 30 1899 display bug)
      timetableSheet.getRange('B:C').setNumberFormat('@STRING@');
      
      timetableSheet.getRange('A2:E4').setValues([
        ['Monday', '10:30 AM', '11:30 AM', 'DS-1 Panel H', 'Room 402'],
        ['Wednesday', '01:30 PM', '02:30 PM', 'DS-1 Panel H', 'Room 402'],
        ['Friday', '09:00 AM', '10:00 AM', 'Chemistry Panel B', 'Lecture Hall 1']
      ]);
      timetableSheet.autoResizeColumn(1);
      timetableSheet.autoResizeColumn(2);
      timetableSheet.autoResizeColumn(3);
      timetableSheet.autoResizeColumn(4);
      timetableSheet.autoResizeColumn(5);
    }
    
    // Create DS-1 Panel H tab if it doesn't exist
    let rosterSheet = ss.getSheetByName('DS-1 Panel H');
    if (!rosterSheet) {
      rosterSheet = ss.insertSheet('DS-1 Panel H', 1);
      
      rosterSheet.getRange('A1:K1').setValues([[
        'Roll Number', 'PRN', 'Student Name', 'Official Email', 'Phone Number', 
        'Parent Email', 'Parent Phone', 'Warnings Sent', 'Conducted Classes', 'Attended Classes', 'Percentage Attendance'
      ]]);
      
      rosterSheet.getRange('A2:G6').setValues([
        ['S001', 'PRN1001', 'Alice Smith', 'alice@example.com', '+123456789', 'parent.alice@example.com', '+198765432'],
        ['S002', 'PRN1002', 'Bob Johnson', 'bob@example.com', '+123456780', 'parent.bob@example.com', '+198765430'],
        ['S003', 'PRN1003', 'Charlie Brown', 'charlie@example.com', '+123456781', 'parent.charlie@example.com', '+198765431'],
        ['S004', 'PRN1004', 'David Davis', 'david@example.com', '+123456782', 'parent.david@example.com', '+198765432'],
        ['S005', 'PRN1005', 'Eva Green', 'eva@example.com', '+123456783', 'parent.eva@example.com', '+198765433']
      ]);
      
      rosterSheet.getRange('H2:H6').setValues([[0], [0], [0], [0], [0]]);
      
      for (let r = 2; r <= 6; r++) {
        rosterSheet.getRange(r, 9).setFormula(`=COUNTIF(L${r}:2, "P") + COUNTIF(L${r}:2, "A") + COUNTIF(L${r}:2, "L")`);
        rosterSheet.getRange(r, 10).setFormula(`=COUNTIF(L${r}:2, "P") + COUNTIF(L${r}:2, "L")`);
        rosterSheet.getRange(r, 11).setFormula(`=IF(I${r}>0, ROUND((J${r}/I${r})*100), 100)`);
      }
      
      for (let c = 1; c <= 11; c++) {
        rosterSheet.autoResizeColumn(c);
      }
    }
  } catch (e) {
    Logger.log('Could not create template: ' + e.message);
  }
}

/**
 * Sends a warning email to a student with low or declining attendance.
 */
function sendWarningEmail(studentName, studentEmail, attendanceRate, sheetName, consecutiveAbsences, parentEmail, ccParent, rowNum) {
  try {
    if (!studentEmail) {
      throw new Error('No email address provided for this student.');
    }
    
    const subject = `⚠️ Attendance Warning Notice: ${sheetName}`;
    let body = `Dear ${studentName},\n\n` +
               `This is a notification regarding your attendance in "${sheetName}".\n\n`;
               
    if (consecutiveAbsences >= 3) {
      body += `Our records show that you have been continuously ABSENT for the last ${consecutiveAbsences} consecutive classes.\n`;
    }
    
    body += `Your current overall attendance rate is ${attendanceRate}%.\n\n` +
            `Please note that maintaining a healthy attendance record is critical for your academic progress. A minimum of 75% attendance is typically expected.\n\n` +
            `Please connect with your course instructor as soon as possible to address this.\n\n` +
            `Sincerely,\n` +
            `Attendance Management System`;
            
    const mailOptions = {
      to: studentEmail,
      subject: subject,
      body: body
    };
    
    if (ccParent && parentEmail) {
      mailOptions.cc = parentEmail;
    }
    
    MailApp.sendEmail(mailOptions);
    
    // Increment Warning Log in Sheet
    if (rowNum && sheetName) {
      try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(sheetName);
        if (sheet) {
          const lastColumn = sheet.getLastColumn();
          const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(h => h.toString().trim().toLowerCase());
          let warningColIdx = headers.findIndex(h => h.includes('warning') || h.includes('warn'));
          
          if (warningColIdx === -1) {
            warningColIdx = lastColumn;
            sheet.getRange(1, warningColIdx + 1).setValue('Warnings Sent');
          }
          
          const cell = sheet.getRange(rowNum, warningColIdx + 1);
          const currentCount = parseInt(cell.getValue()) || 0;
          cell.setValue(currentCount + 1);
        }
      } catch (err) {
        Logger.log('Could not update Warnings Sent cell: ' + err.message);
      }
    }
    
    return { success: true, email: studentEmail, cc: ccParent ? parentEmail : '' };
  } catch (e) {
    throw new Error('Failed to send warning email: ' + e.message);
  }
}

/**
 * Returns summary stats across all tabs/sheets for subject-level comparison.
 */
function getClassSummaries() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const summaries = [];
    
    sheets.forEach(sheet => {
      const name = sheet.getName();
      if (name === 'Timetable') return;
      const lastRow = sheet.getLastRow();
      const lastColumn = sheet.getLastColumn();
      
      if (lastRow < 2) {
        summaries.push({
          className: name,
          studentCount: 0,
          averageAttendance: 100
        });
        return;
      }
      
      const values = sheet.getRange(1, 1, lastRow, lastColumn || 1).getValues();
      const headers = values[0].map(h => h.toString().trim().toLowerCase());
      
      let rollIdx = -1;
      let nameIdx = -1;
      let emailIdx = -1;
      let parentEmailIdx = -1;
      let warningIdx = -1;
      
      for (let i = 0; i < headers.length; i++) {
        const h = headers[i];
        if (h.includes('roll') || h.includes('id') || h === 'admission no' || h === 'reg no' || h === 'number') {
          rollIdx = i;
        } else if (h.includes('name') || h === 'student' || h.includes('full name')) {
          nameIdx = i;
        } else if (h.includes('parent') && (h.includes('email') || h.includes('mail') || h.includes('guardian'))) {
          parentEmailIdx = i;
        } else if (h.includes('warning') || h.includes('warn')) {
          warningIdx = i;
        } else if (h.includes('email') || h.includes('mail')) {
          emailIdx = i;
        }
      }
      
      if (rollIdx === -1) rollIdx = 0;
      if (nameIdx === -1) nameIdx = 1;
      
      const dateColIndices = [];
      for (let i = 0; i < headers.length; i++) {
        if (i !== rollIdx && i !== nameIdx && i !== emailIdx && i !== parentEmailIdx && i !== warningIdx && headers[i]) {
          dateColIndices.push(i);
        }
      }
      
      let totalSlots = 0;
      let presentSlots = 0;
      let studentCount = 0;
      
      for (let r = 1; r < values.length; r++) {
        const row = values[r];
        const roll = row[rollIdx] ? row[rollIdx].toString().trim() : '';
        const studentName = row[nameIdx] ? row[nameIdx].toString().trim() : '';
        if (!roll && !studentName) continue;
        
        studentCount++;
        dateColIndices.forEach(colIdx => {
          const status = row[colIdx] ? row[colIdx].toString().trim() : '';
          if (status) {
            totalSlots++;
            if (status === 'P' || status === 'L') {
              presentSlots++;
            }
          }
        });
      }
      
      const rate = totalSlots > 0 ? Math.round((presentSlots / totalSlots) * 100) : 100;
      summaries.push({
        className: name,
        studentCount: studentCount,
        averageAttendance: rate
      });
    });
    
    return summaries;
  } catch (e) {
    throw new Error('Failed to get class summaries: ' + e.message);
  }
}

/**
 * Compiles a CSV representation of class attendance records.
 */
function exportClassReportCsv(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return 'No records found';
    }
    
    const data = getStudents(sheetName);
    const dates = data.dates;
    const students = data.students;
    
    const csvRows = [];
    const headers = [
      'Roll Number', 'Student Name', 'Email', 'Parent Email', 
      'Warnings Sent', 'Present Count', 'Absent Count', 'Late Count', 'Attendance Rate (%)'
    ];
    
    dates.forEach(date => {
      headers.push(date);
    });
    
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    
    students.forEach(student => {
      let pCount = 0;
      let aCount = 0;
      let lCount = 0;
      let total = 0;
      
      dates.forEach(date => {
        const status = student.attendance[date];
        if (status) {
          total++;
          if (status === 'P') pCount++;
          else if (status === 'A') aCount++;
          else if (status === 'L') lCount++;
        }
      });
      
      const rate = total > 0 ? Math.round(((pCount + lCount) / total) * 100) : 100;
      
      const row = [
        student.rollNumber,
        student.name,
        student.email,
        student.parentEmail,
        student.warningsSent || 0,
        pCount,
        aCount,
        lCount,
        rate
      ];
      
      dates.forEach(date => {
        row.push(student.attendance[date] || '');
      });
      
      csvRows.push(row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','));
    });
    
    return csvRows.join('\n');
  } catch (e) {
    throw new Error('Failed to generate CSV: ' + e.message);
  }
}

/**
 * Retrieves scheduled sessions from the 'Timetable' sheet tab.
 */
function getTimetable() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Timetable');
    if (!sheet) {
      return [];
    }
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    if (lastRow < 2) return [];
    
    const range = sheet.getRange(2, 1, lastRow - 1, Math.max(lastColumn, 5));
    
    // Use getDisplayValues() instead of getValues() so that Time-type, Date-type,
    // and any other auto-parsed cells are returned as their visible display strings
    // (e.g. "10:30 AM") rather than as JavaScript Date objects (which produce "Sat Dec 30 1899...").
    const displayValues = range.getDisplayValues();
    
    return displayValues
      .map(row => ({
        day:       (row[0] || '').toString().trim(),
        startTime: (row[1] || '').toString().trim(),
        endTime:   (row[2] || '').toString().trim(),
        classRef:  (row[3] || '').toString().trim(),
        classroom: (row[4] || '').toString().trim()
      }))
      .filter(entry => entry.day && entry.classRef); // Skip empty rows
  } catch (e) {
    Logger.log('Failed to fetch timetable: ' + e.message);
    return [];
  }
}

