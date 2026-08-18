'use client';

import type { DividendProjection } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DividendProjectionProps {
  projection: DividendProjection[];
}

export function DividendProjection({ projection }: DividendProjectionProps) {
  const totalMonthly = projection.reduce((sum, p) => sum + p.projectedMonthly, 0);
  const totalAnnual = projection.reduce((sum, p) => sum + p.projectedAnnual, 0);
  const totalValue = projection.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);
  const avgYield = totalValue > 0 ? (totalAnnual / totalValue) * 100 : 0;

  const top5 = [...projection]
    .sort((a, b) => b.projectedAnnual - a.projectedAnnual)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Renda Mensal Estimada</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(totalMonthly)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Renda Anual Projetada</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(totalAnnual)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Yield Médio Ponderado</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {avgYield.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Top 5 Maiores Pagadores</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ativo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qtd</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate/Anual</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Projetado Anual</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {top5.map((item) => (
                <tr key={item.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.symbol}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.trailingAnnualRate)}/ano</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(item.projectedAnnual)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                    {totalAnnual > 0 ? ((item.projectedAnnual / totalAnnual) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {top5.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma projeção disponível. Clique em "Atualizar Dividendos".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}