const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

/** Converte o HTML simples das descrições da API em texto legível. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|li|ul|ol|h\d)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** Minúsculas e sem acentos, para buscas que ignoram "supino" x "Supíno". */
export function normalizeForSearch(text: string): string {
  const lower = text.toLowerCase().trim();
  return typeof lower.normalize === 'function' ? lower.normalize('NFD').replace(/[̀-ͯ]/g, '') : lower;
}
