# JobBoard – plateforme de recrutement avec score IA

Application React + Express + PostgreSQL (Prisma). Le recruteur publie des offres, le candidat envoie son CV après avoir vu son score de correspondance (Groq / Llama 3.3).

## Démarrage

### 1. Backend
```bash
cd backend
cp .env.example .env        # puis remplissez DATABASE_URL, JWT_SECRET, GROQ_API_KEY, EMAIL_*
npm install
npx prisma migrate deploy   # applique la migration (nouveaux champs d'offre + suivi des candidatures)
npx prisma generate
npm run seed                # optionnel : comptes et offres de démo
npm start                   # ou : node server.js  (http://localhost:5000)
```

### 2. Frontend
```bash
cd frontend
npm install
npm start                   # http://localhost:3000
```
Pour un autre backend, créez `frontend/.env` avec `REACT_APP_API_URL=https://votre-api`.

Comptes de démo (après `npm run seed`, mot de passe `password123`) : `recruteur@demo.tn` et `candidat@demo.tn`.

## Fonctionnalités

**Recruteur** : créer une offre (publiée ou en brouillon), modifier, clôturer / rouvrir / publier, supprimer ; badge **New** pendant 24 h après la mise en ligne ; page **Candidats** (classement par score, statut, ouverture du CV) ; page **Rapports** (candidatures sur 14 jours, qualité des profils, suivi, offres les plus suivies).

**Candidat** : liste des offres avec filtres, offres sauvegardées, analyse du CV avant envoi (score minimum pour postuler : `MIN_SCORE` dans `frontend/src/utils.js`), page **Mes candidatures** avec le statut donné par le recruteur.

## Notes techniques
- Les CV sont lus côté serveur (PDF avec `unpdf`, Word `.docx` avec `mammoth`) avant d'être envoyés au modèle.
- Toutes les routes recruteur et candidat exigent le token JWT ; un recruteur ne voit et ne modifie que ses propres offres.
- `node_modules` ne doit pas être versionné (voir les `.gitignore`).
