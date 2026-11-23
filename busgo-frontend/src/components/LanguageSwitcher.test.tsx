import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { renderWithProviders } from '../test/render';
import { LanguageSwitcher } from './LanguageSwitcher';

function Heading() {
  const { t } = useTranslation();
  return <h1>{t('home.title')}</h1>;
}

describe('LanguageSwitcher', () => {
  it('switches between English, Sinhala and Tamil', async () => {
    renderWithProviders(
      <>
        <LanguageSwitcher />
        <Heading />
      </>,
    );
    expect(screen.getByRole('heading')).toHaveTextContent(
      'Book bus seats across Sri Lanka',
    );

    await userEvent.click(screen.getByRole('button', { name: 'සිං' }));
    expect(screen.getByRole('heading')).toHaveTextContent(
      'ශ්‍රී ලංකාව පුරා බස් ආසන වෙන්කරගන්න',
    );
    expect(document.documentElement.lang).toBe('si');
    expect(screen.getByRole('button', { name: 'සිං' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'தமி' }));
    expect(screen.getByRole('heading')).toHaveTextContent('இலங்கை முழுவதும்');
    expect(window.localStorage.getItem('busgo.language')).toBe('ta');
  });
});
