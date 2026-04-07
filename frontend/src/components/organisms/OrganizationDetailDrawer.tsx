import { useEffect, useState } from 'react';
import {
  Drawer, Tabs, Group, Stack, Text, ScrollArea, Center, Loader, Anchor,
} from '@mantine/core';
import { api } from '../../services/api';
import { OrganizationTypeBadge } from '../atoms/OrganizationTypeBadge';
import { ProbityBadge } from '../atoms/ProbityBadge';
import { StatusBadge } from '../atoms/StatusBadge';
import { Button } from '../atoms/Button';
import OrganizationEditModal from './OrganizationEditModal';

interface OrganizationDetailDrawerProps {
  organizationId: number | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function OrganizationDetailDrawer({ organizationId, onClose }: OrganizationDetailDrawerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const loadData = async () => {
    if (!organizationId) { setData(null); return; }
    setLoading(true);
    try {
      const result = await api.getCompany(organizationId);
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [organizationId]);

  return (
    <>
      <Drawer
        opened={!!organizationId}
        onClose={onClose}
        position="right"
        size={520}
        title={data ? (
          <Stack gap={4}>
            <Text fw={700} size="lg">{data.name}</Text>
            <OrganizationTypeBadge type={data.type} size="sm" />
          </Stack>
        ) : null}
      >
        {loading ? (
          <Center h={200}><Loader /></Center>
        ) : data ? (
          <Stack gap="md" h="100%">
            <Group gap="xs">
              {data.linkedin_url && (
                <Anchor href={data.linkedin_url} target="_blank" size="sm">LinkedIn</Anchor>
              )}
              {data.website && (
                <Anchor href={data.website} target="_blank" size="sm">Site</Anchor>
              )}
            </Group>

            <Tabs defaultValue="overview" style={{ flex: 1 }}>
              <Tabs.List>
                <Tabs.Tab value="overview">Aperçu</Tabs.Tab>
                <Tabs.Tab value="applications">Candidatures</Tabs.Tab>
                <Tabs.Tab value="contacts">Contacts</Tabs.Tab>
              </Tabs.List>

              <ScrollArea style={{ flex: 1 }}>
                <Tabs.Panel value="overview" pt="md">
                  <Stack gap="lg">
                    <ProbityBadge
                      score={data.metrics?.probity_score}
                      level={data.metrics?.probity_level || 'insuffisant'}
                      size="md"
                    />
                    <div>
                      <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="sm">À propos</Text>
                      <Text size="sm" c="dimmed" fs="italic" mb="sm">{data.notes || 'Aucune note.'}</Text>
                      <Group grow>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Localisation</Text>
                          <Text size="sm">{data.city || 'Non spécifié'}</Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Date création</Text>
                          <Text size="sm">{new Date(data.created_at).toLocaleDateString()}</Text>
                        </div>
                      </Group>
                    </div>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="applications" pt="md">
                  <Stack gap="xs">
                    {data.applications && data.applications.length > 0 ? (
                      data.applications.map((app: { id: number; title: string; applied_at: string; status: string }) => (
                        <Group key={app.id} justify="space-between" p="sm"
                          style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 8 }}>
                          <div>
                            <Text size="sm" fw={700}>{app.title}</Text>
                            <Text size="xs" c="dimmed">{new Date(app.applied_at).toLocaleDateString()}</Text>
                          </div>
                          <StatusBadge status={app.status} />
                        </Group>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed" fs="italic" ta="center">Aucune candidature pour cet ETS.</Text>
                    )}
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="contacts" pt="md">
                  <Stack gap="xs">
                    <Group justify="flex-end">
                      <Button variant="ghost" size="small">+ AJOUTER CONTACT</Button>
                    </Group>
                    {data.contacts && data.contacts.length > 0 ? (
                      data.contacts.map((c: { id: number; first_name: string; last_name: string; role: string; email?: string; is_recruiter?: boolean }) => (
                        <Stack key={c.id} gap={4} p="sm"
                          style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 8 }}>
                          <Text size="sm" fw={700}>{c.first_name} {c.last_name}</Text>
                          <Text size="xs" c="dimmed">{c.role}</Text>
                          {c.email && <Text size="xs" ff="monospace" c="dimmed">{c.email}</Text>}
                        </Stack>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed" fs="italic" ta="center">Aucun contact enregistré.</Text>
                    )}
                  </Stack>
                </Tabs.Panel>
              </ScrollArea>
            </Tabs>

            <Button variant="primary" onClick={() => setEditing(true)}>MODIFIER ETS</Button>
          </Stack>
        ) : (
          <Text c="dimmed" ta="center">Établissement introuvable.</Text>
        )}
      </Drawer>

      {editing && data && (
        <OrganizationEditModal
          organization={data}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await loadData();
          }}
        />
      )}
    </>
  );
}
