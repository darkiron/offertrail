import type { Locale } from '../i18n';
import { sections as frTerms } from './fr/terms';
import { sections as frCgu } from './fr/cgu';
import { sections as frPrivacy } from './fr/privacy';
import { sections as frNotice } from './fr/notice';
import { sections as enTerms } from './en/terms';
import { sections as enCgu } from './en/cgu';
import { sections as enPrivacy } from './en/privacy';
import { sections as enNotice } from './en/notice';
import type {
  LegalDocument,
  LegalDocumentId,
  LegalSection,
  LocalizedLegalMetadata,
} from './types';

const versions: Record<LegalDocumentId, string> = {
  termsOfSale: '2026-01',
  termsOfUse: '2026-01',
  privacy: '2026-08',
  legalNotice: '2026-08',
};

const metadata: Record<
  Locale,
  Record<LegalDocumentId, LocalizedLegalMetadata>
> = {
  fr: {
    termsOfSale: {
      pageTitle: 'Conditions générales de vente — OfferTrail',
      eyebrow: 'Conditions commerciales',
      title: 'Conditions Générales de Vente',
      updated: 'Dernière mise à jour : janvier 2026',
    },
    termsOfUse: {
      pageTitle: 'Conditions Générales d’Utilisation — OfferTrail',
      eyebrow: 'Conditions d’utilisation',
      title: 'Conditions Générales d’Utilisation',
      updated: 'Dernière mise à jour : janvier 2026',
    },
    privacy: {
      pageTitle: 'Politique de confidentialité — OfferTrail',
      eyebrow: 'RGPD & confidentialité',
      title: 'Politique de confidentialité',
      updated: 'Dernière mise à jour : août 2026',
    },
    legalNotice: {
      pageTitle: 'Mentions légales — OfferTrail',
      eyebrow: 'Informations légales',
      title: 'Mentions légales',
      updated: 'Dernière mise à jour : août 2026',
    },
  },
  en: {
    termsOfSale: {
      pageTitle: 'Terms of Sale — OfferTrail',
      eyebrow: 'Commercial terms',
      title: 'Terms of Sale',
      updated: 'Last updated: January 2026',
    },
    termsOfUse: {
      pageTitle: 'Terms of Use — OfferTrail',
      eyebrow: 'Terms of use',
      title: 'Terms of Use',
      updated: 'Last updated: January 2026',
    },
    privacy: {
      pageTitle: 'Privacy Policy — OfferTrail',
      eyebrow: 'GDPR & privacy',
      title: 'Privacy Policy',
      updated: 'Last updated: August 2026',
    },
    legalNotice: {
      pageTitle: 'Legal Notice — OfferTrail',
      eyebrow: 'Legal information',
      title: 'Legal Notice',
      updated: 'Last updated: August 2026',
    },
  },
};

const content: Record<
  Locale,
  Record<LegalDocumentId, readonly LegalSection[]>
> = {
  fr: {
    termsOfSale: frTerms,
    termsOfUse: frCgu,
    privacy: frPrivacy,
    legalNotice: frNotice,
  },
  en: {
    termsOfSale: enTerms,
    termsOfUse: enCgu,
    privacy: enPrivacy,
    legalNotice: enNotice,
  },
};

const createDocument = (
  locale: Locale,
  id: LegalDocumentId,
): LegalDocument => ({
  id,
  version: versions[id],
  ...metadata[locale][id],
  sections: content[locale][id],
});

export const legalDocuments: Record<
  Locale,
  Record<LegalDocumentId, LegalDocument>
> = {
  fr: {
    termsOfSale: createDocument('fr', 'termsOfSale'),
    termsOfUse: createDocument('fr', 'termsOfUse'),
    privacy: createDocument('fr', 'privacy'),
    legalNotice: createDocument('fr', 'legalNotice'),
  },
  en: {
    termsOfSale: createDocument('en', 'termsOfSale'),
    termsOfUse: createDocument('en', 'termsOfUse'),
    privacy: createDocument('en', 'privacy'),
    legalNotice: createDocument('en', 'legalNotice'),
  },
};
