# Vision - OfferTrail

OfferTrail est un **CRM local-first** pour suivre des candidatures CDI et freelance avec plus de clarté, plus de trace, et moins de friction 🙂

L'objectif n'est pas d'automatiser la recherche à votre place.
L'objectif est de la rendre **observable et pilotable** :
- ce qui a été envoyé
- à qui
- quand
- avec quel résultat
- et dans quel contexte relationnel

OfferTrail doit aider à mieux lire son pipeline, repérer les signaux utiles, et capitaliser sur l'historique réel.

---

## Objectifs produit

- centraliser les candidatures dans un seul endroit
- relier candidatures, organisations, contacts et événements
- visualiser des KPI utiles pour décider des relances
- conserver un historique lisible des actions et évolutions
- rester simple à lancer, maintenir et faire évoluer

---

## Direction actuelle

Le projet a commencé comme un outil de suivi centré sur la candidature.
Il évolue maintenant vers une lecture plus riche du pipeline :
- vue portefeuille par organisation
- gestion explicite des contacts
- historique d'activité par entité
- score de probité / qualité de réponse des organisations
- interface React plus complète côté front

Le socle reste volontairement sobre :
- backend FastAPI
- base SQLite
- front React + TypeScript
- logique locale avant toute complexité d'infra

---

## Ce que le projet ne cherche pas a faire

OfferTrail ne vise pas à :
- devenir un ATS d'entreprise complet
- scraper agressivement des plateformes protégées
- agir comme un recruteur IA
- auto-postuler à grande échelle
- imposer une infra SaaS lourde trop tôt

La priorité reste la lisibilité, l'appropriation et la maîtrise des données.
