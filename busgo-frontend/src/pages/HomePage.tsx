import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Card } from '../components/ui';
import { todayInSriLanka } from '../lib/dates';
import { useStops } from '../search/queries';
import { SearchForm } from '../search/SearchForm';
import { searchUrl } from '../search/url';

/** Busy intercity routes, as From/To stop codes. */
const POPULAR: [string, string][] = [
  ['CMB', 'KDY'],
  ['CMB', 'JFN'],
  ['CMB', 'GLE'],
  ['KDY', 'CMB'],
  ['CMB', 'TRC'],
];

/** Landing page: the bus search and popular routes. */
export function HomePage() {
  const { t } = useTranslation();
  const stops = useStops();
  const city = (code: string) =>
    stops.data?.find((s) => s.code === code)?.city ?? code;
  const today = todayInSriLanka();

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-brand-700 px-5 pt-8 pb-16 text-white sm:px-8 sm:pt-10">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('home.title')}</h1>
        <p className="mt-2 text-brand-50">{t('home.subtitle')}</p>
      </section>

      <Card className="-mt-10 mx-2 sm:mx-6">
        <SearchForm />
      </Card>

      <section>
        <h2 className="mb-3 font-semibold text-slate-700 dark:text-slate-300">
          {t('search.popular')}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {POPULAR.map(([from, to]) => (
            <li key={`${from}-${to}`}>
              <Link
                to={searchUrl({ from, to, date: today })}
                className="inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800"
              >
                {city(from)} → {city(to)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
