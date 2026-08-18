import { NextRequest, NextResponse } from 'next/server';
import { DividendHistoryEntry, DividendType } from '@/types';

const STORAGE_KEY = 'dividend-history';

function getHistory(): DividendHistoryEntry[] {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

function saveHistory(history: DividendHistoryEntry[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
}

export async function GET() {
  const history = getHistory();
  return NextResponse.json(history.sort((a, b) => b.date.localeCompare(a.date)));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, name, date, amount, total, type, notes } = body;

    if (!symbol || !name || !date || !amount || !total || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const history = getHistory();
    const newEntry: DividendHistoryEntry = {
      id: crypto.randomUUID(),
      symbol,
      name,
      date,
      amount: Number(amount),
      total: Number(total),
      type: type as DividendType,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    history.unshift(newEntry);
    saveHistory(history);

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error adding dividend history:', error);
    return NextResponse.json({ error: 'Failed to add entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const history = getHistory();
    const filtered = history.filter(h => h.id !== id);
    saveHistory(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dividend history:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}