# Contrat d'API - TappPlus Backend

## Informations Générales

- **Base URL**: `http://localhost:5550/api/v1` (développement)
- **Version**: 1.0
- **Documentation Swagger**: `http://localhost:5550/api/docs`
- **Format**: JSON
- **Authentification**: JWT Bearer Token

## Authentification

L'API utilise JWT (JSON Web Token) pour l'authentification. La plupart des endpoints nécessitent un token d'accès dans le header `Authorization`.

### Format du Header
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 🔐 Authentication

#### POST `/api/v1/auth/register`
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "docteur@meditache.com",
  "password": "password123",
  "phone": "+237 6 12 34 56 78",
  "role": "DOCTOR",
  "timezone": "Africa/Douala",
  "organizationId": "org_123",
  "speciality": "Médecine Générale",
  "license": "MG001"
}
```

**Réponse 201:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "docteur@meditache.com",
    "role": "DOCTOR"
  }
}
```

#### POST `/api/v1/auth/login`
Connexion d'un utilisateur.

**Body:**
```json
{
  "email": "admin@meditache.com",
  "password": "admin123"
}
```

**Réponse 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "admin@meditache.com",
    "role": "ADMIN"
  }
}
```

#### POST `/api/v1/auth/refresh`
Rafraîchir le token d'accès.

**Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET `/api/v1/auth/profile`
Obtenir le profil de l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

**Réponse 200:**
```json
{
  "id": "user_123",
  "email": "docteur@meditache.com",
  "phone": "+237 6 12 34 56 78",
  "role": "DOCTOR",
  "timezone": "Africa/Douala",
  "isActive": true,
  "organizationId": "org_123"
}
```

---

### 🏥 Health Check

#### GET `/health`
Vérifier l'état de santé de l'API.

**Réponse 200:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

**Réponse 503:**
```json
{
  "status": "error",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "disconnected",
  "error": "Connection error"
}
```

---

### 👥 People (Personnes)

Tous les endpoints nécessitent l'authentification JWT.

#### POST `/api/v1/people`
Créer une nouvelle personne.

**Rôles requis:** `DOCTOR`, `ADMIN`

**Body:**
```json
{
  "fullName": "Marie Nguema",
  "birthdate": "1985-03-15",
  "phone": "+237 6 12 34 56 78",
  "email": "marie.nguema@email.com",
  "address": "Quartier Akwa, Douala"
}
```

**Réponse 201:**
```json
{
  "id": "person_123",
  "fullName": "Marie Nguema",
  "birthdate": "1985-03-15T00:00:00.000Z",
  "phone": "+237 6 12 34 56 78",
  "email": "marie.nguema@email.com",
  "address": "Quartier Akwa, Douala",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/people`
Lister les personnes.

**Query Parameters:**
- `search` (optionnel): Recherche par nom, email ou téléphone
- `organizationId` (optionnel): Filtrer par organisation
- `limit` (optionnel): Nombre d'éléments par page
- `offset` (optionnel): Décalage pour la pagination

**Exemple:** `GET /api/v1/people?search=Marie&limit=10&offset=0`

**Réponse 200:**
```json
[
  {
    "id": "person_123",
    "fullName": "Marie Nguema",
    "birthdate": "1985-03-15T00:00:00.000Z",
    "phone": "+237 6 12 34 56 78",
    "email": "marie.nguema@email.com",
    "address": "Quartier Akwa, Douala",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/v1/people/:id`
Obtenir une personne par ID.

**Réponse 200:**
```json
{
  "id": "person_123",
  "fullName": "Marie Nguema",
  "birthdate": "1985-03-15T00:00:00.000Z",
  "phone": "+237 6 12 34 56 78",
  "email": "marie.nguema@email.com",
  "address": "Quartier Akwa, Douala",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### PATCH `/api/v1/people/:id`
Modifier une personne.

**Rôles requis:** `DOCTOR`, `ADMIN`

**Body:** (tous les champs sont optionnels)
```json
{
  "fullName": "Marie Nguema Updated",
  "phone": "+237 6 98 76 54 32"
}
```

**Réponse 200:**
```json
{
  "id": "person_123",
  "fullName": "Marie Nguema Updated",
  "phone": "+237 6 98 76 54 32",
  ...
}
```

#### DELETE `/api/v1/people/:id`
Supprimer une personne.

**Rôles requis:** `ADMIN`

**Réponse 200:**
```json
{
  "message": "Personne supprimée avec succès"
}
```

#### POST `/api/v1/people/:id/organizations/:organizationId`
Attacher une personne à une organisation.

**Rôles requis:** `ADMIN`

**Body:**
```json
{
  "role": "PATIENT"
}
```

**Réponse 200:**
```json
{
  "message": "Personne attachée avec succès"
}
```

#### DELETE `/api/v1/people/:id/organizations/:organizationId`
Détacher une personne d'une organisation.

**Rôles requis:** `ADMIN`

**Réponse 200:**
```json
{
  "message": "Personne détachée avec succès"
}
```

---

### 🏢 Organizations (Organisations)

Tous les endpoints nécessitent l'authentification JWT.

#### POST `/api/v1/organizations`
Créer une nouvelle organisation.

**Rôles requis:** `ADMIN`

**Body:**
```json
{
  "name": "Hôpital Central de Douala"
}
```

**Réponse 201:**
```json
{
  "id": "org_123",
  "name": "Hôpital Central de Douala",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/organizations`
Lister les organisations.

**Réponse 200:**
```json
[
  {
    "id": "org_123",
    "name": "Hôpital Central de Douala",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/v1/organizations/:id`
Obtenir une organisation par ID.

**Réponse 200:**
```json
{
  "id": "org_123",
  "name": "Hôpital Central de Douala",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/organizations/:id/stats`
Obtenir les statistiques d'une organisation.

**Réponse 200:**
```json
{
  "totalPeople": 150,
  "totalInterventions": 45,
  "totalConsultations": 200
}
```

#### PATCH `/api/v1/organizations/:id`
Modifier une organisation.

**Rôles requis:** `ADMIN`

**Body:**
```json
{
  "name": "Hôpital Central de Douala - Mise à jour"
}
```

**Réponse 200:**
```json
{
  "id": "org_123",
  "name": "Hôpital Central de Douala - Mise à jour",
  ...
}
```

#### DELETE `/api/v1/organizations/:id`
Supprimer une organisation.

**Rôles requis:** `ADMIN`

**Réponse 200:**
```json
{
  "message": "Organisation supprimée avec succès"
}
```

---

### 🏥 Interventions

Tous les endpoints nécessitent l'authentification JWT.

#### POST `/api/v1/interventions`
Créer une nouvelle intervention.

**Rôles requis:** `DOCTOR`, `ADMIN`

**Body:**
```json
{
  "personId": "person_123",
  "doctorId": "doctor_456",
  "title": "Visite à domicile - Suivi diabète",
  "description": "Contrôle glycémique et adaptation du traitement",
  "scheduledAt": "2025-10-16T10:30:00+01:00",
  "priority": "NORMAL",
  "location": "Quartier Akwa, Douala",
  "rules": [
    {
      "offsetMinutes": -1440,
      "channel": "SMS",
      "enabled": true
    },
    {
      "offsetMinutes": -60,
      "channel": "EMAIL",
      "enabled": true
    }
  ]
}
```

**Réponse 201:**
```json
{
  "id": "intervention_123",
  "personId": "person_123",
  "doctorId": "doctor_456",
  "title": "Visite à domicile - Suivi diabète",
  "description": "Contrôle glycémique et adaptation du traitement",
  "scheduledAtUtc": "2025-10-16T09:30:00.000Z",
  "priority": "NORMAL",
  "status": "PLANNED",
  "location": "Quartier Akwa, Douala",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/interventions`
Lister les interventions.

**Query Parameters:**
- `doctorId` (optionnel): Filtrer par médecin
- `status` (optionnel): Filtrer par statut (`PLANNED`, `IN_PROGRESS`, `DONE`, `CANCELED`)
- `priority` (optionnel): Filtrer par priorité (`NORMAL`, `URGENT`)
- `from` (optionnel): Date de début (ISO 8601)
- `to` (optionnel): Date de fin (ISO 8601)

**Exemple:** `GET /api/v1/interventions?status=PLANNED&priority=URGENT&from=2025-01-01T00:00:00Z`

**Réponse 200:**
```json
[
  {
    "id": "intervention_123",
    "personId": "person_123",
    "doctorId": "doctor_456",
    "title": "Visite à domicile - Suivi diabète",
    "scheduledAtUtc": "2025-10-16T09:30:00.000Z",
    "priority": "NORMAL",
    "status": "PLANNED",
    ...
  }
]
```

#### GET `/api/v1/interventions/upcoming`
Obtenir les interventions à venir.

**Query Parameters:**
- `days` (optionnel): Nombre de jours à venir (défaut: 7)

**Exemple:** `GET /api/v1/interventions/upcoming?days=14`

**Réponse 200:**
```json
[
  {
    "id": "intervention_123",
    "title": "Visite à domicile - Suivi diabète",
    "scheduledAtUtc": "2025-10-16T09:30:00.000Z",
    ...
  }
]
```

#### GET `/api/v1/interventions/:id`
Obtenir une intervention par ID.

**Réponse 200:**
```json
{
  "id": "intervention_123",
  "personId": "person_123",
  "doctorId": "doctor_456",
  "title": "Visite à domicile - Suivi diabète",
  "scheduledAtUtc": "2025-10-16T09:30:00.000Z",
  "priority": "NORMAL",
  "status": "PLANNED",
  "location": "Quartier Akwa, Douala",
  "person": {
    "id": "person_123",
    "fullName": "Marie Nguema"
  },
  "doctor": {
    "id": "doctor_456",
    "speciality": "Médecine Générale"
  },
  "reminders": [],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### PATCH `/api/v1/interventions/:id`
Modifier une intervention.

**Rôles requis:** `DOCTOR`, `ADMIN`

**Body:** (tous les champs sont optionnels)
```json
{
  "title": "Visite à domicile - Suivi diabète (Mise à jour)",
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

**Réponse 200:**
```json
{
  "id": "intervention_123",
  "title": "Visite à domicile - Suivi diabète (Mise à jour)",
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  ...
}
```

#### DELETE `/api/v1/interventions/:id`
Supprimer une intervention.

**Rôles requis:** `DOCTOR`, `ADMIN`

**Réponse 200:**
```json
{
  "message": "Intervention supprimée avec succès"
}
```

---

### 📅 Consultations

Tous les endpoints nécessitent l'authentification JWT.

#### POST `/api/v1/consultations`
Créer une nouvelle consultation.

**Rôles requis:** `DOCTOR`, `ADMIN`

**Body:**
```json
{
  "personId": "person_123",
  "doctorId": "doctor_456",
  "dateTime": "2025-10-16T10:30:00+01:00",
  "notes": "Consultation de routine - Tension artérielle normale",
  "attachments": [
    "https://example.com/files/rapport.pdf",
    "https://example.com/files/radio.jpg"
  ],
  "status": "COMPLETED"
}
```

**Réponse 201:**
```json
{
  "id": "consultation_123",
  "personId": "person_123",
  "doctorId": "doctor_456",
  "dateTimeUtc": "2025-10-16T09:30:00.000Z",
  "notes": "Consultation de routine - Tension artérielle normale",
  "attachments": "[\"https://example.com/files/rapport.pdf\",\"https://example.com/files/radio.jpg\"]",
  "status": "COMPLETED",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/consultations`
Lister les consultations.

**Query Parameters:**
- `personId` (optionnel): Filtrer par personne
- `doctorId` (optionnel): Filtrer par médecin
- `status` (optionnel): Filtrer par statut (`SCHEDULED`, `COMPLETED`, `CANCELLED`)
- `from` (optionnel): Date de début (ISO 8601)
- `to` (optionnel): Date de fin (ISO 8601)

**Exemple:** `GET /api/v1/consultations?personId=person_123&status=COMPLETED`

**Réponse 200:**
```json
[
  {
    "id": "consultation_123",
    "personId": "person_123",
    "doctorId": "doctor_456",
    "dateTimeUtc": "2025-10-16T09:30:00.000Z",
    "status": "COMPLETED",
    ...
  }
]
```

#### GET `/api/v1/consultations/history/:personId`
Obtenir l'historique médical d'une personne.

**Query Parameters:**
- `doctorId` (optionnel): Filtrer par médecin

**Exemple:** `GET /api/v1/consultations/history/person_123?doctorId=doctor_456`

**Réponse 200:**
```json
[
  {
    "id": "consultation_123",
    "dateTimeUtc": "2025-10-16T09:30:00.000Z",
    "notes": "Consultation de routine",
    "status": "COMPLETED",
    "doctor": {
      "id": "doctor_456",
      "speciality": "Médecine Générale"
    }
  }
]
```

#### GET `/api/v1/consultations/:id`
Obtenir une consultation par ID.

**Réponse 200:**
```json
{
  "id": "consultation_123",
  "personId": "person_123",
  "doctorId": "doctor_456",
  "dateTimeUtc": "2025-10-16T09:30:00.000Z",
  "notes": "Consultation de routine - Tension artérielle normale",
  "attachments": "[\"https://example.com/files/rapport.pdf\"]",
  "status": "COMPLETED",
  "person": {
    "id": "person_123",
    "fullName": "Marie Nguema"
  },
  "doctor": {
    "id": "doctor_456",
    "speciality": "Médecine Générale"
  },
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### PATCH `/api/v1/consultations/:id`
Modifier une consultation.

**Rôles requis:** `DOCTOR`, `ADMIN`

**Body:** (tous les champs sont optionnels)
```json
{
  "notes": "Notes mises à jour",
  "status": "CANCELLED"
}
```

**Réponse 200:**
```json
{
  "id": "consultation_123",
  "notes": "Notes mises à jour",
  "status": "CANCELLED",
  ...
}
```

#### DELETE `/api/v1/consultations/:id`
Supprimer une consultation.

**Rôles requis:** `ADMIN`

**Réponse 200:**
```json
{
  "message": "Consultation supprimée avec succès"
}
```

---

### 🔔 Reminders (Rappels)

Tous les endpoints nécessitent l'authentification JWT.

#### POST `/api/v1/reminders`
Créer un nouveau rappel.

**Rôles requis:** `ADMIN`, `DOCTOR`

**Body:**
```json
{
  "interventionId": "intervention_123",
  "type": "SMS",
  "scheduledAt": "2025-10-15T10:30:00+01:00",
  "message": "Rappel: Vous avez une intervention demain à 10h30",
  "recipient": "+237 6 12 34 56 78",
  "status": "PENDING"
}
```

**Types disponibles:** `EMAIL`, `SMS`, `PUSH`
**Statuts disponibles:** `PENDING`, `SENT`, `FAILED`, `CANCELLED`

**Réponse 201:**
```json
{
  "id": "reminder_123",
  "interventionId": "intervention_123",
  "type": "SMS",
  "plannedSendUtc": "2025-10-15T09:30:00.000Z",
  "message": "Rappel: Vous avez une intervention demain à 10h30",
  "recipient": "+237 6 12 34 56 78",
  "status": "PENDING",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/reminders`
Lister les rappels.

**Query Parameters:**
- `status` (optionnel): Filtrer par statut (`PENDING`, `SENT`, `FAILED`, `CANCELLED`)
- `interventionId` (optionnel): Filtrer par intervention
- `from` (optionnel): Date de début (ISO 8601)
- `to` (optionnel): Date de fin (ISO 8601)

**Exemple:** `GET /api/v1/reminders?status=PENDING&interventionId=intervention_123`

**Réponse 200:**
```json
[
  {
    "id": "reminder_123",
    "interventionId": "intervention_123",
    "type": "SMS",
    "plannedSendUtc": "2025-10-15T09:30:00.000Z",
    "status": "PENDING",
    ...
  }
]
```

#### GET `/api/v1/reminders/stats`
Obtenir les statistiques des rappels.

**Rôles requis:** `ADMIN`, `DOCTOR`

**Réponse 200:**
```json
{
  "total": 150,
  "pending": 10,
  "sent": 130,
  "failed": 8,
  "cancelled": 2,
  "byType": {
    "EMAIL": 50,
    "SMS": 80,
    "PUSH": 20
  }
}
```

#### GET `/api/v1/reminders/:id`
Obtenir un rappel par ID.

**Réponse 200:**
```json
{
  "id": "reminder_123",
  "interventionId": "intervention_123",
  "type": "SMS",
  "plannedSendUtc": "2025-10-15T09:30:00.000Z",
  "message": "Rappel: Vous avez une intervention demain à 10h30",
  "recipient": "+237 6 12 34 56 78",
  "status": "SENT",
  "sentAt": "2025-10-15T09:30:05.000Z",
  "intervention": {
    "id": "intervention_123",
    "title": "Visite à domicile - Suivi diabète"
  },
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### PATCH `/api/v1/reminders/:id`
Mettre à jour un rappel.

**Rôles requis:** `ADMIN`, `DOCTOR`

**Body:** (tous les champs sont optionnels)
```json
{
  "status": "CANCELLED",
  "message": "Message mis à jour"
}
```

**Réponse 200:**
```json
{
  "id": "reminder_123",
  "status": "CANCELLED",
  "message": "Message mis à jour",
  ...
}
```

#### DELETE `/api/v1/reminders/:id`
Supprimer un rappel.

**Rôles requis:** `ADMIN`, `DOCTOR`

**Réponse 200:**
```json
{
  "message": "Rappel supprimé avec succès"
}
```

#### POST `/api/v1/reminders/:id/retry`
Relancer un rappel échoué.

**Rôles requis:** `ADMIN`, `DOCTOR`

**Réponse 200:**
```json
{
  "id": "reminder_123",
  "status": "PENDING",
  "message": "Rappel relancé avec succès"
}
```

---

### 📧 Notifications

Tous les endpoints nécessitent l'authentification JWT.

#### GET `/api/v1/notifications/stats`
Obtenir les statistiques des notifications.

**Rôles requis:** `ADMIN`, `DOCTOR`

**Query Parameters:**
- `interventionId` (optionnel): Filtrer par intervention

**Exemple:** `GET /api/v1/notifications/stats?interventionId=intervention_123`

**Réponse 200:**
```json
{
  "total": 200,
  "sent": 180,
  "failed": 15,
  "delivered": 170,
  "read": 120,
  "byChannel": {
    "EMAIL": 80,
    "SMS": 100,
    "PUSH": 20
  }
}
```

#### POST `/api/v1/notifications/test/email`
Tester l'envoi d'email.

**Rôles requis:** `ADMIN`

**Body:**
```json
{
  "to": "test@example.com"
}
```

**Réponse 200:**
```json
{
  "message": "Email de test envoyé avec succès",
  "messageId": "msg_123"
}
```

#### POST `/api/v1/notifications/test/sms`
Tester l'envoi de SMS.

**Rôles requis:** `ADMIN`

**Body:**
```json
{
  "to": "+237 6 12 34 56 78"
}
```

**Réponse 200:**
```json
{
  "message": "SMS de test envoyé avec succès",
  "messageId": "msg_123"
}
```

#### POST `/api/v1/notifications/test/push`
Tester l'envoi de push notification.

**Rôles requis:** `ADMIN`

**Body:**
```json
{
  "token": "firebase_device_token_123"
}
```

**Réponse 200:**
```json
{
  "message": "Push de test envoyé avec succès",
  "messageId": "msg_123"
}
```

---

## Codes de Réponse HTTP

| Code | Description |
|------|-------------|
| 200 | Succès - Requête traitée avec succès |
| 201 | Créé - Ressource créée avec succès |
| 400 | Requête invalide - Données manquantes ou invalides |
| 401 | Non autorisé - Token manquant ou invalide |
| 403 | Interdit - Permissions insuffisantes |
| 404 | Non trouvé - Ressource introuvable |
| 500 | Erreur serveur - Erreur interne du serveur |
| 503 | Service indisponible - Service temporairement indisponible |

---

## Rôles et Permissions

### ADMIN
- Accès complet à toutes les ressources
- Gestion des organisations
- Gestion des utilisateurs
- Tests de notifications

### DOCTOR
- Création et modification d'interventions
- Création et modification de consultations
- Création et modification de personnes
- Création et modification de rappels
- Consultation des statistiques

### NURSE
- Consultation des interventions
- Consultation des consultations
- Consultation des personnes

---

## Gestion des Erreurs

Les erreurs sont retournées au format JSON :

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 6 characters"],
  "error": "Bad Request"
}
```

### Erreurs courantes

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Intervention not found",
  "error": "Not Found"
}
```

---

## Formats de Dates

Toutes les dates doivent être au format **ISO 8601** avec timezone :

- Format: `YYYY-MM-DDTHH:mm:ss±HH:mm`
- Exemple: `2025-10-16T10:30:00+01:00`

Les dates retournées par l'API sont en UTC (format: `YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## Pagination

Pour les endpoints de liste, utilisez les paramètres de requête :
- `limit`: Nombre d'éléments par page (défaut: non limité)
- `offset`: Décalage pour la pagination (défaut: 0)

**Exemple:**
```
GET /api/v1/people?limit=20&offset=40
```

---

## Validation

L'API valide automatiquement les données envoyées. Les règles de validation incluent :

- **Email**: Format email valide
- **Password**: Minimum 6 caractères
- **Dates**: Format ISO 8601
- **Enums**: Valeurs prédéfinies uniquement
- **Strings**: Non vides pour les champs requis

---

## Exemples d'Utilisation

### Exemple complet : Créer une intervention avec rappels

```javascript
// 1. Se connecter
const loginResponse = await fetch('http://localhost:5550/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'docteur@meditache.com',
    password: 'password123'
  })
});
const { access_token } = await loginResponse.json();

// 2. Créer une intervention
const interventionResponse = await fetch('http://localhost:5550/api/v1/interventions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    personId: 'person_123',
    doctorId: 'doctor_456',
    title: 'Visite à domicile - Suivi diabète',
    scheduledAt: '2025-10-16T10:30:00+01:00',
    priority: 'NORMAL',
    rules: [
      { offsetMinutes: -1440, channel: 'SMS', enabled: true },
      { offsetMinutes: -60, channel: 'EMAIL', enabled: true }
    ]
  })
});
const intervention = await interventionResponse.json();

// 3. Lister les rappels créés
const remindersResponse = await fetch(
  `http://localhost:5550/api/v1/reminders?interventionId=${intervention.id}`,
  {
    headers: { 'Authorization': `Bearer ${access_token}` }
  }
);
const reminders = await remindersResponse.json();
```

---

## Support

Pour plus d'informations ou en cas de problème, consultez :
- Documentation Swagger : `http://localhost:5550/api/docs`
- README du projet : `README.md`


