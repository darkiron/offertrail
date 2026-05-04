# Configuration GitHub pour Codex

## État réel actuel

Configuration déjà validée:

- Git en SSH: OK
- `git push`: OK
- dépôt `origin`: OK
- branches distantes: OK

Point restant à valider:

- création de PR avec `gh` depuis la session Codex

## Objectif

Vérifier que `gh` peut créer une PR dans le même environnement que celui utilisé par Codex.

## Vérifications minimales

Depuis le dépôt:

```bash
cd ~/PhpstormProjects/offertrail
gh auth status
gh repo view darkiron/offertrail
```

Résultat attendu:

- `gh auth status` doit être valide
- `gh repo view` doit répondre sans erreur

## Test minimal de création de PR

Tester une PR sur une branche déjà poussée:

```bash
gh pr create --base dev --head fix/register-public --title "fix: register page public + rate limiting on auth endpoints" --fill
```

Si cette commande passe, Codex pourra créer les autres PRs de la même façon.

## PRs à créer

### Register public

```bash
gh pr create --base dev --head fix/register-public --title "fix: register page public + rate limiting on auth endpoints" --fill
```

### Admin backoffice

```bash
gh pr create --base dev --head feat/admin-backoffice --title "feat: admin backoffice - stats, user management, plan control" --fill
```

### GitHub setup

```bash
gh pr create --base dev --head chore/github-setup --title "chore: github issues setup - templates, labels, changelog" --fill
```

## Si `gh` échoue encore dans Codex

Le problème n’est plus Git ni SSH. Il faut vérifier uniquement l’environnement `gh`.

Commandes utiles:

```bash
which gh
gh --version
echo $HOME
ls -l ~/.config/gh/hosts.yml
```

## Rappel sécurité

- ne jamais partager un token GitHub en clair
- révoquer tout token exposé
- préférer `gh auth login` + SSH
