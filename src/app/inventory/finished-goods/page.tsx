import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FinishedGoodsTable } from '@/components/inventory/FinishedGoodsTable';

export default async function FinishedGoodsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finished Goods</h1>
          <p className="text-gray-600">Manage and monitor finished goods inventory</p>
        </div>

        {/* Finished Goods Table */}
        <FinishedGoodsTable />
      </div>
    </DashboardLayout>
  );
}