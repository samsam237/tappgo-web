'use client';

import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  HeartIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  medicalHistory: string[];
  lastVisit: string;
  nextAppointment?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'AT_RISK';
  bloodType?: string;
  allergies: string[];
}

interface PatientsGridProps {
  patients: Patient[];
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

export function PatientsGrid({ patients, onView, onEdit, onDelete }: PatientsGridProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Actif</Badge>;
      case 'AT_RISK':
        return <Badge variant="outline">À risque</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactif</Badge>;
      default:
        return null;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth || dateOfBirth.trim() === '') {
      return 'N/A';
    }
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return 'N/A';
      }
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return 'Non renseigné';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <p className="text-lg font-medium">Aucun patient trouvé</p>
          <p className="text-sm mt-1">Commencez par ajouter un nouveau patient</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {patients.map((patient) => (
        <Card key={patient.id} className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
          <CardContent className="p-6 overflow-hidden">
            {/* En-tête du patient */}
            <div className="flex items-start justify-between mb-4 min-w-0">
              <div className="flex items-center min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-lg">
                      {patient.fullName && patient.fullName.trim() 
                        ? patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : '??'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {patient.fullName || 'Nom non renseigné'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {(() => {
                      const age = calculateAge(patient.dateOfBirth);
                      return typeof age === 'number' ? `${age} ans` : age;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                {getStatusBadge(patient.status)}
              </div>
            </div>

            {/* Informations de contact */}
            <div className="space-y-2 mb-4">
              {patient.email && (
                <div className="flex items-center text-sm text-gray-600 min-w-0">
                  <EnvelopeIcon className="flex-shrink-0 mr-2 h-4 w-4" />
                  <span className="truncate min-w-0">{patient.email}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center text-sm text-gray-600 min-w-0">
                  <PhoneIcon className="flex-shrink-0 mr-2 h-4 w-4" />
                  <span className="truncate min-w-0">{patient.phone}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center text-sm text-gray-600 min-w-0">
                  <MapPinIcon className="flex-shrink-0 mr-2 h-4 w-4" />
                  <span className="truncate min-w-0">{patient.address}</span>
                </div>
              )}
            </div>

            {/* Informations médicales */}
            <div className="space-y-2 mb-4">
              {patient.bloodType && (
                <div className="flex items-center text-sm text-gray-600 min-w-0">
                  <HeartIcon className="flex-shrink-0 mr-2 h-4 w-4" />
                  <span className="truncate min-w-0">Groupe sanguin: {patient.bloodType}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600 min-w-0">
                <CalendarIcon className="flex-shrink-0 mr-2 h-4 w-4" />
                <span className="truncate min-w-0">Dernière visite: {formatDate(patient.lastVisit)}</span>
              </div>
              {patient.nextAppointment && (
                <div className="flex items-center text-sm text-blue-600 min-w-0">
                  <CalendarIcon className="flex-shrink-0 mr-2 h-4 w-4" />
                  <span className="truncate min-w-0">Prochain RDV: {formatDate(patient.nextAppointment)}</span>
                </div>
              )}
            </div>

            {/* Antécédents médicaux */}
            {patient.medicalHistory.length > 0 && (
              <div className="mb-4 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 mb-2 truncate">Antécédents</h4>
                <div className="flex flex-wrap gap-1">
                  {patient.medicalHistory.slice(0, 2).map((condition, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 max-w-full">
                      <span className="truncate">{condition}</span>
                    </span>
                  ))}
                  {patient.medicalHistory.length > 2 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{patient.medicalHistory.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Allergies */}
            {patient.allergies.length > 0 && (
              <div className="mb-4 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 mb-2 truncate">Allergies</h4>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.slice(0, 2).map((allergy, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 max-w-full">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{allergy}</span>
                    </span>
                  ))}
                  {patient.allergies.length > 2 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{patient.allergies.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t border-gray-200 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(patient)}
                className="flex-1 min-w-0"
              >
                <EyeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Voir</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(patient)}
                className="flex-1 min-w-0"
              >
                <PencilIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Modifier</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(patient)}
                className="flex-shrink-0"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
