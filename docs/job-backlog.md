# Job Backlog - etat simplifie

## Intention

Le backlog de jobs sert a deux choses, pas plus :
- recuperer des annonces depuis quelques sources publiques
- convertir manuellement une annonce en application `INTERESTED`

La feature est volontairement limitee pour le moment.
On ne cherche pas a faire un moteur de matching avance ni un auto-apply.

---

## Position actuelle

Le backlog a commence a deriver vers une usine a gaz :
- scoring trop mis en avant
- statuts qui donnaient une fausse impression de decision automatique
- melange entre ingestion, tri, import et experimentation de sources

Le cap retenu est plus simple :
- une recherche recupere des annonces
- les annonces entrent dans le backlog comme elements exploitables
- l'import cree une application `INTERESTED`
- le score reste un indicateur de tri, pas une decision finale

En clair :
- pas de rejet automatique par defaut
- pas d'automatisation de candidature
- pas de promesse de matching intelligent

---

## Ce qui fonctionne aujourd'hui

### Sources

Sources supportees de facon explicite :
- `mock-board` pour le developpement local
- `wwr-rss` pour les flux RSS We Work Remotely
- `free-work.com` via parsing de page de resultats publique

Regle importante :
- une source inconnue ne doit plus tomber sur du mock
- si une source n'est pas supportee, le run doit echouer clairement

### Recherches

Une recherche contient :
- une source
- des mots-cles
- des exclusions
- des lieux
- un type de contrat
- un mode remote
- un resume de profil
- un score minimal conserve uniquement comme signal

### Runs

Un run :
- recupere les annonces de la source
- normalise le format
- met a jour ou cree les items backlog
- garde un historique simple dans `job_backlog_runs`

### Import

L'action utile reste :
- importer une annonce backlog
- creer une application locale avec `status = INTERESTED`

---

## Regles metier temporaires

- une annonce recuperee n'est plus mise en `REJECTED` par defaut
- une annonce deja importee reste `IMPORTED`
- le score sert au tri et a l'explicabilite
- la deduplication repose d'abord sur `source + external_id`
- une recherche relancee peut nettoyer les anciens items incoherents lies a une mauvaise source

---

## Ce qu'on ne fait pas pour l'instant

- auto-import par defaut
- apprentissage automatique
- ranking complexe multi-signaux
- feedback utilisateur avance
- candidature automatique
- support generique de tous les job boards

Tant que la feature n'est pas stabilisee, chaque ajout doit etre justifie par une utilite claire et immediate.

---

## Structure utile

Tables en place :
- `job_sources`
- `job_searches`
- `job_backlog_runs`
- `job_backlog_items`

Statuts backlog reellement utiles aujourd'hui :
- `NEW`
- `IMPORTED`

`REJECTED` reste un statut historique, mais il n'est plus au centre du flux courant.

---

## Decision produit

Pour le moment, le backlog est un sas manuel.

Le bon workflow est :
1. definir une source simple
2. lancer une recherche
3. relire les annonces recuperees
4. importer uniquement ce qui merite une application `INTERESTED`

Si la feature redevient trop complexe, la priorite n'est pas d'ajouter des couches.
La priorite est de revenir a ce workflow minimal.
