# Palette's Journal

## 2026-08-23 - Attendance toggle group pattern
**Learning:** The attendance "Are you coming?" button group appears in TWO places (EventsPage and EventDetailModal) with identical structure. Any a11y fix must be applied to both files. The `p.attLabel` that labels the group already exists — use its id as `aria-labelledby` on the wrapping `role="group"` div rather than adding a redundant `aria-label`. Decorative symbols (✓, ?, ×) already rendered as text should be wrapped in `aria-hidden` so screen readers only announce the meaningful word after them ("Coming", "Maybe", "Can't make it").
**Action:** When fixing toggle-button groups, use `aria-pressed` on each button + `role="group"` with `aria-labelledby` pointing at the existing label paragraph. Check whether the same UI component is duplicated across pages before deciding scope.
