import type {
  Application,
  Contact,
  Organization,
  OrganizationType,
} from '../../types';
import { axiosInstance } from './client';
import type {
  ApplicationPayload,
  CandidatureApi,
  ContactApi,
  EtablissementApi,
} from './contracts';
import {
  resolveOrganizationId,
  toLegacyContactId,
  toLegacyId,
  toLegacyOrganizationId,
} from './identifiers';

export function normalizeDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.includes('T') ? value.slice(0, 10) : value;
}

export function normalizeOrganizationType(value: string): OrganizationType {
  switch (value.toUpperCase()) {
    case 'CLIENT_FINAL':
      return 'CLIENT_FINAL';
    case 'ESN':
      return 'ESN';
    case 'CABINET_RECRUTEMENT':
      return 'CABINET_RECRUTEMENT';
    case 'STARTUP':
      return 'STARTUP';
    case 'PME':
      return 'PME';
    case 'GRAND_COMPTE':
      return 'GRAND_COMPTE';
    case 'PORTAGE':
      return 'PORTAGE';
    default:
      return 'AUTRE';
  }
}

export async function fetchEtablissementsIndex(): Promise<
  Map<string, EtablissementApi>
> {
  const response =
    await axiosInstance.get<EtablissementApi[]>('/etablissements');
  return new Map(response.data.map((item) => [item.id, item]));
}

export function mapEtablissementToOrganization(
  etablissement: EtablissementApi,
): Organization {
  const probityLevel =
    etablissement.probity_level === 'insuffisant' ||
    etablissement.probity_level === 'fiable' ||
    etablissement.probity_level === 'moyen' ||
    etablissement.probity_level === 'méfiance'
      ? etablissement.probity_level
      : 'insuffisant';
  return {
    id: toLegacyOrganizationId(etablissement.id),
    organization_id: toLegacyOrganizationId(etablissement.id),
    total_applications: etablissement.total_applications,
    total_responses: etablissement.total_responses,
    response_rate: etablissement.response_rate,
    avg_response_days: etablissement.avg_response_days,
    ghosting_count: etablissement.ghosting_count,
    positive_count: etablissement.positive_count,
    positive_rate: etablissement.positive_rate,
    probity_score: etablissement.probity_score,
    probity_level: probityLevel,
    metrics: {
      probity_score: etablissement.probity_score,
      probity_level: probityLevel,
    },
    name: etablissement.nom,
    type: normalizeOrganizationType(etablissement.type),
    website: etablissement.site_web,
    linkedin_url: etablissement.linkedin_url,
    city: etablissement.city,
    notes: etablissement.notes ?? etablissement.description,
    created_at: etablissement.created_at,
    updated_at: etablissement.updated_at,
  };
}

export function mapCandidatureToApplication(
  candidature: CandidatureApi,
  etablissement?: EtablissementApi,
  finalCustomer?: EtablissementApi | null,
): Application {
  return {
    id: toLegacyId(candidature.id),
    organization_id: etablissement
      ? toLegacyOrganizationId(etablissement.id)
      : null,
    final_customer_organization_id: finalCustomer
      ? toLegacyOrganizationId(finalCustomer.id)
      : null,
    final_customer_name: finalCustomer?.nom ?? null,
    company: etablissement?.nom ?? 'Etablissement',
    company_name: etablissement?.nom ?? 'Etablissement',
    organization: etablissement
      ? {
          id: toLegacyOrganizationId(etablissement.id),
          name: etablissement.nom,
        }
      : null,
    title: candidature.poste,
    type: candidature.type_contrat ?? 'autre',
    status: candidature.statut ?? 'en_attente',
    source: candidature.source,
    channel: candidature.source,
    job_url: candidature.url_offre,
    applied_at: normalizeDate(candidature.date_candidature),
    response_date: normalizeDate(candidature.date_reponse),
    salary: candidature.salaire_vise,
    daily_rate: candidature.tjm_vise,
    notes: candidature.notes,
    next_followup_at: null,
    created_at: candidature.created_at,
    updated_at: candidature.updated_at,
    hidden: 0,
  };
}

export function mapPayloadToSaas(
  data: ApplicationPayload,
): Partial<CandidatureApi> {
  const payload: Partial<CandidatureApi> = {};
  const has = (key: keyof ApplicationPayload) =>
    Object.prototype.hasOwnProperty.call(data, key);

  if (has('organization_id') && data.organization_id) {
    payload.etablissement_id = resolveOrganizationId(data.organization_id);
  }
  if (has('final_customer_organization_id')) {
    payload.client_final_id = data.final_customer_organization_id
      ? resolveOrganizationId(data.final_customer_organization_id)
      : null;
  }
  if (has('title')) payload.poste = data.title ?? '';
  if (has('type')) payload.type_contrat = data.type?.toLowerCase() ?? null;
  if (has('status')) payload.statut = data.status ?? undefined;
  if (has('source')) payload.source = data.source ?? null;
  if (has('job_url')) payload.url_offre = data.job_url ?? null;
  if (has('applied_at')) payload.date_candidature = data.applied_at ?? null;
  if (has('response_date')) payload.date_reponse = data.response_date ?? null;
  if (has('salary')) payload.salaire_vise = data.salary ?? null;
  if (has('daily_rate')) payload.tjm_vise = data.daily_rate ?? null;
  if (has('notes')) payload.notes = data.notes ?? null;

  return payload;
}

export function mapContactApiToContact(contact: ContactApi): Contact {
  const organizationId =
    typeof contact.organization_id === 'number'
      ? contact.organization_id
      : contact.organization_id
        ? toLegacyOrganizationId(contact.organization_id)
        : null;
  return {
    id: toLegacyContactId(contact.id),
    organization_id: organizationId,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    role: contact.role,
    is_recruiter: contact.is_recruiter,
    linkedin_url: contact.linkedin_url,
    notes: contact.notes,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
  };
}
