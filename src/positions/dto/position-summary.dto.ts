export interface PositionSummaryItem {
  id: string;
  ticker: string;
  assetType: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number | null;
  currentValue: number | null;
  profitPercent: number | null;
  allocationPercent: number | null;
  logoUrl: string | null;
  dividendPerShareTtm: number | null;
}

export interface PortfolioSummary {
  totalValue: number;
  investedValue: number;
  profitValue: number;
  profitPercent: number | null;
  positions: PositionSummaryItem[];
}
