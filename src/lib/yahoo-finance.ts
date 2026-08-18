'use server';

import YahooFinance from 'yahoo-finance2';
import { yahooSymbols } from '@/data/portfolio';
import { PriceData, DividendEvent } from '@/types';

const yahooFinance = new YahooFinance();

interface YahooQuote {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

interface YahooChartQuote {
  date?: Date;
  close?: number;
  adjclose?: number;
}

interface YahooChartData {
  quotes?: YahooChartQuote[];
}

interface YahooSummaryDetail {
  dividendYield?: number;
  trailingAnnualDividendRate?: number;
}

interface YahooCalendarEvents {
  exDividendDate?: Date;
  dividendDate?: Date;
}

interface YahooDefaultKeyStatistics {
  lastDividendValue?: number;
  lastDividendDate?: Date;
}

interface YahooQuoteSummary {
  summaryDetail?: YahooSummaryDetail;
  calendarEvents?: YahooCalendarEvents;
  defaultKeyStatistics?: YahooDefaultKeyStatistics;
}

export async function fetchPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  
  const validSymbols = symbols
    .map(s => yahooSymbols[s] || `${s}.SA`)
    .filter(Boolean);

  if (validSymbols.length === 0) return results;

  try {
    const quotes = await yahooFinance.quote(validSymbols);
    const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

    quoteArray.forEach((quote) => {
      if (quote.symbol && quote.regularMarketPrice) {
        const originalSymbol = Object.keys(yahooSymbols).find(
          k => yahooSymbols[k] === quote.symbol
        ) || quote.symbol.replace('.SA', '');
        
        results[originalSymbol] = {
          symbol: originalSymbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          timestamp: new Date().toISOString(),
        };
      }
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
  }

  return results;
}

export async function fetchHistoricalData(
  symbol: string, 
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max' = '1y'
) {
  const yahooSymbol = yahooSymbols[symbol] || `${symbol}.SA`;
  
  const periodMap: Record<string, { period1: string; period2: string }> = {
    '1d': { period1: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    '5d': { period1: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    '1mo': { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    '3mo': { period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    '6mo': { period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    '1y': { period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    '2y': { period1: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    '5y': { period1: new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    '10y': { period1: new Date(Date.now() - 3650 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    'ytd': { period1: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], period2: new Date().toISOString().split('T')[0] },
    'max': { period1: '1970-01-01', period2: new Date().toISOString().split('T')[0] },
  };
  
  const { period1, period2 } = periodMap[period] || periodMap['1y'];
  
  try {
    const data = await yahooFinance.chart(yahooSymbol, { period1, period2 }) as YahooChartData;
    return data.quotes?.map((q: YahooChartQuote) => ({
      date: q.date?.toISOString().split('T')[0] || '',
      value: q.close || q.adjclose || 0,
    })).filter(q => q.value > 0) || [];
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

export async function fetchDividends(symbol: string) {
  const yahooSymbol = yahooSymbols[symbol] || `${symbol}.SA`;
  
  try {
    const data = await yahooFinance.quoteSummary(yahooSymbol, { modules: ['summaryDetail'] }) as YahooQuoteSummary;
    return {
      dividendYield: data.summaryDetail?.dividendYield || 0,
      trailingAnnualDividendRate: data.summaryDetail?.trailingAnnualDividendRate || 0,
    };
  } catch (error) {
    console.error(`Error fetching dividends for ${symbol}:`, error);
    return { dividendYield: 0, trailingAnnualDividendRate: 0 };
  }
}

export async function fetchDividendCalendar(symbols: string[]): Promise<Record<string, DividendEvent[]>> {
  const results: Record<string, DividendEvent[]> = {};

  if (symbols.length === 0) return results;

  const promises = symbols.map(async (symbol) => {
    const yahooSymbol = yahooSymbols[symbol] || `${symbol}.SA`;
    
    try {
      const data = await yahooFinance.quoteSummary(yahooSymbol, { 
        modules: ['calendarEvents', 'summaryDetail', 'defaultKeyStatistics'] 
      }) as YahooQuoteSummary;

      const events: DividendEvent[] = [];
      
      if (data.calendarEvents?.exDividendDate || data.calendarEvents?.dividendDate) {
        const exDate = data.calendarEvents.exDividendDate 
          ? data.calendarEvents.exDividendDate.toISOString().split('T')[0]
          : '';
        const payDate = data.calendarEvents.dividendDate
          ? data.calendarEvents.dividendDate.toISOString().split('T')[0]
          : '';
        
        const amount = data.defaultKeyStatistics?.lastDividendValue || 0;
        const trailingRate = data.summaryDetail?.trailingAnnualDividendRate || 0;
        const dividendYield = data.summaryDetail?.dividendYield || 0;

        if (exDate || payDate) {
          events.push({
            symbol,
            name: symbol,
            exDate: exDate || payDate,
            payDate: payDate || exDate,
            amount: amount > 0 ? amount : (trailingRate > 0 ? trailingRate / 12 : 0),
            type: 'dividend',
            source: 'yahoo',
            trailingAnnualRate: trailingRate,
            dividendYield,
          });
        }
      }

      results[symbol] = events;
    } catch (error) {
      console.error(`Error fetching dividend calendar for ${symbol}:`, error);
      results[symbol] = [];
    }
  });

  await Promise.allSettled(promises);
  return results;
}

export async function fetchDividendProjection(
  positions: Array<{ symbol: string; name: string; quantity: number; currentPrice: number }>
): Promise<Array<{
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  trailingAnnualRate: number;
  dividendYield: number;
  projectedMonthly: number;
  projectedAnnual: number;
  nextExDate?: string;
  nextPayDate?: string;
}>> {
  const symbols = positions.map(p => p.symbol);
  const calendar = await fetchDividendCalendar(symbols);

  return positions.map((pos) => {
    const events = calendar[pos.symbol] || [];
    const nextEvent = events[0];
    const trailingRate = nextEvent?.trailingAnnualRate || 0;
    const dividendYield = nextEvent?.dividendYield || 0;
    const projectedAnnual = pos.quantity * trailingRate;
    const projectedMonthly = projectedAnnual / 12;

    return {
      symbol: pos.symbol,
      name: pos.name,
      quantity: pos.quantity,
      currentPrice: pos.currentPrice,
      trailingAnnualRate: trailingRate,
      dividendYield,
      projectedMonthly,
      projectedAnnual,
      nextExDate: nextEvent?.exDate,
      nextPayDate: nextEvent?.payDate,
    };
  });
}