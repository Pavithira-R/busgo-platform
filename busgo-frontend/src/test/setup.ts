import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import i18n from '../i18n';

// Give pages a little longer to load data when many test files run at once.
configure({ asyncUtilTimeout: 3000 });

afterEach(async () => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  await i18n.changeLanguage('en');
});
