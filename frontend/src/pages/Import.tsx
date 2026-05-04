import React, { useState } from 'react';
import axios from 'axios';
import {
  Group, List, Paper, SimpleGrid, Stack, Text, Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { applicationService } from '../services/api';
import type { ImportResponse } from '../services/api';
import { Button } from '../components/atoms/Button';
import { PageHeader } from '../components/molecules/PageHeader';
import { useI18n } from '../i18n';
import classes from './Import.module.css';

export const Import: React.FC = () => {
  const { t } = useI18n();
  const [tsv, setTsv] = useState('');
  const [results, setResults] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    document.title = t('nav.import') + ' — OfferTrail';
  }, [t]);

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tsv.trim()) {
      return;
    }
    setLoading(true);
    try {
      const response = await applicationService.importTsv(tsv);
      setResults(response);
      if (response.created > 0) {
        setTsv('');
        notifications.show({ message: t('import.notifSuccess', { count: response.created }), color: 'green' });
      }
    } catch (importError: unknown) {
      const detail = (axios.isAxiosError(importError) && importError.response?.data?.detail) || t('import.notifError');
      notifications.show({ message: detail, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <PageHeader
        title={t('import.title')}
        description={t('import.description')}
      />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Paper p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('import.dataLabel')}</Text>
          <Text size="sm" c="dimmed" mb="md">
            {t('import.dataHint')}
          </Text>
          <form onSubmit={handleImport}>
            <Textarea
              classNames={{ input: classes.tsvArea }}
              value={tsv}
              onChange={(event) => setTsv(event.target.value)}
              placeholder={t('import.placeholder')}
              mb="md"
            />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? t('import.processing') : t('import.submit')}
            </Button>
          </form>
        </Paper>

        <Stack gap="md">
          {results ? (
            <Paper p="lg" radius="lg" withBorder>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('import.results')}</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">{t('import.total')}</Text>
                  <Text size="sm" fw={700}>{results.total}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">{t('import.created')}</Text>
                  <Text size="sm" fw={700} c="green">{results.created}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">{t('import.skipped')}</Text>
                  <Text size="sm" fw={700} c="red">{results.skipped}</Text>
                </Group>
              </Stack>

              {results.errors?.length > 0 ? (
                <Stack gap="xs" mt="md">
                  <Text size="sm" fw={700} c="red">{t('import.errors')}</Text>
                  <Stack gap={4} style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {results.errors.map((item: ImportResponse['errors'][number], index: number) => (
                      <Text key={index} size="xs" c="dimmed">{t('import.row')} {item.row} : {item.reason}</Text>
                    ))}
                  </Stack>
                </Stack>
              ) : null}
            </Paper>
          ) : null}

          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('import.columnMapping')}</Text>
            <List size="sm" c="dimmed" spacing="xs">
              <List.Item>{t('import.cols.company')}</List.Item>
              <List.Item>{t('import.cols.position')}</List.Item>
              <List.Item>{t('import.cols.type')}</List.Item>
              <List.Item>{t('import.cols.source')}</List.Item>
              <List.Item>{t('import.cols.status')}</List.Item>
              <List.Item>{t('import.cols.date')}</List.Item>
              <List.Item>{t('import.cols.notes')}</List.Item>
            </List>
          </Paper>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
};
