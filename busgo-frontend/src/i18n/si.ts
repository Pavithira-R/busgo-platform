import type { PartialTranslation } from './en';

/** සිංහල (Sinhala). Missing keys fall back to English. */
export const si: PartialTranslation = {
  common: {
    loading: 'පූරණය වෙමින්…',
    noAccess: 'ඔබට මෙම පිටුවට ප්‍රවේශ වීමට අවසර නැත.',
    language: 'භාෂාව',
  },
  nav: {
    search: 'බස් සොයන්න',
    myBookings: 'මගේ වෙන්කිරීම්',
    admin: 'පරිපාලක',
    login: 'පිවිසෙන්න',
    register: 'ලියාපදිංචි වන්න',
    logout: 'ඉවත් වන්න',
    menu: 'මෙනුව',
  },
  home: {
    title: 'ශ්‍රී ලංකාව පුරා බස් ආසන වෙන්කරගන්න',
    subtitle: 'ඔබේ ගමන සොයන්න, ආසනය තෝරන්න, QR කේතයක් සහිත ඊ-ටිකට් පතක් ලබාගන්න.',
  },
  notFound: {
    title: 'පිටුව හමු නොවීය',
    back: 'මුල් පිටුවට',
  },
  footer: {
    tagline: 'ශ්‍රී ලංකාව පුරා අන්තර් නගර බස් ටිකට්',
  },
};
