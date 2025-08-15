/*
 * tracker.js
 * Simple progress tracker for OCR training plans.
 * Allows the user to log workouts and stores them in localStorage.
 * Displays a table of logged entries when the page is loaded.
 */

document.addEventListener('DOMContentLoaded', () => {
  const logForm = document.getElementById('logForm');
  const logsTable = document.getElementById('logsTable');
  const achievementsContainer = document.getElementById('achievementsContainer');

  // Compute and display achievements based on logs
  function updateAchievements(logs) {
    if (!achievementsContainer) return;
    achievementsContainer.innerHTML = '';
    const badges = [];
    if (logs.length === 0) {
      // show a prompt to log workouts
      const div = document.createElement('p');
      div.textContent = 'Log workouts to start earning achievements!';
      achievementsContainer.appendChild(div);
      return;
    }
    // Sort logs by date ascending for streak calculation
    const sortedLogs = logs
      .map((entry) => ({ ...entry, dateObj: new Date(entry.date) }))
      .sort((a, b) => a.dateObj - b.dateObj);
    // Badge: First Workout
    if (logs.length >= 1) {
      badges.push({
        title: 'First Workout',
        description: 'Logged your first workout!',
      });
    }
    // Badge: Runner in the Making (5 run sessions)
    const runCount = logs.filter((l) => l.type === 'run').length;
    if (runCount >= 5) {
      badges.push({
        title: 'Runner in the Making',
        description: 'Logged 5 run sessions.',
      });
    }
    // Badge: Strength Focused (5 strength sessions)
    const strengthCount = logs.filter((l) => l.type === 'strength').length;
    if (strengthCount >= 5) {
      badges.push({
        title: 'Strength Focused',
        description: 'Logged 5 strength sessions.',
      });
    }
    // Badge: Consistency Champ (7-day streak)
    // Calculate the longest streak of consecutive days with at least one log
    let longestStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < sortedLogs.length; i++) {
      const diffDays = Math.round(
        (sortedLogs[i].dateObj - sortedLogs[i - 1].dateObj) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        currentStreak += 1;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else if (diffDays === 0) {
        // same day, ignore for streak
      } else {
        currentStreak = 1;
      }
    }
    if (longestStreak >= 7) {
      badges.push({
        title: 'Consistency Champ',
        description: 'Logged workouts for 7 consecutive days.',
      });
    }
    // Badge: All-rounder (at least 3 run and 3 strength sessions)
    if (runCount >= 3 && strengthCount >= 3) {
      badges.push({
        title: 'All‑Rounder',
        description: 'Balanced training: logged 3 runs and 3 strength sessions.',
      });
    }
    // Render badges
    if (badges.length === 0) {
      const div = document.createElement('p');
      div.textContent = 'Keep training to earn your first badge!';
      achievementsContainer.appendChild(div);
    } else {
      badges.forEach((badge) => {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'achievement-badge';
        const h4 = document.createElement('h4');
        h4.textContent = badge.title;
        const p = document.createElement('p');
        p.textContent = badge.description;
        badgeDiv.appendChild(h4);
        badgeDiv.appendChild(p);
        achievementsContainer.appendChild(badgeDiv);
      });
    }
  }

  // Load existing logs from localStorage and render
  function loadLogs() {
    const logs = JSON.parse(localStorage.getItem('ocrLogs') || '[]');
    // Sort logs by date descending
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    // Clear table
    logsTable.innerHTML = '';
    if (logs.length === 0) {
      const emptyRow = document.createElement('tr');
      const td = document.createElement('td');
      td.textContent = 'No entries yet. Add your first workout above.';
      td.colSpan = 5;
      emptyRow.appendChild(td);
      logsTable.appendChild(emptyRow);
      return;
    }
    // Header row
    const header = document.createElement('tr');
    header.innerHTML =
      '<th>Date</th><th>Type</th><th>Duration/Distance</th><th>RPE</th><th>Notes</th>';
    logsTable.appendChild(header);
    // Data rows
    logs.forEach((entry) => {
      const tr = document.createElement('tr');
      const dateTd = document.createElement('td');
      const typeTd = document.createElement('td');
      const valueTd = document.createElement('td');
      const rpeTd = document.createElement('td');
      const notesTd = document.createElement('td');
      // Format date as YYYY-MM-DD for display
      const dateObj = new Date(entry.date);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      dateTd.textContent = `${yyyy}-${mm}-${dd}`;
      typeTd.textContent = entry.type;
      valueTd.textContent = entry.value || '';
      rpeTd.textContent = entry.rpe || '';
      notesTd.textContent = entry.notes || '';
      tr.appendChild(dateTd);
      tr.appendChild(typeTd);
      tr.appendChild(valueTd);
      tr.appendChild(rpeTd);
      tr.appendChild(notesTd);
      logsTable.appendChild(tr);
    });
    // Update achievements after rendering logs
    updateAchievements(logs);
  }

  // Handle new log submission
  if (logForm) {
    logForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(logForm);
      const entry = {
        date: formData.get('logDate'),
        type: formData.get('logType'),
        value: formData.get('logValue') || '',
        rpe: formData.get('logRPE') || '',
        notes: formData.get('logNotes') || '',
      };
      const logs = JSON.parse(localStorage.getItem('ocrLogs') || '[]');
      logs.push(entry);
      localStorage.setItem('ocrLogs', JSON.stringify(logs));
      // Reset form and reload logs
      logForm.reset();
      loadLogs();
    });
  }

  // Initial render
  loadLogs();
});