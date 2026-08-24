# Politique de sécurité

Ne pas ouvrir d'issue publique pour une vulnérabilité exploitable ou des identifiants exposés. Utiliser le canal privé de sécurité du dépôt GitHub ou contacter l'équipe propriétaire hors canal public.

Inclure : composant et version concernés, impact, conditions de reproduction, preuve minimale expurgée et correctif suggéré. Ne jamais joindre de JWT, clé Supabase, secret Stripe, dump de production ou donnée personnelle réelle.

Les changements concernant Supabase Auth, validation JWT/JWKS, isolation `user_id`, service role, Stripe, webhooks, CORS, RLS et migrations nécessitent une revue sécurité. Les secrets restent uniquement dans les gestionnaires d'environnement ; les fichiers `.env` ne sont pas versionnés.

L'équipe accuse réception sous deux jours ouvrés, qualifie la sévérité et communique un calendrier de correction. Une divulgation coordonnée intervient après mise à disposition du correctif.
