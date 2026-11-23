import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui';

/** Landing page. The bus search form is added in the search feature. */
export function HomePage() {
  const { t } = useTranslation();
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <h1 className="text-2xl font-bold text-brand-800 sm:text-3xl dark:text-brand-200">
        {t('home.title')}
      </h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        {t('home.subtitle')}
      </p>
    </Card>
  );
}
