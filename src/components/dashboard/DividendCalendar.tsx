'use client';

import { useState } from 'react';
import { DividendCalendarMonth, DividendEvent } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DividendCalendarProps {
  calendar: DividendCalendarMonth[];
}

const typeLabels: Record<DividendEvent['type'], string> = {
  dividend: 'Dividendo',
  jcp: 'JCP',
  interest: 'Juros',
  amortizacao: 'Amortização',
};

const typeColors: Record<DividendEvent['type'], string> = {
  dividend: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  jcp: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  interest: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  amortizacao: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

export function DividendCalendar({ calendar }: DividendCalendarProps) {
  const [openMonths, setOpenMonths] = useState<string[]>(
    calendar.slice(0, 3).map(m => m.monthKey)
  );

  const toggleMonth = (monthKey: string) => {
    setOpenMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey) 
        : [...prev, monthKey]
    );
  };

  if (calendar.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Nenhum dividendo programado encontrado.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Clique em "Atualizar Dividendos" para buscar dados do Yahoo Finance e Brapi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {calendar.map((month) => {
        const isOpen = openMonths.includes(month.monthKey);
        const hasEvents = month.events.length > 0;

        return (
          <div key={month.monthKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleMonth(month.monthKey)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  {month.label}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                  {month.events.length} evento{month.events.length !== 1 ? 's' : ''}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                  {formatCurrency(month.totalProjected)}
                </span>
              </div>
              <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isOpen && hasEvents && (
              <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {month.events.map((event, index) => (
                  <div key={`${event.symbol}-${event.exDate}-${index}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {event.symbol}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[event.type]}`}>
                          {typeLabels[event.type]}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {event.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Ex: {event.exDate ? new Date(event.exDate).toLocaleDateString('pt-BR') : '-'}</span>
                        <span>Pag: {event.payDate ? new Date(event.payDate).toLocaleDateString('pt-BR') : '-'}</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(event.amount)}/cota
                        </span>
                        {event.trailingAnnualRate && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Rate: {formatCurrency(event.trailingAnnualRate)}/ano
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}