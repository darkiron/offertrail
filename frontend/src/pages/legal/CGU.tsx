import { useEffect } from 'react';

export const CGU: React.FC = () => {
  useEffect(() => { document.title = 'CGU — OfferTrail'; }, []);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '2rem' }}>
        Conditions Générales d'Utilisation
      </h1>
      <p style={{ color: 'var(--mantine-color-dimmed)', marginBottom: '2rem', fontSize: '13px' }}>
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Éditeur</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          OfferTrail est édité par CraftCodes, auto-entrepreneur immatriculé en France.
          Contact :{' '}
          <a href="mailto:contact@craftcodes.fr" style={{ color: 'var(--mantine-color-blue-6)' }}>
            contact@craftcodes.fr
          </a>
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Service</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          OfferTrail est un outil de suivi de candidatures accessible en ligne.
          Un plan Starter gratuit (limité à 25 candidatures) et un plan Pro à 14,99€/mois
          sont proposés. Le paiement est traité par Stripe.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Abonnement et résiliation</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          L'abonnement Pro est mensuel et sans engagement. Il peut être résilié
          à tout moment depuis la page Mon Compte. La résiliation prend effet
          à la fin de la période en cours. Aucun remboursement prorata n'est effectué
          sur la période déjà facturée.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Données</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          Les données saisies (candidatures, contacts, établissements) sont stockées
          sur des serveurs sécurisés (Supabase, Union Européenne).
          Elles ne sont ni vendues ni partagées à des tiers.
          Chaque utilisateur peut exporter ou supprimer ses données à tout moment.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Limitation de responsabilité</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          OfferTrail est fourni "tel quel". CraftCodes ne garantit pas un résultat
          dans la recherche d'emploi et ne saurait être tenu responsable des décisions
          prises sur la base des informations affichées.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Droit applicable</h2>
        <p style={{ color: 'var(--mantine-color-dimmed)', fontSize: '14px' }}>
          Les présentes CGU sont soumises au droit français.
          Tout litige relève de la compétence des tribunaux français.
        </p>
      </section>
    </div>
  );
};
