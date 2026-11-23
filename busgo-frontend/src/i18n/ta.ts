import type { PartialTranslation } from './en';

/** தமிழ் (Tamil). Missing keys fall back to English. */
export const ta: PartialTranslation = {
  common: {
    loading: 'ஏற்றுகிறது…',
    noAccess: 'இந்தப் பக்கத்தை அணுக உங்களுக்கு அனுமதி இல்லை.',
    language: 'மொழி',
  },
  nav: {
    search: 'பேருந்துகளைத் தேடுக',
    myBookings: 'எனது முன்பதிவுகள்',
    admin: 'நிர்வாகம்',
    login: 'உள்நுழைக',
    register: 'பதிவு செய்க',
    logout: 'வெளியேறு',
    menu: 'பட்டியல்',
  },
  home: {
    title: 'இலங்கை முழுவதும் பேருந்து இருக்கைகளை முன்பதிவு செய்யுங்கள்',
    subtitle:
      'உங்கள் பயணத்தைத் தேடுங்கள், இருக்கையைத் தேர்ந்தெடுங்கள், QR குறியீட்டுடன் மின்-டிக்கெட்டைப் பெறுங்கள்.',
  },
  notFound: {
    title: 'பக்கம் கிடைக்கவில்லை',
    back: 'முகப்புக்குத் திரும்பு',
  },
  footer: {
    tagline: 'இலங்கை முழுவதும் நகரங்களுக்கு இடையேயான பேருந்து டிக்கெட்டுகள்',
  },
};
