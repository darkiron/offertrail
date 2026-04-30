import { useState } from 'react';
import axios from 'axios';
import {
  Modal, TextInput, Textarea, NumberInput, Select, SimpleGrid, Stack, Group, Text,
} from '@mantine/core';
import type { Application } from '../../types';
import type { ApplicationPayload } from '../../services/api';
import { Button } from '../atoms/Button';
import { STATUT_FORM_OPTIONS } from '../../constants/statuts';

interface ApplicationEditModalProps {
  application: Application;
  onClose: () => void;
  onSaved: (payload: ApplicationPayload) => Promise<unknown>;
}

const CONTRACT_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'CDD', label: 'CDD' },
  { value: 'INTERN', label: 'Stage' },
];

export function ApplicationEditModal({ application, onClose, onSaved }: ApplicationEditModalProps) {
  const [form, setForm] = useState<ApplicationPayload>({
    title: application.title ?? '',
    type: application.type ?? 'CDI',
    status: application.status ?? 'envoyee',
    source: application.source ?? '',
    job_url: application.job_url ?? '',
    applied_at: application.applied_at ?? '',
    notes: (application as unknown as Record<string, string>).notes ?? '',
    salary: null,
    response_date: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ApplicationPayload>(key: K, value: ApplicationPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSaved({
        ...form,
        source: form.source || null,
        job_url: form.job_url || null,
        applied_at: form.applied_at || null,
        response_date: form.response_date || null,
        notes: form.notes || null,
      });
      onClose();
    } catch (err: unknown) {
      setError((axios.isAxiosError(err) && err.response?.data?.detail) || 'Échec de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened
      onClose={onClose}
      size="lg"
      title={
        <Stack gap={2}>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Modifier</Text>
          <Text size="xl" fw={700}>{application.title}</Text>
        </Stack>
      }
    >
      {error && <Text c="red" size="sm" mb="md">{error}</Text>}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Poste"
            required
            value={form.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
          />

          <SimpleGrid cols={2} spacing="sm">
            <Select
              label="Type de contrat"
              data={CONTRACT_OPTIONS}
              value={form.type ?? 'CDI'}
              onChange={(v) => set('type', v ?? 'CDI')}
            />
            <Select
              label="Statut"
              data={STATUT_FORM_OPTIONS}
              value={form.status ?? 'envoyee'}
              onChange={(v) => set('status', v ?? 'envoyee')}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="Date de candidature"
              type="date"
              value={form.applied_at ?? ''}
              onChange={(e) => set('applied_at', e.target.value)}
            />
            <TextInput
              label="Date de réponse"
              type="date"
              value={form.response_date ?? ''}
              onChange={(e) => set('response_date', e.target.value)}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="Source"
              placeholder="LinkedIn, Indeed…"
              value={form.source ?? ''}
              onChange={(e) => set('source', e.target.value)}
            />
            <NumberInput
              label="Salaire visé (€)"
              placeholder="45000"
              value={form.salary ?? ''}
              onChange={(v) => set('salary', v === '' ? null : Number(v))}
              min={0}
            />
          </SimpleGrid>

          <TextInput
            label="URL de l'offre"
            placeholder="https://…"
            value={form.job_url ?? ''}
            onChange={(e) => set('job_url', e.target.value)}
          />

          <Textarea
            label="Notes"
            rows={4}
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
          />

          <Group justify="space-between">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Sauvegarde…' : 'Enregistrer'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
