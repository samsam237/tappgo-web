'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '@/lib/api';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-picker';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from 'react-hot-toast';
import { CreateInterventionRequest } from '@/types';
import { useFormDraft } from '@/hooks/use-form-draft';

interface CreateInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInterventionModal({ isOpen, onClose }: CreateInterventionModalProps) {
  const [formData, setFormData] = useState<Partial<CreateInterventionRequest>>({
    title: '',
    interventionTypeId: '',
    description: '',
    costType: 'FREE',
    costAmount: undefined,
    scheduledAt: '',
    priority: 'NORMAL',
    location: '',
  });

  useFormDraft('draft_create_intervention_v1', formData, setFormData, isOpen);

  const queryClient = useQueryClient();

  // Récupérer la liste des patients
  const { data: patients, isLoading: loadingPatients } = useQuery(
    'patients',
    () => apiClient.getPeople({ limit: 100 }),
    {
      enabled: isOpen,
    }
  );

  // Récupérer le profil du médecin
  const { data: profile } = useQuery(
    'profile',
    () => apiClient.getProfile(),
    {
      enabled: isOpen,
    }
  );

  // Récupérer la nomenclature des types d'intervention (globale + médecin)
  const doctorId = profile?.doctor?.id;
  const { data: interventionTypes, isLoading: loadingTypes } = useQuery(
    ['intervention-types', doctorId],
    () => apiClient.getInterventionTypes({ doctorId }),
    {
      enabled: isOpen,
    }
  );

  const createTypeMutation = useMutation(
    (name: string) => apiClient.createInterventionType({ name, doctorId }),
    {
      onSuccess: (created: any) => {
        toast.success('Type d’intervention ajouté');
        queryClient.invalidateQueries(['intervention-types', doctorId]);
        setFormData(prev => ({
          ...prev,
          interventionTypeId: created.id,
          title: created.name,
        }));
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création du type');
      },
    }
  );

  // Mutation pour créer l'intervention
  const createInterventionMutation = useMutation(
    (data: CreateInterventionRequest) => apiClient.createIntervention(data),
    {
      onSuccess: () => {
        toast.success('Intervention créée avec succès');
        queryClient.invalidateQueries('upcoming-interventions');
        queryClient.invalidateQueries('interventions');
        onClose();
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création de l\'intervention');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      title: '',
      interventionTypeId: '',
      description: '',
      costType: 'FREE',
      costAmount: undefined,
      scheduledAt: '',
      priority: 'NORMAL',
      location: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.personId || !formData.title || !formData.scheduledAt) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!profile?.doctor?.id) {
      toast.error('Profil médecin non trouvé');
      return;
    }

    if (formData.costType === 'PAID' && (!formData.costAmount || formData.costAmount <= 0)) {
      toast.error('Veuillez renseigner un montant > 0 pour une intervention payante');
      return;
    }

    createInterventionMutation.mutate({
      personId: formData.personId,
      doctorId: profile.doctor.id,
      title: formData.title,
      interventionTypeId: formData.interventionTypeId || undefined,
      description: formData.description,
      costType: formData.costType as any,
      costAmount: formData.costType === 'PAID' ? Number(formData.costAmount) : undefined,
      scheduledAt: formData.scheduledAt,
      priority: formData.priority as 'NORMAL' | 'URGENT',
      location: formData.location,
    });
  };

  const patientOptions = patients?.data?.map((patient: any) => ({
    value: patient.id,
    label: patient.tappNumber ? `${patient.fullName} (TAPP: ${patient.tappNumber})` : patient.fullName,
  })) || [];

  const typeOptions = (interventionTypes || []).map((t: any) => ({
    value: t.id,
    label: t.createdByDoctorId ? `${t.name} (perso)` : t.name,
  }));

  const selectedTypeLabel = useMemo(() => {
    const found = (interventionTypes || []).find((t: any) => t.id === formData.interventionTypeId);
    return found?.name || '';
  }, [interventionTypes, formData.interventionTypeId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Nouvelle intervention">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalContent>
          <div className="grid grid-cols-1 gap-5">
            {/* Patient */}
            <div>
              <Label htmlFor="patient" required>Patient</Label>
              <Select
                id="patient"
                value={formData.personId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, personId: value }))}
                placeholder="Sélectionner un patient"
                options={patientOptions}
                disabled={loadingPatients}
              />
              {loadingPatients && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Chargement des patients...
                </div>
              )}
            </div>

            {/* Type (nomenclature) */}
            <div>
              <Label htmlFor="interventionType">Type d’intervention</Label>
              <Select
                id="interventionType"
                value={formData.interventionTypeId}
                onValueChange={(value) => {
                  const found = (interventionTypes || []).find((t: any) => t.id === value);
                  setFormData(prev => ({
                    ...prev,
                    interventionTypeId: value,
                    title: found?.name || prev.title,
                  }));
                }}
                placeholder={loadingTypes ? 'Chargement...' : 'Choisir un type'}
                options={typeOptions}
                disabled={loadingTypes}
              />
              <div className="mt-2 flex gap-2">
                <Input
                  id="newType"
                  placeholder="Ajouter un nouveau type (Dr)"
                  defaultValue=""
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = (e.currentTarget as any).value?.trim();
                      if (value) createTypeMutation.mutate(value);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const el = document.getElementById('newType') as HTMLInputElement | null;
                    const value = el?.value?.trim();
                    if (value) createTypeMutation.mutate(value);
                  }}
                  disabled={createTypeMutation.isLoading}
                >
                  Ajouter
                </Button>
              </div>
              {selectedTypeLabel && (
                <p className="mt-1 text-xs text-gray-500">
                  Le titre sera pré-rempli à partir du type sélectionné (modifiable).
                </p>
              )}
            </div>

            {/* Titre */}
            <div>
              <Label htmlFor="title" required>Titre de l'intervention</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Visite à domicile - Suivi diabète"
                required
              />
            </div>

            {/* Coût */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costType">Coût</Label>
                <Select
                  id="costType"
                  value={formData.costType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, costType: value as any }))}
                  options={[
                    { value: 'FREE', label: 'Gratuite' },
                    { value: 'PAID', label: 'Payante' },
                  ]}
                />
              </div>
              <div>
                <Label htmlFor="costAmount">Montant (si payante)</Label>
                <Input
                  id="costAmount"
                  type="number"
                  value={formData.costAmount as any}
                  onChange={(e) => setFormData(prev => ({ ...prev, costAmount: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Ex: 5000"
                  disabled={formData.costType !== 'PAID'}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Détails de l'intervention..."
                rows={3}
              />
            </div>

            {/* Date et heure */}
            <div>
              <Label htmlFor="scheduledAt" required>Date et heure</Label>
              <DateTimePicker
                id="scheduledAt"
                value={formData.scheduledAt}
                onChange={(value) => setFormData(prev => ({ ...prev, scheduledAt: value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Priorité */}
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                id="priority"
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'NORMAL' | 'URGENT' }))}
                options={[
                  { value: 'NORMAL', label: 'Normale' },
                  { value: 'URGENT', label: 'Urgente' },
                ]}
              />
            </div>

            {/* Lieu */}
            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Hôpital Central de Douala"
              />
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createInterventionMutation.isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={createInterventionMutation.isLoading}
          >
            {createInterventionMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Création...
              </>
            ) : (
              'Créer l\'intervention'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
