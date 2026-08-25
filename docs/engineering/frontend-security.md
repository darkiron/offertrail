# Sécurité navigateur et transport API

## Décision actuelle

La configuration publique est validée au démarrage par Zod. `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont obligatoires ; `VITE_API_URL` accepte une URL absolue ou une chaîne vide.

- **Développement** : `VITE_API_URL` vide est la configuration canonique same-origin. Axios appelle des chemins relatifs ; le proxy Vite transmet uniquement les familles de routes déclarées vers `VITE_API_PROXY_TARGET`. Le navigateur ne déclenche donc pas de CORS pour l'API locale.
- **Production** : le frontend appelle actuellement l'URL absolue `https://api.offertrail.fr`. Cette origine et les domaines Supabase HTTPS/WSS sont explicitement autorisés dans `connect-src`. Un passage futur à un proxy same-origin en production exige une modification coordonnée du routage et de la CSP.

Le token Supabase est appliqué en mémoire sur l'en-tête `Authorization`; l'ancien token local est supprimé. Aucun secret serveur ne doit utiliser le préfixe `VITE_`.

## Content Security Policy

Vercel applique sur toutes les routes :

- `default-src 'self'`, `base-uri 'self'`, `form-action 'self'` ;
- `script-src 'self'` sans `unsafe-inline` ; le bootstrap de thème est donc un fichier statique same-origin ;
- `connect-src` limité à l'origine, l'API OfferTrail et Supabase HTTPS/WSS ;
- `object-src 'none'` et `frame-ancestors 'none'` ;
- images same-origin, `data:` ou HTTPS ; fontes same-origin ou `data:` ;
- `style-src 'self' 'unsafe-inline'`, concession actuelle nécessaire aux styles inline présents ;
- upgrade automatique des requêtes non sécurisées.

Les en-têtes complètent la CSP : HSTS, `nosniff`, `DENY`, referrer strict et désactivation caméra/géolocalisation/microphone/paiement. Les assets hashés reçoivent un cache immuable d'un an.

## Règles d'évolution

- Toute nouvelle origine réseau, iframe, image ou script doit être justifiée et ajoutée au plus près, jamais par `*`.
- Ne pas réintroduire de script inline ; conserver le bootstrap de thème externe.
- Réduire puis retirer `style-src 'unsafe-inline'` après suppression des styles inline et stratégie nonce/hash si nécessaire.
- Tester les en-têtes sur preview et production ; le serveur Vite local ne reproduit pas les en-têtes Vercel.
- Les clés Supabase `service_role`, secrets Stripe et secrets JWT restent exclusivement côté serveur.
