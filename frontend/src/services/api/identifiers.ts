import { http as axiosInstance } from '@shared/api/http';
import type { CandidatureApi, EtablissementApi } from './contracts';

const candidatureNumericToUuid = new Map<number, string>();
const organizationNumericToUuid = new Map<number, string>();

export function toLegacyId(uuid: string | number): number {
  if (typeof uuid === 'number') {
    return uuid;
  }
  let hash = 0;
  for (let index = 0; index < uuid.length; index += 1) {
    hash = ((hash << 5) - hash + uuid.charCodeAt(index)) | 0;
  }
  const normalized = Math.abs(hash) || 1;
  candidatureNumericToUuid.set(normalized, uuid);
  return normalized;
}

export function toLegacyOrganizationId(uuid: string | number): number {
  if (typeof uuid === 'number') {
    return uuid;
  }
  let hash = 0;
  const seed = `org:${uuid}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  const normalized = Math.abs(hash) || 1;
  organizationNumericToUuid.set(normalized, uuid);
  return normalized;
}

export function resolveCandidatureId(id: number | string): string {
  if (typeof id === 'string' && id.includes('-')) {
    return id;
  }
  const numericId = typeof id === 'number' ? id : Number(id);
  return candidatureNumericToUuid.get(numericId) ?? String(id);
}

export function resolveOrganizationId(id: number | string): string {
  if (typeof id === 'string' && id.includes('-')) {
    return id;
  }
  const numericId = typeof id === 'number' ? id : Number(id);
  return organizationNumericToUuid.get(numericId) ?? String(id);
}

export async function ensureOrganizationIdResolved(
  id: number | string,
): Promise<string> {
  const resolved = resolveOrganizationId(id);
  if (resolved.includes('-')) {
    return resolved;
  }
  const response =
    await axiosInstance.get<EtablissementApi[]>('/etablissements');
  response.data.forEach((item) => {
    toLegacyOrganizationId(item.id);
  });
  return resolveOrganizationId(id);
}

export async function ensureCandidatureIdResolved(
  id: number | string,
): Promise<string> {
  const resolved = resolveCandidatureId(id);
  if (resolved.includes('-')) {
    return resolved;
  }
  const response = await axiosInstance.get<CandidatureApi[]>('/candidatures');
  response.data.forEach((item) => {
    toLegacyId(item.id);
  });
  return resolveCandidatureId(id);
}
