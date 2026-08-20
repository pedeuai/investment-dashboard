'use client';

import { useState, useMemo } from 'react';
import { DividendCalendarMonth, DividendEvent } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface DividendCalendarProps {
  calendar: DividendCalendarMonth[];
}

type SortField = 'symbol' | 'amount' | 'exDate' | 'payDate' | 'type' | 'dividendYield';
type SortDirection = 'asc' | 'desc';

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
  const [sortField, setSortField] = useState<SortField>('payDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const allEvents = useMemo(() => {
    const events: (DividendEvent & { monthKey: string })[] = [];
    calendar.forEach(month => {
      month.events.forEach(event => {
        events.push({ ...event, monthKey: month.monthKey });
      });
    });
    return events;
  }, [calendar]);

  const sortedEvents = useMemo(() => {
    return [...allEvents].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'exDate':
          aVal = a.exDate || '';
          bVal = b.exDate || '';
          break;
        case 'payDate':
          aVal = a.payDate || '';
          bVal = b.payDate || '';
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'dividendYield':
          aVal = a.dividendYield || 0;
          bVal = b.dividendYield || 0;
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allEvents, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center gap-1">
                  Ativo
                  <SortIcon field="symbol" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Valor
                  <SortIcon field="amount" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSort('exDate')}
              >
                <div className="flex items-center gap-1">
                  Data Com
                  <SortIcon field="exDate" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSort('payDate')}
              >
                <div className="flex items-center gap-1">
                  Data Pagamento
                  <SortIcon field="payDate" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Tipo
                  <SortIcon field="type" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSort('dividendYield')}
              >
                <div className="flex items-center justify-end gap-1">
                  DY
                  <SortIcon field="dividendYield" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedEvents.map((event, index) => (
              <tr key={`${event.symbol}-${event.exDate}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{event.symbol}</td>
                <td className="px-4 py-3 text-sm text-left text-gray-900 dark:text-white font-medium">{formatCurrency(event.amount)}/cota</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {event.exDate ? new Date(event.exDate).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {event.payDate ? new Date(event.payDate).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[event.type]}`}>
                    {typeLabels[event.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400 font-medium">
                  {event.dividendYield ? (event.dividendYield * 100).toFixed(2) + '%' : '-'}
                </td>
              </tr>
            ))}
            {sortedEvents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhum evento de dividendo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total de {sortedEvents.length} evento{sortedEvents.length !== 1 ? 's' : ''} programado{sortedEvents.length !== 1 ? 's' : ''}.
        </p>
      </div>
    </div>
  );
}