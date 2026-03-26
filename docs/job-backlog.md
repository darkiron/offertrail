# Job Backlog - cadrage initial

## But

Créer un backlog d'annonces pertinentes à partir de job boards pour alimenter OfferTrail sans créer directement des candidatures bruitées.

Le flux visé :
- récupérer des annonces depuis des sources définies
- normaliser les données
- scorer la pertinence par rapport au profil et aux recherches
- créer une application en statut `INTERESTED` quand le score passe un seuil
- garder une étape distincte pour toute automatisation de candidature

---

## Pourquoi ce découpage

Le vrai risque ici est de mélanger 3 sujets différents :
- l'ingestion d'annonces
- le matching avec le profil
- l'automatisation de candidature

Si on mélange tout trop tôt :
- on crée beaucoup de faux positifs
- on casse la traçabilité
- on se met vite en conflit avec les conditions d'usage de certaines plateformes

---

## Vision produit

OfferTrail ne doit pas devenir un bot opaque qui postule partout.

Le bon comportement initial :
- repérer des annonces compatibles
- proposer un backlog propre
- permettre validation humaine ou auto-création contrôlée
- marquer ces dossiers comme `INTERESTED`

Ensuite seulement :
- enrichissement
- relance
- candidature assistée

---

## V1 recommandée

### 1. Sources contrôlées

Commencer par des sources simples et relativement stables :
- RSS quand disponible
- pages résultats publiques
- exports / URLs de recherche sauvegardées

Eviter au début :
- login obligatoire
- CAPTCHA
- plateformes avec anti-bot agressif
- auto-apply direct

### 2. Modèle de recherche

Définir une table ou configuration de recherches :
- mots-clés inclus
- mots-clés exclus
- localisation
- remote / hybride / sur site
- type de contrat
- séniorité
- salaire minimum optionnel
- sources autorisées

### 3. Normalisation

Chaque annonce ingérée doit produire un format commun :
- `source`
- `external_id`
- `url`
- `title`
- `company`
- `location`
- `remote_mode`
- `contract_type`
- `description`
- `published_at`
- `salary_text`
- `raw_payload`

### 4. Matching

Calculer un score avec :
- présence de mots-clés cœur
- exclusions bloquantes
- proximité du poste avec le profil
- stack technique détectée
- type de contrat
- lieu / remote
- signaux historiques connus sur l'organisation

### 5. Création dans OfferTrail

Quand le score dépasse un seuil :
- créer ou relier l'organisation
- créer une application avec `status = INTERESTED`
- marquer la source comme `job_backlog`
- stocker l'URL et les métadonnées utiles

---

## V2 possible

- apprentissage sur les annonces acceptées / rejetées
- ajustement automatique des poids de scoring
- suggestions de recherches
- ranking personnalisé
- clustering de doublons inter-sources

---

## V3 éventuelle

- candidature semi-automatique
- pré-remplissage de formulaires
- génération de message / lettre
- orchestration par runbook

Cette phase doit rester séparée de la V1.

---

## Architecture recommandée

### Bloc 1 - Connecteurs source

Un connecteur par source :
- récupère les annonces
- extrait les champs utiles
- retourne un format brut

Exemple :
- `src/jobs/sources/wttj.py`
- `src/jobs/sources/linkedin.py`
- `src/jobs/sources/indeed.py`

### Bloc 2 - Normalisation

Transforme chaque payload source en modèle canonique.

Exemple :
- `src/jobs/normalize.py`

### Bloc 3 - Matching

Service pur qui calcule :
- score
- raisons du score
- motifs d'exclusion

Exemple :
- `src/jobs/matching.py`

### Bloc 4 - Import OfferTrail

Service qui :
- déduplique
- crée les organisations si besoin
- crée les applications `INTERESTED`
- journalise les décisions

Exemple :
- `src/jobs/importer.py`

---

## Modèle de données minimal

Tables recommandées :

### `job_searches`
- recherche définie par l'utilisateur
- paramètres de collecte et de matching

### `job_backlog_items`
- annonce normalisée
- score
- raison du matching
- statut backlog (`NEW`, `ACCEPTED`, `REJECTED`, `IMPORTED`)

### `job_backlog_runs`
- exécution d'un collecteur
- source
- volume récupéré
- erreurs

### `job_backlog_feedback`
- feedback utilisateur sur la pertinence
- utile pour l'apprentissage ultérieur

---

## Règles métier initiales

- une annonce ingérée ne crée pas automatiquement une candidature si elle est sous le seuil
- une annonce déjà importée ne doit pas recréer un doublon
- la déduplication doit combiner `source`, `external_id`, et heuristiques sur `url/title/company`
- toute création automatique doit laisser une trace explicite dans l'historique

---

## Risques à cadrer

### Légal / ToS

Certaines plateformes interdisent ou limitent le scraping.
Il faut privilégier :
- APIs officielles
- flux publics
- RSS
- pages accessibles sans contournement

### Qualité de matching

Le matching doit rester explicable.
On doit pouvoir afficher :
- pourquoi l'annonce a été retenue
- pourquoi elle a été rejetée

### Anti-doublons

Sans déduplication solide, le backlog devient inutilisable.

### Auto-apply

Postuler automatiquement est une autre feature.
Elle touche :
- authentification
- formulaires dynamiques
- fichiers CV / lettres
- conformité plateforme

Ne pas coupler ça à la V1.

---

## Premier incrément conseillé

Le meilleur point de départ :

1. ajouter les tables backlog
2. créer un connecteur simple sur une source publique ou mockée
3. normaliser et scorer
4. afficher le backlog dans l'app
5. bouton pour convertir en application `INTERESTED`

Après ça seulement :
- import automatique
- multi-sources
- feedback et apprentissage

---

## Direction proposée

Nom de feature :
- `job backlog`

Premier objectif concret :
- "ingérer des annonces pertinentes et les convertir proprement en opportunités `INTERESTED`"

Pas encore :
- "auto-postuler partout"
