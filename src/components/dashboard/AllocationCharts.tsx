'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { usePortfolio } from '@/context/PortfolioContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { typeColors, typeLabels, categoryLabels } from '@/data/portfolio';

const COLORS = Object.values(typeColors);
const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6',
  '#ef4444', '#22c55e',
];

const formatCurrency = (value: number | undefined) => 
  value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';

export function AllocationCharts() {
  const { summary } = usePortfolio();

  const typeData = Object.entries(summary.allocationByType).map(([type, value]) => ({
    name: typeLabels[type as keyof typeof typeLabels],
    value,
    color: typeColors[type as keyof typeof typeColors],
  }));

  const categoryData = Object.entries(summary.allocationByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, value], index) => ({
      name: categoryLabels[category as keyof typeof categoryLabels],
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader title="Alocação por Tipo" subtitle="Distribuição das classes de ativos" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {typeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Alocação por Categoria" subtitle="Detalhamento por setor/estratégia" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis type="number" tickFormatter={v => `R$ ${(v/1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" width={180} />
              <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {categoryData.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

interface CustomTooltipProps {
  formatter: (value: number | undefined) => string;
  active?: boolean;
  payload?: Array<{ value: number | undefined; name: string; color: string }>;
}

function CustomTooltip({ formatter, active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.name}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatter(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}