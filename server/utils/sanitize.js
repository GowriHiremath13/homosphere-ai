// Strip control characters and angle brackets, collapse whitespace, cap length.
// React escapes output too; this is defence in depth for anything stored or sent to the LLM.
// Use for short, single-line fields (titles, task names, labels).
export function cleanText(value, max = 200) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, '') // drop whole tags first so "<b>hi</b>" becomes "hi"
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// Like cleanText, but preserves line breaks - for longer AI answers, explanations, or
// anything else meant to read as a real paragraph/list rather than a single-line label.
// Still strips dangerous/invisible control characters and angle-bracket tags.
export function cleanProse(value, max = 4000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ') // control chars, but keep \n and \t
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[ \t]+/g, ' ') // collapse horizontal whitespace only
    .replace(/\n{3,}/g, '\n\n') // cap long runs of blank lines
    .split('\n').map((line) => line.trim()).join('\n')
    .trim()
    .slice(0, max);
}
