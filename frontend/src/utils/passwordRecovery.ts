const RECOVERY_WINDOW_MS = 30 * 60 * 1000;
const PASSWORD_RECOVERY_STORAGE_KEY = 'offertrail.password-recovery';

export type PasswordRecoveryMarker = {
  userId: string;
  expiresAt: number;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type AuthResult = Promise<{ error: unknown | null }>;
type RecoveryAuthClient = {
  updateUser: (attributes: { password: string }) => AuthResult;
  signOut: (options?: { scope: 'local' }) => AuthResult;
  getSession: () => Promise<{
    data: { session: unknown | null };
    error: unknown | null;
  }>;
};

export function createPasswordRecoveryMarker(
  userId: string,
  sessionExpiresAt: number | undefined,
  now = Date.now(),
): PasswordRecoveryMarker {
  const sessionExpiry = sessionExpiresAt ? sessionExpiresAt * 1000 : Infinity;
  return {
    userId,
    expiresAt: Math.min(now + RECOVERY_WINDOW_MS, sessionExpiry),
  };
}

export function savePasswordRecoveryMarker(
  storage: StorageLike,
  marker: PasswordRecoveryMarker,
) {
  storage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, JSON.stringify(marker));
}

export function hasValidPasswordRecoveryMarker(
  storage: StorageLike,
  userId: string | undefined,
  now = Date.now(),
): boolean {
  if (!userId) return false;
  const serialized = storage.getItem(PASSWORD_RECOVERY_STORAGE_KEY);
  if (!serialized) return false;
  try {
    const marker = JSON.parse(serialized) as Partial<PasswordRecoveryMarker>;
    const valid =
      marker.userId === userId &&
      typeof marker.expiresAt === 'number' &&
      marker.expiresAt > now;
    if (!valid) storage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
    return valid;
  } catch {
    storage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
    return false;
  }
}

export function clearPasswordRecoveryMarker(storage: StorageLike) {
  storage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
}

/** Update the password, then revoke the recovery session before returning. */
export async function finalizePasswordRecovery(
  auth: RecoveryAuthClient,
  password: string,
) {
  const { error: updateError } = await auth.updateUser({ password });
  if (updateError) throw updateError;

  const { error: globalSignOutError } = await auth.signOut();
  if (globalSignOutError) {
    const { error: localSignOutError } = await auth.signOut({ scope: 'local' });
    if (localSignOutError) throw localSignOutError;
  }

  const { data, error: sessionError } = await auth.getSession();
  if (sessionError) throw sessionError;
  if (data.session)
    throw new Error('Password recovery session was not cleared');
}
