'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Position, PortfolioSummary } from '@/types';
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
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const STORAGE_KEY = 'investment-portfolio';

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
  const [positions, setPositions] = useState<Position[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return initialPositions;
        }
      }
    }
    return initialPositions;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

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