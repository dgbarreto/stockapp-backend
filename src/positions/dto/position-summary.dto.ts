export interface PositionSummaryItem {
    id: string;
    ticker: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number | null;
    currentValue: number | null;
    profitPercent: number | null;
    allocationPercent: number | null;
}

export interface PortfolioSummary {
    totalValue: number;
    investedValue: number;
    profitValue: number;
    profitPercent: number | null;
    positions: PositionSummaryItem[];
}