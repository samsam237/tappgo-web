'use client';

import { useQuery } from 'react-query';
import { apiClient } from '@/lib/api';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConsultationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string | null;
}

export function ConsultationDetailModal({ isOpen, onClose, consultationId }: ConsultationDetailModalProps) {
  const { data: consultation, isLoading } = useQuery(
    ['consultation', consultationId],
    () => apiClient.getConsultation(consultationId!),
    {
      enabled: isOpen && !!consultationId,
    },
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-500">Effectuée</Badge>;
      case 'SCHEDULED':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-500">Prévue</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    try {
      return format(parseISO(dateString), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500" />
              Détail consultation
            </h3>
            {consultation?.status && (
              <div className="mt-2">{getStatusBadge(consultation.status)}</div>
            )}
          </div>
        </div>
      </ModalHeader>

      <ModalContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : !consultation ? (
          <div className="text-center py-12 text-gray-500">Consultation introuvable</div>
        ) : (
          <div className="space-y-6">
            {/* Patient */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Patient</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {consultation.person?.fullName || 'Non renseigné'}
                  </span>
                  {consultation.person?.tappNumber && (
                    <span className="text-xs text-gray-500">
                      (TAPP: {consultation.person.tappNumber})
                    </span>
                  )}
                </div>
                {consultation.person?.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span>{consultation.person.phone}</span>
                  </div>
                )}
                {consultation.person?.email && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <span>{consultation.person.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Date/Heure */}
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Date et heure</div>
                <div className="text-sm text-gray-600">{formatDate(consultation.dateTimeUtc)}</div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Notes</div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {consultation.notes || '—'}
              </div>
            </div>

            {/* Pièces jointes */}
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Pièces jointes</div>
              {Array.isArray(consultation.attachments) && consultation.attachments.length > 0 ? (
                <div className="space-y-1">
                  {consultation.attachments.map((url: string) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
                    >
                      <PaperClipIcon className="h-4 w-4" />
                      {url}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">—</div>
              )}
            </div>
          </div>
        )}
      </ModalContent>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      </ModalFooter>
    </Modal>
  );
}

