import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Modal, TextInput, Textarea, NumberInput, Select, SimpleGrid, Stack, Group, Text,
} from '@mantine/core';
import type { Application } from '../../types';
import type { ApplicationPayload } from '../../services/api';
import { useI18n } from '../../i18n';
import { Button } from '../atoms/Button';
import { STATUT_FORM_OPTIONS } from '../../constants/statuts';

interface ApplicationEditModalProps {
  application: Application;
  onClose: () => void;
  onSaved: (payload: ApplicationPayload) => Promise<unknown>;
}

export function ApplicationEditModal({ application, onClose, onSaved }: ApplicationEditModalProps) {
  const { t } = useI18n();

  const CONTRACT_OPTIONS = useMemo(() => [
    { value: 'CDI', label: t('newApplication.jobTypes.CDI') },
    { value: 'FREELANCE', label: t('newApplication.jobTypes.FREELANCE') },
    { value: 'CDD', label: t('newApplication.jobTypes.CDD') },
    { value: 'INTERN', label: t('newApplication.jobTypes.INTERN') },
  ], [t]);

  const STATUT_OPTIONS = useMemo(() => [
    ...STATUT_FORM_OPTIONS.map(opt => ({ ...opt, label: t(`status.${opt.value}`) }))
  ], [t]);

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
      setError((axios.isAxiosError(err) && err.response?.data?.detail) || t('application.saveError'));
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
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('application.edit')}</Text>
          <Text size="xl" fw={700}>{application.title}</Text>
        </Stack>
      }
    >
      {error && <Text c="red" size="sm" mb="md">{error}</Text>}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t('application.jobTitle')}
            required
            value={form.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
          />

          <SimpleGrid cols={2} spacing="sm">
            <Select
              label={t('application.contractType')}
              data={CONTRACT_OPTIONS}
              value={form.type ?? 'CDI'}
              onChange={(v) => set('type', v ?? 'CDI')}
            />
            <Select
              label={t('dashboard.status')}
              data={STATUT_OPTIONS}
              value={form.status ?? 'envoyee'}
              onChange={(v) => set('status', v ?? 'envoyee')}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label={t('application.appliedAt')}
              type="date"
              value={form.applied_at ?? ''}
              onChange={(e) => set('applied_at', e.target.value)}
            />
            <TextInput
              label={t('application.responseDate')}
              type="date"
              value={form.response_date ?? ''}
              onChange={(e) => set('response_date', e.target.value)}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label={t('application.source')}
              placeholder="LinkedIn, Indeed…"
              value={form.source ?? ''}
              onChange={(e) => set('source', e.target.value)}
            />
            <NumberInput
              label={t('application.salary')}
              placeholder="45000"
              value={form.salary ?? ''}
              onChange={(v) => set('salary', v === '' ? null : Number(v))}
              min={0}
            />
          </SimpleGrid>

          <TextInput
            label={t('newApplication.jobUrl')}
            placeholder="https://…"
            value={form.job_url ?? ''}
            onChange={(e) => set('job_url', e.target.value)}
          />

          <Textarea
            label={t('application.notes')}
            rows={4}
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
          />

          <Group justify="space-between">
            <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? t('account.saving') : t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
