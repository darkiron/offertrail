import { useMemo } from 'react';
import { STATUTS } from '../constants/statuts';
import { useI18n } from '../i18n';

export function useStatusOptions() {
  const { t } = useI18n();
  return useMemo(() => [
    { value: '', label: t('statut.all') },
    ...STATUTS.map((s) => ({ value: s, label: t(`statut.${s}`) })),
  ], [t]);
}
