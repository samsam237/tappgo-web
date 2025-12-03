'use client';

import { useState } from 'react';
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

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReminderFormData {
  title: string;
  description: string;
  scheduledAt: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  patientId: string;
  interventionId: string;
  template: string;
  recipient: {
    email?: string;
    phone?: string;
  };
}

export function CreateReminderModal({ isOpen, onClose }: CreateReminderModalProps) {
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    scheduledAt: '',
    type: 'EMAIL',
    priority: 'NORMAL',
    patientId: '',
    interventionId: '',
    template: '',
    recipient: {
      email: '',
      phone: ''
    }
  });

  const queryClient = useQueryClient();

  // Récupérer la liste des patients
  const { data: patients } = useQuery(
    'patients',
    () => apiClient.getPeople({ limit: 100 }),
    {
      enabled: isOpen,
    }
  );

  // Récupérer la liste des interventions
  const { data: interventions, isLoading: isLoadingInterventions, error: interventionsError } = useQuery(
    'interventions',
    () => apiClient.getInterventions({ limit: 100 }),
    {
      enabled: isOpen,
      onSuccess: (data) => {
        console.log('📥 Données interventions reçues:', data);
        console.log('📥 Type de données:', typeof data);
        console.log('📥 Est un tableau?', Array.isArray(data));
        if (!Array.isArray(data) && data?.data) {
          console.log('📥 Données dans data.data:', data.data);
        }
      },
      onError: (error) => {
        console.error('❌ Erreur lors du chargement des interventions:', error);
      },
    }
  );

  // Mutation pour créer le rappel
  const createReminderMutation = useMutation(
    (data: ReminderFormData) => {
      const recipient = data.type === 'EMAIL' ? data.recipient.email : data.recipient.phone;
      
      if (!recipient || recipient.trim() === '') {
        throw new Error(`Le ${data.type === 'EMAIL' ? 'email' : 'téléphone'} du destinataire est obligatoire`);
      }
      
      if (!data.description || data.description.trim() === '') {
        throw new Error('Le message est obligatoire');
      }
      
      if (!data.scheduledAt || data.scheduledAt.trim() === '') {
        throw new Error('La date et heure programmées sont obligatoires');
      }
      
      // Convertir le format datetime-local (YYYY-MM-DDTHH:mm) en format ISO 8601 complet
      let scheduledAtFormatted = data.scheduledAt.trim();
      // Le DateTimePicker retourne un format "YYYY-MM-DDTHH:mm" (sans secondes ni timezone)
      // Le backend attend un format ISO 8601 complet avec timezone
      if (scheduledAtFormatted.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        // Format datetime-local, ajouter les secondes et le timezone
        // On utilise le timezone local du navigateur
        const date = new Date(scheduledAtFormatted);
        scheduledAtFormatted = date.toISOString();
        console.log('📅 scheduledAt converti de "datetime-local" vers ISO 8601:', scheduledAtFormatted);
      } else if (!scheduledAtFormatted.includes('T') || !scheduledAtFormatted.includes('Z') && !scheduledAtFormatted.match(/[+-]\d{2}:\d{2}$/)) {
        // Si ce n'est pas déjà au format ISO 8601 complet, essayer de le convertir
        const date = new Date(scheduledAtFormatted);
        if (!isNaN(date.getTime())) {
          scheduledAtFormatted = date.toISOString();
        }
      }
      
      if (!data.interventionId || data.interventionId.trim() === '') {
        throw new Error('L\'intervention est obligatoire');
      }
      
      const reminderData: any = {
        interventionId: data.interventionId.trim(),
        type: data.type,
        scheduledAt: scheduledAtFormatted,
        message: data.description.trim(),
        recipient: recipient.trim(),
      };
      
      // DEBUG: Afficher les données qui seront envoyées
      console.log('📤 Données du rappel à envoyer:', reminderData);
      
      return apiClient.createReminder(reminderData);
    },
    {
      onSuccess: () => {
        toast.success('Rappel créé avec succès');
        queryClient.invalidateQueries('reminders');
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          scheduledAt: '',
          type: 'EMAIL',
          priority: 'NORMAL',
          patientId: '',
          interventionId: '',
          template: '',
          recipient: {
            email: '',
            phone: ''
          }
        });
      },
      onError: (error: any) => {
        console.error('❌ Erreur lors de la création du rappel:', error);
        console.error('❌ Response data:', error.response?.data);
        console.error('❌ Response status:', error.response?.status);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Erreur lors de la création du rappel';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs obligatoires
    if (!formData.title || formData.title.trim() === '') {
      toast.error('Le titre du rappel est obligatoire');
      return;
    }
    
    if (!formData.scheduledAt || formData.scheduledAt.trim() === '') {
      toast.error('La date et heure programmées sont obligatoires');
      return;
    }
    
    if (!formData.description || formData.description.trim() === '') {
      toast.error('Le message est obligatoire');
      return;
    }
    
    const recipient = formData.type === 'EMAIL' ? formData.recipient.email : formData.recipient.phone;
    if (!recipient || recipient.trim() === '') {
      toast.error(`Le ${formData.type === 'EMAIL' ? 'email' : 'téléphone'} du destinataire est obligatoire`);
      return;
    }
    
    if (!formData.interventionId || formData.interventionId.trim() === '') {
      toast.error('L\'intervention est obligatoire');
      return;
    }

    createReminderMutation.mutate(formData);
  };

  // Gérer les deux formats possibles : tableau direct ou objet avec propriété data
  const patientsArray = Array.isArray(patients) 
    ? patients 
    : (patients?.data || []);
  
  const patientOptions = patientsArray.map((patient: any) => ({
    value: patient.id,
    label: patient.fullName,
  }));

  // Gérer les deux formats possibles : tableau direct ou objet avec propriété data
  const interventionsArray = Array.isArray(interventions) 
    ? interventions 
    : (interventions?.data || []);
  
  console.log('📋 Interventions array pour options:', interventionsArray);
  console.log('📋 Nombre d\'interventions:', interventionsArray.length);
  
  const interventionOptions = interventionsArray.map((intervention: any) => ({
    value: intervention.id,
    label: intervention.title || `Intervention ${intervention.id}`,
  }));
  
  console.log('📋 Options d\'interventions générées:', interventionOptions);

  const getTemplatePlaceholder = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'Bonjour {patientName},\n\nCeci est un rappel pour votre {interventionTitle} prévu le {date}.\n\nCordialement,\nL\'équipe médicale';
      case 'SMS':
        return 'Rappel: {interventionTitle} le {date}. Patient: {patientName}';
      case 'PUSH':
        return 'Rappel: {interventionTitle} prévu le {date}';
      default:
        return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Créer un nouveau rappel">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalContent>
          <div className="grid grid-cols-1 gap-5">
            {/* Titre */}
            <div>
              <Label htmlFor="title" required>Titre du rappel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Rappel consultation - Marie Nguema"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" required>Message</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Message du rappel..."
                rows={3}
                required
              />
            </div>

            {/* Date et heure */}
            <div>
              <Label htmlFor="scheduledAt" required>Date et heure programmées</Label>
              <DateTimePicker
                id="scheduledAt"
                value={formData.scheduledAt}
                onChange={(value) => setFormData(prev => ({ ...prev, scheduledAt: value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Type et priorité */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" required>Type de rappel</Label>
                <Select
                  id="type"
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'EMAIL' | 'SMS' | 'PUSH' }))}
                  options={[
                    { value: 'EMAIL', label: 'Email' },
                    { value: 'SMS', label: 'SMS' },
                    { value: 'PUSH', label: 'Notification Push' },
                  ]}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  id="priority"
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'LOW' | 'NORMAL' | 'HIGH' }))}
                  options={[
                    { value: 'LOW', label: 'Faible' },
                    { value: 'NORMAL', label: 'Normale' },
                    { value: 'HIGH', label: 'Élevée' },
                  ]}
                />
              </div>
            </div>

            {/* Patient et intervention */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientId" required>Patient</Label>
                <Select
                  id="patientId"
                  value={formData.patientId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
                  options={patientOptions}
                />
              </div>
              <div>
                <Label htmlFor="interventionId" required>Intervention</Label>
                {isLoadingInterventions ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <LoadingSpinner size="sm" />
                    <span>Chargement des interventions...</span>
                  </div>
                ) : interventionsError ? (
                  <div className="text-sm text-red-500">
                    Erreur lors du chargement des interventions. Veuillez réessayer.
                  </div>
                ) : interventionOptions.length === 0 ? (
                  <div className="text-sm text-yellow-600">
                    Aucune intervention disponible. Veuillez créer une intervention d'abord.
                  </div>
                ) : (
                  <Select
                    id="interventionId"
                    value={formData.interventionId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, interventionId: value }))}
                    options={interventionOptions}
                  />
                )}
              </div>
            </div>

            {/* Informations de contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" required={formData.type === 'EMAIL'}>
                  Email du destinataire {formData.type === 'EMAIL' && '(requis)'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.recipient.email}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recipient: { ...prev.recipient, email: e.target.value }
                  }))}
                  placeholder="email@example.com"
                  required={formData.type === 'EMAIL'}
                />
              </div>
              <div>
                <Label htmlFor="phone" required={formData.type === 'SMS'}>
                  Téléphone du destinataire {(formData.type === 'SMS' || formData.type === 'PUSH') && '(requis)'}
                </Label>
                <Input
                  id="phone"
                  value={formData.recipient.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recipient: { ...prev.recipient, phone: e.target.value }
                  }))}
                  placeholder="+237 6 12 34 56 78"
                  required={formData.type === 'SMS' || formData.type === 'PUSH'}
                />
              </div>
            </div>

            {/* Template du message */}
            <div>
              <Label htmlFor="template">Template du message</Label>
              <Textarea
                id="template"
                value={formData.template}
                onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                placeholder={getTemplatePlaceholder(formData.type)}
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                Variables disponibles: {'{patientName}'}, {'{interventionTitle}'}, {'{date}'}
              </p>
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createReminderMutation.isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={createReminderMutation.isLoading}
          >
            {createReminderMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Création...
              </>
            ) : (
              'Créer le rappel'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
