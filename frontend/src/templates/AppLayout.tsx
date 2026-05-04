import { useRef, useState, useEffect } from 'react';
import {
  AppShell,
  Alert,
  Burger,
  Group,
  NavLink,
  Text,
  UnstyledButton,
  Menu,
  ActionIcon,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useIsFetching } from '@tanstack/react-query';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconBriefcase,
  IconBuilding,
  IconUsers,
  IconFileImport,
  IconUser,
  IconCreditCard,
  IconLogout,
  IconSun,
  IconMoon,
  IconChevronDown,
  IconShield,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { subscriptionService } from '../services/api';
import { PlanLimitBanner } from '../components/PlanLimitBanner';
import type { SubscriptionStatus } from '../types';
import classes from './AppLayout.module.css';


function SlowApiNotice() {
  const isFetching = useIsFetching();
  const [visible, setVisible] = useState(false);
  const alreadyShown = useRef(sessionStorage.getItem('ot_coldstart_shown') === '1');

  useEffect(() => {
    if (alreadyShown.current) return;
    const timer = setTimeout(() => {
      if (isFetching > 0) {
        setVisible(true);
        alreadyShown.current = true;
        sessionStorage.setItem('ot_coldstart_shown', '1');
      }
    }, 1500);
    return () => clearTimeout(timer);
  // Intentionally run only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFetching === 0) setVisible(false);
  }, [isFetching]);

  if (!visible) return null;
  return (
    <Alert
      variant="light"
      color="yellow"
      withCloseButton
      mb="md"
      onClose={() => setVisible(false)}
      title="Démarrage en cours"
    >
      L'API et le frontend sont sur des plans gratuits (Railway + Vercel) —
      après une période d'inactivité, le cold start peut prendre 10–30 secondes.
      C'est normal, la suite sera fluide.
    </Alert>
  );
}

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { isAuthenticated, signOut, user, profile } = useAuth();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { t, locale, changeLanguage } = useI18n();

  const NAV_LINKS = [
    { label: t('nav.dashboard'), to: '/app', icon: IconLayoutDashboard },
    { label: t('nav.applications'), to: '/app/candidatures', icon: IconBriefcase },
    { label: t('nav.organizations'), to: '/app/etablissements', icon: IconBuilding },
    { label: t('nav.contacts'), to: '/app/contacts', icon: IconUsers },
    { label: t('nav.import'), to: '/app/import', icon: IconFileImport },
  ];

  const PRICING_EXEMPT = ['/app/pricing', '/app/mon-compte'];
  const isPricingExempt = PRICING_EXEMPT.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (isAuthenticated) {
      subscriptionService.getMe().then(setSub).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (sub && !sub.is_active && !isPricingExempt && profile?.role !== 'admin') {
      navigate('/app/checkout', { replace: true });
    }
  }, [sub, isPricingExempt, profile]);

  const isActive = (to: string) =>
    to === '/app'
      ? location.pathname === '/app'
      : location.pathname.startsWith(to);

  const handleLogout = () => {
    void signOut().then(() => navigate('/login'));
  };

  if (!isAuthenticated) return <Outlet />;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      className={classes.shell}
    >
      {/* ── Header ── */}
      <AppShell.Header className={classes.header}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Link to="/app" className={classes.brand}>
              <span className={classes.brandMark}>OT</span>
              <Text fw={800} size="sm" style={{ letterSpacing: '-0.02em' }}>OfferTrail</Text>
            </Link>
          </Group>

          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => changeLanguage(locale.startsWith('fr') ? 'en' : 'fr')}
              title={locale.startsWith('fr') ? 'Passer en anglais' : 'Switch to French'}
              radius="xl"
            >
              <Text size="md">{locale.startsWith('fr') ? '🇬🇧' : '🇫🇷'}</Text>
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => toggleColorScheme()}
              title="Changer le thème"
              radius="xl"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            <Menu shadow="md" width={200} radius="md">
              <Menu.Target>
                <UnstyledButton className={classes.userBtn}>
                  <Group gap="xs">
                    <Text size="sm" fw={600}>
                      {profile?.prenom || user?.email?.split('@')[0] || 'Mon compte'}
                    </Text>
                    <IconChevronDown size={14} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.email}</Menu.Label>
                <Menu.Divider />
                <Menu.Item leftSection={<IconUser size={14} />} component={Link} to="/app/mon-compte">
                  Mon compte
                </Menu.Item>
                {profile?.role === 'admin' ? (
                  <Menu.Item leftSection={<IconShield size={14} />} component={Link} to="/app/admin">
                    Administration
                  </Menu.Item>
                ) : null}
                <Menu.Item leftSection={<IconCreditCard size={14} />} component={Link} to="/app/pricing">
                  Abonnement
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                  Se déconnecter
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Sidebar ── */}
      <AppShell.Navbar p="sm" className={classes.navbar}>
        {NAV_LINKS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            label={label}
            leftSection={<Icon size={18} stroke={1.6} />}
            component={Link}
            to={to}
            active={isActive(to)}
            className={classes.navLink}
            onClick={close}
          />
        ))}
      </AppShell.Navbar>

      {/* ── Content ── */}
      <AppShell.Main className={classes.main}>
        <PlanLimitBanner sub={sub} />
        <SlowApiNotice />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
