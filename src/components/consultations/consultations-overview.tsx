'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { 
  DocumentTextIcon, 
  PlusIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { SearchFilter } from '@/components/ui/search-filter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Consultation } from '@/types';
import { ConsultationDetailModal } from '@/components/modals/consultation-detail-modal';

interface ApiConsultation {
  id: string;
  personId: string;
  doctorId: string;
  dateTimeUtc: string;
  notes?: string;
  attachments?: string[];
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  person?: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
    tappNumber?: string;
  };
  doctor?: {
    id: string;
    speciality?: string;
    user?: {
      email: string;
    };
  };
}

const mapApiConsultationToConsultation = (api: ApiConsultation): Consultation => {
  return {
    id: api.id,
    personId: api.personId,
    doctorId: api.doctorId,
    dateTimeUtc: api.dateTimeUtc,
    notes: api.notes,
    attachments: api.attachments,
    status: api.status,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    person: api.person,
    doctor: api.doctor,
  };
};

export function ConsultationsOverview() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);

  const { data: profile } = useQuery('profile', () => apiClient.getProfile());

  const { data: consultationsData, isLoading, refetch } = useQuery(
    ['consultations', filterStatus, profile?.doctor?.id],
    () => {
      const params: any = {};
      if (profile?.doctor?.id) {
        params.doctorId = profile.doctor.id;
      }
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      return apiClient.getConsultations(params);
    },
    {
      enabled: !!profile?.doctor?.id,
    }
  );

  const consultations: Consultation[] = Array.isArray(consultationsData)
    ? consultationsData.map(mapApiConsultationToConsultation)
    : (consultationsData?.data || []).map(mapApiConsultationToConsultation);

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      !searchTerm ||
      consultation.person?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Actions et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <SearchFilter
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par patient ou notes..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="COMPLETED">Effectuées</option>
            <option value="SCHEDULED">Prévues</option>
            <option value="CANCELLED">Annulées</option>
          </select>
          <Button onClick={() => router.push('/consultations/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle consultation
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{consultations.length}</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Effectuées</p>
                <p className="text-2xl font-bold text-green-600">
                  {consultations.filter((c) => c.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prévues</p>
                <p className="text-2xl font-bold text-blue-600">
                  {consultations.filter((c) => c.status === 'SCHEDULED').length}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des consultations */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des consultations</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune consultation</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Aucune consultation ne correspond à vos critères.'
                  : 'Commencez par créer une nouvelle consultation.'}
              </p>
              {!searchTerm && filterStatus === 'ALL' && (
                <div className="mt-6">
                  <Button onClick={() => router.push('/consultations/new')}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nouvelle consultation
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date et heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConsultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {consultation.person?.fullName || 'Non renseigné'}
                            </div>
                            {consultation.person?.tappNumber && (
                              <div className="text-xs text-gray-500">
                                TAPP: {consultation.person.tappNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(consultation.dateTimeUtc)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(consultation.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {consultation.notes || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedConsultation(consultation.id)}
                          className="ml-auto"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Modal détail consultation */}
    <ConsultationDetailModal
      isOpen={!!selectedConsultation}
      consultationId={selectedConsultation}
      onClose={() => setSelectedConsultation(null)}
    />
    </>
  );
}
