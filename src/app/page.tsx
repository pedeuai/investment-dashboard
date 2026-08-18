'use client';

import { PortfolioProvider } from '@/context/PortfolioContext';
import { Header } from '@/components/layout/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { AllocationCharts } from '@/components/dashboard/AllocationCharts';
import { PositionsTable } from '@/components/dashboard/PositionsTable';
import { DividendTabs } from '@/components/dashboard/DividendTabs';

export default function Dashboard() {
  return (
    <PortfolioProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <SummaryCards />
            <AllocationCharts />
            <PositionsTable />
            <DividendTabs />
          </div>
        </main>
      </div>
    </PortfolioProvider>
  );
}