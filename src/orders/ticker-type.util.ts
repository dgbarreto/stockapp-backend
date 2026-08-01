import { AssetType } from '../../generated/prisma/client';

// Heurística pelo sufixo do ticker: "11" é majoritariamente FII (units/BDRs também usam o
// sufixo, mas não são suportados ainda, então o fallback abaixo cobre o caso raro). Não é regra
// oficial da B3, só a ordem de tentativa que mais acerta de primeira — economiza chamada da
// bolsai (cota diária limitada) quando o known_tickers ainda não conhece o ticker.
export function guessAssetTypeOrder(ticker: string): AssetType[] {
  return ticker.endsWith('11') ? ['FII', 'STOCK'] : ['STOCK', 'FII'];
}