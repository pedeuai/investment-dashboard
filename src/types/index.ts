export type AssetType = 'stock' | 'fii' | 'etf' | 'fixed_income' | 'crypto' | 'option';

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
  | 'tesouro_ipca'
  | 'call_option'
  | 'put_option';

export interface Position {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  category: AssetCategory;
  quantity: number;
  avgPrice: number;
  investedAmount: number;
  receivedAmount?: number; // For options: premium received when selling
  expirationDate?: string; // For options: expiration date (YYYY-MM-DD)
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

export type DividendType = 'dividend' | 'jcp' | 'interest' | 'amortizacao';

export interface DividendEvent {
  symbol: string;
  name: string;
  exDate: string;
  payDate: string;
  amount: number;
  type: DividendType;
  source: 'yahoo' | 'brapi';
  trailingAnnualRate?: number;
  dividendYield?: number;
}

export interface DividendProjection {
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  trailingAnnualRate: number;
  dividendYield: number;
  projectedMonthly: number;
  projectedAnnual: number;
  nextExDate?: string;
  nextPayDate?: string;
}

export interface DividendCalendarMonth {
  monthKey: string;
  label: string;
  events: DividendEvent[];
  totalProjected: number;
}

export interface DividendHistoryEntry {
  id: string;
  symbol: string;
  name: string;
  date: string;
  amount: number;
  total: number;
  type: DividendType;
  notes?: string;
  createdAt: string;
}