import { useState } from 'react';
import { Group, Text, ActionIcon, useMantineColorScheme, Drawer, Stack, Burger } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { Link, Outlet } from 'react-router-dom';
import classes from './LandingLayout.module.css';
import { LEGAL_CONFIG } from '../config/legal';
import { CONFIG } from '../config';

export function LandingLayout() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          <Group gap="xs" className={classes.navActions}>
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

          <div className={classes.navBurger}>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => toggleColorScheme()}
              radius="xl"
              title="Changer le thème"
            >
              {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            </ActionIcon>
            <Burger opened={mobileMenuOpen} onClick={() => setMobileMenuOpen((o) => !o)} size="sm" />
          </div>
        </div>
      </nav>

      <Drawer
        opened={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={LEGAL_CONFIG.productName}
        position="right"
        size="xs"
      >
        <Stack gap="md" pt="md">
          <a href="#fonctionnalites" className={classes.navLink} onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
          <a href="#tarifs" className={classes.navLink} onClick={() => setMobileMenuOpen(false)}>Tarifs</a>
          <Link to="/login" className={classes.btnOutline} onClick={() => setMobileMenuOpen(false)}>Se connecter</Link>
          <Link to="/register" className={classes.btnPrimary} onClick={() => setMobileMenuOpen(false)}>Commencer →</Link>
        </Stack>
      </Drawer>

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
              href={CONFIG.CRAFTCODES_URL}
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
            <Link to="/mentions-legales" className={classes.footerLink}>Mentions légales</Link>
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className={classes.footerLink}>Contact</a>
          </Group>
        </div>
      </footer>
    </div>
  );
}
