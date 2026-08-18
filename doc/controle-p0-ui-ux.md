# Contrôle P0 UI/UX — attendu vs réalisé

Date de contrôle : 6 août 2026
Référence : `doc/wireframes-p0-ui-ux.md`

## Verdict

Le flux principal « Aujourd’hui → liste → dossier → action » est fonctionnel et utilise les données Supabase réelles. Le P0 fonctionnel est largement couvert, mais la suppression complète de Mantine et la mesure de performance restent hors de ce lot et empêchent de considérer la refonte globale du SaaS comme terminée.

## Critères fonctionnels

| Attendu validé | État | Réalisation / preuve |
|---|---|---|
| Créer une candidature et planifier sa suite | Fait | Formulaire natif, entreprise existante ou créée, `POST /me/candidatures`, puis action facultative |
| Action due visible à l’ouverture | Fait | `GET /me/today`, file ordonnée, urgences retard/aujourd’hui |
| Ligne entièrement ouvrable et clavier | Fait | Ligne focusable, ouverture au clic et avec `Entrée`, lien natif sur le poste |
| Recherche, filtres, tri et page dans l’URL | Fait | Paramètres `q`, `status`, `due`, `sort`, `page`, `closed` |
| Retour depuis le dossier sans perte de contexte | Fait | URL conservée et position de défilement restaurée |
| Terminer une relance met à jour les écrans | Fait | Mutation atomique puis invalidation Aujourd’hui, liste et workspace |
| Un état terminal ne garde pas de relance active | Fait | Passage à `refusee` → actions ouvertes classées `ignoree`, test serveur |
| Une erreur imprévue ne produit pas un écran blanc global | Partiel | États d’erreur par écran et barrière sur la zone SaaS ; le dashboard dépend encore d’une réponse agrégée unique |

## Critères qualitatifs

| Attendu validé | État | Réalisation / preuve |
|---|---|---|
| Pas de grille uniforme de cartes | Fait | File d’actions, liste éditoriale et dossier contexte/historique |
| Un point focal par écran | Fait | Action urgente, portefeuille, puis prochaine action du dossier |
| Aucun chiffre sans utilité ou période | Fait | Libellés explicites ; réponses et entretiens réellement calculés sur 30 jours |
| Statut compréhensible sans couleur | Fait | Libellé texte systématique |
| États vides métier et filtres distincts | Fait | Premier usage, aucun résultat filtré, aucune action et erreur séparés |
| Composition desktop et mobile dédiée | Fait | Liste recomposée, modale plein bas mobile, navigation et dossier en flux simple |
| Cohérence CSS complète du SaaS | Partiel | Les écrans P0 et le shell sont natifs ; des écrans secondaires utilisent encore Mantine |

## Performance et robustesse

| Cible | État | Observation |
|---|---|---|
| Contenu stable pendant le chargement | Partiel | Skeleton dashboard ; liste et dossier ont un état stable mais aucun budget CLS mesuré |
| Filtres perçus comme immédiats | Fait | Recherche différée 320 ms, anciennes données conservées pendant le rafraîchissement |
| Prochaine action dans la première réponse dossier | Fait | Le workspace renvoie contexte, action et historique en une requête |
| Pas de cascade de requêtes pour reconstruire le contexte | Fait sur le P0 | Aujourd’hui, liste et dossier utilisent leurs endpoints canoniques dédiés |
| Découpage du bundle par route | Fait | Dashboard, liste, dossier, admin, import, Stripe et pages publiques sont chargés séparément |
| Mesure Lighthouse / budgets CI | Non fait | À mesurer après retrait des dépendances restantes |

## Écarts restants ordonnés

1. Migrer les écrans métier secondaires encore dépendants de Mantine, puis retirer le provider et ses feuilles globales.
2. Ajouter des tests de parcours navigateur : création, filtres, retour liste, réalisation et refus.
3. Mesurer CLS, interaction des filtres et rendu mobile avec Lighthouse avant clôture de la refonte SaaS.

## Validation technique actuelle

- La migration PostgreSQL autorisant `relance_planifiee` est appliquée sur Supabase.
- Les données distantes ont été vérifiées : 67 candidatures, sans suppression pendant le chantier.
- Les tests backend P0 couvrent isolation utilisateur, agrégats réels, dates PostgreSQL, action atomique et cohérence du statut terminal.
- Le build frontend passe sans collision i18n ; 768 lignes de traductions strictement dupliquées ont été retirées.
- Le chunk JavaScript initial est passé d’environ 1,48 Mo à 733 Ko minifiés grâce au découpage par route ; le retrait de Mantine reste nécessaire pour aller plus loin.
