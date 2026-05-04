import { useState } from 'react';
import { Group, Text, ActionIcon, useMantineColorScheme, Drawer, Stack, Burger, Menu } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { Link, Outlet } from 'react-router-dom';
import classes from './LandingLayout.module.css';
import { LEGAL_CONFIG } from '../config/legal';
import { CONFIG } from '../config';
import { useI18n } from '../i18n';

export function LandingLayout() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, locale, changeLanguage } = useI18n();

  const LanguageSwitcher = ({ size = 'md' }: { size?: string }) => (
    <Menu shadow="md" width={140} radius="md" position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          title={t('nav.selectLanguage')}
          radius="xl"
        >
          <Text size={size}>{locale.startsWith('fr') ? '🇫🇷' : '🇬🇧'}</Text>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<Text size="sm">🇫🇷</Text>}
          onClick={() => changeLanguage('fr')}
          active={locale.startsWith('fr')}
        >
          {t('nav.langs.fr')}
        </Menu.Item>
        <Menu.Item
          leftSection={<Text size="sm">🇬🇧</Text>}
          onClick={() => changeLanguage('en')}
          active={locale.startsWith('en')}
        >
          {t('nav.langs.en')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

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
            <a href="#fonctionnalites" className={classes.navLink}>{t('nav.features')}</a>
            <a href="#tarifs" className={classes.navLink}>{t('nav.pricing')}</a>
          </div>

          <Group gap="xs" className={classes.navActions}>
            <LanguageSwitcher />
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => toggleColorScheme()}
              radius="xl"
              title={t('nav.switchTheme')}
            >
              {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            </ActionIcon>
            <Link to="/login" className={classes.btnOutline}>{t('nav.login')}</Link>
            <Link to="/register" className={classes.btnPrimary}>{t('nav.start')} →</Link>
          </Group>

          <div className={classes.navBurger}>
            <LanguageSwitcher />
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => toggleColorScheme()}
              radius="xl"
              title={t('nav.switchTheme')}
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
          <a href="#fonctionnalites" className={classes.navLink} onClick={() => setMobileMenuOpen(false)}>{t('nav.features')}</a>
          <a href="#tarifs" className={classes.navLink} onClick={() => setMobileMenuOpen(false)}>{t('nav.pricing')}</a>
          <Link to="/login" className={classes.btnOutline} onClick={() => setMobileMenuOpen(false)}>{t('nav.login')}</Link>
          <Link to="/register" className={classes.btnPrimary} onClick={() => setMobileMenuOpen(false)}>{t('nav.start')} →</Link>
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
            <a href="#tarifs" className={classes.footerLink}>{t('nav.pricing')}</a>
            <Link to="/app/legal/cgu" className={classes.footerLink}>{t('nav.legalCgu')}</Link>
            <Link to="/app/legal/confidentialite" className={classes.footerLink}>{t('nav.legalPrivacy')}</Link>
            <Link to="/mentions-legales" className={classes.footerLink}>{t('nav.legalMentions')}</Link>
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className={classes.footerLink}>{t('nav.contact')}</a>
          </Group>
        </div>
      </footer>
    </div>
  );
}
