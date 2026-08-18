'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Position, PortfolioSummary, DividendCalendarMonth, DividendProjection, DividendHistoryEntry, DividendType } from '@/types';
import { initialPositions } from '@/data/portfolio';

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
  const totalCurrentValue = positions.reduce((sum, p) => sum + (p.currentValue ?? p.investedAmount), 0);
  const totalPL = totalCurrentValue - totalInvested;
  const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  const allocationByType: Record<string, number> = {};
  const allocationByCategory: Record<string, number> = {};

  positions.forEach(p => {
    const value = p.currentValue ?? p.investedAmount;
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
    try {
      const symbols = positions
        .filter(p => p.symbol !== 'TESOURO_SELIC' && p.symbol !== 'TESOURO_IPCA_2035')
        .map(p => p.symbol);
      
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const prices = await response.json();
      
      setPositions(prev => prev.map(p => {
        if (p.symbol === 'TESOURO_SELIC' || p.symbol === 'TESOURO_IPCA_2035') return p;
        const priceData = prices[p.symbol];
        if (!priceData) return p;
        const currentValue = p.quantity * priceData.price;
        return {
          ...p,
          currentPrice: priceData.price,
          currentValue,
          pl: currentValue - p.investedAmount,
          plPercent: p.investedAmount > 0 ? ((currentValue - p.investedAmount) / p.investedAmount) * 100 : 0,
          lastUpdated: new Date().toISOString(),
        };
      }));
    } catch (err) {
      setError('Erro ao buscar preços. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [positions]);

  const refreshDividends = useCallback(async () => {
    setDividendsLoading(true);
    setDividendsError(null);
    try {
      const response = await fetch('/api/dividends/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to fetch dividends');
      
      const data = await response.json();
      setDividendCalendar(data.calendar || []);
      setDividendProjection(data.projection || []);
    } catch (err) {
      setDividendsError('Erro ao buscar dividendos. Tente novamente.');
      console.error(err);
    } finally {
      setDividendsLoading(false);
    }
  }, []);

  const addPosition = useCallback((position: Omit<Position, 'id'>) => {
    const newPosition: Position = {
      ...position,
      id: crypto.randomUUID(),
    };
    setPositions(prev => [...prev, newPosition]);
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
      id: crypto.randomUUID(),
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