/**
 * Temporary compatibility barrel. New code should import its domain module from
 * `services/api/*`; existing consumers can migrate without a flag day.
 */
export * from './api/index';
export { default } from './api/client';
