import { useState } from 'react';
import axios from 'axios';
import {
  Modal, TextInput, Textarea, Select, Stack, Group, Text,
} from '@mantine/core';
import type { EventUpdatePayload } from '../../services/api';
import { Button } from '../atoms/Button';

const EVENT_TYPE_OPTIONS = [
  { value: 'creation', label: 'Création' },
  { value: 'statut_change', label: 'Changement de statut' },
  { value: 'note_ajout', label: 'Note' },
  { value: 'relance', label: 'Relance' },
  { value: 'contact_ajout', label: 'Contact ajouté' },
  { value: 'reponse_recue', label: 'Réponse reçue' },
  { value: 'entretien', label: 'Entretien' },
  { value: 'offre_recue', label: 'Offre reçue' },
];

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
      setError((axios.isAxiosError(err) && err.response?.data?.detail) || "Échec de la sauvegarde de l'événement.");
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
      setError((axios.isAxiosError(err) && err.response?.data?.detail) || "Échec de la suppression.");
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
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Modifier l'événement</Text>
        </Stack>
      }
    >
      {error && <Text c="red" size="sm" mb="md">{error}</Text>}

      <form onSubmit={handleSave}>
        <Stack gap="md">
          <Select
            label="Type"
            data={EVENT_TYPE_OPTIONS}
            value={type}
            onChange={(v) => setType(v ?? rawType)}
          />

          <TextInput
            label="Date et heure"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Textarea
            label="Contenu / Note"
            rows={3}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
          />

          <Group justify="space-between">
            <Button type="button" variant="ghost" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Suppression…' : 'Supprimer'}
            </Button>
            <Group gap="sm">
              <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
