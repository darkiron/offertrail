import { useEffect } from 'react';

export const Confidentialite: React.FC = () => {
  useEffect(() => { document.title = 'Confidentialité — OfferTrail'; }, []);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '2rem' }}>
        Politique de confidentialité
      </h1>
      <p style={{ color: 'var(--mantine-color-dimmed)', marginBottom: '2rem', fontSize: '13px' }}>
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Responsable du traitement</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          CraftCodes — auto-entrepreneur<br />
          contact@craftcodes.fr
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Données collectées</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          Email (pour l'authentification), données de candidatures saisies
          volontairement (entreprises, postes, statuts, contacts, notes).
          Aucune donnée n'est collectée sans action explicite de l'utilisateur.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Utilisation</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          Les données sont utilisées uniquement pour fournir le service OfferTrail.
          Elles ne sont jamais vendues, revendues ou partagées à des tiers
          à des fins commerciales ou publicitaires.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Hébergement</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          Les données sont hébergées par Supabase (Union Européenne)
          et Railway. Le paiement est traité par Stripe. Ces sous-traitants
          sont conformes au RGPD.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Score de probité</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          Les données de candidatures contribuent de manière anonymisée au calcul
          du score de probité des établissements. Aucune donnée personnelle
          (email, nom) n'est exposée dans ce calcul. Un minimum de 3 candidatures
          est requis pour qu'un score soit affiché.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Vos droits</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
          de suppression et de portabilité de vos données.
          Pour exercer ces droits :{' '}
          <a href="mailto:contact@craftcodes.fr" style={{ color: 'var(--mantine-color-blue-6)' }}>
            contact@craftcodes.fr
          </a>
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Cookies</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          OfferTrail n'utilise pas de cookies publicitaires ni de trackers tiers.
          Un cookie de session est utilisé pour maintenir la connexion.
          Aucun outil d'analytics tiers n'est actif à ce jour.
        </p>
      </section>
    </div>
  );
};
