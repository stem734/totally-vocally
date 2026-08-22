import React from 'react';

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export default function LinkedText({ text, className }) {
  const parts = String(text).split(URL_PATTERN);

  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return part;

        return (
          <a key={`${part}-${index}`} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      })}
    </p>
  );
}
