# Environnements et configuration

Les fichiers `.env.example` sont les inventaires exécutables. Les vraies valeurs ne sont jamais versionnées.

| Variable | Backend | Local | Production | Sensible |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | oui | SQLite accepté | PostgreSQL requis | oui |
| `SUPABASE_URL` | oui | requis pour auth | requis | non |
| `SUPABASE_SERVICE_KEY` | oui | selon parcours | requis serveur seulement | oui |
| `SUPABASE_JWT_SECRET` | fallback legacy | optionnel | préférer JWKS | oui |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, prix | paiement | optionnel | requis si vente active | oui |
| `ALLOWED_ORIGINS`, `APP_BASE_URL` | sécurité/redirect | requis | requis | non |
| `RESEND_API_KEY` | email | optionnel | requis pour emails | oui |

| Variable frontend | Usage | Exposition |
| --- | --- | --- |
| `VITE_API_URL` / `VITE_API_PROXY_TARGET` | API | publique |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase Auth | publiques par conception |
| `VITE_STRIPE_PK` | Stripe.js | publique |
| `VITE_CONTACT_EMAIL`, `VITE_CRAFTCODES_URL` | contenu public | publique |
| `VITE_PROMO_PLACEHOLDER` | présentation checkout | publique, jamais autorité remise |

Une clé `service_role`, un secret JWT ou Stripe ne doit jamais être préfixé `VITE_`. Les environnements dev, preview et production utilisent des projets/clefs distincts. Toute nouvelle variable doit être ajoutée aux exemples, validée au démarrage et documentée ici dans la même PR.

En développement, la valeur canonique de `VITE_API_URL` est vide : le navigateur reste same-origin et Vite transmet les routes API à `VITE_API_PROXY_TARGET`. En production, l'URL absolue de l'API doit rester synchronisée avec `connect-src` dans `frontend/vercel.json`. Voir [frontend-security.md](frontend-security.md).
