# OfferTrail 🧭

##  🧭 OfferTrail — follow your applications, don’t lose the plot

**Local-first CRM for job & freelance applications**  
Track your applications, measure what actually works, and keep a full history of every action — *Git-like*.

---

## ✨ Why OfferTrail?
Job searching is messy. Spreadsheets rot, inboxes overflow, and you lose track of who you contacted, when, and why.

**OfferTrail** is a lightweight, self-hosted tool designed to:
- centralize **CDI & freelance applications**
- visualize your **pipeline**
- track **KPIs that matter**
- keep a **complete, immutable history** of changes and interactions

No SaaS lock-in. No black box. Your data stays with you.

---

## 🧠 Core principles
- **Local-first** → run it on your machine or your own server
- **Simple by default** → avoid framework gravity
- **Always traceable** → every change is logged (append-only)
- **Stable main** → no direct commits, clean Git hygiene

---

## 🚀 Features (current & planned)
### Current
- Project scaffolding & workflow foundations

### Planned
- Application pipeline (CDI & freelance)
- Dashboard with actionable KPIs
- Follow-up reminders & relance helpers
- Event log (Git-like history)
- Import offers from URLs / alerts (safe-first)
- Contact & interaction tracking

---

## 🌿 Branching model
We follow a strict but simple Git discipline:

- `main` → **stable**, protected, no direct commits
- `dev` → integration branch
- `feat/*` → feature branches
- `fix/*` → bugfix branches

> Every change starts in a feature branch and flows upward.

---

## 🧱 Tech stack
Not frozen yet. Chosen deliberately, step by step.

Initial constraints:
- Local-first
- Minimal dependencies
- Easy to run & debug
- No premature architecture

Details will be documented in `docs/decisions.md`.

---

## 📁 Project structure
```txt
.
├── docs/
│   ├── vision.md        # product intent & non-goals
│   ├── decisions.md    # architecture decisions (ADR-lite)
│   └── runbook.md      # how to run / debug the app
├── src/                # application source
├── tests/              # tests
├── scripts/            # helper scripts
├── .env.example
├── BACKLOG.md
└── README.md
```

---
## 🛠️ Getting started

> Setup instructions will appear once the first runnable version exists.

Planned commands (subject to change):
```txt
make run     # start the app
make test    # run tests
make lint    # lint code
make fmt     # format code
```
---
## 📜 Documentation

* `docs/vision.md` → what OfferTrail is (and is not)

* `docs/decisions.md` → why technical choices were made

* `docs/runbook.md` → how to run, debug, and recover

---
## 🤝 Contributing

This project favors:

* small, focused changes

* explicit intent

* clean commits

* readable code over clever code

PRs should include:

* a short description

* how to test the change

* any trade-offs made

---
## 📄 License

To be defined.
(MIT is the default candidate unless stated otherwise.)

---


