# Déploiement OfferTrail

## Backend - Railway

1. Créer un compte sur railway.app
2. Nouveau projet -> "Deploy from GitHub repo"
3. Sélectionner le repo darkiron/offertrail
4. Variables d'environnement à configurer dans Railway :
   - SECRET_KEY -> générer avec `python -c "import secrets; print(secrets.token_hex(32))"`
   - DATABASE_URL -> laisser vide pour SQLite local, ou URL PostgreSQL Railway
   - ALLOWED_ORIGINS -> https://app.offertrail.fr
   - RESEND_API_KEY -> clé Resend

5. Railway détecte automatiquement Python via nixpacks
6. Le healthcheck est sur GET /health

## Frontend - Vercel

1. Créer un compte sur vercel.com
2. Nouveau projet -> importer le repo GitHub
3. Root directory : `frontend`
4. Framework preset : Vite
5. Variables d'environnement :
   - VITE_API_URL -> https://[ton-projet].railway.app

6. Chaque push sur main redéploie automatiquement

## Domaine custom (optionnel)

1. Acheter le domaine sur OVH ou Namecheap (~15EUR/an)
2. Dans Vercel : Settings -> Domains -> ajouter app.offertrail.fr
3. Dans Railway : Settings -> Domains -> ajouter api.offertrail.fr
4. Configurer les DNS chez le registrar selon les instructions Vercel/Railway
