import { NextRequest, NextResponse } from 'next/server';
import { fetchPrices } from '@/lib/yahoo-finance';

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols array required' }, { status: 400 });
    }

    const prices = await fetchPrices(symbols);
    return NextResponse.json(prices);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}