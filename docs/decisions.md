# Decisions - OfferTrail

Ce fichier garde les décisions structurantes du projet, en version courte et relisible.

---

## 2026-01-22 - `main` protegée

**Decision**  
Pas de commit direct sur `main`.

**Pourquoi**  
Garder une base stable et éviter les régressions accidentelles.

**Conséquence**  
Le flux passe par `dev`, puis par des branches dédiées `feat/*`, `fix/*`, `chore/*`.

---

## 2026-01-22 - Local-first par défaut

**Decision**  
Le projet privilégie l'exécution locale et la propriété des données.

**Pourquoi**  
Réduire la complexité d'exploitation, éviter le verrouillage SaaS, et garder un cycle de dev rapide.

**Conséquence**  
SQLite, tooling simple, et architecture légère restent les choix par défaut.

---

## 2026-01-22 - Historique événementiel

**Decision**  
Les actions métier importantes sont tracées via un journal d'événements.

**Pourquoi**  
Pouvoir expliquer l'état courant, garder l'historique, et relire le parcours d'une candidature.

**Conséquence**  
Le modèle reste orienté traçabilité plutôt qu'écriture opaque.

---

## 2026-01-22 - Bootstrap backend simple

**Decision**  
Le socle démarre avec Python + FastAPI + Jinja2.

**Pourquoi**  
Aller vite au début, avec peu d'outillage, tout en gardant une API exploitable.

**Conséquence**  
Le projet a d'abord porté des vues HTML serveur avant la montée du front React.

---

## 2026-02-XX - Front React en montée progressive

**Decision**  
Introduire un front React + TypeScript sans casser la compatibilité du backend existant.

**Pourquoi**  
Faire évoluer l'UX plus vite, mieux segmenter les écrans métier, et sortir des limites des templates initiaux.

**Conséquence**  
Le dépôt contient encore une phase de transition :
- API FastAPI comme source commune
- anciennes vues HTML encore présentes
- parité UI en cours selon les écrans

---

## 2026-03-XX - Passage `company` vers `organization`

**Decision**  
Le modèle métier glisse de `company` vers `organization`.

**Pourquoi**  
Le périmètre réel dépasse l'entreprise simple :
- client final
- ESN
- cabinet
- portage
- autres structures impliquées dans une candidature

**Conséquence**  
- nouvelles tables et champs orientés `organizations`
- routes API dédiées `/api/organizations`
- compatibilité encore maintenue avec `/api/companies`
- migrations SQL nécessaires pour les bases existantes

---

## 2026-03-XX - Contacts comme entité métier de premier niveau

**Decision**  
Les contacts deviennent une entité complète, liée aux organisations et aux candidatures.

**Pourquoi**  
Une candidature ne se résume pas à un nom d'entreprise ; la qualité du réseau de contact compte aussi.

**Conséquence**  
- CRUD contact côté API
- pages React dédiées
- timeline enrichie avec les événements contact et application

---

## 2026-03-XX - Lecture "probité" des organisations

**Decision**  
Ajouter des statistiques et un niveau de probité sur les organisations.

**Pourquoi**  
Donner une lecture plus stratégique du pipeline :
- qui répond
- sous quel délai
- qui ghoste
- où l'énergie vaut la peine d'être remise

**Conséquence**  
Le projet ne suit plus seulement des candidatures ; il commence à qualifier le comportement des organisations 🙂
