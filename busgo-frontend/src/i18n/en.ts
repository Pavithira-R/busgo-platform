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
    profile: 'My profile',
  },
  auth: {
    loginTitle: 'Log in',
    loginSubtitle: 'Welcome back. Log in to book and manage your tickets.',
    registerTitle: 'Create your account',
    registerSubtitle: 'Book seats and keep all your e-tickets in one place.',
    fullName: 'Full name',
    email: 'Email',
    phone: 'Mobile number',
    phoneHint: 'Optional. For example 077 123 4567',
    password: 'Password',
    passwordHint: 'At least 8 characters',
    confirmPassword: 'Confirm password',
    submitLogin: 'Log in',
    submittingLogin: 'Logging in…',
    submitRegister: 'Create account',
    submittingRegister: 'Creating account…',
    noAccount: 'New to BusGo?',
    haveAccount: 'Already have an account?',
  },
  profile: {
    title: 'My profile',
    subtitle: 'These details are filled in for you when you book.',
    email: 'Email',
    role: 'Account type',
    nic: 'NIC number',
    nicHint: 'Optional. Old (851234567V) or new (198512345678) format',
    save: 'Save changes',
    saving: 'Saving…',
    saved: 'Your profile has been updated.',
    roles: {
      passenger: 'Passenger',
      staff: 'Gate staff',
      admin: 'Administrator',
    },
  },
  errors: {
    required: 'This field is required',
    email: 'Enter a valid email address',
    nameMin: 'Enter at least 2 characters',
    passwordMin: 'Use at least 8 characters',
    passwordMatch: 'Passwords do not match',
    mobile: 'Enter a Sri Lankan mobile number, e.g. 077 123 4567',
    nic: 'Enter a valid NIC, e.g. 851234567V or 198512345678',
    generic: 'Something went wrong. Please try again.',
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
