'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { apiClient } from '@/lib/api';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from 'react-hot-toast';
import { CreatePersonRequest } from '@/types';

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePatientModal({ isOpen, onClose }: CreatePatientModalProps) {
  const [formData, setFormData] = useState<Partial<CreatePersonRequest>>({
    fullName: '',
    birthdate: '',
    phone: '',
    email: '',
    address: '',
  });

  const queryClient = useQueryClient();

  // Mutation pour créer le patient
  const createPatientMutation = useMutation(
    (data: CreatePersonRequest) => apiClient.createPerson(data),
    {
      onSuccess: () => {
        toast.success('Patient créé avec succès');
        queryClient.invalidateQueries('patients');
        queryClient.invalidateQueries('people');
        onClose();
        resetForm();
      },
      onError: (error: any) => {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Response data:', error.response?.data);
        console.error('❌ Response status:', error.response?.status);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Erreur lors de la création du patient';
        toast.error(errorMessage);
      },
    }
  );

  const resetForm = () => {
    setFormData({
      fullName: '',
      birthdate: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName) {
      toast.error('Le nom complet est obligatoire');
      return;
    }

    // DEBUG: Afficher les données du formulaire avant nettoyage
    console.log('📋 Données du formulaire AVANT nettoyage:', formData);
    console.log('📅 birthdate valeur:', formData.birthdate);
    console.log('📅 birthdate type:', typeof formData.birthdate);
    console.log('📅 birthdate length:', formData.birthdate?.length);
    console.log('📅 birthdate trimmed:', formData.birthdate?.trim());
    console.log('📅 birthdate isEmpty:', !formData.birthdate || formData.birthdate.trim() === '');

    // Nettoyer les données : ne pas envoyer les champs vides
    const cleanedData: CreatePersonRequest = {
      fullName: formData.fullName,
    };

    // Ajouter birthdate seulement si elle n'est pas vide
    // Le DatePicker retourne une date au format "YYYY-MM-DD"
    // Prisma attend un format DateTime ISO 8601 complet, convertissons-le
    if (formData.birthdate && formData.birthdate.trim() !== '') {
      const dateValue = formData.birthdate.trim();
      // Vérifier si c'est déjà un format DateTime complet
      if (dateValue.includes('T') || dateValue.includes(' ')) {
        // Déjà au format DateTime, on le garde tel quel
        cleanedData.birthdate = dateValue;
      } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Format date simple "YYYY-MM-DD", convertir en DateTime ISO 8601
        // On utilise minuit UTC pour la date de naissance
        cleanedData.birthdate = `${dateValue}T00:00:00.000Z`;
        console.log('📅 birthdate converti de "YYYY-MM-DD" vers DateTime ISO:', cleanedData.birthdate);
      } else {
        // Format inattendu, on essaie quand même
        cleanedData.birthdate = dateValue;
        console.warn('⚠️ Format de date inattendu:', dateValue);
      }
    }

    // Ajouter les autres champs optionnels seulement s'ils ne sont pas vides
    if (formData.phone && formData.phone.trim() !== '') {
      cleanedData.phone = formData.phone.trim();
    }
    if (formData.email && formData.email.trim() !== '') {
      cleanedData.email = formData.email.trim();
    }
    if (formData.address && formData.address.trim() !== '') {
      cleanedData.address = formData.address.trim();
    }

    // DEBUG: Afficher les données nettoyées qui seront envoyées
    console.log('✅ Données NETTOYÉES qui seront envoyées à l\'API:', cleanedData);
    console.log('📅 birthdate dans cleanedData:', cleanedData.birthdate);

    createPatientMutation.mutate(cleanedData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Nouveau patient">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalContent>
          <div className="grid grid-cols-1 gap-5">
            {/* Nom complet */}
            <div>
              <Label htmlFor="fullName" required>Nom complet</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Ex: Marie Nguema"
                required
              />
            </div>

            {/* Date de naissance */}
            <div>
              <Label htmlFor="birthdate">Date de naissance</Label>
              <DatePicker
                id="birthdate"
                value={formData.birthdate}
                onChange={(value) => {
                  console.log('📅 DatePicker onChange appelé avec:', value);
                  setFormData(prev => ({ ...prev, birthdate: value }));
                }}
                max={new Date().toISOString().split('T')[0]}
              />
              {/* DEBUG: Afficher la valeur actuelle */}
              {formData.birthdate && (
                <p className="mt-1 text-xs text-gray-500">
                  Valeur actuelle: <strong>{formData.birthdate}</strong> (type: {typeof formData.birthdate}, longueur: {formData.birthdate.length})
                </p>
              )}
              {!formData.birthdate && (
                <p className="mt-1 text-xs text-gray-400 italic">Aucune date sélectionnée</p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Ex: +237 6 12 34 56 78"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Ex: marie.nguema@email.com"
              />
            </div>

            {/* Adresse */}
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Adresse complète du patient..."
                rows={3}
              />
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createPatientMutation.isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={createPatientMutation.isLoading}
          >
            {createPatientMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Création...
              </>
            ) : (
              'Créer le patient'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
