'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { usePortfolio } from '@/context/PortfolioContext';
import { typeLabels, categoryLabels, typeColors } from '@/data/portfolio';
import { Search, ChevronUp, ChevronDown, Plus, Calendar, Bell, BellOff, Volume2, Trash2, Edit2 } from 'lucide-react';
import { Position, AssetCategory } from '@/types';

const optionCategoryLabels: Record<'call_option' | 'put_option', string> = {
  call_option: 'Call',
  put_option: 'Put',
};

const ALERT_STORAGE_KEY = 'options-alert-settings';

interface AlertSettings {
  enabled: boolean;
  daysBefore: number;
  soundEnabled: boolean;
}

const defaultAlertSettings: AlertSettings = {
  enabled: true,
  daysBefore: 3,
  soundEnabled: true,
};

function playAlertSound() {
  const audio = new Audio('/sounds/opcoes.mp3');
  audio.volume = 0.5;
  audio.play().catch(err => console.warn('Could not play alert sound:', err));
}

function checkAndAlertOptions(optionPositions: Position[], settings: AlertSettings) {
  if (!settings.enabled || !settings.soundEnabled) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  optionPositions.forEach(position => {
    if (!position.expirationDate) return;
    
    const expDate = new Date(position.expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= settings.daysBefore) {
      const alertKey = `option-alert-${position.symbol}-${position.expirationDate}`;
      const alreadyAlerted = localStorage.getItem(alertKey);
      
      if (!alreadyAlerted) {
        localStorage.setItem(alertKey, 'true');
        playAlertSound();
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Opção próxima do exercício: ${position.symbol}`, {
            body: `Exercício em ${diffDays} dia${diffDays !== 1 ? 's' : ''} (${new Date(position.expirationDate).toLocaleDateString('pt-BR')})`,
            icon: '/favicon.ico',
          });
        }
      }
    }
  });
}

export function OptionsTable() {
  const { positions, updatePosition, deletePosition, addPosition, refreshPrices, isLoading } = usePortfolio();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Position; direction: 'asc' | 'desc' }>({ key: 'investedAmount', direction: 'desc' });
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState<Partial<Position>>({});
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ALERT_STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultAlertSettings, ...JSON.parse(stored) };
        } catch {
          return defaultAlertSettings;
        }
      }
    }
    return defaultAlertSettings;
  });
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alertSettings));
  }, [alertSettings]);

  const optionPositions = positions.filter(p => p.type === 'option');

  useEffect(() => {
    if (alertSettings.enabled && mounted) {
      checkAndAlertOptions(optionPositions, alertSettings);
    }
  }, [optionPositions, alertSettings, mounted]);

  const filteredPositions = optionPositions
    .filter(p => {
      const matchesSearch = p.symbol.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
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

  // Compute "today" date once at component level to avoid hydration mismatch
  const [today, setToday] = useState<Date | null>(null);
  
  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

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
      receivedAmount: position.receivedAmount,
      expirationDate: position.expirationDate,
      pl: position.pl,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingPosition(null);
    setFormData({ type: 'option', category: 'call_option', quantity: 0, avgPrice: 0, investedAmount: 0, receivedAmount: 0, expirationDate: '', pl: 0 });
    setShowModal(true);
  };

  // Auto-calculate investedAmount when quantity or avgPrice changes
  useEffect(() => {
    if (formData.quantity && formData.avgPrice) {
      setFormData(prev => ({
        ...prev,
        investedAmount: Math.round((prev.quantity || 0) * (prev.avgPrice || 0) * 100) / 100
      }));
    }
  }, [formData.quantity, formData.avgPrice]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercent = (value: number | undefined) =>
    value !== undefined ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : '--';

  const getPLColor = (value: number | undefined) =>
    value !== undefined && value > 0 ? 'text-green-600 dark:text-green-400' :
    value !== undefined && value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500';

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar opção..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as AssetCategory | 'all')}
            options={[{ value: 'all', label: 'Todas' }, { value: 'call_option', label: 'Call' }, { value: 'put_option', label: 'Put' }]}
            placeholder="Filtrar"
            className="w-full sm:w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAlertSettings(!showAlertSettings)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          >
            {alertSettings.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            Alertas
          </button>
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Nova Opção
          </Button>
        </div>
      </div>

      {showAlertSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSettings.enabled}
                onChange={(e) => setAlertSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ativar alertas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSettings.soundEnabled}
                onChange={(e) => setAlertSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                disabled={!alertSettings.enabled}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Som</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dias de antecedência
              </label>
              <select
                value={alertSettings.daysBefore}
                onChange={(e) => setAlertSettings(prev => ({ ...prev, daysBefore: parseInt(e.target.value) }))}
                disabled={!alertSettings.enabled}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value={1}>1 dia</option>
                <option value={2}>2 dias</option>
                <option value={3}>3 dias</option>
                <option value={5}>5 dias</option>
                <option value={7}>7 dias</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={playAlertSound}
                disabled={!alertSettings.soundEnabled || !alertSettings.enabled}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Volume2 className="h-4 w-4" />
                Testar som
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notificações do navegador
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {notificationPermission === 'granted' ? '✅ Ativado' : notificationPermission === 'denied' ? '❌ Bloqueado' : '⚠️ Não solicitado'}
                </span>
                {notificationPermission !== 'granted' && (
                  <button
                    onClick={requestNotificationPermission}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Permitir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {[
                  { key: 'symbol', label: 'Ativo' },
                  { key: 'name', label: 'Nome' },
                  { key: 'category', label: 'Tipo' },
                  { key: 'expirationDate', label: 'Exercício' },
                  { key: 'quantity', label: 'Qtd.' },
                  { key: 'avgPrice', label: 'Preço Médio' },
                  { key: 'investedAmount', label: 'Investido' },
                  { key: 'receivedAmount', label: 'Recebido' },
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
              {filteredPositions.map(position => {
                let isExpirationToday = false;
                let isExpirationSoon = false;
                
                if (today && position.expirationDate) {
                  const expDate = new Date(position.expirationDate);
                  expDate.setHours(0, 0, 0, 0);
                  const diffTime = expDate.getTime() - today.getTime();
                  const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  isExpirationToday = daysUntilExpiration === 0;
                  isExpirationSoon = daysUntilExpiration > 0 && daysUntilExpiration <= alertSettings.daysBefore;
                }

                const rowClassName = [
                  'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  isExpirationToday && 'animate-pulse-red bg-red-100 dark:bg-red-900/30',
                  isExpirationSoon && 'bg-amber-50 dark:bg-amber-900/20'
                ].filter(Boolean).join(' ');

                return (
                  <tr key={position.id} className={rowClassName}>
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{position.symbol}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[120px] text-[11px] leading-tight break-words">{position.name}</td>
<td className="px-4 py-3">
                    <Badge
                      variant="default"
                      className={[
                        'bg-[',
                        typeColors[position.type],
                        ']/10 text-[',
                        typeColors[position.type],
                        '] border border-[',
                        typeColors[position.type],
                        ']/20 text-[9px]'
                      ].join('')}
                    >
                      {optionCategoryLabels[position.category as 'call_option' | 'put_option']}
                    </Badge>
                  </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {position.expirationDate 
                        ? position.expirationDate.split('-').reverse().join('/')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{position.quantity.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{formatCurrency(position.avgPrice)}</td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(position.investedAmount)}</td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">
                      {position.receivedAmount ? formatCurrency(position.receivedAmount) : '--'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {position.pl !== undefined ? (
                        <span className={getPLColor(position.pl)}>{formatCurrency(position.pl)}</span>
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
                );
              })}
              {filteredPositions.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma opção cadastrada. Clique em "Nova Opção" para adicionar.
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
            <CardHeader title={editingPosition ? 'Editar Opção' : 'Nova Opção'} />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Código" value={formData.symbol || ''} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} required />
                <Select label="Tipo" value={formData.category || 'call_option'} onChange={e => setFormData({...formData, category: e.target.value as AssetCategory})} options={[{ value: 'call_option', label: 'Call' }, { value: 'put_option', label: 'Put' }]} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input label="Tipo (fixo)" value="Opção" disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Quantidade" type="number" value={formData.quantity || 0} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} required />
                <Input label="Preço" type="number" step="0.01" value={formData.avgPrice || 0} onChange={e => setFormData({...formData, avgPrice: parseFloat(e.target.value) || 0})} required />
                <Input label="Investido (R$)" type="number" step="0.01" value={formData.investedAmount || 0} readOnly className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Recebido (R$)" type="number" step="0.01" value={formData.receivedAmount || 0} onChange={e => setFormData({...formData, receivedAmount: parseFloat(e.target.value) || 0})} />
                <Input label="Exercício" type="date" value={formData.expirationDate || ''} onChange={e => setFormData({...formData, expirationDate: e.target.value})} />
                <Input label="Lucro/Prejuízo (R$)" type="number" step="0.01" value={formData.pl || 0} onChange={e => setFormData({...formData, pl: parseFloat(e.target.value) || 0})} />
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