export function getDefaultFilters() {
  const current = new Date().getFullYear();
  return {
    eventTypes: ['rehearsal', 'performance', 'workshop'],
    months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    years: [current, current + 1],
  };
}

export function getEventSections(event) {
  // Prefer the current field when it contains values, while retaining
  // compatibility with older events that used `choirs` or `section`.
  const raw = event?.sections?.length
    ? event.sections
    : event?.choirs?.length
      ? event.choirs
      : event?.section ?? event?.groupDay ?? [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw ? [raw] : [];
}

export function eventMatchesSection(event, section) {
  if (!section || section === 'all') return true;
  const sections = getEventSections(event);
  // Events without an explicit section are shared choir-wide events.
  return sections.length === 0 || sections.includes(section);
}

export function filterEventsBySection(events, section) {
  return events.filter((event) => eventMatchesSection(event, section));
}

export function filterEvents(events, filters, section = 'all') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return events.filter((event) => {
    // Only show future events
    const eventDate = new Date(event.date + 'T00:00:00');
    if (eventDate < today) return false;

    // Filter by event type
    if (!filters.eventTypes.includes(event.type)) return false;

    // Filter by month and year
    const eventMonth = eventDate.getMonth();
    const eventYear = eventDate.getFullYear();

    const matchesMonthYear =
      filters.months.includes(eventMonth) &&
      filters.years.includes(eventYear);

    if (!matchesMonthYear) return false;

    return eventMatchesSection(event, section);
  });
}
