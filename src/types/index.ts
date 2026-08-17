export type AssetType = 'stock' | 'fii' | 'etf' | 'fixed_income' | 'crypto';

export type AssetCategory = 
  | 'logistics_fii' 
  | 'paper_credit_fii' 
  | 'mall_fii' 
  | 'office_fii' 
  | 'fof_fii'
  | 'electric_stock'
  | 'financial_stock'
  | 'sanitation_commodity_stock'
  | 'international_etf'
  | 'tesouro_selic'
  | 'tesouro_ipca';

export interface Position {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  category: AssetCategory;
  quantity: number;
  avgPrice: number;
  investedAmount: number;
  currentPrice?: number;
  currentValue?: number;
  pl?: number;
  plPercent?: number;
  dividendYield?: number;
  lastUpdated?: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPL: number;
  totalPLPercent: number;
  allocationByType: Record<AssetType, number>;
  allocationByCategory: Record<AssetCategory, number>;
}

export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface HistoricalPoint {
  date: string;
  value: number;
}

export interface PortfolioSnapshot {
  date: string;
  totalValue: number;
  positions: Position[];
}