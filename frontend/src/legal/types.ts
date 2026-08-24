export type LegalDocumentId =
  'termsOfSale' | 'termsOfUse' | 'privacy' | 'legalNotice';

export interface LegalSection {
  heading: string;
  paragraphs?: readonly string[];
  subheading?: string;
  items?: readonly string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  version: string;
  pageTitle: string;
  eyebrow: string;
  title: string;
  updated: string;
  sections: readonly LegalSection[];
}

export type LocalizedLegalMetadata = Pick<
  LegalDocument,
  'pageTitle' | 'eyebrow' | 'title' | 'updated'
>;
