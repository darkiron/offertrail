import { Menu, Group, Text, UnstyledButton } from '@mantine/core';
import { IconWorld, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n';
import classes from './LanguageSwitcher.module.css';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const current = LOCALES.find((l) => l.value === locale)!;

  return (
    <Menu
      shadow="md"
      width={150}
      radius="md"
      classNames={{ dropdown: classes.dropdown, item: classes.item }}
    >
      <Menu.Target>
        <UnstyledButton className={classes.trigger}>
          <Group gap={6} align="center">
            <IconWorld size={15} stroke={1.5} />
            <Text size="sm" fw={600}>{current.label}</Text>
            <IconChevronDown size={12} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {LOCALES.map(({ value, label }) => (
          <Menu.Item
            key={value}
            onClick={() => setLocale(value)}
            leftSection={
              locale === value
                ? <IconCheck size={14} color="var(--accent)" />
                : <span style={{ display: 'inline-block', width: 14 }} />
            }
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
