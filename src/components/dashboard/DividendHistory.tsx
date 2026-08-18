'use client';

import { useState } from 'react';
import { DividendHistoryEntry, DividendType, Position } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DividendHistoryProps {
  history: DividendHistoryEntry[];
  positions: Position[];
  onAdd: (entry: Omit<DividendHistoryEntry, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

const typeLabels: Record<DividendType, string> = {
  dividend: 'Dividendo',
  jcp: 'JCP',
  interest: 'Juros',
  amortizacao: 'Amortização',
};

export function DividendHistory({ history, positions, onAdd, onDelete }: DividendHistoryProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    total: '',
    type: 'dividend' as DividendType,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = positions.find(p => p.symbol === formData.symbol)?.quantity || 0;
    const total = quantity * parseFloat(formData.amount);
    
    onAdd({
      ...formData,
      amount: parseFloat(formData.amount),
      total,
    });
    setShowModal(false);
    setFormData({
      symbol: '',
      name: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      total: '',
      type: 'dividend',
      notes: '',
    });
  };

  const handleSymbolChange = (symbol: string) => {
    const position = positions.find(p => p.symbol === symbol);
    setFormData(prev => ({
      ...prev,
      symbol,
      name: position?.name || '',
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Histórico de Proventos Recebidos</h3>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Registrar Provento
        </button>
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum provento registrado ainda.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Clique em "Registrar Provento" para adicionar manualmente.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ativo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor/Cota</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Recebido</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notas</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {new Date(entry.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{entry.symbol}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      {typeLabels[entry.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(entry.amount)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(entry.total)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{entry.notes || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Registrar Provento Recebido</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ativo</label>
                <select
                  value={formData.symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione...</option>
                  {positions
                    .filter(p => p.type !== 'fixed_income')
                    .map(p => (
                      <option key={p.symbol} value={p.symbol}>{p.symbol} - {p.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do Recebimento</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DividendType }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dividend">Dividendo</option>
                  <option value="jcp">JCP</option>
                  <option value="interest">Juros</option>
                  <option value="amortizacao">Amortização</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor por Cota (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas (opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}