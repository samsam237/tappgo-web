# Configuration Dokploy pour TappPlus Web

Ce guide explique comment configurer correctement les variables d'environnement dans Dokploy pour ce projet.

## ⚠️ Important : Variables Build-time vs Runtime

Les variables `NEXT_PUBLIC_*` sont des **variables de build-time** pour Next.js. Elles sont intégrées dans le bundle JavaScript au moment du build et **ne peuvent pas être changées au runtime**.

## 🔧 Configuration dans Dokploy

### 1. Variables Build Arguments (OBLIGATOIRE)

Dans Dokploy, vous devez configurer ces variables dans la section **"Build Arguments"** (pas dans "Environment Variables") :

```
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
NEXT_PUBLIC_APP_NAME=TappPlus
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Où les trouver dans Dokploy :**
- Allez dans votre application
- Section "Build Settings" ou "Build Arguments"
- Ajoutez les variables ci-dessus

### 2. Variables Runtime (Optionnel)

Ces variables peuvent être définies au runtime dans la section **"Environment Variables"** :

```
PORT=5500
HOSTNAME=0.0.0.0
NODE_ENV=production
```

## 📋 Checklist de Configuration

- [ ] `NEXT_PUBLIC_API_URL` est défini dans **Build Arguments**
- [ ] `NEXT_PUBLIC_APP_NAME` est défini dans **Build Arguments** (optionnel, défaut: TappPlus)
- [ ] `NEXT_PUBLIC_APP_VERSION` est défini dans **Build Arguments** (optionnel, défaut: 1.0.0)
- [ ] Le port est configuré (défaut: 5500)
- [ ] Le stage de build est défini sur `production`

## 🔍 Vérification

Après le déploiement, vérifiez que les variables sont correctement intégrées :

1. **Inspecter le bundle** : Ouvrez les DevTools du navigateur
2. **Vérifier la console** : Les variables `NEXT_PUBLIC_*` devraient être visibles dans le code
3. **Tester l'API** : Vérifiez que les requêtes vont vers la bonne URL

## ❌ Erreurs Courantes

### Erreur : "Cannot connect to API"

**Cause** : `NEXT_PUBLIC_API_URL` n'a pas été passé comme build argument

**Solution** : 
1. Vérifiez que la variable est dans "Build Arguments" et non "Environment Variables"
2. Rebuild l'application après avoir ajouté la variable

### Erreur : Variables non prises en compte

**Cause** : Les variables ont été ajoutées après le build

**Solution** : 
- Les variables `NEXT_PUBLIC_*` doivent être définies **avant** le build
- Si vous changez ces variables, vous devez **rebuild** l'application

## 🚀 Workflow Recommandé

1. **Configuration initiale** :
   - Définissez toutes les variables `NEXT_PUBLIC_*` dans Build Arguments
   - Configurez les variables runtime si nécessaire

2. **Premier déploiement** :
   - Dokploy va build l'image avec les build arguments
   - L'application sera déployée avec les bonnes variables

3. **Mise à jour des variables** :
   - Si vous changez `NEXT_PUBLIC_*`, vous devez rebuild
   - Dokploy devrait détecter les changements et rebuild automatiquement

## 📝 Exemple de Configuration Dokploy

### Build Arguments
```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=TappPlus
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Environment Variables (Runtime)
```
PORT=5500
HOSTNAME=0.0.0.0
NODE_ENV=production
```

### Dockerfile Target
```
production
```

## 🔗 Ressources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Docker Build Arguments](https://docs.docker.com/engine/reference/builder/#arg)
- [Dokploy Documentation](https://dokploy.com/docs)

