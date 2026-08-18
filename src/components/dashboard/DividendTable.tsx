'use client';

import { DividendProjection, DividendCalendarMonth } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DividendTableProps {
  projection: DividendProjection[];
  calendar: DividendCalendarMonth[];
}

export function DividendTable({ projection, calendar }: DividendTableProps) {
  const getNextPayment = (symbol: string) => {
    for (const month of calendar) {
      const event = month.events.find(e => e.symbol === symbol);
      if (event) return event;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Detalhamento por Ativo</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ativo</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qtd</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preço Atual</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yield</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate Anual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próx. Pagamento</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Projetado Mensal</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Projetado Anual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {projection.map((item) => {
              const nextPayment = getNextPayment(item.symbol);
              const totalValue = item.quantity * item.currentPrice;
              return (
                <tr key={item.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.symbol}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.currentPrice)}</td>
                  <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400">{item.dividendYield.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.trailingAnnualRate)}/ano</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {nextPayment 
                      ? `${nextPayment.type === 'jcp' ? 'JCP' : 'Div'} ${new Date(nextPayment.payDate).toLocaleDateString('pt-BR')}`
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(item.projectedMonthly)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(item.projectedAnnual)}</td>
                </tr>
              );
            })}
            {projection.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma projeção disponível. Clique em "Atualizar Dividendos".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}