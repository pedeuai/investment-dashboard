import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dividends/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch projection' }, { status: 500 });
  }

  const data = await res.json();
  
  const totalMonthly = data.projection.reduce((sum: number, p: any) => sum + p.projectedMonthly, 0);
  const totalAnnual = data.projection.reduce((sum: number, p: any) => sum + p.projectedAnnual, 0);
  const weightedYield = data.projection.reduce((sum: number, p: any) => sum + (p.dividendYield * p.projectedAnnual), 0) / (totalAnnual || 1);

  return NextResponse.json({
    projection: data.projection,
    totals: {
      monthly: totalMonthly,
      annual: totalAnnual,
      weightedYield: Math.round(weightedYield * 10000) / 100,
    },
    updatedAt: data.updatedAt,
  });
}