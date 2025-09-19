import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FinishedGoodsPage as FinishedGoodsComponent } from '@/components/inventory/FinishedGoodsPage';

export default async function FinishedGoodsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <DashboardLayout>
      <FinishedGoodsComponent />
    </DashboardLayout>
  );
}