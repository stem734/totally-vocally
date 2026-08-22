import { requireSafeExternalUrl, safeExternalUrl } from './safeUrl';

describe('safeExternalUrl', () => {
  test('allows HTTPS links', () => {
    expect(safeExternalUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf');
  });

  test.each([
    'http://example.com',
    'javascript:alert(1)',
    'data:text/html,test',
    '/relative/path',
    'not a URL',
  ])('rejects unsafe or incomplete link %s', (value) => {
    expect(safeExternalUrl(value)).toBe('');
  });

  test('accepts an empty optional link', () => {
    expect(requireSafeExternalUrl('  ')).toBe('');
  });

  test('throws a useful validation error', () => {
    expect(() => requireSafeExternalUrl('http://example.com')).toThrow('complete HTTPS URLs');
  });
});
