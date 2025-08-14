/*
 * script.js
 * Handles form submission and generates a simple training plan based on user inputs.
 * The logic implements a very simplified version of the periodization algorithm
 * described in the site specification. It assigns phases (Base → Build → Specific → Taper),
 * gradually increases weekly mileage, and distributes running, strength and rest days
 * according to the user's available days and experience level.
 */

// Utility function: calculate difference in weeks between two dates
function weeksBetween(date1, date2) {
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.max(1, Math.floor((date2 - date1) / msPerWeek));
}

// Main generator function
function generatePlan(data) {
  const today = new Date();
  const raceDate = new Date(data.raceDate);
  const weeksToRace = weeksBetween(today, raceDate);

  // Determine phase lengths (simplified)
  let baseWeeks, buildWeeks, specificWeeks, taperWeeks;
  if (weeksToRace < 8) {
    baseWeeks = 2;
    taperWeeks = 1;
    specificWeeks = 1;
    buildWeeks = weeksToRace - baseWeeks - specificWeeks - taperWeeks;
  } else if (weeksToRace < 12) {
    baseWeeks = 3;
    taperWeeks = 1;
    specificWeeks = 2;
    buildWeeks = weeksToRace - baseWeeks - specificWeeks - taperWeeks;
  } else if (weeksToRace < 20) {
    baseWeeks = 4;
    taperWeeks = 1;
    specificWeeks = 3;
    buildWeeks = weeksToRace - baseWeeks - specificWeeks - taperWeeks;
  } else {
    // longer plans – more specific and taper time
    baseWeeks = 6;
    taperWeeks = 2;
    specificWeeks = 5;
    buildWeeks = weeksToRace - baseWeeks - specificWeeks - taperWeeks;
  }

  // Compute weekly running mileage progression (simplified)
  const initialMiles = Math.max(0, parseFloat(data.runningMileage) || 0);
  const experience = data.experience;
  const weeks = weeksToRace;
  const weeklyMiles = [];
  let currentMiles = initialMiles;
  // set approximate peak volume multiplier based on race distance
  let peakMultiplier = 1.5;
  if (data.raceDistance === '5k') peakMultiplier = 1.5;
  else if (data.raceDistance === '10k') peakMultiplier = 1.8;
  else if (data.raceDistance === '21k') peakMultiplier = 2.2;
  else peakMultiplier = 3.0; // ultra
  const targetPeak = Math.max(currentMiles * peakMultiplier, 10);
  for (let i = 0; i < weeks; i++) {
    weeklyMiles.push(currentMiles);
    // increase miles gradually until targetPeak
    const inc = experience === 'beginner' ? 0.08 : experience === 'intermediate' ? 0.10 : 0.12;
    currentMiles = Math.min(targetPeak, currentMiles * (1 + inc));
  }

  // Helper to pick a run description based on phase and whether it's hard or easy
  function generateRunDesc(isHard, phase) {
    if (!isHard) {
      return 'Easy run – stay at conversational pace (RPE 3–4).';
    }
    if (phase === 'Base') {
      return 'Tempo run – moderate pace (RPE 5–6).';
    }
    if (phase === 'Build') {
      return 'Interval or hill session – short bursts at RPE 6–7 with recovery jogs.';
    }
    if (phase === 'Specific') {
      return 'Race‑specific run – include carries or obstacles and maintain RPE 5–7.';
    }
    return 'Short sharpening run – brief bursts at RPE 6, mostly easy.';
  }
  // Helper to pick a strength description based on phase
  function generateStrengthDesc(phase) {
    if (phase === 'Base') {
      return 'General strength circuit – squats, push‑ups, lunges, core exercises.';
    }
    if (phase === 'Build') {
      return 'Full‑body strength with added grip work – deadlifts, pull‑ups, presses.';
    }
    if (phase === 'Specific') {
      return 'Obstacle strength & carries – rope climbs, sandbag/bucket carries, rig practice.';
    }
    return 'Light strength & mobility – keep muscles activated but prioritise recovery.';
  }

  // Determine how many sessions per category per week
  const trainingDays = parseInt(data.trainingDays, 10) || 3;
  const strengthFreq = parseInt(data.strengthFrequency, 10) || 1;

  // Build the weekly schedule
  const weeksPlan = [];
  for (let w = 0; w < weeks; w++) {
    let phase;
    if (w < baseWeeks) phase = 'Base';
    else if (w < baseWeeks + buildWeeks) phase = 'Build';
    else if (w < baseWeeks + buildWeeks + specificWeeks) phase = 'Specific';
    else phase = 'Taper';

    const days = Array(7).fill('');
    // Determine number of run days (60% of training days, at least 1)
    const runDays = Math.max(1, Math.round(trainingDays * 0.6));
    // Strength days: min(strength frequency, trainingDays - runDays)
    const strengthDays = Math.min(strengthFreq, trainingDays - runDays);
    // Remaining training days are rest/optional mobility
    const restDays = trainingDays - runDays - strengthDays;
    // Determine which run days are hard: 1 hard day per week if >3 training days
    const hardRuns = trainingDays >= 4 ? 1 : 0;

    // Spread training across Monday–Sunday
    let runCount = 0;
    let strengthCount = 0;
    let hardRunUsed = 0;
    for (let d = 0; d < 7; d++) {
      if (runCount < runDays) {
        const isHard = hardRunUsed < hardRuns && runDays - runCount <= hardRuns - hardRunUsed + (7 - d);
        if (isHard) hardRunUsed++;
        days[d] = generateRunDesc(isHard, phase);
        runCount++;
      } else if (strengthCount < strengthDays) {
        days[d] = generateStrengthDesc(phase);
        strengthCount++;
      } else if (d < trainingDays) {
        days[d] = 'Active recovery/mobility – gentle stretching or yoga.';
      } else {
        days[d] = 'Rest day.';
      }
    }
    weeksPlan.push({
      week: w + 1,
      phase,
      mileage: weeklyMiles[w].toFixed(1),
      days,
    });
  }
  return {
    weeks: weeksPlan,
    phases: { baseWeeks, buildWeeks, specificWeeks, taperWeeks },
    weeksToRace,
  };
}

// Render plan to table
function renderPlan(plan) {
  const planTable = document.getElementById('planTable');
  const planSummary = document.getElementById('planSummary');
  // Clear previous contents
  planTable.innerHTML = '';
  planSummary.innerHTML = '';
  // Summary text
  planSummary.innerHTML = `<p>Total weeks: <strong>${plan.weeksToRace}</strong> &nbsp;|&nbsp; Phases → Base: ${plan.phases.baseWeeks} wk, Build: ${plan.phases.buildWeeks} wk, Specific: ${plan.phases.specificWeeks} wk, Taper: ${plan.phases.taperWeeks} wk</p>`;
  // Table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `<th>Week</th><th>Phase</th><th>Weekly mileage</th>`;
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  daysOfWeek.forEach((d) => {
    const th = document.createElement('th');
    th.textContent = d;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  planTable.appendChild(thead);
  // Table body
  const tbody = document.createElement('tbody');
  // Compute start date (upcoming Monday) for progress comparison
  const today = new Date();
  const startDate = new Date(today);
  const dow = startDate.getDay();
  let diffToMon;
  if (dow === 1) {
    diffToMon = 0;
  } else if (dow === 0) {
    diffToMon = 1;
  } else {
    diffToMon = 8 - dow;
  }
  startDate.setDate(startDate.getDate() + diffToMon);
  // Load logged entries from localStorage keyed by ISO date (YYYY-MM-DD)
  let logsMapRender = {};
  try {
    const stored = JSON.parse(localStorage.getItem('ocrLogs') || '[]');
    stored.forEach((entry) => {
      if (entry.date) logsMapRender[entry.date] = entry;
    });
  } catch (err) {
    logsMapRender = {};
  }
  // Helper to convert date to ISO string with hyphens
  function toIsoHyphen(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  plan.weeks.forEach((weekObj, wIndex) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${weekObj.week}</td><td>${weekObj.phase}</td><td>${weekObj.mileage} mi</td>`;
    weekObj.days.forEach((cell, dIndex) => {
      const td = document.createElement('td');
      // Determine the actual date for this workout
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + wIndex * 7 + dIndex);
      const isoDate = toIsoHyphen(dayDate);
      // If there's a log entry for this date, mark as completed
      if (logsMapRender[isoDate]) {
        td.classList.add('completed');
        td.textContent = `\u2714\u00a0${cell}`; // prepend checkmark and non-breaking space
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  planTable.appendChild(tbody);
}

// Update the countdown to race day and display milestone suggestions
function updateCountdown(raceDateStr) {
  const container = document.getElementById('countdownContainer');
  if (!container || !raceDateStr) return;
  const raceDate = new Date(raceDateStr);
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.max(0, Math.ceil((raceDate - today) / msPerDay));
  // Generate milestone tasks based on time remaining
  let tasks;
  if (diffDays > 28) {
    tasks = [
      'Continue building your base fitness and gradually increase mileage.',
      'Practice obstacle techniques to improve efficiency.',
      'Ensure strength and mobility work remain consistent.',
    ];
  } else if (diffDays > 14) {
    tasks = [
      'Finalize your race gear and test it during long sessions.',
      'Begin mental rehearsal – visualise obstacles and race strategy.',
      'Increase specificity: include carries and technical terrain in your runs.',
    ];
  } else if (diffDays > 7) {
    tasks = [
      'Taper your training volume to allow recovery.',
      'Prioritise sleep, nutrition and hydration.',
      'Refine obstacle technique with low‑intensity practice.',
    ];
  } else {
    tasks = [
      'Maintain light activity to stay loose, avoid strenuous sessions.',
      'Prepare your race day logistics: travel, nutrition and gear.',
      'Stay positive – trust your training and visualise success.',
    ];
  }
  let html = '<h3>Countdown to Race</h3>';
  html += `<p>${diffDays} day${diffDays === 1 ? '' : 's'} remaining</p>`;
  html += '<ul>';
  tasks.forEach((task) => {
    html += `<li>${task}</li>`;
  });
  html += '</ul>';
  container.innerHTML = html;
}

// Adapt plan based on logged progress (simple adaptive logic)
// This function does not mutate the original plan; it assumes a fresh copy
function adaptPlan(plan) {
  if (!plan || !plan.weeks) return;
  // Determine start date (upcoming Monday) same as in renderPlan
  const today = new Date();
  const startDate = new Date(today);
  const dow = startDate.getDay();
  let diffToMon;
  if (dow === 1) {
    diffToMon = 0;
  } else if (dow === 0) {
    diffToMon = 1;
  } else {
    diffToMon = 8 - dow;
  }
  startDate.setDate(startDate.getDate() + diffToMon);
  // Load logs from localStorage and map by date
  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('ocrLogs') || '[]');
  } catch (e) {
    logs = [];
  }
  // Helper to get ISO date string with hyphens
  function toIso(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Determine last logged week index and completion stats
  let lastLoggedWeekIndex = -1;
  let completedSessions = 0;
  let totalDaysPassed = 0;
  let totalRPE = 0;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + plan.weeks.length * 7);
  // Build a set of logged dates for quick lookup
  const logMap = {};
  logs.forEach((entry) => {
    if (entry.date) {
      logMap[entry.date] = entry;
    }
  });
  // Iterate through days from startDate until today to compute stats
  const now = new Date();
  for (let d = new Date(startDate), i = 0; d <= now && d < endDate; i++, d.setDate(d.getDate() + 1)) {
    const iso = toIso(d);
    // Determine week index based on days offset
    const weekIndex = Math.floor(i / 7);
    if (logMap[iso]) {
      completedSessions++;
      // convert rpe to number if provided
      const rpeNum = parseFloat(logMap[iso].rpe);
      if (!isNaN(rpeNum)) {
        totalRPE += rpeNum;
      }
      if (weekIndex > lastLoggedWeekIndex) lastLoggedWeekIndex = weekIndex;
    }
    totalDaysPassed++;
  }
  if (totalDaysPassed === 0 || completedSessions === 0) {
    return; // nothing to adapt yet
  }
  const completionRatio = completedSessions / totalDaysPassed;
  const avgRPE = totalRPE / completedSessions;
  // Determine adaptation mode: lighten, intensify, or none
  let mode = 'none';
  if (completionRatio < 0.5 || avgRPE >= 6) {
    mode = 'lighten';
  } else if (completionRatio >= 0.8 && avgRPE <= 4) {
    mode = 'intensify';
  }
  if (mode === 'none') return;
  // Adapt upcoming weeks (those after lastLoggedWeekIndex)
  for (let w = 0; w < plan.weeks.length; w++) {
    if (w > lastLoggedWeekIndex) {
      const weekObj = plan.weeks[w];
      // Adjust mileage by ±10%
      const mileageNum = parseFloat(weekObj.mileage);
      if (!isNaN(mileageNum)) {
        const factor = mode === 'lighten' ? 0.9 : 1.1;
        weekObj.mileage = (mileageNum * factor).toFixed(1);
      }
      // Modify one workout in this week
      let modified = false;
      for (let d = 0; d < weekObj.days.length; d++) {
        const desc = weekObj.days[d];
        if (mode === 'lighten') {
          // Find first hard or tempo or race-specific run and soften to recovery
          if (/Interval|Tempo|race‑specific|short/i.test(desc) && !modified) {
            weekObj.days[d] = 'Active recovery/mobility – gentle stretching or yoga.';
            modified = true;
          }
        } else if (mode === 'intensify') {
          // Find first easy or recovery day and make it a hard session
          if (/Easy run|Active recovery|Rest day|mobility/i.test(desc) && !modified) {
            weekObj.days[d] = 'Interval or hill session – short bursts at RPE 6–7 with recovery jogs.';
            modified = true;
          }
        }
      }
    }
  }
}

// Helper functions for calendar generation
// Format a Date object as YYYYMMDD for iCalendar all-day events
function formatICSDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Format a Date object as UTC timestamp YYYYMMDDTHHMMSSZ
function formatUTCStamp(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

// Escape special characters in iCalendar text fields
function escapeICSText(text) {
  return String(text)
    .replace(/\\/g, '\\\\') // escape backslash
    .replace(/\n/g, '\\n') // newline
    .replace(/\r/g, '')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

// Generate and trigger download of an .ics calendar file from a plan
function downloadCalendar(plan) {
  if (!plan || !plan.weeks) return;
  // Determine start date: next Monday (or today if today is Monday)
  const today = new Date();
  const startDate = new Date(today);
  const dayOfWeek = startDate.getDay(); // 0=Sun,1=Mon,...
  let diffToMonday;
  if (dayOfWeek === 1) {
    diffToMonday = 0;
  } else if (dayOfWeek === 0) {
    diffToMonday = 1;
  } else {
    diffToMonday = 8 - dayOfWeek;
  }
  startDate.setDate(startDate.getDate() + diffToMonday);
  // Load logged progress from localStorage, keyed by ISO date (YYYY-MM-DD)
  let logsMap = {};
  try {
    const stored = JSON.parse(localStorage.getItem('ocrLogs') || '[]');
    stored.forEach((entry) => {
      if (entry.date) logsMap[entry.date] = entry;
    });
  } catch (e) {
    logsMap = {};
  }
  // Build the lines of the .ics file
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//OCR Planner//EN');
  let uidCounter = 1;
  // Iterate through each week and day
  plan.weeks.forEach((weekObj, wIndex) => {
    weekObj.days.forEach((desc, dIndex) => {
      const eventDate = new Date(startDate);
      eventDate.setDate(startDate.getDate() + wIndex * 7 + dIndex);
      const dtStart = formatICSDate(eventDate);
      const dtEndDate = new Date(eventDate);
      dtEndDate.setDate(eventDate.getDate() + 1);
      const dtEnd = formatICSDate(dtEndDate);
      // Use the first sentence as summary if possible
      let summary = desc;
      const dashIdx = desc.indexOf('–');
      if (dashIdx > -1) {
        summary = desc.substring(0, dashIdx).trim();
      }
      // If summary is empty (e.g., rest day), use a generic summary
      if (!summary) {
        summary = desc;
      }
      // Determine status based on logged workouts
      const isoDate = `${dtStart.slice(0,4)}-${dtStart.slice(4,6)}-${dtStart.slice(6,8)}`;
      let statusText = 'Status: not completed';
      let notesText = '';
      if (logsMap[isoDate]) {
        statusText = 'Status: completed';
        if (logsMap[isoDate].notes) {
          notesText = `\\nNotes: ${escapeICSText(logsMap[isoDate].notes)}`;
        }
      }
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:plan-${uidCounter}@ocrplanner`);
      lines.push(`DTSTAMP:${formatUTCStamp(new Date())}`);
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
      lines.push(`SUMMARY:${escapeICSText(summary)}`);
      // Include the workout description and status/notes in the event description
      lines.push(
        `DESCRIPTION:${escapeICSText(desc)}\\n${escapeICSText(statusText)}${notesText}`
      );
      lines.push('END:VEVENT');
      uidCounter++;
    });
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ocr_training_plan.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('planForm');
  const planOutput = document.getElementById('planOutput');
  const backBtn = document.getElementById('backBtn');
  const calendarBtn = document.getElementById('calendarBtn');
  let currentPlan = null;
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Gather form data
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        if (key === 'equipment' || key === 'goals') {
          if (!data[key]) data[key] = [];
          data[key].push(value);
        } else {
          data[key] = value;
        }
      });
      // Generate plan
      const plan = generatePlan(data);
      // Preserve a base copy for future adaptive recalculations
      const baseCopy = JSON.parse(JSON.stringify(plan));
      // Store base plan in localStorage so the review page can access it
      try {
        localStorage.setItem('ocrBasePlan', JSON.stringify(baseCopy));
      } catch (e) {
        console.warn('Unable to save base plan to localStorage', e);
      }
      window.basePlan = baseCopy;
      // Save race date globally
      window.raceDate = data.raceDate;
      // Create an adaptive copy based on logs
      const adaptiveCopy = JSON.parse(JSON.stringify(baseCopy));
      adaptPlan(adaptiveCopy);
      currentPlan = adaptiveCopy;
      // Expose plan globally so it can be re-rendered when logs change
      window.currentPlan = adaptiveCopy;
      // Render plan
      renderPlan(adaptiveCopy);
      // Update countdown display
      updateCountdown(window.raceDate);
      // Hide form and show output
      form.style.display = 'none';
      planOutput.hidden = false;
    });
  }
  if (calendarBtn) {
    calendarBtn.addEventListener('click', () => {
      if (currentPlan) {
        downloadCalendar(currentPlan);
      }
    });
  }
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Reset view: show form, hide plan
      const formElem = document.getElementById('planForm');
      formElem.style.display = '';
      planOutput.hidden = true;
    });
  }

  // Listen for changes to logs (storage events) from other tabs/pages
  window.addEventListener('storage', (event) => {
    if (event.key === 'ocrLogs') {
      // If a plan has been generated and is displayed, re-render to update completion indicators
      const planContainer = document.getElementById('planTable');
      if (window.basePlan && planContainer && !planOutput.hidden) {
        // Create a fresh adaptive copy from the base plan and adapt it to current logs
        const newCopy = JSON.parse(JSON.stringify(window.basePlan));
        adaptPlan(newCopy);
        window.currentPlan = newCopy;
        renderPlan(newCopy);
        // Refresh the countdown to ensure up-to-date remaining days
        if (window.raceDate) {
          updateCountdown(window.raceDate);
        }
      }
    }
  });
});