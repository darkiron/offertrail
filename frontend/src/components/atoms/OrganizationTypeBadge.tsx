import { Badge } from '@mantine/core';
import type { OrganizationType } from '../../types';
import classes from './OrganizationTypeBadge.module.css';

interface OrganizationTypeBadgeProps {
  type: OrganizationType;
  size?: 'xs' | 'sm';
}

const TYPE_CONFIG: Record<OrganizationType, { label: string; className: string }> = {
  CLIENT_FINAL:        { label: 'Client final', className: classes.clientFinal },
  ESN:                 { label: 'ESN',          className: classes.esn },
  CABINET_RECRUTEMENT: { label: 'Cabinet',      className: classes.cabinetRecrutement },
  STARTUP:             { label: 'Startup',      className: classes.startup },
  PME:                 { label: 'PME',          className: classes.pme },
  GRAND_COMPTE:        { label: 'Grand compte', className: classes.grandCompte },
  PORTAGE:             { label: 'Portage',      className: classes.portage },
  AUTRE:               { label: 'Autre',        className: classes.autre },
};

export function OrganizationTypeBadge({ type, size = 'sm' }: OrganizationTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.AUTRE;

  return (
    <Badge
      size={size === 'xs' ? 'xs' : 'sm'}
      radius="xl"
      className={`${classes.badge} ${config.className}`}
      variant="light"
    >
      {config.label}
    </Badge>
  );
}

export default OrganizationTypeBadge;
