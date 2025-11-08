# Guide de déploiement - Site École

## Fichiers inclus

- `index.html` - Page de connexion (prof, élève, admin)
- `dashboard-admin.html` - Dashboard administrateur
- `dashboard-prof.html` - Dashboard professeur
- `dashboard-eleve.html` - Dashboard élève
- `script.js` - Script principal (authentification, navigation)
- `admin.js` - Script pour le dashboard admin
- `prof.js` - Script pour le dashboard professeur
- `eleve.js` - Script pour le dashboard élève
- `style.css` - Styles CSS pour tout le site

## Instructions pour Netlify

1. **Déployer sur Netlify :**
   - Connectez-vous à Netlify
   - Cliquez sur "Add new site" → "Deploy manually"
   - Glissez-déposez le dossier `ecole` ou l'archive ZIP
   - Netlify déploiera automatiquement le site

2. **Configuration :**
   - **Page d'accueil :** `index.html`
   - **Build command :** (aucun, site statique)
   - **Publish directory :** `ecole`

3. **Fonctionnalités :**
   - ✅ Authentification (admin, prof, élève)
   - ✅ Gestion des devoirs
   - ✅ Gestion des notes
   - ✅ Gestion des élèves
   - ✅ Gestion des classes (CE1, CE2)
   - ✅ Emploi du temps
   - ✅ Stockage local (localStorage)

## Identifiants par défaut

- **Admin :** admin / admin123
- **Professeur :** alexiag / alexiagoletto
- **Élève :** gaia / gaia123 (ou autres prénoms)

## Classes disponibles

- CE1
- CE2

## Notes importantes

- Le site utilise localStorage pour stocker les données
- Les données sont stockées localement dans le navigateur
- Pour un déploiement en production, il faudrait une base de données backend

