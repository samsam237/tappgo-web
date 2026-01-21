import { requireAuth } from '@/lib/auth-server';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CreateConsultationForm } from '@/components/consultations/create-consultation-form';

export default async function NewConsultationPage() {
  await requireAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle consultation</h1>
          <p className="mt-1 text-sm text-gray-600">
            Enregistrer une consultation pour un patient
          </p>
        </div>
        <CreateConsultationForm />
      </div>
    </DashboardLayout>
  );
}

