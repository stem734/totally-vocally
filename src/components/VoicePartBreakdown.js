import React from 'react';
import s from './VoicePartBreakdown.module.css';

const VOICE_PART_ORDER = ['Soprano 1', 'Soprano 2', 'Alto', 'Tenor 1', 'Tenor 2', 'Bass', 'Unassigned'];

const VOICE_PART_COLORS = {
  'Soprano 1': { bg: '#e8657a', text: '#1a0a0d' },
  'Soprano 2': { bg: '#d4a5a5', text: '#1a0a0d' },
  'Alto': { bg: '#d6a32e', text: '#1a1405' },
  'Tenor 1': { bg: '#4eabd8', text: '#f5f0f5' },
  'Tenor 2': { bg: '#6b7a8f', text: '#f5f0f5' },
  'Bass': { bg: '#4a7c59', text: '#f5f0f5' },
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

export default function VoicePartBreakdown({ counts }) {
  const total = VOICE_PART_ORDER.reduce((sum, part) => sum + (counts[part] || 0), 0);

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
    </div>
  );
}
