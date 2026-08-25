import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import {
  contactDetailsSchema,
  contactPortfolioSchema,
} from '@entities/contact/model';
import {
  organizationPortfolioSchema,
  organizationWorkspaceSchema,
} from '@entities/organization/model';

export const relationshipKeys = {
  all: ['relationships'] as const,
  organizations: () => [...relationshipKeys.all, 'organizations'] as const,
  organizationPortfolio: (params: object) =>
    [...relationshipKeys.organizations(), 'portfolio', params] as const,
  organizationWorkspace: (id: string) =>
    [...relationshipKeys.organizations(), 'workspace', id] as const,
  contacts: () => [...relationshipKeys.all, 'contacts'] as const,
  contactPortfolio: (params: object) =>
    [...relationshipKeys.contacts(), 'portfolio', params] as const,
  contactDetails: (id: string) =>
    [...relationshipKeys.contacts(), 'detail', id] as const,
};

export const relationshipApi = {
  organizationPortfolio: async (params: object) =>
    organizationPortfolioSchema.parse(
      (await http.get('/me/etablissements', { params })).data,
    ),
  organizationWorkspace: async (id: string) =>
    organizationWorkspaceSchema.parse(
      (await http.get(`/me/etablissements/${id}/workspace`)).data,
    ),
  contactPortfolio: async (params: object) =>
    contactPortfolioSchema.parse(
      (await http.get('/me/contacts', { params })).data,
    ),
  contactDetails: async (id: string) =>
    contactDetailsSchema.parse((await http.get(`/contacts/${id}`)).data),
};

export function useOrganizationWorkspace(id?: string) {
  return useQuery({
    queryKey: relationshipKeys.organizationWorkspace(id ?? ''),
    queryFn: () => relationshipApi.organizationWorkspace(id!),
    enabled: Boolean(id),
  });
}

export function useContactDetails(id?: string) {
  return useQuery({
    queryKey: relationshipKeys.contactDetails(id ?? ''),
    queryFn: () => relationshipApi.contactDetails(id!),
    enabled: Boolean(id),
  });
}
