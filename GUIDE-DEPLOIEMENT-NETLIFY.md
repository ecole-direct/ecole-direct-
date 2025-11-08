# Guide de déploiement et mise à jour sur Netlify

## ⚠️ IMPORTANT : Les modifications locales ne se synchronisent PAS automatiquement

Quand je modifie les fichiers sur votre ordinateur, **ces changements restent locaux**. Pour qu'ils apparaissent sur Netlify, vous devez **redéployer le site**.

## 📋 Méthodes de déploiement sur Netlify

### Méthode 1 : Déploiement manuel (Simple)

1. **Aller sur Netlify :** https://app.netlify.com
2. **Sélectionner votre site** (ou créer un nouveau site)
3. **Cliquer sur "Deploys"** dans le menu
4. **Glisser-déposer le dossier `ecole`** dans la zone de déploiement
5. Netlify déploiera automatiquement les nouvelles versions

### Méthode 2 : Déploiement via Git (Recommandé pour les mises à jour fréquentes)

1. **Créer un compte GitHub** (si vous n'en avez pas)
2. **Créer un nouveau repository** sur GitHub
3. **Uploader le dossier `ecole`** dans le repository
4. **Sur Netlify :**
   - Aller dans "Site settings" → "Build & deploy"
   - Connecter votre repository GitHub
   - Configurer :
     - **Build command :** (laisser vide)
     - **Publish directory :** `ecole`
   - Cliquer sur "Deploy site"

5. **Pour chaque mise à jour :**
   - Je modifie les fichiers localement
   - Vous faites : `git add .` → `git commit -m "Mise à jour"` → `git push`
   - Netlify redéploiera automatiquement !

### Méthode 3 : Netlify CLI (Pour les développeurs)

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Dans le dossier ecole
cd ecole
netlify deploy --prod
```

## 🔄 Processus de mise à jour

**À chaque fois que je modifie quelque chose :**

1. ✅ Je modifie les fichiers dans le dossier `ecole` sur votre ordinateur
2. ⚠️ **VOUS devez redéployer sur Netlify** pour que les changements apparaissent en ligne
3. 📤 Utilisez une des méthodes ci-dessus pour redéployer

## 📁 Structure du site

```
ecole/
├── index.html              (Page de connexion)
├── dashboard-admin.html    (Dashboard admin)
├── dashboard-prof.html     (Dashboard professeur)
├── dashboard-eleve.html    (Dashboard élève)
├── script.js               (Script principal)
├── admin.js               (Script admin)
├── prof.js                 (Script professeur)
├── eleve.js                (Script élève)
└── style.css               (Styles CSS)
```

## ✅ Vérification après déploiement

Après chaque déploiement, vérifiez que :
- La page de connexion s'affiche correctement
- Les identifiants fonctionnent
- Les dashboards se chargent
- Toutes les fonctionnalités marchent

## 🆘 En cas de problème

Si le site ne fonctionne pas après déploiement :
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs de déploiement sur Netlify
3. Assurez-vous que tous les fichiers sont bien uploadés

