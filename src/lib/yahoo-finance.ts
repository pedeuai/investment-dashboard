'use server';

import yahooFinance from 'yahoo-finance2';
import { yahooSymbols } from '@/data/portfolio';
import { PriceData } from '@/types';

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

interface YahooQuoteSummary {
  summaryDetail?: YahooSummaryDetail;
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

    quoteArray.forEach((quote: YahooQuote) => {
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
  
  try {
    const data = await yahooFinance.chart(yahooSymbol, { period }) as YahooChartData;
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