import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer, Tabs, Group, Stack, Text, SimpleGrid, ScrollArea,
  Timeline, Center, Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { applicationService } from '../../services/api';
import type { ApplicationDetailsResponse } from '../../services/api';
import type { Contact } from '../../types';
import { StatusBadge } from '../atoms/StatusBadge';
import { OrganizationTypeBadge } from '../atoms/OrganizationTypeBadge';
import { ProbityBadge } from '../atoms/ProbityBadge';
import { Button } from '../atoms/Button';
import { ApplicationEditModal } from './ApplicationEditModal';

import { useI18n } from '../../i18n';

interface ApplicationDetailDrawerProps {
  appId: number | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function ApplicationDetailDrawer({ appId, onClose, onUpdate }: ApplicationDetailDrawerProps) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState<ApplicationDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!appId) { setData(null); return; }
    setLoading(true);
    applicationService.getApplication(appId)
      .then((result) => setData(result))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appId]);

  return (
    <Drawer
      opened={!!appId}
      onClose={onClose}
      position="right"
      size="md"
      title={data ? (
        <Stack gap={4}>
          <Text fw={700} size="lg">{data.application.title}</Text>
          <Text size="sm" c="dimmed">
            {data.application.organization?.name || data.application.company_name}
          </Text>
        </Stack>
      ) : null}
    >
      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : data ? (
        <Stack gap="md" h="100%">
          <Group gap="xs">
            <StatusBadge status={data.application.status} />
            {data.organization?.type && (
              <OrganizationTypeBadge type={data.organization.type} size="xs" />
            )}
          </Group>

          <Tabs defaultValue="overview" style={{ flex: 1 }}>
            <Tabs.List>
              <Tabs.Tab value="overview">{t('organization.overview')}</Tabs.Tab>
              <Tabs.Tab value="timeline">{t('application.timeline')}</Tabs.Tab>
            </Tabs.List>

            <ScrollArea style={{ flex: 1 }}>
              <Tabs.Panel value="overview" pt="md">
                <Stack gap="lg">
                  {data.organization && (
                    <ProbityBadge
                      score={data.organization.metrics?.probity_score}
                      level={data.organization.metrics?.probity_level || 'insuffisant'}
                      size="md"
                    />
                  )}

                  <div>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="sm">
                      {t('application.details')}
                    </Text>
                    <SimpleGrid cols={2} spacing="sm">
                      <div>
                        <Text size="xs" c="dimmed">{t('application.applied')}</Text>
                        <Text size="sm">{new Date(data.application.applied_at).toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-US')}</Text>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">{t('application.source')}</Text>
                        <Text size="sm">{data.application.channel || data.application.source}</Text>
                      </div>
                    </SimpleGrid>
                  </div>

                  <div>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="sm">
                      {t('application.notes')}
                    </Text>
                    <Text size="sm" fs="italic" c="dimmed">
                      {data.application.notes || t('organization.noNotes')}
                    </Text>
                  </div>

                  {data.contacts && data.contacts.length > 0 && (
                    <div>
                      <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="sm">
                        {t('nav.contacts')}
                      </Text>
                      <Stack gap="xs">
                        {data.contacts.map((c: Contact) => (
                          <Group key={c.id} justify="space-between">
                            <Text size="sm">{c.first_name} {c.last_name}</Text>
                            <Text size="xs" c="dimmed">{c.role}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </div>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="timeline" pt="md">
                {data.events && data.events.length > 0 ? (
                  <Timeline active={data.events.length - 1} bulletSize={12} lineWidth={2}>
                    {data.events.map((event: ApplicationDetailsResponse['events'][number], idx: number) => (
                      <Timeline.Item key={event.id || idx} title={t(`organization.events.${String(event.type || event.event_type).toLowerCase()}`) !== `organization.events.${String(event.type || event.event_type).toLowerCase()}` ? t(`organization.events.${String(event.type || event.event_type).toLowerCase()}`) : event.type}>
                        <Text size="xs" c="dimmed">{new Date(event.ts).toLocaleString(locale.startsWith('fr') ? 'fr-FR' : 'en-US')}</Text>
                        {event.payload && Object.keys(event.payload).length > 0 && (
                          <Text size="xs" c="dimmed" mt={4}>{JSON.stringify(event.payload)}</Text>
                        )}
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <Text size="sm" c="dimmed" fs="italic">{t('application.noEvents')}</Text>
                )}
              </Tabs.Panel>
            </ScrollArea>
          </Tabs>

          <Group>
            <Button variant="ghost" style={{ flex: 1 }} onClick={() => setShowEditModal(true)}>{t('common.edit').toUpperCase()}</Button>
            <Button variant="ghost" style={{ flex: 1 }} onClick={() => navigate(`/app/candidatures/${appId}`)}>{t('common.details').toUpperCase()}</Button>
          </Group>
        </Stack>
      ) : (
        <Text c="dimmed" ta="center">{t('application.notFound')}</Text>
      )}

      {showEditModal && data && (
        <ApplicationEditModal
          application={data.application}
          onClose={() => setShowEditModal(false)}
          onSaved={async (payload) => {
            await applicationService.updateApplication(appId!, payload);
            notifications.show({ message: t('application.notifUpdated'), color: 'green' });
            const refreshed = await applicationService.getApplication(appId!);
            setData(refreshed);
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}
    </Drawer>
  );
}
