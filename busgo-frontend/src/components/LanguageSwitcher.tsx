import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

/** EN | සිං | தமி buttons; the choice is remembered on this device. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className="flex rounded-lg bg-brand-800/60 p-0.5 text-xs"
    >
      {LANGUAGES.map((lang) => {
        const active = i18n.resolvedLanguage === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            lang={lang.code}
            title={lang.label}
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(lang.code)}
            className={`rounded-md px-2 py-1 font-semibold transition-colors ${
              active
                ? 'bg-white text-brand-800'
                : 'text-brand-50 hover:bg-brand-700'
            }`}
          >
            {lang.short}
          </button>
        );
      })}
    </div>
  );
}
