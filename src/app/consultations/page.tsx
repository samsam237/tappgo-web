import { requireAuth } from '@/lib/auth-server';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ConsultationsOverview } from '@/components/consultations/consultations-overview';

export default async function ConsultationsPage() {
  await requireAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gérez vos consultations médicales et leur historique
          </p>
        </div>
        
        <ConsultationsOverview />
      </div>
    </DashboardLayout>
  );
}
