# Déploiement avec Domaines Différents (Sans Reverse Proxy)

Ce guide explique comment déployer le frontend et l'API sur des VPS différents avec des domaines différents, **sans utiliser de reverse proxy**.

## 📋 Architecture

```
Frontend: https://app.example.com (VPS 1)
API:      https://api.example.com (VPS 2)
```

## ✅ Avantages

- **Flexibilité** : Déploiement indépendant du frontend et de l'API
- **Scalabilité** : Possibilité de scaler chaque service indépendamment
- **Sécurité** : Isolation des services
- **Simplicité** : Pas besoin de configurer Nginx comme reverse proxy

## ⚙️ Configuration

### 1. Configuration du Frontend

Définissez la variable d'environnement `NEXT_PUBLIC_API_URL` avec l'URL complète de votre API :

```bash
# .env.local (développement)
NEXT_PUBLIC_API_URL=https://api.example.com

# Ou lors du build Docker
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t tappplus-web:latest \
  .

# Ou lors de l'exécution
docker run -d \
  --name tappplus-web \
  -p 5500:5500 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  tappplus-web:latest
```

### 2. Configuration CORS sur le Backend

**IMPORTANT** : Vous devez configurer CORS sur votre backend pour autoriser les requêtes depuis votre domaine frontend.

#### Exemple avec NestJS :

```typescript
// main.ts
app.enableCors({
  origin: [
    'https://app.example.com',
    'http://localhost:5500', // Pour le développement
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

#### Exemple avec Express :

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://app.example.com',
    'http://localhost:5500',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### 3. Configuration SSL/HTTPS

Assurez-vous que les deux domaines utilisent HTTPS :

```bash
# Frontend
https://app.example.com

# API
https://api.example.com
```

Utilisez Let's Encrypt pour obtenir des certificats SSL gratuits :

```bash
# Sur chaque VPS
sudo apt install certbot
sudo certbot --nginx -d app.example.com
sudo certbot --nginx -d api.example.com
```

## 🚀 Déploiement

### Frontend (VPS 1)

```bash
# 1. Cloner le repository
git clone https://github.com/your-org/tappplus-web.git
cd tappplus-web

# 2. Créer le fichier .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=TappPlus
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF

# 3. Build et démarrer
npm install
npm run build
npm start

# Ou avec Docker
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t tappplus-web:latest \
  .

docker run -d \
  --name tappplus-web \
  -p 5500:5500 \
  --restart unless-stopped \
  tappplus-web:latest
```

### API (VPS 2)

Déployez votre API backend normalement, en vous assurant que CORS est configuré correctement.

## 🔍 Vérification

### 1. Vérifier que le frontend pointe vers la bonne API

Ouvrez la console du navigateur et vérifiez les requêtes réseau. Elles devraient aller vers `https://api.example.com/api/v1/...`

### 2. Vérifier CORS

Si vous voyez des erreurs CORS dans la console, vérifiez :
- Que le backend autorise votre domaine frontend
- Que les headers CORS sont correctement configurés
- Que les méthodes HTTP sont autorisées

### 3. Tester la connexion

```bash
# Depuis le frontend
curl https://api.example.com/api/v1/health

# Depuis le navigateur (console)
fetch('https://api.example.com/api/v1/health')
  .then(r => r.json())
  .then(console.log)
```

## 🐛 Dépannage

### Erreur CORS

**Symptôme** : `Access-Control-Allow-Origin` error dans la console

**Solution** :
1. Vérifiez que le backend autorise votre domaine frontend
2. Vérifiez que les headers CORS incluent `Authorization` si vous utilisez JWT
3. Vérifiez que la méthode HTTP est autorisée (GET, POST, etc.)

### Erreur 404

**Symptôme** : Les requêtes retournent 404

**Solution** :
1. Vérifiez que `NEXT_PUBLIC_API_URL` est correctement défini
2. Vérifiez que l'URL de l'API est accessible depuis le navigateur
3. Vérifiez que le chemin de l'API est correct (`/api/v1/...`)

### Erreur de certificat SSL

**Symptôme** : Erreurs de certificat SSL

**Solution** :
1. Assurez-vous que les deux domaines utilisent HTTPS
2. Vérifiez que les certificats SSL sont valides
3. Utilisez Let's Encrypt pour des certificats gratuits

## 📊 Comparaison des Approches

| Aspect | Domaines Différents | Reverse Proxy |
|--------|---------------------|---------------|
| **Complexité** | Moyenne (CORS à configurer) | Élevée (Nginx à configurer) |
| **Flexibilité** | ✅ Très flexible | ⚠️ Moins flexible |
| **Scalabilité** | ✅ Excellente | ⚠️ Dépend du proxy |
| **Sécurité** | ✅ Isolation | ⚠️ Point unique d'entrée |
| **Performance** | ✅ Direct | ⚠️ Latence du proxy |
| **CORS** | ⚠️ Nécessaire | ✅ Pas nécessaire |

## 🔐 Sécurité

### Recommandations

1. **HTTPS uniquement** : Utilisez HTTPS pour les deux domaines
2. **CORS strict** : Autorisez uniquement votre domaine frontend
3. **Headers de sécurité** : Configurez les headers de sécurité sur le backend
4. **Rate limiting** : Implémentez le rate limiting sur l'API
5. **Authentification** : Utilisez JWT avec des tokens sécurisés

### Exemple de configuration CORS sécurisée

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'https://app.example.com',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 heures
});
```

## 📝 Notes

- Le proxy Next.js (`src/app/api/v1/[...path]/route.ts`) n'est **pas utilisé** quand `NEXT_PUBLIC_API_URL` est défini
- Les requêtes sont faites **directement** depuis le navigateur vers l'API
- Assurez-vous que le backend est **accessible publiquement** (ou via VPN si nécessaire)
- Pour le développement local, vous pouvez toujours utiliser `http://localhost:5550`

