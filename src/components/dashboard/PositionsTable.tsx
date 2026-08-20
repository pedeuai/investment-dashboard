'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { usePortfolio } from '@/context/PortfolioContext';
import { typeLabels, categoryLabels, typeColors } from '@/data/portfolio';
import { Search, Filter, ChevronUp, ChevronDown, Plus, Trash2, Edit2 } from 'lucide-react';
import { Position, AssetType, AssetCategory } from '@/types';

const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({ value, label }));
const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));

export function PositionsTable() {
  const { positions, updatePosition, deletePosition, addPosition, refreshPrices, isLoading } = usePortfolio();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Position; direction: 'asc' | 'desc' }>({ key: 'investedAmount', direction: 'desc' });
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState<Partial<Position>>({});

  const filteredPositions = positions
    .filter(p => p.type !== 'option')
    .filter(p => {
      const matchesSearch = p.symbol.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

  const handleSort = (key: keyof Position) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPosition) {
      updatePosition(editingPosition.id, formData);
    } else {
      addPosition(formData as Omit<Position, 'id'>);
    }
    setShowModal(false);
    setEditingPosition(null);
    setFormData({});
  };

  const openEditModal = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      symbol: position.symbol,
      name: position.name,
      type: position.type,
      category: position.category,
      quantity: position.quantity,
      avgPrice: position.avgPrice,
      investedAmount: position.investedAmount,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingPosition(null);
    setFormData({ type: 'stock', quantity: 0, avgPrice: 0, investedAmount: 0 });
    setShowModal(true);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const formatPercent = (value: number | undefined) =>
    value !== undefined ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : '--';

  const getPLColor = (value: number | undefined) =>
    value !== undefined && value > 0 ? 'text-green-600 dark:text-green-400' :
    value !== undefined && value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar ativo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as AssetType | 'all')}
            options={[{ value: 'all', label: 'Todos os tipos' }, ...typeOptions]}
            placeholder="Filtrar por tipo"
            className="w-full sm:w-40"
          />
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as AssetCategory | 'all')}
            options={[{ value: 'all', label: 'Todas categorias' }, ...categoryOptions]}
            placeholder="Filtrar por categoria"
            className="w-full sm:w-48"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshPrices} loading={isLoading} className="sm:hidden">
            Atualizar
          </Button>
          <Button variant="outline" onClick={refreshPrices} loading={isLoading} className="hidden sm:flex">
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Atualizar Preços
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Novo Ativo
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
{[
                    { key: 'symbol', label: 'Ativo' },
                    { key: 'name', label: 'Nome' },
                    { key: 'type', label: 'Tipo' },
                    { key: 'quantity', label: 'Qtd.' },
                    { key: 'avgPrice', label: 'Preço Médio' },
                    { key: 'investedAmount', label: 'Investido' },
                    { key: 'currentValue', label: 'Valor Atual' },
                    { key: 'pl', label: 'Lucro/Prejuízo' },
                    { key: 'plPercent', label: '%' },
                  ].map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => handleSort(col.key as keyof Position)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPositions.map(position => (
                <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{position.symbol}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[120px] text-[11px] leading-tight break-words">{position.name}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="default"
                      className="bg-[${typeColors[position.type]}]/10 text-[${typeColors[position.type]}] border border-[${typeColors[position.type]}]/20 text-[9px]"
                    >
                      {typeLabels[position.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{position.quantity.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{formatNumber(position.avgPrice)}</td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{formatNumber(position.investedAmount)}</td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">
                    {position.currentValue ? formatNumber(position.currentValue) : formatNumber(position.investedAmount)}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {position.pl !== undefined ? (
                      <span className={getPLColor(position.pl)}>{formatNumber(position.pl)}</span>
                    ) : '--'}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {position.plPercent !== undefined ? (
                      <span className={getPLColor(position.plPercent)}>{formatPercent(position.plPercent)}</span>
                    ) : '--'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(position)} className="p-1">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deletePosition(position.id)} className="text-red-600 hover:text-red-700 p-1">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPositions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum ativo encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader title={editingPosition ? 'Editar Ativo' : 'Novo Ativo'} />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Código" value={formData.symbol || ''} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} required />
                <Select label="Tipo" value={formData.type || 'stock'} onChange={e => setFormData({...formData, type: e.target.value as AssetType})} options={typeOptions} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Select label="Categoria" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value as AssetCategory})} options={categoryOptions} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Quantidade" type="number" value={formData.quantity || 0} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} required />
                <Input label="Preço Médio" type="number" step="0.01" value={formData.avgPrice || 0} onChange={e => setFormData({...formData, avgPrice: parseFloat(e.target.value) || 0})} required />
                <Input label="Investido (R$)" type="number" step="0.01" value={formData.investedAmount || 0} onChange={e => setFormData({...formData, investedAmount: parseFloat(e.target.value) || 0})} required />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditingPosition(null); setFormData({}); }}>Cancelar</Button>
                <Button type="submit">{editingPosition ? 'Salvar' : 'Adicionar'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}