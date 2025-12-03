'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { apiClient } from '@/lib/api';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InterventionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  interventionId: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function InterventionDetailModal({ 
  isOpen, 
  onClose, 
  interventionId, 
  onEdit, 
  onDelete 
}: InterventionDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Récupérer les détails de l'intervention
  const { data: intervention, isLoading } = useQuery(
    ['intervention', interventionId],
    () => {
      if (!interventionId) throw new Error('Intervention ID requis');
      return apiClient.getIntervention(interventionId);
    },
    {
      enabled: isOpen && !!interventionId,
      onError: (error: any) => {
        console.error('❌ Erreur lors de la récupération de l\'intervention:', error);
        console.error('📋 Intervention ID:', interventionId);
      },
      onSuccess: (data: any) => {
        console.log('✅ Intervention récupérée:', data);
        console.log('📅 scheduledAtUtc:', data?.scheduledAtUtc);
      }
    }
  );

  // Récupérer les rappels associés
  const { data: reminders } = useQuery(
    ['intervention-reminders', interventionId],
    () => apiClient.getReminders({ interventionId }),
    {
      enabled: isOpen && !!interventionId,
    }
  );

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'NORMAL':
        return <Badge variant="default">Normal</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Faible</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-500">Planifiée</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="default" className="bg-purple-500 hover:bg-purple-500">En cours</Badge>;
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-500">Terminée</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getReminderStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-500">Envoyé</Badge>;
      case 'PENDING':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-500">En attente</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Échec</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Annulé</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString || dateString.trim() === '') {
      return 'Date non renseignée';
    }
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return format(date, 'EEEE dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error, dateString);
      return 'Date invalide';
    }
  };

  const formatDateShort = (dateString: string | undefined | null) => {
    if (!dateString || dateString.trim() === '') {
      return 'Date non renseignée';
    }
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return format(date, 'dd/MM/yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error, dateString);
      return 'Date invalide';
    }
  };

  const handleDelete = async () => {
    if (!interventionId) return;
    
    setIsDeleting(true);
    try {
      await apiClient.deleteIntervention(interventionId);
      onDelete?.(interventionId);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (!intervention) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Intervention non trouvée</p>
          </div>
        </ModalContent>
      </Modal>
    );
  }

  // DEBUG: Afficher la structure de l'intervention
  console.log('📋 Intervention dans le modal:', intervention);
  console.log('📅 scheduledAtUtc valeur:', intervention.scheduledAtUtc);
  console.log('📅 scheduledAtUtc type:', typeof intervention.scheduledAtUtc);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {intervention.title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {getPriorityBadge(intervention.priority)}
              {getStatusBadge(intervention.status)}
            </div>
          </div>
        </div>
      </ModalHeader>

      <ModalContent>
        <div className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">
                  {intervention.description || 'Aucune description'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Date et heure</h4>
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {formatDate(intervention.scheduledAtUtc)}
                </div>
              </div>

              {intervention.location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Lieu</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {intervention.location}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Patient</h4>
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="h-4 w-4 mr-2" />
                  {intervention.person?.fullName || 'Non spécifié'}
                </div>
                {intervention.person?.phone && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {intervention.person.phone}
                  </div>
                )}
                {intervention.person?.email && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {intervention.person.email}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Médecin</h4>
                <div className="text-sm text-gray-600">
                  {intervention.doctor?.speciality || 'Non spécifié'}
                </div>
              </div>
            </div>
          </div>

          {/* Rappels */}
          {reminders && reminders.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <BellIcon className="h-4 w-4 mr-2" />
                Rappels ({reminders.length})
              </h4>
              <div className="space-y-2">
                {reminders.map((reminder: any) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {formatDateShort(reminder.plannedSendUtc)}
                        </div>
                        <div className="text-gray-500">
                          Canal: {reminder.type || reminder.channel || 'N/A'}
                        </div>
                      </div>
                    </div>
                    {getReminderStatusBadge(reminder.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes et observations */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {intervention.notes || 'Aucune note'}
              </p>
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <div>
            {intervention.status !== 'CANCELLED' && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            {intervention.status !== 'COMPLETED' && intervention.status !== 'CANCELLED' && (
              <Button onClick={() => onEdit?.(intervention.id)}>
                Modifier
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
