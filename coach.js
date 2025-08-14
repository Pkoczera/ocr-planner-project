/*
 * coach.js
 * Provides a simple search interface to match users with coaches based on
 * preferred format, specialties and athlete experience level. This is a demo
 * dataset for illustrative purposes and does not represent actual coaches.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('coachSearchForm');
  const resultsSection = document.getElementById('coachResults');
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'coach-list';
  resultsSection.appendChild(resultsContainer);

  // Demo coaches data
  const coaches = [
    {
      name: 'Sarah Thompson',
      format: 'remote',
      specialties: ['ocr', 'strength'],
      levels: ['beginner', 'intermediate', 'advanced'],
      bio: 'Certified OCR specialist and strength coach offering virtual programs and video analysis.',
      locationText: 'Remote',
      contact: 'mailto:sarah@example.com',
    },
    {
      name: 'John Ramirez',
      format: 'in-person',
      specialties: ['running', 'ocr'],
      levels: ['beginner', 'intermediate'],
      bio: 'Former collegiate runner and Spartan veteran based in Virginia. Offers trail and obstacle skills clinics.',
      locationText: 'Purcellville, VA',
      contact: 'mailto:john@example.com',
    },
    {
      name: 'Emily Chen',
      format: 'remote',
      specialties: ['nutrition', 'strength'],
      levels: ['beginner', 'intermediate'],
      bio: 'Sports nutritionist and certified personal trainer helping OCR athletes fuel and build strength.',
      locationText: 'Remote',
      contact: 'mailto:emily@example.com',
    },
    {
      name: 'Marcus Lee',
      format: 'in-person',
      specialties: ['ocr', 'running', 'strength'],
      levels: ['advanced'],
      bio: 'Elite OCR athlete offering personalised coaching and on‑course training sessions.',
      locationText: 'New York, NY',
      contact: 'mailto:marcus@example.com',
    },
    {
      name: 'Ariana Gomez',
      format: 'remote',
      specialties: ['running'],
      levels: ['beginner', 'intermediate'],
      bio: 'Endurance running coach focusing on building aerobic capacity for OCR and trail events.',
      locationText: 'Remote',
      contact: 'mailto:ariana@example.com',
    },
  ];

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    resultsContainer.innerHTML = '';
    // Get form values
    const formData = new FormData(form);
    const selectedFormat = formData.get('location');
    const experience = formData.get('experience');
    const specialties = formData.getAll('specialty');
    // Filter coaches based on selected criteria
    const matches = coaches.filter((coach) => {
      // Format filter
      if (selectedFormat && coach.format !== selectedFormat) {
        return false;
      }
      // Experience filter
      if (experience && !coach.levels.includes(experience)) {
        return false;
      }
      // Specialties filter (must match at least one selected if any selected)
      if (specialties.length > 0) {
        const matchSpecialty = specialties.some((spec) => coach.specialties.includes(spec));
        if (!matchSpecialty) return false;
      }
      return true;
    });
    // Show results section
    resultsSection.hidden = false;
    if (matches.length === 0) {
      resultsContainer.innerHTML = '<p>No coaches match your criteria. Try adjusting your filters.</p>';
      return;
    }
    // Display each matching coach
    matches.forEach((coach) => {
      const card = document.createElement('div');
      card.className = 'coach-card';
      card.innerHTML = `
        <h3>${coach.name}</h3>
        <p><strong>Location:</strong> ${coach.locationText}</p>
        <p><strong>Format:</strong> ${coach.format === 'remote' ? 'Remote/Virtual' : 'In‑person'}</p>
        <p><strong>Specialties:</strong> ${coach.specialties.map((s) => s.toUpperCase()).join(', ')}</p>
        <p><strong>Athlete levels:</strong> ${coach.levels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}</p>
        <p>${coach.bio}</p>
        <p><a href="${coach.contact}" class="secondary-btn">Contact Coach</a></p>
      `;
      resultsContainer.appendChild(card);
    });
  });
});