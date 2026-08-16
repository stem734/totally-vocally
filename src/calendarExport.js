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
    'BEGIN:VTIMEZONE',
    'TZID:Europe/London',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0000',
    'TZOFFSETTO:+0100',
    'TZNAME:BST',
    'DTSTART:19810329T010000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0000',
    'TZNAME:GMT',
    'DTSTART:19961027T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  events.forEach(event => {
    const startDate = formatDateForICS(event.date, event.time);
    const endDate = calculateEndTime(event.date, event.time, event.type);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@totallyvocally.com`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;TZID=Europe/London:${startDate}`);
    lines.push(`DTEND;TZID=Europe/London:${endDate}`);
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
  if (!timeStr) {
    // All-day event format: YYYYMMDD
    return dateStr.replace(/-/g, '');
  }

  // Timed event format: YYYYMMDDTHHmmss (no Z, since we use TZID)
  const [hours, minutes] = timeStr.split(':');
  return `${dateStr.replace(/-/g, '')}T${hours}${minutes}00`;
}

function calculateEndTime(dateStr, timeStr, eventType) {
  if (!timeStr) {
    // All-day event: end is next day
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  // Rehearsals are 2 hours, other events are 1.5 hours
  const durationHours = eventType === 'rehearsal' ? 2 : 1.5;
  const [hours, minutes] = timeStr.split(':');
  const date = new Date(dateStr + `T${hours}:${minutes}:00`);
  date.setHours(date.getHours() + durationHours);
  const newHours = String(date.getHours()).padStart(2, '0');
  const newMinutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr.replace(/-/g, '')}T${newHours}${newMinutes}00`;
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
