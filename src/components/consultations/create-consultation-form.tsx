'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-picker';
import { toast } from 'react-hot-toast';
import { useFormDraft } from '@/hooks/use-form-draft';

export function CreateConsultationForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    personId: string;
    dateTime: string;
    notes: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  }>({
    personId: '',
    dateTime: '',
    notes: '',
    status: 'COMPLETED',
  });

  useFormDraft('draft_create_consultation_v1', formData, setFormData, true);

  const { data: profile } = useQuery('profile', () => apiClient.getProfile());
  const { data: patients, isLoading: loadingPatients } = useQuery(
    'patients',
    () => apiClient.getPeople({ limit: 200 }),
  );

  const createMutation = useMutation(
    async () => {
      const doctorId = profile?.doctor?.id;
      if (!doctorId) throw new Error('Profil médecin non trouvé');
      if (!formData.personId) throw new Error('Patient obligatoire');
      if (!formData.dateTime) throw new Error('Date/heure obligatoire');

      return apiClient.createConsultation({
        personId: formData.personId,
        doctorId,
        dateTime: formData.dateTime,
        notes: formData.notes || undefined,
        status: formData.status,
      });
    },
    {
      onSuccess: () => {
        toast.success('Consultation enregistrée');
        queryClient.invalidateQueries('patients');
        queryClient.invalidateQueries('consultations');
        setFormData({ personId: '', dateTime: '', notes: '', status: 'COMPLETED' });
      },
      onError: (e: any) => {
        toast.error(e?.response?.data?.message || e?.message || 'Erreur lors de l’enregistrement');
      },
    },
  );

  const patientsArray = Array.isArray(patients) ? patients : (patients?.data || []);
  const patientOptions = patientsArray.map((p: any) => ({
    value: p.id,
    label: p.tappNumber ? `${p.fullName} (TAPP: ${p.tappNumber})` : p.fullName,
  }));

  return (
    <div className="card p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patient" required>Patient</Label>
          <Select
            id="patient"
            value={formData.personId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, personId: value }))}
            placeholder={loadingPatients ? 'Chargement...' : 'Sélectionner un patient'}
            options={patientOptions}
            disabled={loadingPatients}
          />
        </div>
        <div>
          <Label htmlFor="dateTime" required>Date et heure</Label>
          <DateTimePicker
            id="dateTime"
            value={formData.dateTime}
            onChange={(value) => setFormData(prev => ({ ...prev, dateTime: value }))}
            max={undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Statut</Label>
          <Select
            id="status"
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            options={[
              { value: 'COMPLETED', label: 'Effectuée' },
              { value: 'SCHEDULED', label: 'Prévue' },
              { value: 'CANCELLED', label: 'Annulée' },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="attachments">Pièces jointes</Label>
          <Input id="attachments" disabled value="(optionnel) non géré dans l’UI pour l’instant" />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Compte rendu, observations, prescription..."
          rows={5}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isLoading}>
          {createMutation.isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}

