export const STATUTS = ['en_attente', 'envoyee', 'entretien', 'offre_recue', 'refusee'] as const;
export type Statut = typeof STATUTS[number];

export const STATUT_LABELS: Record<Statut, string> = {
  en_attente:  'En attente',
  envoyee:     'Envoyée',
  entretien:   'Entretien',
  offre_recue: 'Offre reçue',
  refusee:     'Refusée',
};

export const STATUT_COLORS: Record<Statut, { background: string; color: string; borderColor: string }> = {
  en_attente:  { background: 'rgba(14, 165, 233, 0.18)',  color: '#38bdf8', borderColor: 'rgba(14, 165, 233, 0.34)' },
  envoyee:     { background: 'rgba(59, 130, 246, 0.18)',  color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.34)' },
  entretien:   { background: 'rgba(245, 158, 11, 0.18)',  color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.34)' },
  offre_recue: { background: 'rgba(16, 185, 129, 0.18)',  color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.34)' },
  refusee:     { background: 'rgba(244, 63, 94, 0.18)',   color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.34)' },
};

export const STATUT_OPTIONS = [
  { value: '', label: 'Tous' },
  ...STATUTS.map((s) => ({ value: s, label: STATUT_LABELS[s] })),
];

export const STATUT_FORM_OPTIONS = STATUTS.map((s) => ({ value: s, label: STATUT_LABELS[s] }));

export const STATUTS_REPONSE_POSITIVE = new Set<Statut>(['entretien', 'offre_recue']);
export const STATUTS_CLOS             = new Set<Statut>(['refusee']);
export const STATUTS_ACTIFS           = new Set<Statut>(['en_attente', 'envoyee', 'entretien', 'offre_recue']);
