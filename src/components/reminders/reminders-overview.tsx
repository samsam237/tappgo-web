'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  BellIcon, 
  PlusIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ChartBarIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFilter } from '@/components/ui/search-filter';
import { LoadingSpinner } from '@/components/ui/loading';
import { RemindersTable } from './reminders-table';
import { RemindersGrid } from './reminders-grid';
import { RemindersStats } from './reminders-stats';
import { CreateReminderModal } from '@/components/modals/create-reminder-modal';
import { ReminderDetailModal } from '@/components/modals/reminder-detail-modal';
import { EditReminderModal } from '@/components/modals/edit-reminder-modal';

interface Reminder {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  patientName: string;
  interventionTitle: string;
  createdAt: string;
  sentAt?: string;
  deliveryStatus?: string;
}

// Interface pour mapper les données de l'API vers l'interface Reminder
interface ApiReminder {
  id: string;
  interventionId: string;
  type: string;
  plannedSendUtc: string;
  message?: string;
  recipient?: string;
  status: string;
  lastError?: string;
  idempotencyKey: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  intervention?: {
    id: string;
    title: string;
    person?: {
      firstName: string;
      lastName: string;
    };
  };
}

// Fonction pour mapper les données de l'API vers l'interface Reminder
const mapApiReminderToReminder = (apiReminder: any): Reminder => {
  console.log('🔍 Structure complète du rappel API:', JSON.stringify(apiReminder, null, 2));
  
  // Gérer différents formats pour le nom du patient
  let patientName = 'Patient inconnu';
  
  // Vérifier si l'intervention est incluse
  if (apiReminder.intervention) {
    console.log('✅ Intervention incluse:', apiReminder.intervention);
    
    // Vérifier si la personne est incluse dans l'intervention
    if (apiReminder.intervention.person) {
      const person = apiReminder.intervention.person;
      console.log('✅ Person incluse dans intervention:', person);
      
      if (person.fullName) {
        patientName = person.fullName;
      } else if (person.firstName && person.lastName) {
        patientName = `${person.firstName} ${person.lastName}`;
      } else if (person.firstName) {
        patientName = person.firstName;
      } else if (person.lastName) {
        patientName = person.lastName;
      }
    } else if (apiReminder.intervention.personId) {
      // Si on a seulement l'ID, on ne peut pas récupérer le nom sans requête supplémentaire
      console.log('⚠️ Seulement personId disponible:', apiReminder.intervention.personId);
      patientName = `Patient ${apiReminder.intervention.personId}`;
    }
  } else if (apiReminder.interventionId) {
    // Si l'intervention n'est pas incluse, on a seulement l'ID
    console.log('⚠️ Intervention non incluse, seulement interventionId:', apiReminder.interventionId);
    patientName = 'Patient inconnu (intervention non chargée)';
  }
  
  // Gérer le titre de l'intervention
  const interventionTitle = apiReminder.intervention?.title 
    || apiReminder.intervention?.name 
    || (apiReminder.interventionId ? `Intervention ${apiReminder.interventionId}` : 'Intervention inconnue');
  
  // Gérer le message/description
  const description = apiReminder.message 
    || apiReminder.description 
    || `Rappel ${(apiReminder.type || 'UNKNOWN').toLowerCase()} pour ${interventionTitle}`;
  
  // Gérer la date programmée
  const scheduledAt = apiReminder.plannedSendUtc 
    || apiReminder.scheduledAt 
    || apiReminder.plannedSendAt 
    || apiReminder.createdAt 
    || new Date().toISOString();
  
  // Gérer le type
  const type = (apiReminder.type || 'EMAIL') as 'EMAIL' | 'SMS' | 'PUSH';
  
  // Gérer le statut
  const status = (apiReminder.status || 'PENDING') as 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  
  // Gérer la date de création
  const createdAt = apiReminder.createdAt || new Date().toISOString();
  
  // Gérer la date d'envoi
  const sentAt = apiReminder.sentAt || undefined;
  
  // Créer le titre
  const title = `${type} - ${patientName}`;
  
  return {
    id: apiReminder.id || `reminder_${Date.now()}`,
    title,
    description,
    scheduledAt,
    type,
    status,
    priority: 'NORMAL', // Pas de priorité dans l'API, on met NORMAL par défaut
    patientName,
    interventionTitle,
    createdAt,
    sentAt,
    deliveryStatus: status === 'SENT' ? 'Delivered' : 
                   status === 'FAILED' ? `Failed - ${apiReminder.lastError || 'Unknown error'}` : 
                   undefined
  };
};

export function RemindersOverview() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'export'>('overview');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);

  // Utilisation de React Query pour charger les rappels
  const { data: remindersData, isLoading, error, refetch } = useQuery(
    'reminders',
    () => apiClient.getReminders(),
    {
      onSuccess: (data) => {
        console.log('📥 Données rappels reçues de l\'API:', data);
        console.log('📥 Type de données:', typeof data);
        console.log('📥 Est un tableau?', Array.isArray(data));
        
        // Gérer les deux formats possibles : tableau direct ou objet avec propriété data
        const remindersArray = Array.isArray(data) 
          ? data 
          : (data?.data || []);
        
        console.log('📋 Tableau de rappels:', remindersArray);
        console.log('📋 Nombre de rappels:', remindersArray.length);
        
        if (remindersArray.length > 0) {
          console.log('📋 Premier rappel (exemple):', remindersArray[0]);
        }
        
        const mappedReminders = remindersArray.map((reminder: any, index: number) => {
          console.log(`🔄 Mapping rappel ${index + 1}:`, reminder);
          return mapApiReminderToReminder(reminder);
        });
        
        console.log('✅ Rappels mappés:', mappedReminders);
        setReminders(mappedReminders);
        setLoading(false);
      },
      onError: (error) => {
        console.error('❌ Erreur lors du chargement des rappels:', error);
        toast.error('Erreur lors du chargement des rappels');
        setLoading(false);
      }
    }
  );

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reminder.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reminder.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || reminder.status === filterStatus;
    const matchesType = filterType === 'ALL' || reminder.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const totalItems = filteredReminders.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReminders = filteredReminders.slice(startIndex, endIndex);

  // Handlers
  const handleViewReminder = (id: string) => {
    setSelectedReminderId(id);
    setShowDetailModal(true);
  };

  const handleEditReminder = (id: string) => {
    setSelectedReminderId(id);
    setShowEditModal(true);
  };

  const handleDeleteReminder = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rappel ?')) {
      try {
        await apiClient.deleteReminder(id);
        setReminders(prev => prev.filter(r => r.id !== id));
        toast.success('Rappel supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du rappel');
      }
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    // Recharger les données via React Query
    refetch();
  };


  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setFilterType('ALL');
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <BellIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur de chargement</h3>
        <p className="mt-1 text-sm text-gray-500">
          Impossible de charger les rappels. Veuillez réessayer.
        </p>
        <Button onClick={() => refetch()} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BellIcon className="h-4 w-4 inline mr-2" />
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-4 w-4 inline mr-2" />
            Statistiques
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentArrowDownIcon className="h-4 w-4 inline mr-2" />
            Exports
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <>
          {/* Filtres et actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={(value) => setSearchTerm(value)}
              filters={[
                {
                  key: 'status',
                  label: 'Statut',
                  type: 'select',
                  options: [
                    { value: 'ALL', label: 'Tous les statuts' },
                    { value: 'PENDING', label: 'En attente' },
                    { value: 'SENT', label: 'Envoyé' },
                    { value: 'FAILED', label: 'Échec' },
                    { value: 'CANCELLED', label: 'Annulé' },
                  ],
                },
                {
                  key: 'type',
                  label: 'Type',
                  type: 'select',
                  options: [
                    { value: 'ALL', label: 'Tous les types' },
                    { value: 'EMAIL', label: 'Email' },
                    { value: 'SMS', label: 'SMS' },
                    { value: 'PUSH', label: 'Push' },
                  ],
                },
              ]}
              filterValues={{
                status: filterStatus,
                type: filterType,
              }}
              onFilterChange={(key, value) => {
                if (key === 'status') setFilterStatus(value);
                if (key === 'type') setFilterType(value);
              }}
              onClearFilters={handleClearFilters}
            />
            
            <div className="flex items-center space-x-2">
              <div className="flex rounded-md shadow-sm">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <TableCellsIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau rappel
              </Button>
            </div>
          </div>

          {/* Contenu principal */}
          {viewMode === 'table' ? (
            <RemindersTable
              reminders={paginatedReminders}
              onView={handleViewReminder}
              onEdit={handleEditReminder}
              onDelete={handleDeleteReminder}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          ) : (
            <RemindersGrid
              reminders={paginatedReminders}
              onView={handleViewReminder}
              onEdit={handleEditReminder}
              onDelete={handleDeleteReminder}
            />
          )}
        </>
      )}

      {activeTab === 'stats' && (
        <RemindersStats reminders={reminders} />
      )}

      {activeTab === 'export' && (
        <Card>
          <CardHeader>
            <CardTitle>Exports et rapports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Exports disponibles</h3>
              <p className="mt-1 text-sm text-gray-500">
                Fonctionnalité d'export en cours de développement.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modales */}
      <CreateReminderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <ReminderDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        reminderId={selectedReminderId}
        onEdit={handleEditReminder}
        onDelete={handleDeleteReminder}
      />

      <EditReminderModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        reminderId={selectedReminderId}
      />
    </div>
  );
}
