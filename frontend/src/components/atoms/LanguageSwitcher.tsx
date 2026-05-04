import { ActionIcon, Menu, Text } from '@mantine/core';
import { useI18n } from '../../i18n';

interface LanguageSwitcherProps {
  size?: string;
}

export function LanguageSwitcher({ size = 'md' }: LanguageSwitcherProps) {
  const { t, locale, changeLanguage } = useI18n();

  return (
    <Menu shadow="md" width={140} radius="md" position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          title={t('nav.selectLanguage')}
          radius="xl"
          aria-label={t('nav.selectLanguage')}
        >
          <Text size={size}>{locale.startsWith('fr') ? '🇫🇷' : '🇬🇧'}</Text>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<Text size="sm">🇫🇷</Text>}
          onClick={() => changeLanguage('fr')}
        >
          {t('nav.langs.fr')}
        </Menu.Item>
        <Menu.Item
          leftSection={<Text size="sm">🇬🇧</Text>}
          onClick={() => changeLanguage('en')}
        >
          {t('nav.langs.en')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
