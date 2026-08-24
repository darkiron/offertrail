# Cartographie qualité du frontend

Audit du 24 août 2026 sur `refactor/frontend-atomic-scss`. Ce document est la source de vérité avant les prochaines réécritures. Il couvre les routes, les parcours, les pages, les états, les composants, les styles, les appels de données et les droits.

## État mesuré

- 82 fichiers TSX, 25 modules CSS encore actifs et 39 fichiers SCSS.
- Knip signale 23 fichiers inutilisés, 3 dépendances inutilisées, 20 exports inutilisés, 18 types exportés inutilisés et 7 doubles exports.
- Les listes métier partagent déjà leurs molécules; les détails partagent une partie de leur structure. Landing, back-office, admin, checkout et compte restent toutefois des systèmes visuels distincts.
- La landing publique est structurée en layout, page, organismes et molécules SCSS. Le cœur applicatif reste majoritairement en CSS, avec beaucoup de libellés français en dur.

## Carte des routes et propriétaires

| Route canonique | Accès | Layout | Page / responsabilité | État |
| --- | --- | --- | --- | --- |
| `/` | public | LandingLayout | acquisition et présentation | cohérente |
| `/cgv` | public | LandingLayout + LegalLayout | conditions de vente | canonique; `/terms` et `/app/legal/cgv` sont des alias |
| `/mentions-legales` | public | LandingLayout + LegalLayout | mentions légales | canonique; `/legal-notice` est un alias |
| `/rgpd` | public | LandingLayout + LegalLayout | confidentialité | canonique; trois anciens chemins sont des alias |
| `/app/legal/cgu` | public | LandingLayout + LegalLayout | conditions d'utilisation | chemin pseudo-privé incohérent; à canoniser en `/cgu` |
| `/contact` | public | LandingLayout | contact | contenu bilingue encore local au composant; erreur d'envoi absente |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | public | PublicShell dans chaque page | authentification Supabase | layout non porté par le routeur; TSX trop compact |
| `/app` | authentifié | AppLayout | tableau de bord | textes et dates FR en dur |
| `/app/candidatures` et `/:id` | authentifié | AppLayout | portefeuille et dossier | composants partagés; erreurs 403/réseau confondues avec 404 |
| `/app/etablissements`, `/maintenance`, `/:id` | authentifié | AppLayout | portefeuille, fiche, fusion/scission | composants partagés; copie FR; règles d'entités partagées à formaliser |
| `/app/contacts` et `/:id` | authentifié | AppLayout | portefeuille et fiche | composants partagés; copie FR; erreurs mal différenciées |
| `/app/import` | authentifié | AppLayout | import | i18n présente; entitlement serveur à vérifier systématiquement |
| `/app/mon-compte` | authentifié | AppLayout | profil et abonnement | dépend fortement des classes globales `ot-*` |
| `/app/checkout` | authentifié | aucun AppLayout | paiement Stripe | page visuellement isolée; paramètres invalides normalisés silencieusement |
| `/app/admin` | authentifié seulement | AppLayout | administration | P0: pas de garde de rôle frontend, non localisée, non responsive |
| `/app/pricing` | authentifié | redirect compte | ancien parcours prix | la vraie `Pricing.tsx` est orpheline |

Les menus desktop et mobile partagent une seule configuration. Tous les liens internes littéraux audités ont une cible; aucun 404 direct n'a été trouvé. L'admin existe sans entrée de menu. Les navigations depuis certains drawers et après un 401 perdent cependant l'écran d'origine.

## Carte fonctionnelle et données

| Domaine | Frontend | API / autorité | Problème structurel |
| --- | --- | --- | --- |
| session | AuthContext + deux listeners Supabase | Supabase Auth, `GET /auth/me` | listeners dupliqués; les erreurs profil sont avalées; aucune machine d'état 401/403 |
| candidatures | services legacy + workflow, hooks et pages | `/candidatures`, `/me/candidatures`, événements, relances | deux contrats concurrents; notes/actions dupliquées; quotas contournables selon le chemin |
| établissements | service portfolio + CRUD legacy | `/me/etablissements`, `/etablissements`, merge/split | ownership versus catalogue partagé non formalisé |
| contacts | service portfolio + CRUD | `/me/contacts`, `/contacts`, événements de liaison | relation encodée en événement; droits de mutation partagée à auditer |
| dashboard | service et hook dédiés | `/me/today`, actions, stats, relances | données également relues par les services candidature |
| import | page et service | `/api/import` | seul entitlement explicitement gardé de façon centrale |
| abonnement | Compte, Checkout, Pricing orpheline | `/subscription/me`, checkout, portal, Stripe | parcours CGV/promo inaccessible; droits payants incorrects si statut non actif |
| admin | page autonome, appels directs | endpoints admin protégés serveur | sept requêtes peuvent partir avant le 403 frontend |

Les anciennes méthodes frontend `/auth/login`, `/auth/register`, changement et récupération de mot de passe ne correspondent plus au backend Supabase et ne sont plus consommées. Elles doivent être supprimées avec les autres contrats morts.

## Doublons, indépendances et code mort

À supprimer après vérification des imports dynamiques: `Pricing`, les anciens drawers de candidature et établissement, `MonthlyApplicationsChart`, les anciens modals d'édition, plusieurs atoms/badges/spinners et `Login.module.css`. La liste exacte exécutable reste `npm run deadcode`; le nettoyage doit faire passer Knip sans résultat, pas seulement cacher ses alertes.

Les frontières à converger sont:

1. un route layout public, un route layout auth et un route layout applicatif;
2. une seule source de navigation et de routes canoniques;
3. une template de liste et une template de détail avec six états explicites: loading, empty, error, forbidden, not-found et success;
4. une famille de contrats par entité, générée ou vérifiée contre OpenAPI;
5. un catalogue central des capacités Free/Pro/Ultimate, appliqué par tous les endpoints équivalents;
6. des primitives accessibles uniques pour bouton, lien, champ, dialogue, onglets, feedback et pagination.

## Risques prioritaires

### P0 — avant toute finition visuelle

1. Choisir un parcours abonnement canonique. Aujourd'hui `Pricing.tsx`, qui contient CGV et promotion, est inaccessible, alors que Checkout lance Stripe directement. Intégrer cette étape au checkout ou la router, puis supprimer l'autre implémentation.
2. Ajouter une garde de rôle admin côté route avant le chargement du bundle et des requêtes. La garde backend reste obligatoire.
3. Corriger la validation JWT backend: issuer, audience `authenticated`, sélection `kid` et rafraîchissement JWKS; ajouter les tests de rotation et de mauvais issuer/audience.
4. Corriger le plan effectif: `past_due`, `unpaid` ou annulé ne doivent pas conserver implicitement les droits payants.
5. Appliquer quotas et capacités sur tous les chemins candidature/action/KPI/export/probité, avec tests Free/Pro/Ultimate.
6. Formaliser puis tester l'ownership des contacts et établissements partagés entre deux utilisateurs.
7. Remplacer le dialogue actuel: identifiant de titre unique, Escape, focus initial, piège et restauration du focus, libellés localisés.
8. Distinguer les états réseau, interdit, introuvable et vide; ne plus transformer toute erreur de détail en 404.

### P1 — convergence produit

1. Migrer les vertical slices métier de CSS vers SCSS tokenisé et supprimer les styles remplacés au même commit.
2. Extraire tous les textes, aria-labels et formats de date du cœur applicatif vers les locales typées.
3. Ramener Admin, Checkout et MonCompte dans les layouts/primitives partagés.
4. Corriger Tabs et EntityList avec une sémantique clavier native.
5. Réduire et stabiliser la navigation mobile; garantir cibles 44 px, focus visible et état actif.
6. Unifier les erreurs Axios 401/402/403, le retour après connexion et la conservation du contexte.
7. Canoniser `/cgu`, le retour Checkout et les navigations de drawers; conserver uniquement des redirects de compatibilité documentés.
8. Supprimer les services auth legacy et converger les API `/me/*` et legacy.

## Ordre de réécriture en vertical slices

1. Fondations: registre de routes, guards, états de page, Dialog/Tabs, tokens SCSS, i18n commune.
2. Auth et abonnement: PublicShell route-level, session, pricing/checkout/compte, Stripe.
3. Candidatures: liste, détail, modals, actions, contrats et quotas.
4. Établissements et contacts: listes/détails, ownership, fusion/scission.
5. Dashboard, import et admin.
6. Suppression finale du code mort, des CSS et des alias non nécessaires.

Chaque slice est une branche Gitflow dédiée depuis cette branche d'intégration, une PR synchronisée et un merge seulement après validation. Aucun commit ne va directement sur `dev`.

## Definition of Done

- Aucun fichier, export, type ou dépendance inutilisé selon Knip.
- Aucun `.css` dans `src`; SCSS colocalisé, tokenisé et Stylelint vert.
- Aucun texte d'interface ou locale de date en dur dans TSX.
- Chaque route déclare layout, accès, rôle/capacité, titre, canonical et six états.
- Chaque CTA et lien interne possède un test de destination; aucun alias utilisé comme cible interne.
- Tests E2E desktop/mobile: landing, inscription, login/logout, recovery, CRUD principal, limites de plan, checkout et admin interdit.
- Tests d'accessibilité clavier sur header, menu mobile, dialogues, onglets, listes et formulaires.
- Tests backend paramétrés par endpoint, méthode, utilisateur A/B, statut actif/désactivé, plan et rôle.
- Tests contractuels interdisant tout appel frontend absent de l'OpenAPI.
- `lint`, `typecheck`, `stylelint`, `test`, `build`, budget bundle et matrice E2E verts dans la PR.

