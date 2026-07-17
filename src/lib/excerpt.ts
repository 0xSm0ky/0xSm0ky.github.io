// Derive a short plain-text brief from the first real paragraph of a post body.
// Skips headings, lists, blockquotes, code fences, tables, and images; strips
// inline markdown (code, links, bold/italic) so cards show clean prose.
export function firstParagraph(body: string, maxLen = 160): string {
  const block = body
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .find((b) => b && !/^(#{1,6}\s|>|[-*+]\s|\d+\.\s|```|~~~|\||!\[|<)/.test(b));
  if (!block) return '';

  let text = block
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> label
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold / italic
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length > maxLen) {
    text = text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
  }
  return text;
}
