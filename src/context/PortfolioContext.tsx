'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Position, PortfolioSummary, DividendCalendarMonth, DividendProjection, DividendHistoryEntry, DividendType } from '@/types';
import { initialPositions } from '@/data/portfolio';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface PortfolioContextType {
  positions: Position[];
  summary: PortfolioSummary;
  isLoading: boolean;
  error: string | null;
  refreshPrices: () => Promise<void>;
  addPosition: (position: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  deletePosition: (id: string) => void;
  resetToDefault: () => void;
  dividendCalendar: DividendCalendarMonth[];
  dividendProjection: DividendProjection[];
  dividendHistory: DividendHistoryEntry[];
  dividendsLoading: boolean;
  dividendsError: string | null;
  refreshDividends: () => Promise<void>;
  addDividendHistory: (entry: Omit<DividendHistoryEntry, 'id' | 'createdAt'>) => void;
  deleteDividendHistory: (id: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const STORAGE_KEY = 'investment-portfolio';
const DIVIDEND_HISTORY_KEY = 'dividend-history';

function calculateSummary(positions: Position[]): PortfolioSummary {
  const totalInvested = positions.reduce((sum, p) => sum + p.investedAmount, 0);
  const totalReceived = positions.reduce((sum, p) => sum + (p.receivedAmount || 0), 0);
  
  const totalCurrentValue = positions.reduce((sum, p) => {
    if (p.type === 'option') {
      // For options: value = received - invested + currentValue (if still open)
      const optionValue = (p.receivedAmount || 0) - p.investedAmount + (p.currentValue ?? 0);
      return sum + optionValue;
    }
    return sum + (p.currentValue ?? p.investedAmount);
  }, 0);
  
  // For options, the "invested" basis includes the net cash flow (received - invested)
  const totalNetInvested = positions.reduce((sum, p) => {
    if (p.type === 'option') {
      return sum + p.investedAmount - (p.receivedAmount || 0);
    }
    return sum + p.investedAmount;
  }, 0);
  
  const totalPL = totalCurrentValue - totalNetInvested;
  const totalPLPercent = totalNetInvested !== 0 ? (totalPL / Math.abs(totalNetInvested)) * 100 : 0;

  const allocationByType: Record<string, number> = {};
  const allocationByCategory: Record<string, number> = {};

  positions.forEach(p => {
    let value: number;
    if (p.type === 'option') {
      value = (p.receivedAmount || 0) - p.investedAmount + (p.currentValue ?? 0);
    } else {
      value = p.currentValue ?? p.investedAmount;
    }
    allocationByType[p.type] = (allocationByType[p.type] || 0) + value;
    allocationByCategory[p.category] = (allocationByCategory[p.category] || 0) + value;
  });

  return {
    totalInvested,
    totalCurrentValue,
    totalPL,
    totalPLPercent,
    allocationByType: allocationByType as PortfolioSummary['allocationByType'],
    allocationByCategory: allocationByCategory as PortfolioSummary['allocationByCategory'],
  };
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dividendCalendar, setDividendCalendar] = useState<DividendCalendarMonth[]>([]);
  const [dividendProjection, setDividendProjection] = useState<DividendProjection[]>([]);
  const [dividendHistory, setDividendHistory] = useState<DividendHistoryEntry[]>([]);
  const [dividendsLoading, setDividendsLoading] = useState(false);
  const [dividendsError, setDividendsError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedPositions = localStorage.getItem(STORAGE_KEY);
    if (storedPositions) {
      try {
        setPositions(JSON.parse(storedPositions));
      } catch {
        setPositions(initialPositions);
      }
    }
    const storedHistory = localStorage.getItem(DIVIDEND_HISTORY_KEY);
    if (storedHistory) {
      try {
        setDividendHistory(JSON.parse(storedHistory));
      } catch {
        setDividendHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    }
  }, [positions, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(DIVIDEND_HISTORY_KEY, JSON.stringify(dividendHistory));
    }
  }, [dividendHistory, mounted]);

  const summary = calculateSummary(positions);

  const refreshPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Safety timeout to prevent stuck loading state
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Tempo limite excedido ao buscar preços.');
    }, 15000);
    
    try {
      const symbols = positions
        .filter(p => p.symbol !== 'TESOURO_SELIC' && p.symbol !== 'TESOURO_IPCA_2035')
        .map(p => p.symbol);
      
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const prices = await response.json();
      
      setPositions(prev => prev.map(p => {
        if (p.symbol === 'TESOURO_SELIC' || p.symbol === 'TESOURO_IPCA_2035') return p;
        const priceData = prices[p.symbol];
        if (!priceData) return p;
        const currentValue = p.quantity * priceData.price;
        
        let pl: number;
        let plPercent: number;
        
        if (p.type === 'option') {
          // For options: PL = received - invested + currentValue
          const received = p.receivedAmount || 0;
          pl = received - p.investedAmount + currentValue;
          const netInvested = p.investedAmount - received;
          plPercent = netInvested !== 0 ? (pl / Math.abs(netInvested)) * 100 : 0;
        } else {
          pl = currentValue - p.investedAmount;
          plPercent = p.investedAmount > 0 ? ((currentValue - p.investedAmount) / p.investedAmount) * 100 : 0;
        }
        
        return {
          ...p,
          currentPrice: priceData.price,
          currentValue,
          pl,
          plPercent,
          lastUpdated: new Date().toISOString(),
        };
      }));
    } catch (err) {
      setError('Erro ao buscar preços. Tente novamente.');
      console.error(err);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [positions]);

  const refreshDividends = useCallback(async () => {
    setDividendsLoading(true);
    setDividendsError(null);
    
    const timeoutId = setTimeout(() => {
      setDividendsLoading(false);
      setDividendsError('Tempo limite excedido ao buscar dividendos.');
    }, 15000);
    
    try {
      const response = await fetch('/api/dividends/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) throw new Error('Failed to fetch dividends');
      
      const data = await response.json();
      setDividendCalendar(data.calendar || []);
      setDividendProjection(data.projection || []);
    } catch (err) {
      setDividendsError('Erro ao buscar dividendos. Tente novamente.');
      console.error(err);
    } finally {
      clearTimeout(timeoutId);
      setDividendsLoading(false);
    }
  }, []);

  const addPosition = useCallback((position: Omit<Position, 'id'>) => {
    setPositions(prev => {
      const existingIndex = prev.findIndex(p => p.symbol === position.symbol);
      
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        const newQuantity = existing.quantity + position.quantity;
        const newInvestedAmount = existing.investedAmount + position.investedAmount;
        const newAvgPrice = newInvestedAmount / newQuantity;
        
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          investedAmount: newInvestedAmount,
          avgPrice: newAvgPrice,
          currentValue: (existing.currentValue ?? existing.investedAmount) + (position.currentValue ?? position.investedAmount),
        };
        return updated;
      }
      
      const newPosition: Position = {
        ...position,
        id: generateId(),
      };
      return [...prev, newPosition];
    });
  }, []);

  const updatePosition = useCallback((id: string, updates: Partial<Position>) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePosition = useCallback((id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  }, []);

  const resetToDefault = useCallback(() => {
    setPositions(initialPositions);
  }, []);

  const addDividendHistory = useCallback((entry: Omit<DividendHistoryEntry, 'id' | 'createdAt'>) => {
    const newEntry: DividendHistoryEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setDividendHistory(prev => [newEntry, ...prev]);
  }, []);

  const deleteDividendHistory = useCallback((id: string) => {
    setDividendHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  return (
    <PortfolioContext.Provider value={{
      positions,
      summary,
      isLoading,
      error,
      refreshPrices,
      addPosition,
      updatePosition,
      deletePosition,
      resetToDefault,
      dividendCalendar,
      dividendProjection,
      dividendHistory,
      dividendsLoading,
      dividendsError,
      refreshDividends,
      addDividendHistory,
      deleteDividendHistory,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}