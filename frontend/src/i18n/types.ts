export type Locale = 'fr' | 'en';

export type LocaleShape<T> = {
  readonly [Key in keyof T]: T[Key] extends string
    ? string
    : T[Key] extends ReadonlyArray<infer Item>
      ? ReadonlyArray<LocaleShape<Item>>
      : T[Key] extends object
        ? LocaleShape<T[Key]>
        : T[Key];
};

export type TranslationKeyOf<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends object
      ? `${Key}.${TranslationKeyOf<T[Key]>}`
      : never;
}[keyof T & string];
