import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dividends/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data.calendar);
}