export const EVENT_TYPES = [
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'performance', label: 'Performance' },
  { value: 'workshop', label: 'Workshop' },
];

export const eventTypeLabel = (type) =>
  EVENT_TYPES.find(t => t.value === type)?.label || 'Performance';

// Duration stored in minutes, selectable in half-hour increments.
export const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 1) * 30);

export const formatDuration = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

export const defaultArrivalTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '';

  const totalMinutes = (hours * 60 + minutes - 30 + 24 * 60) % (24 * 60);
  const arrivalHours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const arrivalMinutes = String(totalMinutes % 60).padStart(2, '0');
  return `${arrivalHours}:${arrivalMinutes}`;
};
