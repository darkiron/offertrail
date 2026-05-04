import { useState } from 'react';
import axios from 'axios';
import {
  Modal, TextInput, Textarea, Select, Stack, Group, Text,
} from '@mantine/core';
import type { EventUpdatePayload } from '../../services/api';
import { useI18n } from '../../i18n';
import { Button } from '../atoms/Button';

interface EventItem {
  id: string;
  type: string;
  ts: string;
  payload?: {
    text?: string | null;
    old_status?: string | null;
    new_status?: string | null;
  };
}

interface EventEditModalProps {
  event: EventItem;
  onClose: () => void;
  onSaved: (eventId: string, data: EventUpdatePayload) => Promise<unknown>;
  onDeleted: (eventId: string) => Promise<unknown>;
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventEditModal({ event, onClose, onSaved, onDeleted }: EventEditModalProps) {
  const { t } = useI18n();

  const EVENT_TYPE_OPTIONS = [
    { value: 'creation', label: t('application.created') },
    { value: 'statut_change', label: t('application.statusUpdated') },
    { value: 'note_ajout', label: t('application.noteAdded') },
    { value: 'relance', label: t('application.followupSent') },
    { value: 'contact_ajout', label: t('application.contactCreated') },
    { value: 'reponse_recue', label: t('application.responseReceived') },
    { value: 'entretien', label: t('application.interviewScheduled') },
    { value: 'offre_recue', label: t('application.offerReceived') },
  ];
  const rawType = event.type.toLowerCase();
  const [type, setType] = useState(rawType);
  const [contenu, setContenu] = useState(event.payload?.text ?? '');
  const [date, setDate] = useState(toDatetimeLocal(event.ts));
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const isoDate = date ? new Date(date).toISOString() : null;
      await onSaved(event.id, {
        type,
        contenu: contenu || null,
        created_at: isoDate,
      });
      onClose();
    } catch (err: unknown) {
      setError((axios.isAxiosError(err) && err.response?.data?.detail) || t('application.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDeleted(event.id);
      onClose();
    } catch (err: unknown) {
      setError((axios.isAxiosError(err) && err.response?.data?.detail) || t('application.deleteError'));
      setDeleting(false);
    }
  };

  return (
    <Modal
      opened
      onClose={onClose}
      size="md"
      title={
        <Stack gap={2}>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('application.editEventTitle')}</Text>
        </Stack>
      }
    >
      {error && <Text c="red" size="sm" mb="md">{error}</Text>}

      <form onSubmit={handleSave}>
        <Stack gap="md">
          <Select
            label={t('newApplication.orgLabels.type')}
            data={EVENT_TYPE_OPTIONS}
            value={type}
            onChange={(v) => setType(v ?? rawType)}
          />

          <TextInput
            label={t('application.dateTime')}
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Textarea
            label={t('application.contentNote')}
            rows={3}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
          />

          <Group justify="space-between">
            <Button type="button" variant="ghost" onClick={handleDelete} disabled={deleting}>
              {deleting ? t('application.deleting') : t('application.delete')}
            </Button>
            <Group gap="sm">
              <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? t('account.saving') : t('common.save')}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
