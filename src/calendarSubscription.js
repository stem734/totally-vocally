export function generateICalendar(events) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let ical = 'BEGIN:VCALENDAR\r\n';
  ical += 'VERSION:2.0\r\n';
  ical += 'PRODID:-//Totally Vocally//Choir Calendar//EN\r\n';
  ical += 'CALSCALE:GREGORIAN\r\n';
  ical += 'METHOD:PUBLISH\r\n';
  ical += 'X-WR-CALNAME:Totally Vocally\r\n';
  ical += 'X-WR-TIMEZONE:UTC\r\n';
  ical += 'BEGIN:VTIMEZONE\r\n';
  ical += 'TZID:UTC\r\n';
  ical += 'BEGIN:STANDARD\r\n';
  ical += 'DTSTART:19700101T000000Z\r\n';
  ical += 'TZOFFSETFROM:+0000\r\n';
  ical += 'TZOFFSETTO:+0000\r\n';
  ical += 'END:STANDARD\r\n';
  ical += 'END:VTIMEZONE\r\n';

  events.forEach((event) => {
    const eventDate = new Date(event.date + 'T12:00:00Z');
    const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${event.id}@totallyvocally.local`;

    ical += 'BEGIN:VEVENT\r\n';
    ical += `UID:${uid}\r\n`;
    ical += `DTSTAMP:${now}\r\n`;
    ical += `DTSTART:${dateStr}\r\n`;
    ical += `SUMMARY:${escapeText(event.title)}\r\n`;
    if (event.desc) ical += `DESCRIPTION:${escapeText(event.desc)}\r\n`;
    if (event.location) ical += `LOCATION:${escapeText(event.location)}\r\n`;
    if (event.time) ical += `X-CUSTOM-TIME:${event.time}\r\n`;
    ical += `CATEGORIES:${event.type === 'rehearsal' ? 'Rehearsal' : 'Performance'}\r\n`;
    ical += 'END:VEVENT\r\n';
  });

  ical += 'END:VCALENDAR\r\n';
  return ical;
}

function escapeText(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function downloadICalendar(events, filename = 'totally-vocally-calendar.ics') {
  const ical = generateICalendar(events);
  const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
