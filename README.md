# OfferTrail 🧭

## 🧭 OfferTrail, pour suivre ses candidatures sans perdre le fil

**CRM local-first pour piloter ses candidatures CDI et freelance**  
Centraliser, suivre, relancer, mesurer, garder l'historique. Simple, lisible, utile 🙂

---

## ✨ Pourquoi OfferTrail ?

La recherche d'emploi devient vite brouillonne :
- plusieurs candidatures en parallèle
- des contacts dispersés
- des relances oubliées
- peu de visibilité sur ce qui fonctionne vraiment

**OfferTrail** sert à reprendre la main sur ce flux avec une logique claire :
- suivre les candidatures dans le temps
- visualiser les KPI utiles
- relier organisations, contacts et événements
- conserver un historique traçable des actions

Pas de SaaS imposé. Pas de boîte noire. Les données restent chez vous.

---

## 🧠 Principes du projet

- **Local-first** : exécution en local, base SQLite, prise en main rapide
- **Lisible par défaut** : éviter la complexité gratuite
- **Traçable** : les événements métier restent visibles et exploitables
- **Main propre** : pas de commits directs sur `main`, historique Git net

---

## 🚀 État actuel

Le projet est déjà exploitable sur plusieurs briques :
- tableau de bord KPI
- gestion des candidatures
- fiches détail candidature
- gestion des organisations
- gestion des contacts
- import TSV
- API FastAPI pour alimenter le front React

Le dépôt contient encore quelques zones en transition entre anciennes vues HTML et interface React. Le cap reste simple : consolider le socle avant d'élargir 🙂

---

## 🧱 Stack actuelle

### Backend
- Python 3.9+
- FastAPI
- Uvicorn
- SQLite

### Frontend
- React 19
- TypeScript
- Vite
- Bulma
- React Router

---

## 📁 Structure

```txt
.
├── docs/              # vision, décisions, runbook
├── frontend/          # interface React + Vite
├── scripts/           # scripts utilitaires / migrations
├── src/               # backend FastAPI + logique métier
├── tests/             # tests Python
├── saved_db/          # snapshots / bases sauvegardées
├── Makefile
├── requirements.txt
├── BACKLOG.md
└── README.md
```

---

## 🛠️ Démarrage

### Prérequis
- Python 3.9+
- npm
- idéalement une virtualenv Python

### Installation

```bash
make install
```

Cette commande installe :
- les dépendances Python du backend
- les dépendances npm du frontend

### Lancer le projet

#### Backend + Frontend

```bash
make run
```

Cette commande ouvre deux processus :
- API FastAPI sur `http://localhost:8000`
- frontend Vite sur `http://localhost:5173`

#### Backend seul

```bash
make run-back
```

#### Frontend seul

```bash
make run-front
```

### Variables d'exécution

Si `python`, `pip` ou `npm` ne sont pas dans le `PATH`, vous pouvez surcharger les variables du `Makefile` :

```bash
make install PYTHON=C:\Path\To\python.exe PIP=C:\Path\To\pip.exe NPM=C:\Path\To\npm.cmd
```

### Healthcheck

`GET http://localhost:8000/health`

---

## 📌 Workflow Git

Le projet suit une logique **git flow** légère :
- `main` : stable, propre, pas de commit direct
- `dev` : branche d'intégration
- `feat/*` : nouvelles fonctionnalités
- `fix/*` : corrections
- `chore/*` : maintenance, scripts, doc, nettoyage

Chaque changement part d'une branche dédiée puis remonte proprement.

### Commits

On garde des commits **courts, lisibles, conventionnels**, avec un smiley si pertinent 🙂

Exemples :
- `📝 docs: refresh readme`
- `✨ feat: add contacts page`
- `🐛 fix: handle empty followup date`
- `♻️ refactor: simplify organization mapping`

Objectif :
- un commit = une intention claire
- pas de message vague
- historique facile à relire

---

## 📚 Documentation

- `docs/vision.md` : la direction produit
- `docs/decisions.md` : les choix techniques
- `docs/runbook.md` : exécution, debug, récupération

---

## 🤝 Contribution

Le projet préfère :
- des changements petits et ciblés
- de l'intention explicite
- des commits propres
- du code lisible avant le code malin

Pour chaque PR :
- résumer le changement
- expliquer comment tester
- signaler les compromis éventuels

---

## 📄 Licence

Pas encore figée.
MIT reste la candidate par défaut tant qu'aucune autre décision n'est prise.
