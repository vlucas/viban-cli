import { describe, expect, test } from 'bun:test';
import { parseStatus } from '../src/types.ts';

describe('parseStatus', () => {
  test('parses all exact valid statuses', () => {
    expect(parseStatus('ready')).toBe('ready');
    expect(parseStatus('todo')).toBe('todo');
    expect(parseStatus('in_progress')).toBe('in_progress');
    expect(parseStatus('in_review')).toBe('in_review');
    expect(parseStatus('done')).toBe('done');
  });

  test('is case-insensitive', () => {
    expect(parseStatus('READY')).toBe('ready');
    expect(parseStatus('Done')).toBe('done');
    expect(parseStatus('IN_PROGRESS')).toBe('in_progress');
  });

  test('normalizes spaces to underscores', () => {
    expect(parseStatus('in progress')).toBe('in_progress');
    expect(parseStatus('in review')).toBe('in_review');
  });

  test('normalizes hyphens to underscores', () => {
    expect(parseStatus('in-progress')).toBe('in_progress');
    expect(parseStatus('in-review')).toBe('in_review');
  });

  test('handles wip alias', () => {
    expect(parseStatus('wip')).toBe('in_progress');
  });

  test('handles review alias', () => {
    expect(parseStatus('review')).toBe('in_review');
  });

  test('handles inprogress alias', () => {
    expect(parseStatus('inprogress')).toBe('in_progress');
  });

  test('handles inreview alias', () => {
    expect(parseStatus('inreview')).toBe('in_review');
  });

  test('parses archived status', () => {
    expect(parseStatus('archived')).toBe('archived');
    expect(parseStatus('ARCHIVED')).toBe('archived');
  });

  test('throws for unknown status', () => {
    expect(() => parseStatus('invalid')).toThrow('Invalid status');
  });

  test('throws for empty string', () => {
    expect(() => parseStatus('')).toThrow();
  });
});
