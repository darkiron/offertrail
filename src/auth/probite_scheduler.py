"""
OfferTrail — Scheduler APScheduler (recompute périodique du score de probité).

Historiquement colocalisé avec la vérification JWT dans src/auth.py ; conservé
ici tel quel lors de l'éclatement en package (pas de changement de
comportement, uniquement de la réorganisation de fichiers).

Nommé `probite_scheduler` (plutôt que `scheduler`) pour éviter toute collision
entre le nom du sous-module et le nom de l'instance `scheduler` qu'il expose
et que `src.auth.__init__` ré-exporte.
"""
from apscheduler.schedulers.background import BackgroundScheduler

from src.database import SessionLocal

scheduler = BackgroundScheduler()


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(
        func=_run_probite_recompute,
        trigger="interval",
        hours=1,
        id="recompute_probite",
        replace_existing=True,
    )
    scheduler.start()


def _run_probite_recompute() -> None:
    db = SessionLocal()
    try:
        from src.services.probite import recompute_probite_scores
        recompute_probite_scores(db)
    finally:
        db.close()
