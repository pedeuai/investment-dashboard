import { Position, AssetType, AssetCategory } from '@/types';

export const initialPositions: Position[] = [
  // Renda Fixa
  { id: '1', symbol: 'TESOURO_SELIC', name: 'Tesouro Selic 2029', type: 'fixed_income', category: 'tesouro_selic', quantity: 1, avgPrice: 0, investedAmount: 200000, currentPrice: 100 },
  { id: '2', symbol: 'TESOURO_IPCA_2035', name: 'Tesouro IPCA+ 2035', type: 'fixed_income', category: 'tesouro_ipca', quantity: 1, avgPrice: 0, investedAmount: 500000, currentPrice: 100 },

  // FIIs - Galpões Logísticos
  { id: '3', symbol: 'HGLG11', name: 'CSHG Logística', type: 'fii', category: 'logistics_fii', quantity: 1, avgPrice: 0, investedAmount: 70000 },

  // FIIs - Shopping Centers
  { id: '8', symbol: 'XPML11', name: 'XP Malls', type: 'fii', category: 'mall_fii', quantity: 1, avgPrice: 0, investedAmount: 70000 },

  // Ações - Financeiro
  { id: '16', symbol: 'BBSE3', name: 'BB Seguridade', type: 'stock', category: 'financial_stock', quantity: 1, avgPrice: 0, investedAmount: 60000 },

  // Ações - Saneamento/Commodities
  { id: '18', symbol: 'PETR4', name: 'Petrobras', type: 'stock', category: 'sanitation_commodity_stock', quantity: 1, avgPrice: 0, investedAmount: 60000 },

  // Internacional
  { id: '20', symbol: 'IVVB11', name: 'iShares S&P 500 ETF', type: 'etf', category: 'international_etf', quantity: 1, avgPrice: 0, investedAmount: 200000 },
];

export const yahooSymbols: Record<string, string> = {
  'HGLG11': 'HGLG11.SA',
  'BTLG11': 'BTLG11.SA',
  'XPLG11': 'XPLG11.SA',
  'KNCR11': 'KNCR11.SA',
  'KNSC11': 'KNSC11.SA',
  'XPML11': 'XPML11.SA',
  'VISC11': 'VISC11.SA',
  'PVBI11': 'PVBI11.SA',
  'HGBS11': 'HGBS11.SA',
  'ALZR11': 'ALZR11.SA',
  'TAEE11': 'TAEE11.SA',
  'CPFE3': 'CPFE3.SA',
  'ITUB4': 'ITUB4.SA',
  'BBSE3': 'BBSE3.SA',
  'SAPR11': 'SAPR11.SA',
  'PETR4': 'PETR4.SA',
  'VBBR3': 'VBBR3.SA',
  'IVVB11': 'IVVB11.SA',
};

export const categoryLabels: Record<AssetCategory, string> = {
  logistics_fii: 'Galpões Logísticos',
  paper_credit_fii: 'FIIs Papel/Crédito',
  mall_fii: 'Shopping Centers',
  office_fii: 'Lajes Corporativas',
  fof_fii: 'Fundos de Fundos',
  electric_stock: 'Setor Elétrico',
  financial_stock: 'Setor Financeiro',
  sanitation_commodity_stock: 'Saneamento/Commodities',
  international_etf: 'Internacional (ETF)',
  tesouro_selic: 'Tesouro Selic',
  tesouro_ipca: 'Tesouro IPCA+',
  call_option: 'Call',
  put_option: 'Put',
};

export const typeLabels: Record<AssetType, string> = {
  stock: 'Ações',
  fii: 'FIIs',
  etf: 'ETFs',
  fixed_income: 'Renda Fixa',
  crypto: 'Cripto',
  option: 'Opções',
};

export const typeColors: Record<AssetType, string> = {
  stock: '#3b82f6',
  fii: '#10b981',
  etf: '#8b5cf6',
  fixed_income: '#f59e0b',
  crypto: '#ec4899',
  option: '#6366f1',
};