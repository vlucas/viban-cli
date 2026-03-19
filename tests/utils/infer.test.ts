import { describe, expect, test } from 'bun:test';
import { inferTitle } from '../../src/utils/infer.ts';

describe('inferTitle', () => {
  test('returns first sentence ending with period', () => {
    expect(inferTitle('Fix the login bug. More details here.')).toBe('Fix the login bug.');
  });

  test('returns first sentence ending with exclamation mark', () => {
    expect(inferTitle('Urgent! Please fix this.')).toBe('Urgent!');
  });

  test('returns first sentence ending with question mark', () => {
    expect(inferTitle('What is this? A test.')).toBe('What is this?');
  });

  test('truncates to 60 chars with ellipsis when no sentence break', () => {
    const long = 'A very long title that goes on and on and on without any punctuation at all here';
    const result = inferTitle(long);
    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBe(60);
  });

  test('returns full text if under 60 chars with no punctuation', () => {
    expect(inferTitle('Short title')).toBe('Short title');
  });

  test('stops at newline', () => {
    expect(inferTitle('First line\nSecond line')).toBe('First line');
  });

  test('trims whitespace from result', () => {
    expect(inferTitle('  Hello world.  Rest of text')).toBe('Hello world.');
  });
});
