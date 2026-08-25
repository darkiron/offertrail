# Audit UI/UX — compte, abonnement et tunnel de vente

Date : 7 août 2026
Périmètre : landing/pricing public, `/register`, `/login`, `/app/checkout`, `/app/mon-compte`, retour Stripe et portail client.

## Verdict

Le socle visuel est désormais cohérent avec le reste de l’application, mais le parcours commercial n’est pas encore au niveau « produit premium ». Il explique les plans, mais ne répond pas assez vite aux trois questions qui déclenchent l’achat : **quel problème est résolu, quel plan choisir, que se passe-t-il après le clic ?**

Le risque principal n’est pas esthétique : c’est une perte de confiance entre le choix d’un plan et la confirmation de l’abonnement. La page pricing applicative a été retirée du parcours : la landing porte la comparaison commerciale, le compte porte la gestion et le checkout porte la transaction.

## Parcours constaté

```text
Landing → /register?plan&period → création de compte
       → /app/checkout?plan&period → acceptation Stripe → Stripe Checkout
       → retour payment=success → /app ou /app/mon-compte
       → portail Stripe pour factures / gestion
```

## Points positifs

- Les plans existent dans un module partagé (`pricingPlans.ts`) et sont traduits.
- Le checkout réel passe par Stripe et le portail est prévu pour les factures.
- Le compte distingue profil, abonnement et facturation.
- Les boutons exposent un état de chargement et les retours de paiement sont pris en compte.
- Le thème `ot-*` permet maintenant d’éviter un nouveau mélange de bibliothèques CSS.

## Écarts P0 — à corriger avant acquisition

### 1. Le choix de plan n’est pas suffisamment contextualisé

Sur la grille pricing publique, les cartes montrent surtout des quotas (`5`, `100`, `Illimité`) et des fonctionnalités courtes. Il manque une promesse métier mesurable : temps économisé, relances qui ne tombent plus dans l’oubli, visibilité sur le pipeline. Le visiteur doit pouvoir choisir sans interpréter une grille technique.

**Action :** ajouter sous chaque plan une phrase « Pour qui / résultat » et une ligne « Vous passez à ce plan si… ». Garder trois bénéfices maximum, puis un lien « voir le détail ».

### 2. Le bouton d’achat est bloqué par une CGV placée trop loin du choix

Tous les CTA payants reçoivent `checkoutDisabled={!cgvAccepted}`. L’utilisateur peut donc cliquer sur une carte, mais le bouton reste inactif sans explication immédiate. La case est rendue après la grille : l’obligation arrive après la décision et peut ressembler à un bug.

**Action :** afficher une confirmation légale compacte dans le CTA (« En continuant, vous acceptez… »), avec la case juste au-dessus des boutons ou dans un résumé sticky. Le bouton doit expliquer son état (`Accepter les CGV pour continuer`) au lieu d’être silencieusement désactivé.

### 3. Le tunnel checkout ne reprend pas le plan sélectionné

`/app/checkout` affiche un plan Pro mensuel en dur (`Pro · 9,99 € / mois`) et relance `checkout({ plan: 'pro', period: 'monthly' })`. Il existe donc un risque direct de divergence entre ce que l’utilisateur a choisi et ce qui est facturé.

**Action :** transmettre `plan`, `period` et éventuellement `coupon` dans l’URL de checkout, les valider côté serveur, puis afficher un récapitulatif issu de la réponse serveur. Ne jamais afficher un prix hardcodé dans l’écran de paiement.

### 4. Le retour Stripe est trop ambigu

Le retour `payment=success` lance un polling puis redirige vers `/app` dès que le profil devient actif. L’utilisateur peut ne jamais voir la confirmation de l’offre, le montant, la prochaine échéance ou le lien vers les factures. En cas de webhook lent, le message reste générique.

**Action :** créer un état de confirmation explicite : plan activé, fréquence, montant, prochaine étape, bouton « ouvrir mon espace », bouton « gérer la facturation ». Prévoir un état « paiement reçu, activation en cours » avec délai et bouton de réessai.

### 5. Le pricing et le compte ne racontent pas le même modèle d’abonnement

Le compte affiche `Pro` ou `Free`, tandis que l’API connaît aussi `ultimate`, `pending` et `cancelled`. L’utilisateur ne voit pas clairement la différence entre abonnement actif, paiement en attente, résiliation et accès encore valable.

**Action :** définir une matrice d’états UI : `free`, `pending`, `active`, `past_due`, `cancelled`, `incomplete`. Pour chaque état : badge, explication courte, action primaire unique.

## Écarts P1 — conversion et confiance

- Les montants annuels devraient afficher l’économie exacte (« 2 mois offerts » ou équivalent), pas seulement un badge générique.
- Les limites doivent préciser leur comportement : que se passe-t-il à 5/100 candidatures, que devient l’historique après dépassement, et ce qui reste consultable après annulation.
- Le portail Stripe est le bon endroit pour les factures, mais l’écran compte doit expliquer que la gestion s’ouvre dans Stripe et qu’aucune donnée bancaire n’est stockée par OfferTrail.
- Le champ promo apparaît avant la preuve de valeur et prend une place visuelle importante. Le déplacer dans un accordéon « Vous avez un code ? ».
- La page compte mélange profil personnel, sécurité, abonnement et facturation dans deux colonnes sans navigation interne. Sur mobile, la hiérarchie doit devenir : identité → sécurité → abonnement → factures.
- Les libellés doivent être systématiquement localisés : éviter les valeurs métier affichées directement (`Free`, `Pro`) si une traduction ou une description est attendue.
- Le lien CGV actuel doit être vérifié contre les routes canoniques : l’interface utilise `/app/legal/cgv` alors que plusieurs routes légales existent.

## Architecture UI/UX recommandée

### Pricing

1. En-tête : problème résolu + preuve courte.
2. Sélecteur mensuel/annuel avec économie chiffrée.
3. Grille de plans : un plan recommandé, un CTA explicite par plan.
4. Comparaison « inclus / limites / pour qui ».
5. FAQ achat : essai, facturation, annulation, données, downgrade.
6. Réassurance : Stripe, factures, annulation, support.

### Checkout

Un écran de confirmation en deux colonnes : récapitulatif du plan à gauche, paiement Stripe à droite. Le récapitulatif doit rester visible et être alimenté par le serveur. Aucun nouveau checkout ne doit être créé si un abonnement actif existe : dans ce cas, le CTA devient « Gérer mon abonnement ».

### Mon compte

Utiliser une navigation locale à quatre sections : `Profil`, `Sécurité`, `Abonnement`, `Facturation`. La carte abonnement doit toujours afficher : plan, statut, fréquence, prochaine échéance, action principale. La facture doit être présentée comme une capacité de gestion, pas comme une carte vide.

## Mesure à ajouter

Événements minimum : `pricing_viewed`, `plan_selected`, `cgv_toggled`, `checkout_started`, `checkout_redirected`, `checkout_cancelled`, `payment_returned`, `subscription_activated`, `billing_portal_opened`, `upgrade_clicked`. Chaque événement doit contenir `plan`, `period`, `locale`, `source` et un identifiant de session non sensible.

## Ordre de mise en œuvre

1. P0 : supprimer le plan/prix hardcodé du checkout et transmettre le choix réel.
2. P0 : rendre les états Stripe explicites et non ambigus.
3. P0 : corriger le CTA CGV et les routes légales canoniques.
4. P1 : restructurer `Mon compte` en quatre sections responsive.
5. P1 : réécrire les cartes de plans autour des résultats métier et des limites.
6. P1 : ajouter FAQ, réassurance et instrumentation du funnel.
7. P2 : tests navigateur du parcours Free → Pro mensuel/annuel → annulation → portail.

## Critère de sortie

Un utilisateur doit pouvoir répondre en moins de 30 secondes à : « quel plan me convient ? », « combien vais-je payer et quand ? », « que se passe-t-il après le paiement ? », et « où gérer mes factures ou annuler ? ». Tant que l’une de ces réponses nécessite d’ouvrir plusieurs écrans ou de deviner, le funnel n’est pas considéré premium.

## Avancement de la correction

- P0.1 traité : l’écran checkout lit désormais `plan` et `period` depuis le parcours, calcule le libellé depuis le catalogue partagé et envoie ces valeurs à l’API. L’ancienne route `/app/pricing` est conservée uniquement comme redirection de compatibilité vers le compte.
- P0.2 partiellement traité : l’API refuse maintenant de créer une seconde souscription identique pour un abonnement actif ; le portail devient le parcours de gestion.
- UI compte renforcée : page organisée comme un centre de contrôle avec navigation locale Profil / Sécurité / Abonnement / Facturation, hiérarchie de carte premium et menu utilisateur recentré sur les actions personnelles.
- Restent à traiter : confirmation Stripe persistante, matrice complète des statuts, CTA CGV explicite et routes légales canoniques.
