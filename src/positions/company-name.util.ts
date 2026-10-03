const SHARE_CLASS_BY_SUFFIX: Record<string, string> = {
  '3': 'ON',
  '4': 'PN',
  '5': 'PNA',
  '6': 'PNB',
  '11': 'UNT',
};

const LEGAL_SUFFIX = /\s+S\.?\s?\/?A\.?$/i; // "S.A.", "SA", "S/A"

export function formatCompanyName(
  raw: string | null | undefined,
  ticker: string,
  assetType: string,
): string | null {
  if (!raw?.trim()) return null;
  if (assetType === 'FII') return raw.trim();

  // "PETRÓLEO BRASILEIRO S.A. - PETROBRAS" → "PETROBRAS" (nome fantasia)
  const tradeName = raw.includes(' - ') ? raw.split(' - ').pop()! : raw;
  const base = toTitleCase(tradeName.trim().replace(LEGAL_SUFFIX, ''));

  const suffix = ticker.match(/(\d+)$/)?.[1];
  const shareClass = suffix ? SHARE_CLASS_BY_SUFFIX[suffix] : undefined;
  return shareClass ? `${base} ${shareClass}` : base;
}

function toTitleCase(value: string): string {
  return value.toLowerCase().replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase());
}