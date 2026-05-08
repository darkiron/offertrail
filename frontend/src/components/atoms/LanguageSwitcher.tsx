import { ActionIcon, Menu, Text } from '@mantine/core';
import { useI18n } from '../../i18n';

export function LanguageSwitcher() {
  const { t, locale, changeLanguage } = useI18n();

  return (
    <Menu shadow="md" width={140} radius="md" position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          aria-label={t('nav.selectLanguage')}
        >
          <Text size="sm">{locale.startsWith('fr') ? '🇫🇷' : '🇬🇧'}</Text>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => changeLanguage('fr')}>
          {t('nav.langs.fr')}
        </Menu.Item>
        <Menu.Item onClick={() => changeLanguage('en')}>
          {t('nav.langs.en')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
