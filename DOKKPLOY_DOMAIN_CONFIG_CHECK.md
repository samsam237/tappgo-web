# Vérification Configuration Domaine Dokploy

Votre configuration semble correcte :
- ✅ Host: `app.tappgo.net`
- ✅ Container Port: `5500`
- ✅ Path: `/`
- ✅ Internal Path: `/`

## 🔍 Points à Vérifier

### 1. Healthcheck

Le healthcheck peut bloquer le reverse proxy s'il échoue. Vérifiez dans Dokploy :

1. Allez dans votre application
2. Vérifiez l'état du healthcheck
3. Attendez au moins 40 secondes après le démarrage (start-period)

Si le healthcheck échoue, le reverse proxy peut refuser de router les requêtes.

### 2. Vérifier que le Serveur Répond

Testez directement depuis l'intérieur du conteneur (si vous avez accès SSH) :

```bash
# Trouver le conteneur
docker ps | grep tappplus-web

# Tester depuis l'extérieur du conteneur
curl http://localhost:5500

# Ou depuis l'intérieur
docker exec <container-id> curl http://localhost:5500
```

### 3. Vérifier les Logs du Reverse Proxy

Dans Dokploy, consultez les logs du reverse proxy (Nginx/Traefik) pour voir les erreurs exactes. Les logs devraient montrer quelque chose comme :

```
502 Bad Gateway
upstream connection failed
```

### 4. Vérifier le Timing

Le serveur Next.js démarre en 186ms, mais le reverse proxy peut essayer de se connecter avant. Vérifiez :

1. Le healthcheck a-t-il le temps de passer ?
2. Y a-t-il un délai de démarrage configuré ?

### 5. Vérifier les Variables d'Environnement

Assurez-vous que ces variables sont bien définies dans "Environment Settings" :

```
PORT=5500
HOST=0.0.0.0
HOSTNAME=0.0.0.0
NODE_ENV=production
```

## 🛠️ Solutions à Essayer

### Solution 1 : Redémarrer le Reverse Proxy

1. Dans Dokploy, redémarrez le reverse proxy
2. Ou redéployez votre application

### Solution 2 : Vérifier le Healthcheck

Si le healthcheck échoue, essayez de le désactiver temporairement pour tester, ou augmentez le `start-period`.

### Solution 3 : Vérifier les Logs en Temps Réel

Surveillez les logs du conteneur ET du reverse proxy en même temps pour voir ce qui se passe lors d'une requête.

### Solution 4 : Tester avec curl depuis le Serveur

Si vous avez accès SSH au serveur Dokploy :

```bash
# Tester directement le conteneur
curl -v http://localhost:5500

# Tester via le reverse proxy interne
curl -v http://app.tappgo.net
```

## 📋 Checklist Complète

- [ ] Container Port est à **5500** ✅ (confirmé)
- [ ] Le serveur démarre correctement ✅ (confirmé par les logs)
- [ ] Le healthcheck passe (vérifier dans Dokploy)
- [ ] Les variables d'environnement sont définies (PORT, HOST, etc.)
- [ ] Le reverse proxy a été redémarré après configuration
- [ ] Les logs du reverse proxy ont été consultés
- [ ] Test direct du conteneur fonctionne (curl localhost:5500)

## 🎯 Prochaines Étapes

1. **Vérifiez le healthcheck** dans Dokploy - est-il vert/passant ?
2. **Consultez les logs du reverse proxy** - quelles erreurs voyez-vous ?
3. **Testez directement le conteneur** - `curl http://localhost:5500` fonctionne-t-il ?
4. **Redémarrez le reverse proxy** ou redéployez l'application

## 💡 Diagnostic Rapide

Si vous pouvez accéder au serveur Dokploy via SSH, exécutez :

```bash
# 1. Trouver le conteneur
CONTAINER_ID=$(docker ps | grep tappplus-web | awk '{print $1}')

# 2. Tester le conteneur directement
docker exec $CONTAINER_ID curl -s http://localhost:5500 | head -20

# 3. Vérifier les variables d'environnement
docker exec $CONTAINER_ID env | grep -E "PORT|HOST"

# 4. Vérifier que le port est bien ouvert
docker exec $CONTAINER_ID netstat -tlnp | grep 5500
```

Ces commandes vous diront si le problème vient du conteneur ou du reverse proxy.

