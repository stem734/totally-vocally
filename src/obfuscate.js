// Deterministic placeholder for a real user id, used by the read-only demo
// account so it can see the shape of admin pages without real member PII.
export function obfuscatedLabel(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return `Member ${(hash % 900) + 100}`;
}

export function obfuscatedEmail(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return `member.${(hash % 900) + 100}@redacted.example`;
}
