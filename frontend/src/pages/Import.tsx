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
import classes from './Import.module.css';

export const Import: React.FC = () => {
  const [tsv, setTsv] = useState('');
  const [results, setResults] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    document.title = 'Import — OfferTrail';
  }, []);

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
        notifications.show({ message: `${response.created} candidature(s) importée(s)`, color: 'green' });
      }
    } catch (importError: unknown) {
      const detail = (axios.isAxiosError(importError) && importError.response?.data?.detail) || "Echec de l'import. Verifie le format TSV.";
      notifications.show({ message: detail, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <PageHeader
        title="Import des candidatures"
        description="Colle tes données TSV depuis Excel ou Google Sheets pour importer tes candidatures en masse."
      />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Paper p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">Données TSV</Text>
          <Text size="sm" c="dimmed" mb="md">
            Colle ici tes données TSV, par exemple depuis Excel ou Google Sheets.
            La première ligne doit contenir les colonnes : Entreprise, Poste, Type, Source, Statut, etc.
          </Text>
          <form onSubmit={handleImport}>
            <Textarea
              classNames={{ input: classes.tsvArea }}
              value={tsv}
              onChange={(event) => setTsv(event.target.value)}
              placeholder={'Entreprise\tPoste\tType\tSource\tStatut...'}
              mb="md"
            />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Import en cours...' : "Lancer l'import"}
            </Button>
          </form>
        </Paper>

        <Stack gap="md">
          {results ? (
            <Paper p="lg" radius="lg" withBorder>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">Résultats</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Lignes totales</Text>
                  <Text size="sm" fw={700}>{results.total}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Créées</Text>
                  <Text size="sm" fw={700} c="green">{results.created}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Ignorées / erreurs</Text>
                  <Text size="sm" fw={700} c="red">{results.skipped}</Text>
                </Group>
              </Stack>

              {results.errors?.length > 0 ? (
                <Stack gap="xs" mt="md">
                  <Text size="sm" fw={700} c="red">Erreurs :</Text>
                  <Stack gap={4} style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {results.errors.map((item: ImportResponse['errors'][number], index: number) => (
                      <Text key={index} size="xs" c="dimmed">Ligne {item.row} : {item.reason}</Text>
                    ))}
                  </Stack>
                </Stack>
              ) : null}
            </Paper>
          ) : null}

          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">Correspondance des colonnes</Text>
            <List size="sm" c="dimmed" spacing="xs">
              <List.Item>Entreprise (obligatoire)</List.Item>
              <List.Item>Poste (obligatoire)</List.Item>
              <List.Item>Type (CDI, Freelance)</List.Item>
              <List.Item>Source (LinkedIn, etc.)</List.Item>
              <List.Item>Statut (Applied, Interview...)</List.Item>
              <List.Item>Date candidature</List.Item>
              <List.Item>Notes</List.Item>
            </List>
          </Paper>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
};
