export function getStatutStyle(statut: string): { background: string; color: string; borderColor: string } {
  const key = String(statut || '').toLowerCase();
  const map: Record<string, { background: string; color: string; borderColor: string }> = {
    brouillon: { background: 'rgba(148, 163, 184, 0.18)', color: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.34)' },
    envoyee: { background: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.34)' },
    en_attente: { background: 'rgba(14, 165, 233, 0.18)', color: '#38bdf8', borderColor: 'rgba(14, 165, 233, 0.34)' },
    relancee: { background: 'rgba(14, 165, 233, 0.18)', color: '#38bdf8', borderColor: 'rgba(14, 165, 233, 0.34)' },
    entretien: { background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.34)' },
    test_technique: { background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.34)' },
    offre_recue: { background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.34)' },
    acceptee: { background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.34)' },
    refusee: { background: 'rgba(244, 63, 94, 0.18)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.34)' },
    ghosting: { background: 'rgba(244, 63, 94, 0.18)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.34)' },
    abandonnee: { background: 'rgba(148, 163, 184, 0.18)', color: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.34)' },
  };

  return map[key] ?? { background: 'rgba(148, 163, 184, 0.18)', color: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.34)' };
}

export function getStatutLabel(statut: string): string {
  const normalized = String(statut || '').toLowerCase();
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoyee: 'Envoyee',
    en_attente: 'En attente',
    relancee: 'Relancee',
    entretien: 'Entretien',
    test_technique: 'Test technique',
    offre_recue: 'Offre recue',
    acceptee: 'Acceptee',
    refusee: 'Refusee',
    ghosting: 'Ghosting',
    abandonnee: 'Abandonnee',
    interested: 'En attente',
    applied: 'Envoyee',
    interview: 'Entretien',
    offer: 'Offre recue',
    rejected: 'Refusee',
  };

  return labels[normalized] ?? (normalized ? normalized.replace(/_/g, ' ') : 'N/A');
}

export const statusLabelMap: Record<string, string> = {
  INTERESTED: getStatutLabel('interested'),
  APPLIED: getStatutLabel('applied'),
  INTERVIEW: getStatutLabel('interview'),
  OFFER: getStatutLabel('offer'),
  REJECTED: getStatutLabel('rejected'),
};
