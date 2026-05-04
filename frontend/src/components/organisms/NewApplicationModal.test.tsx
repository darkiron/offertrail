import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { NewApplicationModal } from './NewApplicationModal';

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.name) return `${key}:${options.name}`;
      return key;
    },
  }),
}));

vi.mock('../../services/api', () => ({
  organizationService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    getById: vi.fn(),
  },
  applicationService: {
    createApplication: vi.fn(),
  },
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <MantineProvider>{children}</MantineProvider>
  </MemoryRouter>
);

describe('NewApplicationModal', () => {
  it('renders without crashing and shows title translation key', async () => {
    render(
      <NewApplicationModal onClose={vi.fn()} onCreated={vi.fn()} />,
      { wrapper },
    );
    await waitFor(() => expect(screen.getByText('newApplication.title')).toBeInTheDocument());
  });

  it('renders kicker translation key', async () => {
    render(
      <NewApplicationModal onClose={vi.fn()} onCreated={vi.fn()} />,
      { wrapper },
    );
    await waitFor(() => expect(screen.getByText('newApplication.kicker')).toBeInTheDocument());
  });

  it('renders organization input', async () => {
    render(
      <NewApplicationModal onClose={vi.fn()} onCreated={vi.fn()} />,
      { wrapper },
    );
    await waitFor(() => expect(screen.getByText('newApplication.organization')).toBeInTheDocument());
  });
});
