import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: process.cwd() });

async function boundaryErrors(filePath: string, specifier: string) {
  const [result] = await eslint.lintText(`import '${specifier}';`, {
    filePath,
  });
  return result.messages.filter(
    (message) => message.ruleId === 'no-restricted-imports',
  );
}

describe('ADR-0001 dependency boundaries', () => {
  it.each([
    ['src/entities/application/deep/model.ts', '@features/applications/edit'],
    ['src/entities/application/deep/model.ts', '../../../features'],
    [
      'src/entities/application/deep/model.ts',
      '../../../features/auth/sign-in',
    ],
    ['src/features/applications/deep/use-case.ts', '@widgets/app-shell/nav'],
    [
      'src/features/applications/deep/use-case.ts',
      '../../../widgets/app-shell/nav',
    ],
    ['src/shared/api/deep/client.ts', '@entities/application/model'],
    ['src/shared/api/deep/client.ts', '../../../entities/application/model'],
    ['src/routes/private/deep/route.tsx', '@app/providers/query'],
    ['src/routes/private/deep/route.tsx', '../../../app/providers/query'],
  ])('rejects %s importing %s', async (filePath, specifier) => {
    expect(await boundaryErrors(filePath, specifier)).toHaveLength(1);
  });

  it.each([
    ['src/app/providers/query.tsx', '@routes/private/app-route'],
    ['src/routes/private/app-route.tsx', '@widgets/app-shell/nav'],
    ['src/widgets/app-shell/nav.tsx', '@features/auth/sign-out'],
    ['src/features/auth/sign-out.ts', '@entities/user/model'],
    ['src/entities/user/model.ts', '@shared/api/ApiError'],
    ['src/features/auth/deep/sign-out.ts', '../../../entities/user/model'],
    ['src/entities/user/deep/model.ts', '../../../shared/api/ApiError'],
  ])('allows %s importing %s', async (filePath, specifier) => {
    expect(await boundaryErrors(filePath, specifier)).toHaveLength(0);
  });
});
