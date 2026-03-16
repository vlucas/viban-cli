/**
 * Infer a task title from its description when no explicit name is given.
 * Takes the first sentence (up to . ! ?) or the first 60 characters.
 */
export function inferTitle(description: string): string {
  const match = description.match(/^[^.!?\n]+[.!?]?/);
  const candidate = (match ? match[0] : description).trim();
  return candidate.length > 60 ? candidate.substring(0, 57) + '...' : candidate;
}
