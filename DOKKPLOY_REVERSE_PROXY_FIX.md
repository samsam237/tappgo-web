# Solution : Bad Gateway malgré serveur fonctionnel

Votre serveur Next.js fonctionne correctement (logs montrent `Ready on http://0.0.0.0:5500`), mais vous obtenez une erreur "Bad Gateway". Cela signifie que le problème vient de la configuration du reverse proxy dans Dokploy.

## ✅ Votre Serveur Fonctionne

Les logs confirment :
```
✓ Ready in 186ms
- Network: http://0.0.0.0:5500
```

Le serveur écoute correctement sur toutes les interfaces réseau.

## 🔍 Problème : Configuration du Reverse Proxy

L'erreur "Bad Gateway" (502) indique que le reverse proxy (Nginx/Traefik) ne peut pas communiquer avec votre conteneur.

## 🛠️ Solutions dans Dokploy

### 1. Vérifier le Port Interne

Dans la configuration de votre application dans Dokploy :

1. Allez dans les **Settings** de votre application
2. Vérifiez la section **Ports** ou **Network**
3. Assurez-vous que le **port interne** est bien **5500**

### 2. Vérifier le Reverse Proxy

Dans Dokploy, vérifiez la configuration du reverse proxy :

#### Si vous utilisez un domaine personnalisé :

1. Allez dans **Domains** ou **Ingress**
2. Vérifiez que le domaine pointe vers votre application
3. Vérifiez que le **port backend** est **5500**

#### Configuration attendue :

```
Domain: votre-domaine.com
Backend Port: 5500
Protocol: http (ou https si SSL)
```

### 3. Vérifier le Health Check

Le healthcheck peut bloquer le reverse proxy si il échoue :

1. Vérifiez que le healthcheck passe dans Dokploy
2. Attendez au moins 40 secondes après le démarrage
3. Si le healthcheck échoue, vérifiez les logs

### 4. Vérifier les Variables d'Environnement du Reverse Proxy

Certaines configurations Dokploy nécessitent des variables spécifiques pour le reverse proxy. Vérifiez la documentation Dokploy pour votre configuration.

## 🔧 Actions Immédiates

### Option 1 : Vérifier le Port dans Dokploy

1. Ouvrez votre application dans Dokploy
2. Allez dans **Settings** → **Ports** (ou équivalent)
3. Vérifiez que :
   - Port interne : `5500`
   - Port externe : `80` ou `443` (selon votre config)

### Option 2 : Redémarrer le Reverse Proxy

1. Dans Dokploy, redémarrez le reverse proxy
2. Ou redéployez votre application

### Option 3 : Vérifier les Logs du Reverse Proxy

Dans Dokploy, consultez les logs du reverse proxy (Nginx/Traefik) pour voir les erreurs exactes.

## 📋 Checklist

- [ ] Le serveur Next.js démarre correctement (✅ confirmé par vos logs)
- [ ] Le port interne est configuré sur **5500** dans Dokploy
- [ ] Le reverse proxy pointe vers le port **5500**
- [ ] Le healthcheck passe (attendre 40 secondes)
- [ ] Le domaine/URL est correctement configuré
- [ ] Le reverse proxy a été redémarré après les changements

## 🎯 Test Direct

Pour confirmer que le problème vient du reverse proxy, testez directement le conteneur :

Si vous avez accès SSH au serveur Dokploy :

```bash
# Trouver l'ID du conteneur
docker ps | grep tappplus-web

# Tester directement le conteneur
curl http://localhost:5500
# ou
docker exec <container-id> curl http://localhost:5500
```

Si cette commande fonctionne, le problème vient définitivement du reverse proxy.

## 📞 Prochaines Étapes

1. **Vérifiez le port interne** dans la configuration Dokploy
2. **Vérifiez la configuration du reverse proxy** (domaine, port backend)
3. **Redémarrez le reverse proxy** ou redéployez l'application
4. **Consultez les logs du reverse proxy** pour plus de détails

Si le problème persiste, partagez :
- La configuration du port dans Dokploy
- La configuration du domaine/reverse proxy
- Les logs du reverse proxy (si disponibles)

