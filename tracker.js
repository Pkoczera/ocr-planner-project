/*
 * tracker.js
 * Simple progress tracker for OCR training plans.
 * Allows the user to log workouts and stores them in localStorage.
 * Displays a table of logged entries when the page is loaded.
 */

document.addEventListener('DOMContentLoaded', () => {
  const logForm = document.getElementById('logForm');
  const logsTable = document.getElementById('logsTable');

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