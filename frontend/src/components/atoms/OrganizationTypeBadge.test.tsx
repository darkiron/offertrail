import { render, screen } from '@testing-library/react';
import { OrganizationTypeBadge } from './OrganizationTypeBadge';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { MantineProvider } from '@mantine/core';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('OrganizationTypeBadge', () => {
  it.each([
    ['CLIENT_FINAL', 'Client final'],
    ['ESN', 'ESN'],
    ['CABINET_RECRUTEMENT', 'Cabinet'],
    ['STARTUP', 'Startup'],
    ['PME', 'PME'],
    ['GRAND_COMPTE', 'Grand compte'],
    ['PORTAGE', 'Portage'],
    ['AUTRE', 'Autre'],
  ] as const)('renders %s label as "%s"', (type, label) => {
    render(<OrganizationTypeBadge type={type} />, { wrapper });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('falls back to AUTRE for unknown type', () => {
    render(<OrganizationTypeBadge type={'UNKNOWN' as any} />, { wrapper });
    expect(screen.getByText('Autre')).toBeInTheDocument();
  });

  it('renders with xs size prop', () => {
    render(<OrganizationTypeBadge type="CLIENT_FINAL" size="xs" />, { wrapper });
    expect(screen.getByText('Client final')).toBeInTheDocument();
  });
});
