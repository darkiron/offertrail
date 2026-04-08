import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Stack, Text, Title } from '@mantine/core';
import { LEGAL_CONFIG } from '../config/legal';

const PAGES: Record<string, { title: string; heading: string; content: string }> = {
  '/cgv': {
    title: 'Conditions Générales de Vente — OfferTrail',
    heading: 'Conditions Générales de Vente',
    content: `Les présentes CGV régissent les abonnements au service ${LEGAL_CONFIG.productName} édité par ${LEGAL_CONFIG.company.name}.\n\nCe document est en cours de rédaction. Pour toute question, contactez-nous à ${LEGAL_CONFIG.company.email}.`,
  },
  '/mentions-legales': {
    title: 'Mentions Légales — OfferTrail',
    heading: 'Mentions Légales',
    content: `Éditeur : ${LEGAL_CONFIG.company.name}\nContact : ${LEGAL_CONFIG.company.email}\n\nConformément à la loi n°2004-575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique.\n\nCe document est en cours de rédaction.`,
  },
  '/rgpd': {
    title: 'Politique de confidentialité — OfferTrail',
    heading: 'Protection des données (RGPD)',
    content: `${LEGAL_CONFIG.productName} est édité par ${LEGAL_CONFIG.company.name}.\n\nVos données personnelles sont traitées dans le cadre du RGPD (Règlement UE 2016/679). Elles ne sont jamais vendues à des tiers.\n\nPour exercer vos droits ou pour toute question : ${LEGAL_CONFIG.company.email}\n\nCe document est en cours de rédaction.`,
  },
};

export function LegalPage() {
  const { pathname } = useLocation();
  const page = PAGES[pathname] ?? PAGES['/mentions-legales'];

  useEffect(() => {
    document.title = page.title;
  }, [page.title]);

  return (
    <Stack gap="lg" maw={720} mx="auto" p="xl" py={64}>
      <Title order={1} style={{ letterSpacing: '-0.03em' }}>{page.heading}</Title>
      {page.content.split('\n\n').map((para, i) => (
        <Text key={i} c="dimmed" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
          {para}
        </Text>
      ))}
      <Text size="xs" c="dimmed" mt="lg">
        © {new Date().getFullYear()} {LEGAL_CONFIG.company.name}
      </Text>
    </Stack>
  );
}
