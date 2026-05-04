import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CompanyDetailsPage } from './CompanyDetailsPage';

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'fr',
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    getCompany: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Acme Corp',
      type: 'CLIENT_FINAL',
      city: 'Paris',
      website: null,
      linkedin_url: null,
      notes: null,
      probity_score: null,
      probity_level: null,
      response_rate: null,
      applications: [],
      contacts: [],
      events: [],
    }),
  },
  organizationService: { getAll: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../components/atoms/OrganizationTypeBadge', () => ({
  default: () => <span>OrgTypeBadge</span>,
}));

vi.mock('../components/atoms/ProbityBadge', () => ({
  default: () => <span>ProbityBadge</span>,
  ProbityBadge: () => <span>ProbityBadge</span>,
}));

vi.mock('../components/atoms/StatusBadge', () => ({
  default: () => <span>StatusBadge</span>,
}));

vi.mock('../components/organisms/OrganizationEditModal', () => ({
  default: () => <div>OrganizationEditModal</div>,
}));

vi.mock('../components/organisms/ContactEditModal', () => ({
  default: () => <div>ContactEditModal</div>,
}));


describe('CompanyDetailsPage', () => {
  it('renders without crashing (tabDefinitions uses t inside component)', async () => {
    render(
      <MemoryRouter initialEntries={['/app/etablissements/1']}>
        <MantineProvider>
          <Routes>
            <Route path="/app/etablissements/:id" element={<CompanyDetailsPage />} />
          </Routes>
        </MantineProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0));
  });

  it('renders tab labels via t()', async () => {
    render(
      <MemoryRouter initialEntries={['/app/etablissements/1']}>
        <MantineProvider>
          <Routes>
            <Route path="/app/etablissements/:id" element={<CompanyDetailsPage />} />
          </Routes>
        </MantineProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('organization.overview')).toBeInTheDocument());
  });
});
