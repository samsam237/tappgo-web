# TappPlus Web

Interface web Next.js pour le système de gestion des rappels d'interventions médicales.

## 🚀 Technologies

- **Next.js 14** - Framework React avec App Router
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utility-first
- **Axios** - Client HTTP
- **React Hook Form** - Gestion de formulaires performante
- **Zod** - Validation de schémas
- **React Query** - Gestion du cache et état serveur
- **Recharts** - Graphiques et visualisations
- **Framer Motion** - Animations fluides

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Backend API TappPlus en cours d'exécution (voir [tappplus-api](https://github.com/your-org/tappplus-api))

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone <votre-repo-url>
cd tappplus-web
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration

Copier le fichier `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Éditer `.env.local` :

```env
# URL de l'API Backend
# En développement local
NEXT_PUBLIC_API_URL=http://localhost:5550

# En production avec Nginx reverse proxy (laisser vide ou relatif)
# NEXT_PUBLIC_API_URL=
```

## 🏃 Démarrage

### Mode Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Avec API locale
npm run dev:local
```

L'application sera disponible sur `http://localhost:5500`

### Mode Production

```bash
# Build l'application
npm run build

# Démarrer en production
npm start
```

## 🐳 Docker

### Avec Docker Compose (Recommandé)

```bash
# Build et démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Build Docker manuel

```bash
# Build l'image
docker build -t tappplus-web:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://your-api-url \
  .

# Run
docker run -p 5500:5500 \
  -e NEXT_PUBLIC_API_URL=http://your-api-url \
  tappplus-web:latest
```

## 📚 Structure du Projet

```
tappplus-web/
├── src/
│   ├── app/                           # Pages Next.js (App Router)
│   │   ├── layout.tsx                 # Layout racine
│   │   ├── page.tsx                   # Page d'accueil
│   │   ├── auth/                      # Pages d'authentification
│   │   ├── dashboard/                 # Tableau de bord
│   │   ├── interventions/             # Gestion interventions
│   │   ├── patients/                  # Gestion patients
│   │   ├── reminders/                 # Gestion rappels
│   │   ├── stats/                     # Statistiques
│   │   └── settings/                  # Paramètres
│   │
│   ├── components/                    # Composants React
│   │   ├── auth/                      # Composants auth
│   │   ├── dashboard/                 # Composants dashboard
│   │   ├── interventions/             # Composants interventions
│   │   ├── patients/                  # Composants patients
│   │   ├── reminders/                 # Composants rappels
│   │   ├── layout/                    # Header, Sidebar, Footer
│   │   ├── ui/                        # Composants UI génériques
│   │   └── providers.tsx              # Context providers
│   │
│   ├── lib/                           # Utilitaires et API client
│   │   ├── api.ts                     # Client Axios + ApiClient
│   │   ├── auth.ts                    # Helpers authentification
│   │   ├── auth-client.ts             # Auth côté client
│   │   └── auth-server.ts             # Auth côté serveur
│   │
│   ├── hooks/                         # Hooks React personnalisés
│   │   └── use-api.ts                 # Hook useApi
│   │
│   ├── types/                         # Types TypeScript
│   │   └── index.ts                   # Interfaces et types
│   │
│   └── public/                        # Ressources statiques
│       └── logo_tapp+.jpg
│
├── Dockerfile                         # Image Docker
├── docker-compose.yml                 # Orchestration
├── next.config.js                     # Configuration Next.js
├── tailwind.config.js                 # Configuration Tailwind
├── tsconfig.json                      # Configuration TypeScript
└── package.json
```

## 🔧 Scripts NPM

| Script | Description |
|--------|-------------|
| `npm run dev` | Mode développement (port 5500) |
| `npm run dev:local` | Dev avec API locale |
| `npm run build` | Build pour production |
| `npm start` | Démarrer en production |
| `npm run lint` | Linter le code |
| `npm run type-check` | Vérifier les types TypeScript |

## 🎨 Pages et Routes

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil (redirige vers /dashboard) |
| `/auth/login` | Connexion |
| `/dashboard` | Tableau de bord principal |
| `/interventions` | Liste des interventions |
| `/interventions/new` | Créer une intervention |
| `/interventions/[id]` | Détails intervention |
| `/patients` | Liste des patients |
| `/patients/new` | Ajouter un patient |
| `/patients/[id]` | Détails patient |
| `/reminders` | Gestion des rappels |
| `/stats` | Statistiques et rapports |
| `/settings` | Paramètres utilisateur |

## 🔐 Authentification

L'application utilise JWT avec localStorage :

1. **Login** : Formulaire `/auth/login`
2. **Token** : Stocké dans `localStorage.access_token`
3. **Auto-refresh** : Refresh automatique via intercepteurs Axios
4. **Protection** : Routes protégées par middleware

## 📡 Client API

Le client API (`src/lib/api.ts`) gère automatiquement :

- **Headers** : Authorization Bearer token
- **Errors** : Gestion 401, 403, 5xx
- **Retry** : Tentatives automatiques
- **Refresh** : Tokens JWT
- **Toast** : Notifications utilisateur

### Exemple d'utilisation

```typescript
import { useApi } from '@/hooks/use-api';

function MyComponent() {
  const api = useApi();

  const interventions = await api.getInterventions();
  const created = await api.createIntervention(data);
}
```

## 🎨 Composants UI

Composants réutilisables dans `src/components/ui/` :

- `<Button>` - Boutons stylisés
- `<Input>` - Champs de formulaire
- `<Select>` - Sélecteurs
- `<Modal>` - Modales
- `<Spinner>` - Indicateurs de chargement
- `<Card>` - Cartes de contenu

## 📊 Gestion d'État

- **React Query** : Cache et synchronisation serveur
- **Context API** : État global (user, theme)
- **localStorage** : Persistance (tokens, préférences)

## 🌍 Variables d'Environnement

### Build-time (NEXT_PUBLIC_*)

Ces variables sont incluses dans le bundle :

```env
NEXT_PUBLIC_API_URL=http://localhost:5550
NEXT_PUBLIC_APP_NAME=TappPlus
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Runtime

```env
PORT=5500
HOSTNAME=0.0.0.0
NODE_ENV=production
```

## 🚢 Déploiement

### Option 1 : Avec l'API (Nginx Reverse Proxy)

Déployer l'API et le Web ensemble avec Nginx :

```nginx
# nginx.conf
upstream api_backend {
    server tappplus-api:5550;
}

upstream web_frontend {
    server tappplus-web:5500;
}

server {
    listen 80;

    location /api/v1/ {
        proxy_pass http://api_backend;
    }

    location / {
        proxy_pass http://web_frontend;
    }
}
```

### Option 2 : Déploiement séparé

Déployer le frontend indépendamment et pointer vers l'API :

```bash
docker run -p 5500:5500 \
  -e NEXT_PUBLIC_API_URL=https://api.tappplus.com \
  tappplus-web:latest
```

### Option 3 : Vercel / Netlify

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

Variables d'environnement à configurer :
- `NEXT_PUBLIC_API_URL` : URL de votre API

## 🔍 Troubleshooting

### Erreur "Cannot connect to API"

Vérifier `NEXT_PUBLIC_API_URL` dans `.env.local`

### Images ne s'affichent pas

Configurer `IMAGE_DOMAINS` dans `next.config.js`

### Build échoue

```bash
# Nettoyer cache
rm -rf .next node_modules
npm install
npm run build
```

## 📱 Responsive Design

L'application est entièrement responsive :

- **Mobile** : < 640px
- **Tablet** : 640px - 1024px
- **Desktop** : > 1024px

Tailwind breakpoints :
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

## ♿ Accessibilité

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

## 🧪 Tests (À venir)

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## 📝 Licence

MIT

## 👥 Auteurs

TappPlus Team

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

## 🔗 Liens Utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation React Hook Form](https://react-hook-form.com/)
- [Backend API](https://github.com/your-org/tappplus-api)
