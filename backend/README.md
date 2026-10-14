# 🚀 Backend - Plateforme de Recrutement IA
## Guide pas à pas pour un développeur débutant

---

## 📁 Structure du projet

```
backend/
├── server.js            ← TON FICHIER PRINCIPAL (point d'entrée du serveur)
├── package.json         ← Liste des dépendances et scripts npm
├── .env.example         ← Modèle pour ton fichier .env (à copier !)
├── .gitignore           ← Fichiers à ne pas mettre sur GitHub
└── prisma/
    └── schema.prisma    ← Plan de ta base de données
```

---

## ⚙️ ÉTAPES D'INSTALLATION (à faire une seule fois)

### 1. Installer les dépendances Node.js

Ouvre ton terminal dans le dossier `backend/` et tape :

```bash
npm install
```

💡 Cette commande lit `package.json` et télécharge toutes les bibliothèques
   dans un dossier `node_modules/`. Ça peut prendre 1-2 minutes.

---

### 2. Configurer ta base de données

Copie le fichier `.env.example` en `.env` :

```bash
# Sur Mac/Linux :
cp .env.example .env

# Sur Windows :
copy .env.example .env
```

Puis ouvre `.env` et remplis ton URL PostgreSQL :

```
DATABASE_URL="postgresql://postgres:tonmotdepasse@localhost:5432/recrutement_ia?schema=public"
```

---

### 3. Générer le client Prisma

```bash
npx prisma generate
```

💡 Cette commande lit ton `schema.prisma` et génère les fichiers JavaScript
   qui te permettent d'appeler `prisma.job.findMany()` etc.

---

### 4. Créer les tables dans PostgreSQL

```bash
npx prisma migrate dev --name init
```

💡 Cette commande crée physiquement la table `Job` dans ta base de données PostgreSQL.
   "init" est juste un nom pour identifier cette migration.

---

## 🚀 LANCER LE SERVEUR

### Mode développement (recommandé) — Redémarre automatiquement à chaque modification

```bash
npm run dev
```

### Mode normal — Lance le serveur une seule fois

```bash
npm start
```

### Tu devrais voir dans ton terminal :

```
🚀 Serveur démarré avec succès !
📡 Écoute sur : http://localhost:3000
🔗 Test rapide : http://localhost:3000/
💼 Liste des jobs : http://localhost:3000/api/jobs
```

---

## ✅ VÉRIFIER QUE ÇA FONCTIONNE

### Dans ton navigateur :

1. **Ouvre** `http://localhost:3000/`
   → Tu dois voir : `Backend Running ✅`

2. **Ouvre** `http://localhost:3000/api/jobs`
   → Tu dois voir : `[]` (tableau vide, normal si tu n'as pas encore de données)

### Optionnel - Ajouter des données de test avec Prisma Studio :

```bash
npx prisma studio
```

Cela ouvre une interface visuelle dans ton navigateur pour ajouter/modifier
des données directement dans ta base de données. Super utile pour tester !

---

## 🐛 PROBLÈMES COURANTS

| Erreur | Cause probable | Solution |
|--------|---------------|----------|
| `Cannot find module 'express'` | npm install pas fait | Lancer `npm install` |
| `ECONNREFUSED` | PostgreSQL éteint | Démarrer PostgreSQL |
| `Invalid URL` | .env mal configuré | Vérifier DATABASE_URL dans .env |
| `Port 3000 already in use` | Un autre serveur tourne | Changer PORT=3001 dans .env |

---

## 📚 Récap des commandes importantes

```bash
npm install                              # Installer les dépendances
npx prisma generate                      # Régénérer le client Prisma
npx prisma migrate dev --name <nom>      # Créer/mettre à jour les tables BDD
npx prisma studio                        # Interface visuelle de la BDD
npm run dev                              # Lancer le serveur (mode développement)
npm start                                # Lancer le serveur (mode production)
```
