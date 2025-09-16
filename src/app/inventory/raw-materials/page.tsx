import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RawMaterialsTable } from '@/components/inventory/RawMaterialsTable';

export default async function RawMaterialsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-gray-600">Manage and monitor raw material inventory</p>
        </div>

        {/* Raw Materials Table */}
        <RawMaterialsTable />
      </div>
    </DashboardLayout>
  );
}