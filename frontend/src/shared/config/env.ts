import { parsePublicEnv } from './parsePublicEnv';

export const env = parsePublicEnv(import.meta.env);
