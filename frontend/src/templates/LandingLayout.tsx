import { Group, Text, UnstyledButton, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { Link, Outlet } from 'react-router-dom';
import classes from './LandingLayout.module.css';
import { LEGAL_CONFIG } from '../config/legal';

export function LandingLayout() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <div className={classes.root}>
      {/* ── Nav ── */}
      <nav className={classes.nav}>
        <div className={classes.navInner}>
          <Link to="/" className={classes.logo}>
            <span className={classes.logoMark}>OT</span>
            <Text fw={800} size="sm" style={{ letterSpacing: '-0.02em' }}>
              {LEGAL_CONFIG.productName}
            </Text>
          </Link>

          <div className={classes.navCenter}>
            <a href="#fonctionnalites" className={classes.navLink}>Fonctionnalités</a>
            <a href="#tarifs" className={classes.navLink}>Tarifs</a>
          </div>

          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => toggleColorScheme()}
              radius="xl"
              title="Changer le thème"
            >
              {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            </ActionIcon>
            <Link to="/login" className={classes.btnOutline}>Se connecter</Link>
            <Link to="/register" className={classes.btnPrimary}>Commencer →</Link>
          </Group>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className={classes.main}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className={classes.footer}>
        <div className={classes.footerInner}>
          <Text size="xs" c="dimmed">
            © {new Date().getFullYear()} {LEGAL_CONFIG.productName} —{' '}
            <a
              href={LEGAL_CONFIG.company.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              {LEGAL_CONFIG.company.name}
            </a>
          </Text>
          <Group gap="lg">
            <a href="#tarifs" className={classes.footerLink}>Tarifs</a>
            <Link to="/app/legal/cgu" className={classes.footerLink}>CGU</Link>
            <Link to="/app/legal/confidentialite" className={classes.footerLink}>Confidentialité</Link>
            <Link to="/cgv" className={classes.footerLink}>CGV</Link>
            <Link to="/mentions-legales" className={classes.footerLink}>Mentions légales</Link>
            <a href={`mailto:${LEGAL_CONFIG.company.email}`} className={classes.footerLink}>Contact</a>
          </Group>
        </div>
      </footer>
    </div>
  );
}
