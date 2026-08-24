import { eventMatchesSection, filterEventsBySection, getEventSections } from './filterUtils';

describe('event section matching', () => {
  test('reads the current sections field', () => {
    expect(getEventSections({ sections: ['Monday', 'Wednesday'] })).toEqual(['Monday', 'Wednesday']);
  });

  test('reads legacy choir and single-section fields', () => {
    expect(getEventSections({ choirs: ['Tuesday'] })).toEqual(['Tuesday']);
    expect(getEventSections({ section: 'Wednesday' })).toEqual(['Wednesday']);
    expect(getEventSections({ sections: [], choirs: ['Monday'] })).toEqual(['Monday']);
    expect(getEventSections({ groupDay: 'Tuesday' })).toEqual(['Tuesday']);
  });

  test('shared events match every section', () => {
    expect(eventMatchesSection({ title: 'All choir social' }, 'Monday')).toBe(true);
  });

  test('sectioned events only match their selected section', () => {
    const event = { sections: ['Monday', 'Wednesday'] };
    expect(eventMatchesSection(event, 'Monday')).toBe(true);
    expect(eventMatchesSection(event, 'Tuesday')).toBe(false);
  });

  test('all sections leaves every event visible', () => {
    const events = [{ id: 'a', sections: ['Monday'] }, { id: 'b', sections: ['Tuesday'] }];
    expect(filterEventsBySection(events, 'all').map((event) => event.id)).toEqual(['a', 'b']);
  });

  test('filters non-admin events to the member section', () => {
    const events = [
      { id: 'shared' },
      { id: 'monday', sections: ['Monday'] },
      { id: 'tuesday', sections: ['Tuesday'] },
    ];
    expect(filterEventsBySection(events, 'Monday').map((event) => event.id)).toEqual(['shared', 'monday']);
  });
});
