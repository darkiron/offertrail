import { Link } from 'react-router-dom';
import { LEGAL_CONFIG } from '../../config/legal';

type PublicBrandProps = { to?: string };

/** Single brand lockup shared by the public and authentication shells. */
export function PublicBrand({ to = '/' }: PublicBrandProps) {
  return (
    <Link
      className="ot-public-brand"
      to={to}
      aria-label={`${LEGAL_CONFIG.productName} — accueil`}
    >
      <span className="ot-public-brand__mark" aria-hidden="true">
        OT
      </span>
      <span className="ot-public-brand__name">{LEGAL_CONFIG.productName}</span>
    </Link>
  );
}
