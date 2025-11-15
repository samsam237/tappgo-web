# Dépannage du Healthcheck

## ✅ Votre Dockerfile a un Healthcheck

Le Dockerfile définit un healthcheck qui vérifie que le serveur répond sur le port 5500 :

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5500/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

## 🔍 Comment Vérifier le Healthcheck

### Dans Dokploy

1. Allez dans votre application
2. Regardez l'état du conteneur
3. Vérifiez l'état du healthcheck :
   - ✅ **healthy** : Le healthcheck passe
   - ⚠️ **starting** : En attente (pendant les 40 premières secondes)
   - ❌ **unhealthy** : Le healthcheck échoue

### Via Docker (si vous avez accès SSH)

```bash
# Voir l'état du healthcheck
docker ps
# La colonne STATUS montre l'état : "healthy", "unhealthy", ou "starting"

# Voir les détails du healthcheck
docker inspect <container-id> | grep -A 10 Health
```

## ⚠️ Problèmes Possibles

### 1. Le Healthcheck Échoue

**Symptôme** : Le conteneur est marqué comme "unhealthy"

**Causes possibles** :
- Le serveur ne démarre pas assez vite
- Le serveur ne répond pas sur `http://localhost:5500/`
- Le serveur retourne un code HTTP différent de 200

**Solution** :
1. Vérifiez les logs du conteneur - le serveur démarre-t-il ?
2. Testez manuellement : `docker exec <container-id> curl http://localhost:5500`
3. Augmentez le `start-period` si le serveur met plus de 40 secondes à démarrer

### 2. Le Reverse Proxy Attend le Healthcheck

**Symptôme** : Bad Gateway même si le serveur fonctionne

**Cause** : Certains reverse proxy (comme Traefik) attendent que le healthcheck passe avant de router les requêtes

**Solution** :
1. Attendez que le healthcheck passe (vérifiez dans Dokploy)
2. Si le healthcheck échoue, corrigez-le (voir ci-dessus)
3. Si nécessaire, désactivez temporairement le healthcheck pour tester

## 🛠️ Solutions

### Solution 1 : Vérifier que le Serveur Répond

Testez manuellement le healthcheck :

```bash
# Depuis l'intérieur du conteneur
docker exec <container-id> node -e "require('http').get('http://localhost:5500/', (r) => {console.log('Status:', r.statusCode); process.exit(r.statusCode === 200 ? 0 : 1)})"
```

Si cette commande échoue, le problème vient du serveur, pas du healthcheck.

### Solution 2 : Augmenter le Start Period

Si le serveur met plus de 40 secondes à démarrer, augmentez le `start-period` :

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5500/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### Solution 3 : Désactiver Temporairement le Healthcheck

Pour tester si le healthcheck est la cause du problème, vous pouvez temporairement le désactiver :

```dockerfile
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#     CMD node -e "require('http').get('http://localhost:5500/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**⚠️ Attention** : Ne laissez pas le healthcheck désactivé en production. C'est une fonctionnalité importante pour Docker et les orchestrateurs.

### Solution 4 : Améliorer le Healthcheck

Si le serveur retourne un code différent de 200 (par exemple 307 pour une redirection), ajustez le healthcheck :

```dockerfile
# Accepter les codes 200, 301, 302, 307
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5500/', (r) => {const code = r.statusCode; process.exit([200, 301, 302, 307].includes(code) ? 0 : 1)})"
```

## 📋 Checklist

- [ ] Le serveur démarre correctement (confirmé par vos logs)
- [ ] Le serveur écoute sur `0.0.0.0:5500` (confirmé par vos logs)
- [ ] Le healthcheck passe (vérifier dans Dokploy)
- [ ] Le serveur répond à `http://localhost:5500/` (tester manuellement)
- [ ] Le reverse proxy attend que le healthcheck passe

## 🎯 Prochaines Étapes

1. **Vérifiez l'état du healthcheck** dans Dokploy
2. **Attendez au moins 40 secondes** après le démarrage
3. **Testez manuellement** : `docker exec <container-id> curl http://localhost:5500`
4. **Consultez les logs** pour voir si le serveur répond correctement

Si le healthcheck est "unhealthy", c'est probablement la cause du Bad Gateway.

