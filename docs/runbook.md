# Runbook - OfferTrail

Ce document sert a lancer, verifier et depanner le projet sans perdre de temps.

---

## Etat du projet

Le projet tourne avec :
- un backend FastAPI
- un frontend React + Vite
- une base SQLite locale

Le depot contient aussi une phase de transition :
- anciennes vues HTML encore presentes
- API utilisee comme socle commun
- migrations SQL pour faire evoluer le schema

---

## Prerequis

- Python 3.9+
- npm
- Windows + `make` disponible dans le terminal utilise
- idealement un environnement virtuel Python

---

## Installation

```bash
make install
```

Cette commande :
- installe `requirements.txt`
- installe les dependances du frontend dans `frontend/`

Si besoin, vous pouvez surcharger :

```bash
make install PYTHON=C:\Path\To\python.exe PIP=C:\Path\To\pip.exe NPM=C:\Path\To\npm.cmd
```

---

## Lancement

### Stack complete

```bash
make run
```

Cela lance :
- l'API sur `http://localhost:8000`
- le front sur `http://localhost:5173`

### Backend seul

```bash
make run-back
```

### Frontend seul

```bash
make run-front
```

### Healthcheck

```txt
GET http://localhost:8000/health
```

Reponse attendue :

```json
{"status":"ok"}
```

---

## Tests

Le depot contient actuellement des tests Python centres sur le backend et les vues historiques.

Commande simple :

```bash
pytest
```

Point d'attention :
- une partie des tests reflete encore les anciennes vues HTML
- la couverture React reste limitee
- avec les changements `organization/contact`, certains tests historiques peuvent necessiter une mise a jour

### Cibler le backlog

Pour valider rapidement la partie backlog sans relancer toute la suite :

```bash
.venv\Scripts\python.exe -m pytest tests\test_main.py -q
```

Ce bloc couvre notamment :
- les sources backlog
- les recherches
- l'import backlog vers application
- le cas `free-work` sans fallback vers le mock

---

## Migrations utiles

Des scripts de migration existent dans `scripts/`.

### V4

```bash
python scripts/run_v4_migration.py
```

### V5 organisations

```bash
python scripts/run_v5_migration.py
```

Avant migration :
- sauvegarder la base locale
- verifier quelle base est ciblee par le script

Aujourd'hui :
- `run_v4_migration.py` cible `offertrail_new.db`
- `run_v5_migration.py` cible `offertrail.db`

Ne pas lancer ces scripts a l'aveugle sur une base utile.

---

## Depannage rapide

### Port deja pris

Le backend utilise par defaut le port `8000` et le frontend `5173`.
Si un port est deja utilise, relancer le service concerne avec une config adaptee.

### Python ou npm non trouves

Surcharger `PYTHON`, `PIP` ou `NPM` dans les commandes `make`.

### Erreurs de schema SQLite

Verifier :
- la base reellement ouverte
- le niveau de migration applique
- la compatibilite entre schema local et code courant

### UI incoherente entre ecrans

Le depot melange encore :
- vues HTML historiques
- ecrans React recents

Si un comportement semble different selon la route, verifier d'abord si la page vient du front React ou d'un template serveur.

### Backlog trop complexe ou trompeur

Le backlog est volontairement traite comme une feature simple :
- une recherche recupere
- le backlog affiche
- l'import cree une application `INTERESTED`

Si la logique de scoring, de statuts ou de source devient difficile a expliquer, revenir au document `docs/job-backlog.md` et privilegier le chemin le plus simple.

---

## Philosophie

Si quelque chose casse, ce fichier doit aider a repondre vite a trois questions :
- comment reproduire
- comment inspecter
- comment revenir a un etat comprehensible

Court, pratique, sans roman.
