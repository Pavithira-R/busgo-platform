import i18n from '.';
import { en } from './en';
import { si } from './si';
import { ta } from './ta';

type Tree = { [key: string]: string | Tree };

/** { a: { b: 'x' } } -> { 'a.b': 'x' } */
function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  );
}

const english = flatten(en);
/** Kept in English on purpose: the brand and the bus type names. */
const sameEverywhere = (key: string) =>
  key === 'common.appName' || key.startsWith('serviceTypes.');
const placeholders = (text: string) => (text.match(/{{\w+}}/g) ?? []).sort();

describe.each([
  ['Sinhala', si],
  ['Tamil', ta],
])('%s text', (_, language) => {
  const translated = flatten(language as Tree);

  it('covers every English text', () => {
    const missing = Object.keys(english).filter(
      (key) => !sameEverywhere(key) && !(key in translated),
    );
    expect(missing).toEqual([]);
  });

  it('has no texts that English does not have', () => {
    expect(Object.keys(translated).filter((key) => !(key in english))).toEqual(
      [],
    );
  });

  it('keeps every {{placeholder}} the app fills in', () => {
    const broken = Object.keys(translated).filter(
      (key) =>
        JSON.stringify(placeholders(translated[key])) !==
        JSON.stringify(placeholders(english[key])),
    );
    expect(broken).toEqual([]);
  });
});

it('shows bus types by their English names in every language', async () => {
  await i18n.changeLanguage('si');
  expect(i18n.t('serviceTypes.semi_luxury')).toBe('Semi-Luxury');
  await i18n.changeLanguage('ta');
  expect(i18n.t('serviceTypes.luxury')).toBe('Luxury AC');
  expect(i18n.t('search.duration', { hours: 3, minutes: 30 })).toBe(
    '3 மணி 30 நிமி.',
  );
});
