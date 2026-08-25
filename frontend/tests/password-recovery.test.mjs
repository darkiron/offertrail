import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPasswordRecoveryMarker,
  finalizePasswordRecovery,
  hasValidPasswordRecoveryMarker,
  savePasswordRecoveryMarker,
} from '../src/utils/passwordRecovery.ts';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

test('a recovery marker survives refresh only for its user and validity window', () => {
  const storage = createStorage();
  const now = 1_800_000_000_000;
  const marker = createPasswordRecoveryMarker(
    'recovery-user',
    (now + 60 * 60 * 1000) / 1000,
    now,
  );

  savePasswordRecoveryMarker(storage, marker);

  assert.equal(
    hasValidPasswordRecoveryMarker(storage, 'recovery-user', now + 1000),
    true,
  );
  assert.equal(
    hasValidPasswordRecoveryMarker(storage, 'other-user', now + 1000),
    false,
  );
});

test('an expired recovery marker is rejected after refresh', () => {
  const storage = createStorage();
  const now = 1_800_000_000_000;
  savePasswordRecoveryMarker(
    storage,
    createPasswordRecoveryMarker('recovery-user', undefined, now),
  );

  assert.equal(
    hasValidPasswordRecoveryMarker(
      storage,
      'recovery-user',
      now + 31 * 60 * 1000,
    ),
    false,
  );
});

test('password recovery revokes the session before reporting success', async () => {
  const calls = [];
  const auth = {
    async updateUser(attributes) {
      calls.push(['update', attributes.password]);
      return { error: null };
    },
    async signOut(options) {
      calls.push(['signOut', options?.scope ?? 'global']);
      return { error: null };
    },
    async getSession() {
      calls.push(['getSession']);
      return { data: { session: null }, error: null };
    },
  };

  await finalizePasswordRecovery(auth, 'new-password');

  assert.deepEqual(calls, [
    ['update', 'new-password'],
    ['signOut', 'global'],
    ['getSession'],
  ]);
});

test('password recovery clears the local session if global revocation fails', async () => {
  const calls = [];
  const auth = {
    async updateUser() {
      calls.push('update');
      return { error: null };
    },
    async signOut(options) {
      const scope = options?.scope ?? 'global';
      calls.push(scope);
      return { error: scope === 'global' ? new Error('offline') : null };
    },
    async getSession() {
      calls.push('getSession');
      return { data: { session: null }, error: null };
    },
  };

  await finalizePasswordRecovery(auth, 'new-password');

  assert.deepEqual(calls, ['update', 'global', 'local', 'getSession']);
});

test('password recovery never reports success while a session remains', async () => {
  const auth = {
    async updateUser() {
      return { error: null };
    },
    async signOut() {
      return { error: null };
    },
    async getSession() {
      return {
        data: { session: { user: { id: 'recovery-user' } } },
        error: null,
      };
    },
  };

  await assert.rejects(
    finalizePasswordRecovery(auth, 'new-password'),
    /session was not cleared/,
  );
});
