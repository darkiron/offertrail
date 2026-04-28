import { STATUT_COLORS, STATUT_LABELS, type Statut } from '../constants/statuts';

export { STATUT_LABELS, STATUT_COLORS };
export type { Statut };

export function getStatutStyle(statut: string): { background: string; color: string; borderColor: string } {
  const key = statut as Statut;
  return STATUT_COLORS[key] ?? { background: 'rgba(148, 163, 184, 0.18)', color: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.34)' };
}

export function getStatutLabel(statut: string): string {
  const key = statut as Statut;
  return STATUT_LABELS[key] ?? (statut ? statut.replace(/_/g, ' ') : 'N/A');
}

export const statusLabelMap: Record<string, string> = {
  en_attente:  STATUT_LABELS.en_attente,
  envoyee:     STATUT_LABELS.envoyee,
  entretien:   STATUT_LABELS.entretien,
  offre_recue: STATUT_LABELS.offre_recue,
  refusee:     STATUT_LABELS.refusee,
};
