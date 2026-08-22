export function safeExternalUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export function requireSafeExternalUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const safe = safeExternalUrl(trimmed);
  if (!safe) throw new Error('Links must be complete HTTPS URLs.');
  return safe;
}
