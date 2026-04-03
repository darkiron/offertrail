from src.auth import _user_can_see_contact, get_visible_contacts
from src.database import SessionLocal, engine
from src.models import Base, Candidature, Contact, Etablissement, User


def test_contact_visible_when_target_organization_is_user_owned():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user = User(
            id="user-1",
            email="user@example.com",
            hashed_password="secret",
            is_active=True,
        )
        intermediary = Etablissement(
            id="org-intermediary",
            nom="Effektiv",
            type="cabinet_recrutement",
        )
        target = Etablissement(
            id="org-target",
            nom="Ritchee - Rhétores",
            type="autre",
            created_by=user.id,
        )
        contact = Contact(
            id="contact-1",
            etablissement_id=target.id,
            prenom="Francois-Jerome",
            nom="Biolay",
            email_pro="fj.biolay@rhetores.com",
            created_by=user.id,
        )
        candidature = Candidature(
            id="cand-1",
            user_id=user.id,
            etablissement_id=intermediary.id,
            poste="DevOps",
            statut="envoyee",
        )

        db.add_all([user, intermediary, target, contact, candidature])
        db.commit()

        assert _user_can_see_contact(db, user.id, contact) is True
        visible_contacts = get_visible_contacts(db, user.id)
        assert [item.id for item in visible_contacts] == [contact.id]
    finally:
        db.close()
