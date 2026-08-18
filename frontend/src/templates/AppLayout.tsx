import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/api';
import { PlanLimitBanner } from '../components/PlanLimitBanner';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { useI18n } from '../i18n';
import type { SubscriptionStatus } from '../types';
import classes from './AppLayout.module.css';

function SlowApiNotice() {
  const fetching = useIsFetching();
  const [visible, setVisible] = useState(false);
  const shown = useRef(sessionStorage.getItem('ot_coldstart_shown') === '1');
  useEffect(() => {
    if (shown.current) return;
    const timer = window.setTimeout(() => { if (fetching > 0) { setVisible(true); shown.current = true; sessionStorage.setItem('ot_coldstart_shown', '1'); } }, 1500);
    return () => window.clearTimeout(timer);
  }, [fetching]);
  useEffect(() => { if (fetching === 0) setVisible(false); }, [fetching]);
  return visible ? <div className={classes.slow} role="status">Le service se réveille. Vos données vont apparaître dans quelques instants.<button onClick={() => setVisible(false)} aria-label="Masquer">×</button></div> : null;
}

export function AppLayout() {
  const { isAuthenticated, signOut, user, profile } = useAuth();
  const { t } = useI18n();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [menu, setMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const links = [[t('nav.dashboard'), '/app'], [t('nav.applications'), '/app/candidatures'], [t('nav.organizations'), '/app/etablissements'], [t('nav.contacts'), '/app/contacts'], [t('nav.import'), '/app/import']] as const;
  const initials = useMemo(() => (profile?.prenom?.[0] || user?.email?.[0] || 'O').toUpperCase(), [profile?.prenom, user?.email]);
  useEffect(() => { if (isAuthenticated) subscriptionService.getMe().then(setSub).catch(() => undefined); }, [isAuthenticated]);
  if (!isAuthenticated) return <Outlet />;
  return <div className={classes.shell}>
    {showCreate && <NewApplicationModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void queryClient.invalidateQueries({ queryKey: ['today'] }); void queryClient.invalidateQueries({ queryKey: ['workflow-applications'] }); }} />}
    <header className={classes.header}>
      <Link className={classes.brand} to="/app"><span aria-hidden="true" className={classes.mark} /><strong>OfferTrail</strong></Link>
      <nav className={classes.desktopNav} aria-label={t('nav.dashboard')}>{links.map(([label, to]) => <NavLink key={to} end={to === '/app'} to={to} className={({ isActive }) => isActive ? classes.active : ''}>{label}</NavLink>)}</nav>
      <button className={classes.avatar} onClick={() => setMenu((value) => !value)} aria-expanded={menu} aria-label={t('nav.monCompte')}>{initials}</button>
      {menu && <div className={classes.accountMenu} role="menu">
        <div className={classes.accountIdentity}><span className={classes.accountAvatar}>{initials}</span><div><strong>{profile?.prenom || t('nav.monCompte')}</strong><small>{user?.email}</small></div></div>
        <div className={classes.accountDivider} />
        <Link role="menuitem" to="/app/mon-compte" onClick={() => setMenu(false)}>{t('nav.monCompte')}<small>{t('nav.subscription')}</small></Link>
        <div className={classes.accountDivider} />
        <button role="menuitem" onClick={() => void signOut().then(() => navigate('/login'))}>{t('nav.logout')}</button>
      </div>}
    </header>
    <div className={classes.notices}><PlanLimitBanner sub={sub} /><SlowApiNotice /></div>
    <div className={classes.content}><AppErrorBoundary><Outlet context={{ openCreateApplication: () => setShowCreate(true) }} /></AppErrorBoundary></div>
    <nav className={classes.mobileNav} aria-label={t('nav.dashboard')}><NavLink end to="/app">{t('nav.dashboard')}</NavLink><NavLink to="/app/candidatures">{t('nav.applications')}</NavLink><button type="button" aria-label={t('dashboard.newApplication')} onClick={() => setShowCreate(true)}>＋</button></nav>
  </div>;
}
