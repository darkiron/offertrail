from src.auth import _user_can_see_contact, get_visible_contacts
from src.database import SessionLocal, engine
import asyncio

from src.main import api_get_contact
from src.models import Base, Candidature, Contact, Etablissement, Profile


def test_contact_visible_when_target_organization_is_user_owned():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user = Profile(
            id="user-1",
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


def test_contact_detail_is_readable_when_visible_but_created_by_another_user():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user = Profile(id="user-reader", is_active=True)
        creator = Profile(id="user-creator", is_active=True)
        organization = Etablissement(id="org-shared", nom="Shared", type="autre")
        contact = Contact(
            id="contact-shared",
            etablissement_id=organization.id,
            prenom="Visible",
            nom="Contact",
            created_by=creator.id,
        )
        candidature = Candidature(
            id="cand-reader",
            user_id=user.id,
            etablissement_id=organization.id,
            poste="Développeur",
            statut="envoyee",
        )
        db.add_all([user, creator, organization, contact, candidature])
        db.commit()

        result = asyncio.run(api_get_contact(contact.id, db, user.id))

        assert result["first_name"] == "Visible"
        assert len(result["applications"]) == 1
        assert result["applications"][0]["id"] == candidature.id
        assert result["organization"]["id"] == organization.id
    finally:
        db.close()
