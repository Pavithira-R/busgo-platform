import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
      <Link
        to="/"
        className="mt-4 inline-block font-semibold text-brand-700 hover:underline dark:text-brand-200"
      >
        {t('notFound.back')}
      </Link>
    </div>
  );
}
