/*
 * review.js
 * Generates a simple expert review based on the user's base plan and logged workouts.
 * It analyzes adherence and intensity trends and produces personalised feedback.
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('reviewResults');
  // Clear container
  container.innerHTML = '';
  // Retrieve base plan from localStorage
  let basePlan = null;
  try {
    basePlan = JSON.parse(localStorage.getItem('ocrBasePlan') || 'null');
  } catch (e) {
    basePlan = null;
  }
  if (!basePlan || !basePlan.weeks) {
    container.innerHTML =
      '<p>Please generate a training plan first in the Plan Generator tab. Once a plan is available, return here for your review.</p>';
    return;
  }
  // Load logs
  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('ocrLogs') || '[]');
  } catch (e) {
    logs = [];
  }
  // Create a map of logs by ISO date
  const logMap = {};
  logs.forEach((entry) => {
    if (entry.date) {
      logMap[entry.date] = entry;
    }
  });
  // Determine plan start date (upcoming Monday when plan was generated)
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
  // Helper to convert date to ISO hyphenated format
  function toIso(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Compute metrics
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + basePlan.weeks.length * 7);
  let totalDays = 0;
  let completedDays = 0;
  let totalRPE = 0;
  let rpeCount = 0;
  // Count workout types
  const typeCounts = { run: 0, strength: 0, other: 0, rest: 0 };
  // Iterate day by day up to either today or plan end date
  for (let d = new Date(startDate); d <= today && d < endDate; d.setDate(d.getDate() + 1)) {
    totalDays++;
    const iso = toIso(d);
    if (logMap[iso]) {
      completedDays++;
      const entry = logMap[iso];
      // Count type
      const type = (entry.type || '').toLowerCase();
      if (typeCounts.hasOwnProperty(type)) {
        typeCounts[type]++;
      } else {
        typeCounts.other++;
      }
      const rpeNum = parseFloat(entry.rpe);
      if (!isNaN(rpeNum)) {
        totalRPE += rpeNum;
        rpeCount++;
      }
    }
  }
  const completionRatio = totalDays > 0 ? completedDays / totalDays : 0;
  const avgRPE = rpeCount > 0 ? totalRPE / rpeCount : null;
  // Build review summary HTML
  let html = '';
  html += '<h2>Your Training Insights</h2>';
  html += `<p><strong>Training duration evaluated:</strong> ${totalDays} days (from plan start to today)</p>`;
  html += `<p><strong>Completed workouts:</strong> ${completedDays} out of ${totalDays} days</p>`;
  html += `<p><strong>Adherence ratio:</strong> ${(completionRatio * 100).toFixed(1)}%`;
  if (avgRPE !== null) {
    html += ` &nbsp;|&nbsp; <strong>Average RPE:</strong> ${avgRPE.toFixed(1)}`;
  }
  html += '</p>';
  html += '<ul>';
  html += `<li><strong>Runs logged:</strong> ${typeCounts.run}</li>`;
  html += `<li><strong>Strength sessions logged:</strong> ${typeCounts.strength}</li>`;
  html += `<li><strong>Other workouts:</strong> ${typeCounts.other}</li>`;
  html += `<li><strong>Rest days logged:</strong> ${typeCounts.rest}</li>`;
  html += '</ul>';
  // Generate recommendations based on metrics
  let recommendations = '';
  if (completionRatio < 0.5) {
    recommendations +=
      '<p>You’re missing many of your planned sessions. Consider reducing the weekly workload or adjusting your schedule to make training more manageable. Focus on consistency before intensity.</p>';
  } else if (completionRatio >= 0.8 && (avgRPE === null || avgRPE <= 4)) {
    recommendations +=
      '<p>Great adherence with manageable effort levels! You may benefit from slightly increasing the challenge—try adding an extra interval session or increasing the pace on one easy run.</p>';
  } else if (avgRPE !== null && avgRPE > 6) {
    recommendations +=
      '<p>Your recorded RPEs suggest workouts are feeling very hard. Prioritize recovery sessions and reduce intensity until fatigue decreases. Listen to your body to avoid overtraining.</p>';
  } else {
    recommendations +=
      '<p>Your training is on track. Maintain your current balance between running, strength and recovery to continue progressing toward your race.</p>';
  }
  // Additional type-based suggestions
  if (typeCounts.run < typeCounts.strength) {
    recommendations +=
      '<p>You’ve logged more strength than running workouts. Ensure you’re getting sufficient run mileage to build endurance for your race distance.</p>';
  }
  if (typeCounts.strength === 0) {
    recommendations +=
      '<p>You haven’t logged any strength sessions. Incorporating strength and grip work will help with obstacle efficiency.</p>';
  }
  if (typeCounts.other > 0 && typeCounts.run + typeCounts.strength === 0) {
    recommendations +=
      '<p>Most of your workouts are categorized as “Other.” Try logging runs and strength sessions specifically to better tailor the plan.</p>';
  }
  html += '<h3>Recommendations</h3>' + recommendations;
  container.innerHTML = html;
});