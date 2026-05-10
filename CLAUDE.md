# Claude — instructions projet OfferTrail

## Git flow (strict)

- Ne jamais committer directement sur `dev` ou `main`.
- Tout travail passe par une branche dédiée : `feat/`, `fix/`, `chore/`, etc., créée depuis `dev`.
- Merger uniquement via Pull Request (`feat/... → dev`, puis `dev → main`).
- Résoudre les conflits sur la branche feature avant de push, pas après.
