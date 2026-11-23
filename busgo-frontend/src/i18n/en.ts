/** English text: the source every other language translates. */
export const en = {
  common: {
    appName: 'BusGo',
    loading: 'Loading…',
    noAccess: "You don't have access to this page.",
    language: 'Language',
  },
  nav: {
    search: 'Search buses',
    myBookings: 'My bookings',
    admin: 'Admin',
    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
    menu: 'Menu',
  },
  home: {
    title: 'Book bus seats across Sri Lanka',
    subtitle:
      'Find your trip, pick your seat and get an e-ticket with a QR code.',
  },
  notFound: {
    title: 'Page not found',
    back: 'Back to home',
  },
  footer: {
    tagline: 'Intercity bus tickets across Sri Lanka',
  },
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : string;
};
type DeepString<T> = {
  [K in keyof T]: T[K] extends object ? DeepString<T[K]> : string;
};

export type Translation = DeepString<typeof en>;
/** Other languages may leave keys out; English fills the gaps. */
export type PartialTranslation = DeepPartial<typeof en>;
