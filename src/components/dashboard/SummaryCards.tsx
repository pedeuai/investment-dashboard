'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/context/PortfolioContext';
import { typeColors, typeLabels } from '@/data/portfolio';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function SummaryCards() {
  const { summary, isLoading } = usePortfolio();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  const plColor = summary.totalPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const PLIcon = summary.totalPL >= 0 ? TrendingUp : summary.totalPL < 0 ? TrendingDown : Minus;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader title="Total Investido" subtitle="Valor aplicado" />
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          R$ {summary.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </Card>

      <Card>
        <CardHeader title="Valor Atual" subtitle="Patrimônio total" />
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          R$ {summary.totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </Card>

      <Card>
        <CardHeader title="Lucro/Prejuízo" subtitle="Resultado total" />
        <div className="flex items-center gap-2">
          <PLIcon className={`h-5 w-5 ${plColor}`} />
          <p className={`text-3xl font-bold ${plColor}`}>
            R$ {summary.totalPL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <p className={`text-sm ${plColor} mt-1`}>
          {summary.totalPLPercent >= 0 ? '+' : ''}{summary.totalPLPercent.toFixed(2)}%
        </p>
      </Card>

      <Card>
        <CardHeader title="Diversificação" subtitle={`${Object.keys(summary.allocationByType).length} classes de ativos`} />
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.allocationByType).map(([type, value]) => (
            <Badge
              key={type}
              variant="default"
              className="bg-[${typeColors[type as keyof typeof typeColors]}]/10 text-[${typeColors[type as keyof typeof typeColors]}] border border-[${typeColors[type as keyof typeof typeColors]}]/20"
            >
              {typeLabels[type as keyof typeof typeLabels]}: {(value / summary.totalCurrentValue * 100).toFixed(1)}%
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}