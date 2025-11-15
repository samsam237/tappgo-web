# Dépannage : Erreur Bad Gateway (502)

Ce guide vous aide à diagnostiquer et résoudre l'erreur "Bad Gateway" avec votre application Next.js déployée sur Dokploy.

## 🔍 Étapes de Diagnostic

### 1. Vérifier les Logs du Conteneur

Dans Dokploy, allez dans les logs de votre application et vérifiez :

```bash
# Cherchez ces messages dans les logs :
- "Ready on http://0.0.0.0:5500" ✅ (Le serveur démarre correctement)
- "Error: Cannot find module" ❌ (Problème de dépendances)
- "EADDRINUSE" ❌ (Le port est déjà utilisé)
- "Error: server.js not found" ❌ (Problème de build)
```

### 2. Vérifier que le Serveur Écoute sur le Bon Port

Les logs devraient afficher :
```
- ▲ Next.js 14.x.x
- - Local:        http://localhost:5500
- - Ready in X ms
```

Si vous voyez `http://127.0.0.1:5500` ou `http://localhost:5500` sans `0.0.0.0`, le serveur n'écoute pas sur toutes les interfaces.

### 3. Vérifier les Variables d'Environnement

Dans Dokploy, vérifiez que ces variables sont définies dans **"Environment Settings"** :

```
PORT=5500
HOST=0.0.0.0
HOSTNAME=0.0.0.0
NODE_ENV=production
```

**Important** : `HOST=0.0.0.0` est **obligatoire**. Sans cette variable, le serveur écoute seulement sur localhost et n'est pas accessible depuis l'extérieur.

### 4. Vérifier le Mapping de Port

Dans Dokploy, vérifiez la configuration du port :
- Le port **interne** du conteneur doit être **5500**
- Le port **externe** peut être 80, 443, ou tout autre port selon votre configuration

Exemple de mapping correct :
```
Port externe: 80 → Port interne: 5500
```

### 5. Vérifier que le Build a Réussi

Vérifiez les logs de build dans Dokploy. Le build doit se terminer sans erreur.

Si vous voyez des erreurs comme :
- `Error: Cannot find module`
- `Build failed`
- `server.js not found`

Le problème vient du build, pas du runtime.

## 🛠️ Solutions par Problème

### Problème 1 : Le serveur n'écoute pas sur 0.0.0.0

**Symptôme** : Les logs montrent `http://localhost:5500` ou `http://127.0.0.1:5500`

**Solution** :
1. Ajoutez `HOST=0.0.0.0` dans "Environment Settings" de Dokploy
2. Redémarrez le conteneur
3. Vérifiez les logs - vous devriez voir `http://0.0.0.0:5500`

### Problème 2 : Le port est incorrect

**Symptôme** : Le serveur écoute sur un port différent de 5500

**Solution** :
1. Vérifiez que `PORT=5500` est défini dans "Environment Settings"
2. Vérifiez le mapping de port dans Dokploy
3. Redémarrez le conteneur

### Problème 3 : Le serveur ne démarre pas

**Symptôme** : Les logs montrent une erreur au démarrage

**Solutions possibles** :

#### A. Fichier server.js introuvable
```bash
# Vérifiez dans les logs :
Error: Cannot find module './server.js'
```

**Solution** : Le build standalone n'a pas fonctionné. Vérifiez :
- Que `output: 'standalone'` est dans `next.config.js`
- Que le build s'est terminé sans erreur
- Rebuild l'application

#### B. Erreur de permissions
```bash
# Vérifiez dans les logs :
EACCES: permission denied
```

**Solution** : Les permissions sont correctement configurées dans le Dockerfile. Si le problème persiste, vérifiez les logs de build.

#### C. Port déjà utilisé
```bash
# Vérifiez dans les logs :
EADDRINUSE: address already in use :::5500
```

**Solution** : Un autre processus utilise le port 5500. Changez le port ou arrêtez l'autre processus.

### Problème 4 : Le healthcheck échoue

**Symptôme** : Le conteneur démarre mais le healthcheck échoue

**Solution** :
1. Attendez au moins 40 secondes après le démarrage (start-period)
2. Vérifiez que le serveur répond sur `http://localhost:5500` dans le conteneur
3. Vérifiez les logs pour voir si le serveur démarre correctement

### Problème 5 : Bad Gateway persistant

**Symptôme** : Toutes les vérifications passent mais Bad Gateway persiste

**Solutions** :

1. **Vérifier le reverse proxy** (si vous utilisez Nginx/Traefik) :
   - Vérifiez que le reverse proxy pointe vers le bon port
   - Vérifiez la configuration du proxy

2. **Tester directement le conteneur** :
   ```bash
   # Dans Dokploy, exécutez une commande dans le conteneur
   curl http://localhost:5500
   ```
   Si ça fonctionne, le problème vient du reverse proxy, pas du conteneur.

3. **Vérifier les variables d'environnement** :
   - Assurez-vous que toutes les variables sont définies
   - Redémarrez le conteneur après avoir ajouté/modifié des variables

## 📋 Checklist Complète

- [ ] `HOST=0.0.0.0` est défini dans "Environment Settings"
- [ ] `PORT=5500` est défini dans "Environment Settings"
- [ ] Le mapping de port est correct (externe:interne)
- [ ] Le build s'est terminé sans erreur
- [ ] Les logs montrent "Ready on http://0.0.0.0:5500"
- [ ] Le healthcheck passe (attendre 40 secondes)
- [ ] Le conteneur est en état "Running"
- [ ] Le reverse proxy (si utilisé) pointe vers le bon port

## 🔧 Commandes de Diagnostic

Si vous avez accès SSH au serveur Dokploy :

```bash
# Vérifier que le conteneur tourne
docker ps | grep tappplus-web

# Voir les logs en temps réel
docker logs -f <container-id>

# Tester depuis l'intérieur du conteneur
docker exec -it <container-id> sh
curl http://localhost:5500

# Vérifier les variables d'environnement
docker exec <container-id> env | grep -E "PORT|HOST"
```

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. Collectez les logs complets du conteneur
2. Vérifiez la configuration Dokploy (ports, variables d'environnement)
3. Vérifiez la configuration du reverse proxy (si utilisé)
4. Vérifiez les logs de build

