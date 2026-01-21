'use client';

import { useState, useEffect } from 'react';
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
import { Intervention } from '@/types';

interface EditInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  interventionId: string | null;
}

export function EditInterventionModal({ isOpen, onClose, interventionId }: EditInterventionModalProps) {
  const [formData, setFormData] = useState<Partial<Intervention>>({
    title: '',
    description: '',
    scheduledAtUtc: '',
    priority: 'NORMAL',
    location: '',
    status: 'PLANNED',
    costType: 'FREE',
    costAmount: undefined,
    reportText: '',
  });

  const [newFiles, setNewFiles] = useState<File[]>([]);

  const queryClient = useQueryClient();

  // Récupérer les détails de l'intervention
  const { data: intervention, isLoading } = useQuery(
    ['intervention', interventionId],
    () => apiClient.getIntervention(interventionId as string),
    {
      enabled: isOpen && !!interventionId,
    }
  );

  // Récupérer la liste des patients
  const { data: patients } = useQuery(
    'patients',
    () => apiClient.getPeople({ limit: 100 }),
    {
      enabled: isOpen,
    }
  );

  // Mutation pour mettre à jour l'intervention
  const updateInterventionMutation = useMutation(
    (data: Partial<Intervention>) => apiClient.updateIntervention(interventionId!, data),
    {
      onSuccess: async () => {
        // Upload des pièces jointes si présentes
        if (interventionId && newFiles.length > 0) {
          try {
            await apiClient.uploadInterventionReportAttachments(interventionId, newFiles);
            setNewFiles([]);
          } catch (e) {
            // Ne bloque pas la mise à jour principale
            toast.error('Mise à jour OK, mais upload des pièces jointes en échec');
          }
        }
        toast.success('Intervention mise à jour avec succès');
        queryClient.invalidateQueries('interventions');
        queryClient.invalidateQueries('upcoming-interventions');
        queryClient.invalidateQueries(['intervention', interventionId]);
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'intervention');
      },
    }
  );

  // Initialiser le formulaire avec les données de l'intervention
  useEffect(() => {
    if (intervention) {
      setFormData({
        title: intervention.title,
        description: intervention.description,
        scheduledAtUtc: intervention.scheduledAtUtc,
        priority: intervention.priority,
        location: intervention.location,
        status: intervention.status,
        costType: (intervention as any).costType || 'FREE',
        costAmount: (intervention as any).costAmount || undefined,
        reportText: (intervention as any).reportText || '',
      });
    }
  }, [intervention]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.scheduledAtUtc) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if ((formData as any).costType === 'PAID' && (!(formData as any).costAmount || Number((formData as any).costAmount) <= 0)) {
      toast.error('Veuillez renseigner un montant > 0 pour une intervention payante');
      return;
    }

    updateInterventionMutation.mutate({
      ...formData,
      costAmount: (formData as any).costType === 'PAID' ? Number((formData as any).costAmount) : null,
    } as any);
  };

  const patientOptions = patients?.data?.map((patient: any) => ({
    value: patient.id,
    label: patient.fullName,
  })) || [];

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Modifier l'intervention">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalContent>
          <div className="grid grid-cols-1 gap-5">
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
              <Label htmlFor="scheduledAtUtc" required>Date et heure</Label>
              <DateTimePicker
                id="scheduledAtUtc"
                value={formData.scheduledAtUtc}
                onChange={(value) => setFormData(prev => ({ ...prev, scheduledAtUtc: value }))}
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
                  { value: 'LOW', label: 'Faible' },
                  { value: 'NORMAL', label: 'Normale' },
                  { value: 'URGENT', label: 'Urgente' },
                ]}
              />
            </div>

            {/* Statut */}
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                id="status"
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED' }))}
                options={[
                  { value: 'PLANNED', label: 'Prévue' },
                  { value: 'DONE', label: 'Effectuée' },
                  { value: 'CANCELED', label: 'Annulée' },
                ]}
              />
            </div>

            {/* Coût */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costType">Coût</Label>
                <Select
                  id="costType"
                  value={(formData as any).costType}
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
                  value={(formData as any).costAmount as any}
                  onChange={(e) => setFormData(prev => ({ ...prev, costAmount: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Ex: 5000"
                  disabled={(formData as any).costType !== 'PAID'}
                />
              </div>
            </div>

            {/* Rapport */}
            <div>
              <Label htmlFor="reportText">Rapport d’intervention</Label>
              <Textarea
                id="reportText"
                value={((formData as any).reportText as any) || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reportText: e.target.value }))}
                placeholder="Compte rendu..."
                rows={4}
              />
            </div>

            {/* Pièces jointes */}
            <div>
              <Label htmlFor="reportFiles">Pièces jointes (photo ordonnance / rapport)</Label>
              <Input
                id="reportFiles"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setNewFiles(files);
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Les fichiers seront uploadés après la mise à jour.
              </p>
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
            disabled={updateInterventionMutation.isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={updateInterventionMutation.isLoading}
          >
            {updateInterventionMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Mise à jour...
              </>
            ) : (
              'Mettre à jour'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
