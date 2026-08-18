'use client';

import { useState } from 'react';
import { DividendCalendarMonth, DividendProjection, DividendHistoryEntry, Position } from '@/types';
import { usePortfolio } from '@/context/PortfolioContext';
import { DividendProjection as DividendProjectionComponent } from './DividendProjection';
import { DividendCalendar } from './DividendCalendar';
import { DividendTable } from './DividendTable';
import { DividendHistory } from './DividendHistory';

type Tab = 'projection' | 'calendar' | 'history';

export function DividendTabs() {
  const { 
    dividendCalendar, 
    dividendProjection, 
    dividendHistory, 
    dividendsLoading, 
    dividendsError, 
    refreshDividends,
    positions,
    addDividendHistory,
    deleteDividendHistory,
  } = usePortfolio();
  
  const [activeTab, setActiveTab] = useState<Tab>('projection');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'projection', label: 'Projeção' },
    { id: 'calendar', label: 'Calendário' },
    { id: 'history', label: 'Histórico' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dividendos & Proventos</h2>
        <button
          onClick={refreshDividends}
          disabled={dividendsLoading}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {dividendsLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Atualizando...
            </>
          ) : (
            'Atualizar Dividendos'
          )}
        </button>
      </div>

      {dividendsError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {dividendsError}
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4" aria-label="Dividend tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'projection' && (
          <>
            <DividendProjectionComponent projection={dividendProjection} />
            <DividendTable projection={dividendProjection} calendar={dividendCalendar} />
          </>
        )}
        {activeTab === 'calendar' && (
          <DividendCalendar calendar={dividendCalendar} />
        )}
        {activeTab === 'history' && (
          <DividendHistory 
            history={dividendHistory} 
            positions={positions}
            onAdd={addDividendHistory}
            onDelete={deleteDividendHistory}
          />
        )}
      </div>
    </div>
  );
}