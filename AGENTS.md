# Instruction de base pour claude

## GIT flow 
Pour chaque demande, tu dois partir de la branche dev est créer une branche 
spécifique respectant le git flow strict.

faire un pr sur dev.

## Conventional commits
on se base sur conventional commits short avec smiley face.

## Security contexte
- atention au variable d'env au secret 
- atention aux logs
- atention aux injections SQL
- atention aux injections XSS
- atention aux injections XXE
- atention aux injections LDAP
- attention a realisé un code securisé

## Tests
Coverage obligatoire à 100%

## QA
Attention a la qualité du code, à la lisibilité et à la maintenabilité.
Attention a pas revert des fonctions

