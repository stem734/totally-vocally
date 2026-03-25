/**
 * Generate iCalendar (.ics) format for events
 * Can be imported into Google Calendar, Apple Calendar, Outlook, etc.
 */
export function generateCalendarFile(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Totally Vocally//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Totally Vocally Events',
    'X-WR-TIMEZONE:Europe/London',
  ];

  events.forEach(event => {
    const startDate = formatDateForICS(event.date, event.time);
    const endDate = calculateEndTime(event.date, event.time);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@totallyvocally.com`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART:${startDate}`);
    lines.push(`DTEND:${endDate}`);
    lines.push(`SUMMARY:${escapeICSText(event.title)}`);

    if (event.location) {
      lines.push(`LOCATION:${escapeICSText(event.location)}`);
    }
    if (event.desc) {
      lines.push(`DESCRIPTION:${escapeICSText(event.desc)}`);
    }

    // Add alarm 30 minutes before
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT30M');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeICSText(event.title)} starts in 30 minutes`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatDateForICS(dateStr, timeStr) {
  const date = new Date(dateStr + 'T00:00:00');
  let isoString = date.toISOString();

  if (timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const dateWithTime = new Date(dateStr + `T${hours}:${minutes}:00`);
    isoString = dateWithTime.toISOString();
  }

  return isoString.replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function calculateEndTime(dateStr, timeStr) {
  if (!timeStr) {
    // All-day event: end is next day
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  // 1 hour event
  const [hours, minutes] = timeStr.split(':');
  const date = new Date(dateStr + `T${hours}:${minutes}:00`);
  date.setHours(date.getHours() + 1);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICSText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

export function downloadCalendar(events, filename = 'Totally_Vocally.ics') {
  const icsContent = generateCalendarFile(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
