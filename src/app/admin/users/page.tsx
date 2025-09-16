import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default async function UsersManagementPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user roles and area assignments</p>
          </div>

          {/* User Management Table */}
          <UserManagementTable />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}