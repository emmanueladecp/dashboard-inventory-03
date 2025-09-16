import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AreaManagementTable } from '@/components/admin/AreaManagementTable';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default async function AreaManagementPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Area Management</h1>
            <p className="text-gray-600">Manage areas and their configurations</p>
          </div>

          {/* Area Management Table */}
          <AreaManagementTable />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}