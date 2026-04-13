# Runbook - OfferTrail

Ce document sert à lancer, vérifier et dépanner le projet sans perdre de temps.

---

## Etat du projet

Le projet tourne avec :
- un backend FastAPI
- un frontend React + Vite
- une base SQLite locale

Le dépôt contient aussi une phase de transition :
- anciennes vues HTML encore présentes
- API utilisée comme socle commun
- migrations SQL pour faire évoluer le schéma

---

## Prérequis

- Python 3.9+
- npm
- Windows + `make` disponible dans le terminal utilisé
- idéalement un environnement virtuel Python

---

## Installation

```bash
make install
```

Cette commande :
- installe `requirements.txt`
- installe les dépendances du frontend dans `frontend/`

Si besoin, vous pouvez surcharger :

```bash
make install PYTHON=C:\Path\To\python.exe PIP=C:\Path\To\pip.exe NPM=C:\Path\To\npm.cmd
```

---

## Lancement

### Stack complète

```bash
make run
```

Cela lance :
- l'API sur `http://localhost:8000`
- le front sur `http://localhost:5173`

Notes d'environnement :
- le backend charge les variables depuis `.env` à la racine
- le frontend lancé via `make run` charge `frontend/.env.dev`

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

Réponse attendue :

```json
{"status":"ok"}
```

---

## Tests

Le dépôt contient actuellement des tests Python centrés sur le backend et les vues historiques.

Commande simple :

```bash
pytest
```

Point d'attention :
- une partie des tests reflète encore les anciennes vues HTML
- la couverture React reste limitée
- avec les changements `organization/contact`, certains tests historiques peuvent nécessiter une mise à jour

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
- vérifier quelle base est ciblée par le script

Aujourd'hui :
- `run_v4_migration.py` cible `offertrail_new.db`
- `run_v5_migration.py` cible `offertrail.db`

Ne pas lancer ces scripts à l'aveugle sur une base utile 🙂

---

## Dépannage rapide

### Port déjà pris

Le backend utilise par défaut le port `8000` et le frontend `5173`.
Si un port est déjà utilisé, relancer le service concerné avec une config adaptée.

### Python ou npm non trouvés

Surcharger `PYTHON`, `PIP` ou `NPM` dans les commandes `make`.

### Erreurs de schéma SQLite

Vérifier :
- la base réellement ouverte
- le niveau de migration appliqué
- la compatibilité entre schéma local et code courant

### UI incohérente entre écrans

Le dépôt mélange encore :
- vues HTML historiques
- écrans React récents

Si un comportement semble différent selon la route, vérifier d'abord si la page vient du front React ou d'un template serveur.

---

## Philosophie

Si quelque chose casse, ce fichier doit aider à répondre vite à trois questions :
- comment reproduire
- comment inspecter
- comment revenir à un état compréhensible

Court, pratique, sans roman.
