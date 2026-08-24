# Architecture frontend : actuelle et cible

## AS-IS

L'application React est une SPA Vite. Le socle de l'architecture en couches existe dans `src/app`, `routes`, `widgets`, `features`, `entities` et `shared`. L'ADR [0001](../adr/0001-frontend-architecture.md) en fixe le sens de dépendance. La migration n'est toutefois pas terminée : `src/App.tsx`, `pages`, `templates`, `services` et `i18n` contiennent encore l'application historique active.

Le dossier technique `components/atoms`, `molecules`, `organisms` a été résorbé : les primitives et compositions génériques vivent désormais dans `shared/ui`, les compositions métier dans `widgets`, et les guards de route dans `routes`. Les vues Jinja sous le `src/templates` backend et le dossier racine `landing` appartiennent à des générations antérieures.

Règle immédiate : tout code migré respecte les nouvelles frontières ; une vertical slice remplace ses imports et supprime son ancien chemin dans la même story. Aucun barrel de compatibilité supplémentaire.

## TO-BE

```text
src/
├── app/          # bootstrap et providers
├── routes/       # compositions de routes minces
├── widgets/      # grandes compositions autonomes
├── features/     # actions utilisateur et queries/mutations
├── entities/     # modèles canoniques et schémas runtime
└── shared/       # UI, API, i18n et styles agnostiques
```

Règles de dépendance cibles : `app/routes → widgets → features → entities → shared`. Une couche basse ne dépend jamais d'une couche haute. Une route n'implémente ni requête HTTP, ni règle de plan, ni transformation métier.

## Stratégie de migration

Chaque vertical slice :

1. documente routes, owner, rôles/plans et contrats ;
2. déplace une fonctionnalité complète vers la cible ;
3. remplace tous ses imports ;
4. supprime l'implémentation et les styles remplacés ;
5. ajoute les tests empêchant la réapparition du chemin legacy.

Les critères de sortie globaux sont : registre de routes unique, client dérivé de l'OpenAPI, frontières contrôlées par lint, catalogue UI exécutable, aucun import vers les générations supprimées.
