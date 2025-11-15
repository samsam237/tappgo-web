# Guide de Déploiement - TappPlus Web

Ce guide couvre le déploiement du frontend TappPlus dans différents environnements.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration Initiale](#configuration-initiale)
3. [Déploiement Local](#déploiement-local)
4. [Déploiement Production](#déploiement-production)
5. [Déploiement sur Vercel](#déploiement-sur-vercel)
6. [Déploiement sur Netlify](#déploiement-sur-netlify)
7. [Déploiement Docker](#déploiement-docker)
8. [Configuration Nginx](#configuration-nginx)
9. [Troubleshooting](#troubleshooting)

## 🔧 Prérequis

### Environnement de Production

- **Node.js** : 18+
- **npm** : 9+
- **Docker** : 20.10+ (optionnel)
- **API Backend** : TappPlus API doit être accessible

## ⚙️ Configuration Initiale

### 1. Cloner le Projet

```bash
git clone https://github.com/your-org/tappplus-web.git
cd tappplus-web
```

### 2. Installer les Dépendances

```bash
npm install
```

### 3. Configurer les Variables d'Environnement

```bash
cp .env.example .env.local
```

Éditer `.env.local` :

```env
# URL de l'API Backend
NEXT_PUBLIC_API_URL=http://localhost:5550

# Application
NEXT_PUBLIC_APP_NAME=TappPlus
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🏠 Déploiement Local

### Mode Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Ou avec API locale
npm run dev:local
```

Application accessible sur `http://localhost:5500`

### Mode Production Local

```bash
# Build
npm run build

# Démarrer
npm start
```

## 🚀 Déploiement Production

### Option 1 : Vercel (Recommandé pour Next.js)

#### Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Production
vercel --prod
```

#### Via Dashboard Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Connecter le repository GitHub
3. Configurer les variables d'environnement :

```env
NEXT_PUBLIC_API_URL=https://api.tappplus.com
NEXT_PUBLIC_APP_NAME=TappPlus
NEXT_PUBLIC_APP_VERSION=1.0.0
```

4. Déployer

#### Configuration Vercel (vercel.json)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.tappplus.com"
  }
}
```

### Option 2 : Netlify

#### Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy

# Production
netlify deploy --prod
```

#### Via Dashboard Netlify

1. Connecter le repository GitHub
2. Configuration de build :

```
Build command: npm run build
Publish directory: .next
```

3. Variables d'environnement :

```env
NEXT_PUBLIC_API_URL=https://api.tappplus.com
```

#### Configuration Netlify (netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://api.tappplus.com/api/:splat"
  status = 200
  force = true
```

### Option 3 : Docker (Production)

#### Avec Docker Compose

```bash
# Build et démarrer
docker-compose up -d

# Vérifier
curl http://localhost:5500
```

#### Docker Manuel

```bash
# Build avec variables d'env
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tappplus.com \
  -t tappplus-web:latest \
  .

# Run
docker run -d \
  --name tappplus-web \
  -p 5500:5500 \
  -e NEXT_PUBLIC_API_URL=https://api.tappplus.com \
  tappplus-web:latest
```

### Option 4 : VPS (Ubuntu/Debian)

```bash
# 1. Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Cloner et installer
git clone https://github.com/your-org/tappplus-web.git
cd tappplus-web
npm install

# 3. Configurer .env
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.tappplus.com
EOF

# 4. Build
npm run build

# 5. Installer PM2
sudo npm install -g pm2

# 6. Démarrer avec PM2
pm2 start npm --name "tappplus-web" -- start
pm2 save
pm2 startup

# 7. Vérifier
pm2 status
curl http://localhost:5500
```

## 🌐 Configuration Nginx

### Reverse Proxy pour Next.js

```nginx
# /etc/nginx/sites-available/tappplus-web

upstream web_frontend {
    server 127.0.0.1:5500;
    keepalive 64;
}

server {
    listen 80;
    server_name tappplus.com www.tappplus.com;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tappplus.com www.tappplus.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tappplus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tappplus.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Next.js static files with cache
    location /_next/static {
        proxy_pass http://web_frontend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Next.js images
    location /_next/image {
        proxy_pass http://web_frontend;
        add_header Cache-Control "public, max-age=3600";
    }

    # Public assets
    location /images {
        proxy_pass http://web_frontend;
        add_header Cache-Control "public, max-age=86400";
    }

    # Main app
    location / {
        proxy_pass http://web_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Configuration Complète API + Web

```nginx
# /etc/nginx/sites-available/tappplus

upstream api_backend {
    server tappplus-api:5550;
    keepalive 32;
}

upstream web_frontend {
    server tappplus-web:5500;
    keepalive 32;
}

server {
    listen 80;
    server_name tappplus.com;

    # Health check
    location /health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routes
    location /api/v1/ {
        proxy_pass http://api_backend/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (optionnel si géré par NestJS)
        add_header Access-Control-Allow-Origin "$http_origin" always;
        add_header Access-Control-Allow-Methods "GET, POST, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Frontend routes
    location / {
        proxy_pass http://web_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://web_frontend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

## 🔧 Optimisations Production

### 1. Image Optimization

Next.js optimise automatiquement les images. Configuration dans `next.config.js` :

```javascript
module.exports = {
  images: {
    domains: ['api.tappplus.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

### 2. Bundle Analyzer

```bash
# Installer
npm install --save-dev @next/bundle-analyzer

# Analyser
ANALYZE=true npm run build
```

### 3. Performance Monitoring

#### Vercel Analytics

```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## 📊 Monitoring et Logs

### Logs Docker

```bash
# Logs en temps réel
docker-compose logs -f web

# Dernières 100 lignes
docker-compose logs --tail=100 web
```

### Logs PM2

```bash
# Logs en temps réel
pm2 logs tappplus-web

# Seulement erreurs
pm2 logs tappplus-web --err
```

### Monitoring Vercel

Dashboard Vercel fournit :
- Analytics
- Logs en temps réel
- Web Vitals
- Edge Functions logs

## 🔍 Troubleshooting

### Build échoue

```bash
# Nettoyer cache
rm -rf .next node_modules
npm install
npm run build
```

### Erreur "Cannot connect to API"

```bash
# Vérifier NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_URL

# Tester l'API
curl $NEXT_PUBLIC_API_URL/health
```

### Images ne se chargent pas

```bash
# Vérifier next.config.js
# Ajouter le domaine dans images.domains
```

### CORS Errors

Si l'API et le Web sont sur des domaines différents, configurer CORS dans l'API :

```typescript
// NestJS main.ts
app.enableCors({
  origin: ['https://tappplus.com', 'https://www.tappplus.com'],
  credentials: true,
});
```

### Performance lente

```bash
# Analyser le bundle
ANALYZE=true npm run build

# Vérifier Web Vitals
# Utiliser Lighthouse dans Chrome DevTools
```

## 🔐 Sécurité Production

### Checklist

- [ ] HTTPS activé
- [ ] Security headers configurés (Nginx)
- [ ] CSP (Content Security Policy) configuré
- [ ] Rate limiting (Nginx ou Cloudflare)
- [ ] Pas de secrets dans le code client
- [ ] Variables NEXT_PUBLIC_* minimales
- [ ] Validation côté serveur (API)

### Content Security Policy

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.tappplus.com;
  frame-ancestors 'none';
" always;
```

## 🚀 CI/CD

### GitHub Actions

`.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📦 Mise à Jour

### Rolling Update (Docker)

```bash
# 1. Pull nouvelle version
git pull origin main

# 2. Build
docker-compose build web

# 3. Redémarrer
docker-compose up -d --no-deps web
```

### Zero-Downtime Update (PM2)

```bash
# Pull code
git pull origin main

# Install deps
npm install

# Build
npm run build

# Reload avec PM2
pm2 reload tappplus-web --update-env
```

## 📞 Support

Pour toute question :
- Documentation : [README.md](./README.md)
- API Documentation : [tappplus-api](https://github.com/your-org/tappplus-api)
- Issues : https://github.com/your-org/tappplus-web/issues
