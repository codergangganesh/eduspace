// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readStoredJson } from '@/lib/storage';

describe('readStoredJson', () => {
  it('returns parsed data for valid JSON', () => {
    const key = 'profile:test';
    localStorage.setItem(key, JSON.stringify({ ok: true }));

    expect(readStoredJson(key, { ok: false })).toEqual({ ok: true });
  });

  it('returns the fallback for invalid JSON', () => {
    const key = 'profile:invalid';
    localStorage.setItem(key, '{not valid json');

    expect(readStoredJson(key, { ok: false })).toEqual({ ok: false });
  });
});
