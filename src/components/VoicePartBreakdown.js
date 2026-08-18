import React from 'react';
import s from './VoicePartBreakdown.module.css';

const VOICE_PART_ORDER = ['Soprano 1', 'Soprano 2', 'Alto', 'Tenor 1', 'Tenor 2', 'Bass', 'Unassigned'];

const VOICE_PART_COLORS = {
  'Soprano 1': { bg: '#c13c85', text: '#ffffff' },
  'Soprano 2': { bg: '#e87ab8', text: '#1a0a12' },
  'Alto': { bg: '#f4c56a', text: '#1a1405' },
  'Tenor 1': { bg: '#4eabd8', text: '#0a1620' },
  'Tenor 2': { bg: '#2e7fa8', text: '#f5f0f5' },
  'Bass': { bg: '#76d19a', text: '#0a1a0f' },
  'Unassigned': { bg: '#54545f', text: '#f5f0f5' },
};

const VOICE_PART_ABBR = {
  'Soprano 1': 'S1',
  'Soprano 2': 'S2',
  'Alto': 'A',
  'Tenor 1': 'T1',
  'Tenor 2': 'T2',
  'Bass': 'B',
  'Unassigned': '?',
};

const SUNG_VOICE_PARTS = VOICE_PART_ORDER.filter((part) => part !== 'Unassigned');

export default function VoicePartBreakdown({ counts, checkMissing = false }) {
  const total = VOICE_PART_ORDER.reduce((sum, part) => sum + (counts[part] || 0), 0);
  const missingParts = checkMissing
    ? SUNG_VOICE_PARTS.filter((part) => (counts[part] || 0) === 0)
    : [];

  return (
    <div className={s.wrap}>
      <p className={s.label}>Voice Parts Coming</p>
      {total === 0 ? (
        <p className={s.empty}>No one marked as coming yet</p>
      ) : (
        <div className={s.bar}>
          {VOICE_PART_ORDER.map((part) => {
            const count = counts[part] || 0;
            if (count === 0) return null;
            const pct = (count / total) * 100;
            const { bg, text } = VOICE_PART_COLORS[part];
            return (
              <div
                key={part}
                className={s.segment}
                style={{ width: `${pct}%`, background: bg, color: text }}
                title={`${part}: ${count}`}
              >
                <span className={s.segmentLabel}>{VOICE_PART_ABBR[part]}</span>
                <span className={s.segmentCount}>{count}</span>
              </div>
            );
          })}
        </div>
      )}
      {missingParts.length > 0 && (
        <p className={s.missingAlert}>
          ⚠ No one coming from: {missingParts.join(', ')}
        </p>
      )}
    </div>
  );
}
