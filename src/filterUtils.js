export function getDefaultFilters() {
  const current = new Date().getFullYear();
  return {
    eventTypes: ['rehearsal', 'performance'],
    months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    years: [current, current + 1],
  };
}

export function filterEvents(events, filters) {
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

    return true;
  });
}
