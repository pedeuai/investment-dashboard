import { NextRequest, NextResponse } from 'next/server';
import { fetchDividendCalendar, fetchDividendProjection } from '@/lib/yahoo-finance';
import { fetchBrapiDividends } from '@/lib/brapi';
import { initialPositions } from '@/data/portfolio';
import { DividendEvent, DividendCalendarMonth } from '@/types';

function mergeDividends(yahooEvents: DividendEvent[], brapiEvents: Array<{ date: string; value: number; type: string }>, symbol: string): DividendEvent[] {
  const map = new Map<string, DividendEvent>();

  yahooEvents.forEach(e => {
    const key = `${e.symbol}-${e.exDate}-${e.payDate}`;
    map.set(key, { ...e, source: 'yahoo' });
  });

  brapiEvents.forEach(e => {
    const key = `${symbol}-${e.date}-${e.date}`;
    if (!map.has(key)) {
      map.set(key, {
        symbol,
        name: symbol,
        exDate: e.date,
        payDate: e.date,
        amount: e.value,
        type: e.type?.toLowerCase() === 'jcp' ? 'jcp' : 'dividend',
        source: 'brapi',
      });
    }
  });

  return Array.from(map.values());
}

function groupByMonth(events: DividendEvent[]): DividendCalendarMonth[] {
  const monthMap = new Map<string, DividendEvent[]>();

  events.forEach(event => {
    const date = event.payDate || event.exDate;
    if (!date) return;
    const monthKey = date.substring(0, 7);
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(event);
  });

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, monthEvents]) => {
      const date = new Date(monthKey + '-01');
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const totalProjected = monthEvents.reduce((sum, e) => sum + e.amount, 0);
      return { monthKey, label, events: monthEvents, totalProjected };
    });
}

export async function POST(request: NextRequest) {
  try {
    const positions = initialPositions.filter(p => p.type !== 'fixed_income');
    const symbols = positions.map(p => p.symbol);

    const [yahooCalendar, brapiDividends] = await Promise.allSettled([
      fetchDividendCalendar(symbols),
      fetchBrapiDividends(symbols),
    ]);

    const yahooData = yahooCalendar.status === 'fulfilled' ? yahooCalendar.value : {};
    const brapiData = brapiDividends.status === 'fulfilled' ? brapiDividends.value : {};

    const allEvents: DividendEvent[] = [];

    symbols.forEach(symbol => {
      const yahooEvents = yahooData[symbol] || [];
      const brapiEvents = brapiData[symbol] || [];
      const merged = mergeDividends(yahooEvents, brapiEvents, symbol);
      allEvents.push(...merged);
    });

    allEvents.sort((a, b) => (a.payDate || a.exDate).localeCompare(b.payDate || b.exDate));

    const calendar = groupByMonth(allEvents);

    const projection = await fetchDividendProjection(
      positions.map(p => ({
        symbol: p.symbol,
        name: p.name,
        quantity: p.quantity,
        currentPrice: p.currentPrice || p.avgPrice,
      }))
    );

    const updatedAt = new Date().toISOString();

    return NextResponse.json({ calendar, projection, updatedAt });
  } catch (error) {
    console.error('Error refreshing dividends:', error);
    return NextResponse.json({ error: 'Failed to refresh dividends' }, { status: 500 });
  }
}