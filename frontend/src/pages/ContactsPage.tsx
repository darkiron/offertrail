import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, Chip, Group, Paper, SimpleGrid, Stack, Text, TextInput, Title,
} from '@mantine/core';
import { contactService, organizationService } from '../services/api';
import { Spinner } from '../components/atoms/Spinner';
import type { Contact, Organization } from '../types';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import ProbityBadge from '../components/atoms/ProbityBadge';
import { Button } from '../components/atoms/Button';
import ContactCreateModal from '../components/organisms/ContactCreateModal';
import { useI18n } from '../i18n';
import classes from './ContactsPage.module.css';

type ContactTab = 'all' | 'recruiters' | 'linked' | 'unlinked';

export const ContactsPage: React.FC = () => {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ContactTab>('all');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Contacts — OfferTrail';
  }, []);

  const tabs: Array<{ id: ContactTab; label: string; hint: string }> = [
    { id: 'all', label: t('contacts.tabAll'), hint: t('contacts.tabAllHint') },
    { id: 'recruiters', label: t('contacts.tabRecruiters'), hint: t('contacts.tabRecruitersHint') },
    { id: 'linked', label: t('contacts.tabLinked'), hint: t('contacts.tabLinkedHint') },
    { id: 'unlinked', label: t('contacts.tabUnlinked'), hint: t('contacts.tabUnlinkedHint') },
  ];

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactService.getAll();
      setContacts(data);
    } catch {
      setError(t('contacts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    organizationService.getAll().then(setOrganizations).catch(() => {});
  }, []);

  const organizationsMap = useMemo(() => new Map(organizations.map((org) => [org.id, org])), [organizations]);

  const visibleContacts = contacts.filter((contact) => {
    const matchesSearch = `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(search.toLowerCase())
      || (contact.role && contact.role.toLowerCase().includes(search.toLowerCase()))
      || (contact.email && contact.email.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) {
      return false;
    }

    switch (activeTab) {
      case 'recruiters': return !!contact.is_recruiter;
      case 'linked': return !!contact.organization_id;
      case 'unlinked': return !contact.organization_id;
      default: return true;
    }
  });

  const recruitersCount = contacts.filter((contact) => !!contact.is_recruiter).length;
  const linkedCount = contacts.filter((contact) => !!contact.organization_id).length;

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'stretch' }}>
        <Paper className={classes.hero} p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('contacts.kicker')}</Text>
          <Title order={1} mt="xs">{t('contacts.title')}</Title>
          <Text c="dimmed" mt="sm">{t('contacts.copy')}</Text>
          <Group mt="lg">
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>{t('contacts.newContact')}</Button>
          </Group>
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <SimpleGrid cols={3} spacing="md">
            {[
              { label: t('contacts.total'), value: contacts.length, hint: t('contacts.totalHint') },
              { label: t('contacts.recruiters'), value: recruitersCount, hint: t('contacts.recruitersHint') },
              { label: t('contacts.linked'), value: linkedCount, hint: t('contacts.linkedHint') },
            ].map((stat) => (
              <Stack key={stat.label} gap={4}>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{stat.label}</Text>
                <Text size="xl" fw={700}>{stat.value}</Text>
                <Text size="xs" c="dimmed">{stat.hint}</Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Paper>
      </SimpleGrid>

      <Paper p="lg" radius="lg" withBorder>
        <Group justify="space-between" mb="md" wrap="wrap" gap="md">
          <TextInput
            placeholder={t('contacts.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 240 }}
          />
          <Text size="sm" c="dimmed">
            {loading ? t('contacts.loading') : `${visibleContacts.length} ${t('contacts.results')}`}
          </Text>
        </Group>
        <Group gap="xs" wrap="wrap" mb="xs">
          {tabs.map((tab) => (
            <Chip
              key={tab.id}
              checked={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              size="sm"
            >
              {tab.label}
            </Chip>
          ))}
        </Group>
        <Text size="xs" c="dimmed">{tabs.find((tab) => tab.id === activeTab)?.hint}</Text>
      </Paper>

      <Paper p="lg" radius="lg" withBorder>
        {loading ? (
          <Spinner />
        ) : error ? (
          <Text c="red">{error}</Text>
        ) : visibleContacts.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {visibleContacts.map((contact) => {
              const organization = contact.organization_id ? organizationsMap.get(contact.organization_id) : null;
              return (
                <Paper
                  key={contact.id}
                  p="lg"
                  radius="lg"
                  withBorder
                  className={classes.card}
                  onClick={() => navigate(`/app/contacts/${contact.id}`)}
                >
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={2}>
                      <Text fw={700} size="lg">{contact.first_name} {contact.last_name}</Text>
                      <Text c="dimmed" size="sm">{contact.role || t('contacts.noRole')}</Text>
                    </Stack>
                    {contact.is_recruiter ? (
                      <Badge variant="light" color="pink" size="sm">{t('contacts.recruiter')}</Badge>
                    ) : null}
                  </Group>

                  <Group mt="sm" gap="xs" wrap="wrap">
                    {organization ? (
                      <>
                        <OrganizationTypeBadge type={organization.type} size="xs" />
                        <ProbityBadge score={organization.probity_score} level={organization.probity_level} showScore={false} />
                        <Text size="xs" c="dimmed">{organization.name}</Text>
                      </>
                    ) : (
                      <Text size="xs" c="dimmed">{t('contacts.noOrg')}</Text>
                    )}
                  </Group>

                  <SimpleGrid cols={2} spacing="xs" mt="md">
                    <Paper p="sm" radius="md" withBorder>
                      <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('contacts.email')}</Text>
                      <Text size="xs" c="dimmed" mt={4}>{contact.email || t('contacts.notDefined')}</Text>
                    </Paper>
                    <Paper p="sm" radius="md" withBorder>
                      <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('contacts.phone')}</Text>
                      <Text size="xs" c="dimmed" mt={4}>{contact.phone || t('contacts.notDefined')}</Text>
                    </Paper>
                  </SimpleGrid>

                  <Group justify="space-between" mt="md">
                    <Text size="xs" c="dimmed">{t('contacts.updated')} {new Date(contact.updated_at).toLocaleDateString('fr-FR')}</Text>
                    <Text size="xs" c="dimmed">{t('contacts.openCard')} →</Text>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        ) : (
          <Text c="dimmed" ta="center" py="xl">{t('contacts.noMatches')}</Text>
        )}
      </Paper>

      {showCreateModal ? (
        <ContactCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchContacts();
            organizationService.getAll().then(setOrganizations).catch(() => {});
          }}
        />
      ) : null}
    </Stack>
  );
};
