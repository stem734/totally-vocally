import React from 'react';
import s from './VoicePartBreakdown.module.css';

const VOICE_PART_ORDER = ['Soprano 1', 'Soprano 2', 'Alto', 'Tenor 1', 'Tenor 2', 'Bass', 'Unassigned'];

const VOICE_PART_COLORS = {
  'Soprano 1': '#e8657a',
  'Soprano 2': '#d4a5a5',
  'Alto': '#d6a32e',
  'Tenor 1': '#4eabd8',
  'Tenor 2': '#6b7a8f',
  'Bass': '#4a7c59',
  'Unassigned': '#54545f',
};

export default function VoicePartBreakdown({ counts }) {
  const total = VOICE_PART_ORDER.reduce((sum, part) => sum + (counts[part] || 0), 0);

  return (
    <div className={s.wrap}>
      <p className={s.label}>Voice Parts Coming</p>
      {total === 0 ? (
        <p className={s.empty}>No one marked as coming yet</p>
      ) : (
        <>
          <div className={s.bar}>
            {VOICE_PART_ORDER.map((part) => {
              const count = counts[part] || 0;
              if (count === 0) return null;
              const pct = (count / total) * 100;
              return (
                <div
                  key={part}
                  className={s.segment}
                  style={{ width: `${pct}%`, background: VOICE_PART_COLORS[part] }}
                  title={`${part}: ${count}`}
                />
              );
            })}
          </div>
          <div className={s.legend}>
            {VOICE_PART_ORDER.map((part) => {
              const count = counts[part] || 0;
              if (count === 0) return null;
              return (
                <span key={part} className={s.legendItem}>
                  <span className={s.dot} style={{ background: VOICE_PART_COLORS[part] }} />
                  {part} <strong>{count}</strong>
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
