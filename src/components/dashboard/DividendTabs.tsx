'use client';

import { useState, useEffect, useMemo } from 'react';
import { DividendCalendarMonth, DividendProjection, DividendHistoryEntry, Position, DividendEvent } from '@/types';
import { usePortfolio } from '@/context/PortfolioContext';
import { DividendProjection as DividendProjectionComponent } from './DividendProjection';
import { DividendCalendar } from './DividendCalendar';
import { DividendTable } from './DividendTable';
import { DividendHistory } from './DividendHistory';
import { Bell, BellOff, Volume2 } from 'lucide-react';

type Tab = 'projection' | 'calendar' | 'history';

const ALERT_STORAGE_KEY = 'dividend-alert-settings';

interface AlertSettings {
  enabled: boolean;
  daysBefore: number;
  alertOnExDate: boolean;
  alertOnPayDate: boolean;
  soundEnabled: boolean;
}

const defaultSettings: AlertSettings = {
  enabled: true,
  daysBefore: 3,
  alertOnExDate: true,
  alertOnPayDate: true,
  soundEnabled: true,
};

function playAlertSound() {
  const audio = new Audio('/sounds/alert.mp3');
  audio.volume = 0.5;
  audio.play().catch(err => console.warn('Could not play alert sound:', err));
}

function checkAndAlertDividends(events: (DividendEvent & { monthKey: string })[], settings: AlertSettings) {
  if (!settings.enabled || !settings.soundEnabled) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  events.forEach(event => {
    const checkDates = [];
    if (settings.alertOnExDate && event.exDate) checkDates.push({ date: event.exDate, label: 'Data Com' });
    if (settings.alertOnPayDate && event.payDate) checkDates.push({ date: event.payDate, label: 'Data Pagamento' });
    
    checkDates.forEach(({ date: dateStr, label }) => {
      const eventDate = new Date(dateStr);
      eventDate.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= settings.daysBefore) {
        const alertKey = `dividend-alert-${event.symbol}-${label}-${dateStr}`;
        const alreadyAlerted = localStorage.getItem(alertKey);
        
        if (!alreadyAlerted) {
          localStorage.setItem(alertKey, 'true');
          const audio = new Audio('/sounds/alert.mp3');
          audio.volume = 0.5;
          audio.play().catch(err => console.warn('Could not play alert sound:', err));
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Dividendo se aproximando: ${event.symbol}`, {
              body: `${label} em ${diffDays} dia${diffDays !== 1 ? 's' : ''} (${new Date(dateStr).toLocaleDateString('pt-BR')})`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    });
  });
}
 
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
  const [alertSettings, setAlertSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dividend-alert-settings');
      if (stored) {
        try {
          return { enabled: true, daysBefore: 3, alertOnExDate: true, alertOnPayDate: true, soundEnabled: true, ...JSON.parse(stored) };
        } catch {
          return { enabled: true, daysBefore: 3, alertOnExDate: true, alertOnPayDate: true, soundEnabled: true };
        }
      }
    }
    return { enabled: true, daysBefore: 3, alertOnExDate: true, alertOnPayDate: true, soundEnabled: true };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dividend-alert-settings', JSON.stringify(alertSettings));
  }, [alertSettings]);

  const allEvents = useMemo(() => {
    const events: (DividendEvent & { monthKey: string })[] = [];
    dividendCalendar.forEach(month => {
      month.events.forEach(event => {
        events.push({ ...event, monthKey: month.monthKey });
      });
    });
    return events;
  }, [dividendCalendar]);

  useEffect(() => {
    if (alertSettings.enabled) {
      checkAndAlertDividends(allEvents, alertSettings);
    }
  }, [allEvents, alertSettings]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'projection', label: 'Projeção' },
    { id: 'calendar', label: 'Calendário' },
    { id: 'history', label: 'Histórico' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dividendos & Proventos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          >
            {alertSettings.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            Alertas
          </button>
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

      </div>

      {showSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSettings.enabled}
                onChange={(e) => setAlertSettings((prev: AlertSettings) => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ativar alertas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSettings.soundEnabled}
                onChange={(e) => setAlertSettings((prev: AlertSettings) => ({ ...prev, soundEnabled: e.target.checked }))}
                disabled={!alertSettings.enabled}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Som</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSettings.alertOnExDate}
                onChange={(e) => setAlertSettings((prev: AlertSettings) => ({ ...prev, alertOnExDate: e.target.checked }))}
                disabled={!alertSettings.enabled}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Alertar na Data Com</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSettings.alertOnPayDate}
                onChange={(e) => setAlertSettings((prev: AlertSettings) => ({ ...prev, alertOnPayDate: e.target.checked }))}
                disabled={!alertSettings.enabled}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Alertar na Data Pagamento</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dias de antecedência
              </label>
              <select
                value={alertSettings.daysBefore}
                onChange={(e) => setAlertSettings((prev: AlertSettings) => ({ ...prev, daysBefore: parseInt(e.target.value) }))}
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
                    onClick={() => Notification.requestPermission().then(p => setNotificationPermission(p))}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Permitir
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const audio = new Audio('/sounds/alert.mp3');
                  audio.volume = 0.5;
                  audio.play().catch(err => console.warn('Could not play test sound:', err));
                }}
                disabled={!alertSettings.soundEnabled || !alertSettings.enabled}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Volume2 className="h-4 w-4" />
                Testar som
              </button>
            </div>
          </div>
        </div>
      )}
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