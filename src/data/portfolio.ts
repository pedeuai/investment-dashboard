import { Position, AssetType, AssetCategory } from '@/types';

export const initialPositions: Position[] = [
  // Renda Fixa
  { id: '1', symbol: 'TESOURO_SELIC', name: 'Tesouro Selic 2029', type: 'fixed_income', category: 'tesouro_selic', quantity: 2000, avgPrice: 100, investedAmount: 200000, currentPrice: 100 },
  { id: '2', symbol: 'TESOURO_IPCA_2035', name: 'Tesouro IPCA+ 2035', type: 'fixed_income', category: 'tesouro_ipca', quantity: 5000, avgPrice: 100, investedAmount: 500000, currentPrice: 100 },

  // FIIs - Galpões Logísticos
  { id: '3', symbol: 'HGLG11', name: 'CSHG Logística', type: 'fii', category: 'logistics_fii', quantity: 700, avgPrice: 100, investedAmount: 70000 },
  { id: '4', symbol: 'BTLG11', name: 'BTG Logística', type: 'fii', category: 'logistics_fii', quantity: 700, avgPrice: 100, investedAmount: 70000 },
  { id: '5', symbol: 'XPLG11', name: 'XP Log', type: 'fii', category: 'logistics_fii', quantity: 700, avgPrice: 100, investedAmount: 70000 },

  // FIIs - Papel e Crédito
  { id: '6', symbol: 'KNCR11', name: 'Kinea Rendimentos Imobiliários', type: 'fii', category: 'paper_credit_fii', quantity: 1050, avgPrice: 100, investedAmount: 105000 },
  { id: '7', symbol: 'KNSC11', name: 'Kinea Securities', type: 'fii', category: 'paper_credit_fii', quantity: 1050, avgPrice: 100, investedAmount: 105000 },

  // FIIs - Shopping Centers
  { id: '8', symbol: 'XPML11', name: 'XP Malls', type: 'fii', category: 'mall_fii', quantity: 700, avgPrice: 100, investedAmount: 70000 },
  { id: '9', symbol: 'VISC11', name: 'Vinci Shopping Centers', type: 'fii', category: 'mall_fii', quantity: 700, avgPrice: 100, investedAmount: 70000 },

  // FIIs - Lajes Corporativas
  { id: '10', symbol: 'PVBI11', name: 'VBI Prime Properties', type: 'fii', category: 'office_fii', quantity: 700, avgPrice: 100, investedAmount: 70000 },

  // FIIs - Fundos de Fundos
  { id: '11', symbol: 'HGBS11', name: 'HGBS FII', type: 'fii', category: 'fof_fii', quantity: 350, avgPrice: 100, investedAmount: 35000 },
  { id: '12', symbol: 'ALZR11', name: 'Alianza Trust Renda Imobiliária', type: 'fii', category: 'fof_fii', quantity: 350, avgPrice: 100, investedAmount: 35000 },

  // Ações - Elétrico
  { id: '13', symbol: 'TAEE11', name: 'Taesa', type: 'stock', category: 'electric_stock', quantity: 600, avgPrice: 100, investedAmount: 60000 },
  { id: '14', symbol: 'CPFE3', name: 'CPFL Energia', type: 'stock', category: 'electric_stock', quantity: 600, avgPrice: 100, investedAmount: 60000 },

  // Ações - Financeiro
  { id: '15', symbol: 'ITUB4', name: 'Itaú Unibanco', type: 'stock', category: 'financial_stock', quantity: 600, avgPrice: 100, investedAmount: 60000 },
  { id: '16', symbol: 'BBSE3', name: 'BB Seguridade', type: 'stock', category: 'financial_stock', quantity: 600, avgPrice: 100, investedAmount: 60000 },

  // Ações - Saneamento/Commodities
  { id: '17', symbol: 'SAPR11', name: 'Sanepar', type: 'stock', category: 'sanitation_commodity_stock', quantity: 400, avgPrice: 100, investedAmount: 40000 },
  { id: '18', symbol: 'PETR4', name: 'Petrobras', type: 'stock', category: 'sanitation_commodity_stock', quantity: 600, avgPrice: 100, investedAmount: 60000 },
  { id: '19', symbol: 'VBBR3', name: 'Vibra Energia', type: 'stock', category: 'sanitation_commodity_stock', quantity: 600, avgPrice: 100, investedAmount: 60000 },

  // Internacional
  { id: '20', symbol: 'IVVB11', name: 'iShares S&P 500 ETF', type: 'etf', category: 'international_etf', quantity: 2000, avgPrice: 100, investedAmount: 200000 },
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
};

export const typeLabels: Record<AssetType, string> = {
  stock: 'Ações',
  fii: 'FIIs',
  etf: 'ETFs',
  fixed_income: 'Renda Fixa',
  crypto: 'Cripto',
};

export const typeColors: Record<AssetType, string> = {
  stock: '#3b82f6',
  fii: '#10b981',
  etf: '#8b5cf6',
  fixed_income: '#f59e0b',
  crypto: '#ec4899',
};