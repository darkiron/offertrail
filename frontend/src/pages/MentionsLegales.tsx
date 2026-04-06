import { useEffect } from 'react';
import { LegalLayout } from '../components/layouts/LegalLayout';
import { LEGAL_CONFIG, formatLastUpdated } from '../config/legal';

export function MentionsLegales() {
  useEffect(() => {
    document.title = `Mentions légales — ${LEGAL_CONFIG.productName}`;
  }, []);

  return (
    <LegalLayout title="Mentions légales" lastUpdated={formatLastUpdated(LEGAL_CONFIG.lastUpdated)}>

      <div className="ll-section">
        <h2>Éditeur du site</h2>
        <address>
          <strong>{LEGAL_CONFIG.company.name}</strong><br />
          {LEGAL_CONFIG.company.address.join(', ')}<br />
          {LEGAL_CONFIG.company.siret ? <>SIRET : {LEGAL_CONFIG.company.siret}<br /></> : null}
          E-mail : <a href={`mailto:${LEGAL_CONFIG.company.email}`}>{LEGAL_CONFIG.company.email}</a>
        </address>
      </div>

      <div className="ll-section">
        <h2>Directeur de la publication</h2>
        <p>{LEGAL_CONFIG.company.name}</p>
      </div>

      <div className="ll-section">
        <h2>Hébergement</h2>
        <address>
          {LEGAL_CONFIG.hosting.name}
          {LEGAL_CONFIG.hosting.address ? <><br />{LEGAL_CONFIG.hosting.address}</> : null}
          {LEGAL_CONFIG.hosting.url
            ? <><br /><a href={LEGAL_CONFIG.hosting.url} target="_blank" rel="noopener noreferrer">{LEGAL_CONFIG.hosting.url}</a></>
            : null}
        </address>
      </div>

      <div className="ll-section">
        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus présents sur {LEGAL_CONFIG.productName} — textes, interface, logotypes, code source — sont la propriété exclusive de {LEGAL_CONFIG.company.name}. Toute reproduction, représentation, modification ou diffusion, intégrale ou partielle, sans autorisation écrite préalable, est interdite et constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.
        </p>
      </div>

      <div className="ll-section">
        <h2>Données personnelles</h2>
        <p>
          {LEGAL_CONFIG.productName} traite des données à caractère personnel dans le cadre de la fourniture du service. Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez de droits sur vos données (accès, rectification, effacement, portabilité, opposition).
        </p>
        <p>
          Pour en savoir plus, consultez notre <a href="/rgpd">Politique de confidentialité & RGPD</a>.
          Contact DPO : <a href={`mailto:${LEGAL_CONFIG.company.emailRgpd}`}>{LEGAL_CONFIG.company.emailRgpd}</a>
        </p>
      </div>

      <div className="ll-section">
        <h2>Cookies</h2>
        <p>
          Ce site utilise uniquement un cookie de session strictement nécessaire au maintien de votre connexion. Aucun cookie publicitaire ou analytique tiers n'est utilisé.
        </p>
      </div>

      <div className="ll-section">
        <h2>Responsabilité</h2>
        <p>
          {LEGAL_CONFIG.company.name} s'efforce d'assurer l'exactitude et la mise à jour des informations publiées sur {LEGAL_CONFIG.productName}. Toutefois, nous ne saurions être tenus responsables des erreurs ou omissions, de l'indisponibilité temporaire du service, ou de l'utilisation faite des informations contenues sur ce site.
        </p>
      </div>

    </LegalLayout>
  );
}
