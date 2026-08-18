'use server';

const BRAPI_BASE = 'https://brapi.dev/api';

interface BrapiQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  dividendYield?: number;
  trailingAnnualDividendRate?: number;
}

interface BrapiResponse {
  results?: BrapiQuote[];
  error?: string;
}

interface BrapiDividend {
  symbol: string;
  date: string;
  value: number;
  type: string;
}

interface BrapiDividendsResponse {
  results?: BrapiDividend[];
  error?: string;
}

function getToken(): string {
  return process.env.BRAPI_TOKEN || '';
}

async function fetchWithToken(url: string): Promise<Response> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { headers, next: { revalidate: 3600 } });
}

export async function fetchBrapiQuotes(symbols: string[]): Promise<Record<string, BrapiQuote>> {
  const results: Record<string, BrapiQuote> = {};
  
  if (symbols.length === 0) return results;

  try {
    const symbolsParam = symbols.join(',');
    const url = `${BRAPI_BASE}/quote/${symbolsParam}?fundamental=true`;
    const response = await fetchWithToken(url);
    const data: BrapiResponse = await response.json();

    if (data.results) {
      data.results.forEach((quote) => {
        if (quote.symbol && quote.regularMarketPrice) {
          results[quote.symbol] = quote;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching Brapi quotes:', error);
  }

  return results;
}

export async function fetchBrapiDividends(symbols: string[]): Promise<Record<string, BrapiDividend[]>> {
  const results: Record<string, BrapiDividend[]> = {};
  
  if (symbols.length === 0) return results;

  try {
    const promises = symbols.map(async (symbol) => {
      const url = `${BRAPI_BASE}/quote/${symbol}/dividends`;
      const response = await fetchWithToken(url);
      const data: BrapiDividendsResponse = await response.json();
      
      if (data.results) {
        results[symbol] = data.results;
      } else {
        results[symbol] = [];
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error fetching Brapi dividends:', error);
  }

  return results;
}

export async function fetchBrapiDividendYield(symbol: string): Promise<{ dividendYield: number; trailingAnnualDividendRate: number }> {
  const quotes = await fetchBrapiQuotes([symbol]);
  const quote = quotes[symbol];
  
  if (quote) {
    return {
      dividendYield: quote.dividendYield || 0,
      trailingAnnualDividendRate: quote.trailingAnnualDividendRate || 0,
    };
  }
  
  return { dividendYield: 0, trailingAnnualDividendRate: 0 };
}