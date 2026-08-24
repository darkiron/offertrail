import { en } from './en';
import { fr } from './fr';
import type { TranslationKeyOf } from '../types';

export const locales = { en, fr } as const;

export type TranslationKey = TranslationKeyOf<typeof en>;

type IsEqual<Left, Right> =
  (<Type>() => Type extends Left ? 1 : 2) extends <Type>() => Type extends Right
    ? 1
    : 2
    ? true
    : false;

type Assert<Type extends true> = Type;

/** Compile-time parity guard: either locale changing keys fails the typecheck. */
type LocaleKeyParity = Assert<
  IsEqual<TranslationKeyOf<typeof en>, TranslationKeyOf<typeof fr>>
>;

const localeKeyParity: LocaleKeyParity = true;
void localeKeyParity;
