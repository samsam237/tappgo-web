import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // Configuration flexible pour différents scénarios de déploiement :
    // 1. Domaines différents (VPS séparés) : NEXT_PUBLIC_API_URL=https://api.example.com
    //    → Requêtes directes vers l'API (nécessite CORS configuré sur le backend)
    // 2. Reverse proxy (même domaine) : NEXT_PUBLIC_API_URL vide ou non défini
    //    → Utilise le proxy Next.js (/api/v1) qui route vers le backend
    // 3. Développement local : NEXT_PUBLIC_API_URL=http://localhost:5550
    //    → Utilise le proxy Next.js qui route vers localhost:5550
    // 4. Forcer le proxy en développement : USE_PROXY_IN_DEV=true
    //    → Force l'utilisation du proxy même si NEXT_PUBLIC_API_URL est défini
    //    → Utile pour contourner les problèmes de certificat SSL en développement
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const USE_PROXY_IN_DEV = 
      process.env.NODE_ENV === 'development' && 
      process.env.USE_PROXY_IN_DEV === 'true';

    // Si USE_PROXY_IN_DEV est activé, forcer l'utilisation du proxy
    // Sinon, si une URL absolue est fournie, l'utiliser directement
    // Sinon, utiliser le proxy Next.js (routes dans src/app/api/v1/[...path]/route.ts)
    const baseURL = (USE_PROXY_IN_DEV || !API_BASE_URL)
      ? '/api/v1'
      : `${API_BASE_URL}/api/v1`;

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Pour les requêtes cross-origin, axios gère automatiquement CORS
      // Assurez-vous que le backend autorise votre domaine frontend dans les headers CORS
      withCredentials: false, // Changez à true si vous utilisez des cookies cross-origin
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token d'authentification
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor pour gérer les erreurs
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        // Détection des erreurs de certificat SSL/TLS
        const isCertificateError = 
          error.code === 'ERR_CERT_AUTHORITY_INVALID' ||
          error.code === 'ERR_CERT_COMMON_NAME_INVALID' ||
          error.code === 'ERR_CERT_DATE_INVALID' ||
          error.code === 'ERR_CERT_INVALID' ||
          error.message?.includes('certificate') ||
          error.message?.includes('SSL') ||
          error.message?.includes('TLS') ||
          error.message?.includes('ERR_CERT');

        if (isCertificateError) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const isDevelopment = process.env.NODE_ENV === 'development';
          
          let errorMessage = 'Erreur de certificat SSL : Le certificat du serveur API n\'est pas valide.';
          
          if (isDevelopment && apiUrl) {
            errorMessage += '\n\nSolution : Utilisez le proxy Next.js en supprimant NEXT_PUBLIC_API_URL de votre .env.local, ou corrigez le certificat SSL du serveur.';
          } else if (apiUrl) {
            errorMessage += '\n\nVeuillez contacter l\'administrateur pour corriger le certificat SSL du serveur.';
          }
          
          console.error('Erreur de certificat SSL détectée:', {
            code: error.code,
            message: error.message,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
          });
          
          toast.error(errorMessage, {
            duration: 8000,
          });
          
          return Promise.reject(new Error('Erreur de certificat SSL. Veuillez vérifier la configuration du serveur.'));
        }

        // Gestion des autres erreurs
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/auth/login';
          toast.error('Session expirée. Veuillez vous reconnecter.');
        } else if (error.response?.status >= 500) {
          toast.error('Erreur serveur. Veuillez réessayer plus tard.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message) {
          // Ne pas afficher les messages d'erreur réseau génériques pour les erreurs de certificat
          if (!isCertificateError) {
            toast.error(error.message);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  public setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  }

  // Méthodes d'authentification
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data;
    
    this.setToken(access_token);
    this.setRefreshToken(refresh_token);
    
    return { user, access_token, refresh_token };
  }

  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/auth/refresh', {
      refresh_token: refreshToken,
    });

    const { access_token, user } = response.data;
    this.setToken(access_token);
    
    return { user, access_token };
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Méthodes pour les interventions
  async getInterventions(params?: any) {
    const response = await this.client.get('/interventions', { params });
    return response.data;
  }

  async getUpcomingInterventions(days?: number) {
    const response = await this.client.get('/interventions/upcoming', {
      params: { days },
    });
    return response.data;
  }

  async createIntervention(data: any) {
    const response = await this.client.post('/interventions', data);
    return response.data;
  }

  async updateIntervention(id: string, data: any) {
    const response = await this.client.patch(`/interventions/${id}`, data);
    return response.data;
  }

  async deleteIntervention(id: string) {
    const response = await this.client.delete(`/interventions/${id}`);
    return response.data;
  }

  // Méthodes pour les personnes
  async getPeople(params?: any) {
    const response = await this.client.get('/people', { params });
    return response.data;
  }

  async getPerson(id: string) {
    const response = await this.client.get(`/people/${id}`);
    return response.data;
  }

  async createPerson(data: any) {
    const response = await this.client.post('/people', data);
    return response.data;
  }

  async updatePerson(id: string, data: any) {
    const response = await this.client.patch(`/people/${id}`, data);
    return response.data;
  }

  async deletePerson(id: string) {
    const response = await this.client.delete(`/people/${id}`);
    return response.data;
  }

  // Méthodes pour les consultations
  async getConsultations(params?: any) {
    const response = await this.client.get('/consultations', { params });
    return response.data;
  }

  async getPatientHistory(personId: string, doctorId?: string) {
    const response = await this.client.get(`/consultations/history/${personId}`, {
      params: { doctorId },
    });
    return response.data;
  }

  async createConsultation(data: any) {
    const response = await this.client.post('/consultations', data);
    return response.data;
  }

  async updateConsultation(id: string, data: any) {
    const response = await this.client.patch(`/consultations/${id}`, data);
    return response.data;
  }

  async deleteConsultation(id: string) {
    const response = await this.client.delete(`/consultations/${id}`);
    return response.data;
  }

  // Méthodes pour les rappels
  async getReminders(params?: any) {
    const response = await this.client.get('/reminders', { params });
    return response.data;
  }

  async getReminder(id: string) {
    const response = await this.client.get(`/reminders/${id}`);
    return response.data;
  }

  async createReminder(data: any) {
    const response = await this.client.post('/reminders', data);
    return response.data;
  }

  async updateReminder(id: string, data: any) {
    const response = await this.client.patch(`/reminders/${id}`, data);
    return response.data;
  }

  async deleteReminder(id: string) {
    const response = await this.client.delete(`/reminders/${id}`);
    return response.data;
  }

  async getReminderStats() {
    const response = await this.client.get('/reminders/stats');
    return response.data;
  }

  async retryReminder(id: string) {
    const response = await this.client.post(`/reminders/${id}/retry`);
    return response.data;
  }

  // Méthodes pour les organisations
  async getOrganizations() {
    const response = await this.client.get('/organizations');
    return response.data;
  }

  async getOrganization(id: string) {
    const response = await this.client.get(`/organizations/${id}`);
    return response.data;
  }

  async getOrganizationStats(id: string) {
    const response = await this.client.get(`/organizations/${id}/stats`);
    return response.data;
  }

  // Méthodes pour les notifications
  async getNotificationStats(interventionId?: string) {
    const response = await this.client.get('/notifications/stats', {
      params: { interventionId },
    });
    return response.data;
  }

  async testEmail(to: string) {
    const response = await this.client.post('/notifications/test/email', { to });
    return response.data;
  }

  async testSms(to: string) {
    const response = await this.client.post('/notifications/test/sms', { to });
    return response.data;
  }

  async testPush(token: string) {
    const response = await this.client.post('/notifications/test/push', { token });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
