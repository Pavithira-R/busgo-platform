import i18n from '../i18n';

// The backend writes its error messages in English. These are the ones a
// passenger can meet, matched to translated text; anything else (mostly
// admin-only messages) is shown as the server wrote it.
const RULES: [
  RegExp,
  string,
  (match: RegExpMatchArray) => Record<string, string>,
][] = [
  [/^Invalid email or password$/, 'errors.badLogin', () => ({})],
  [/^Email is already registered$/, 'errors.emailTaken', () => ({})],
  [
    /^Seat (\w+) is already booked for this trip$/,
    'errors.seatTaken',
    (m) => ({ seat: m[1] }),
  ],
  [/^(This|The) bus has already departed$/, 'errors.departed', () => ({})],
  [/^Travel date is in the past$/, 'errors.pastDate', () => ({})],
  [
    /^Bookings open (\d+) days before travel$/,
    'errors.tooEarly',
    (m) => ({ days: m[1] }),
  ],
  [
    /^This booking can no longer be cancelled$/,
    'errors.cannotCancel',
    () => ({}),
  ],
  [
    /^This booking is already (cancelled|used|expired)$/,
    'errors.alreadyStatus',
    (m) => ({ status: i18n.t(`ticket.status.${m[1]}`) }),
  ],
  [/^Booking not found$/, 'ticket.notFound', () => ({})],
  [/^Route not found$/, 'route.notFound', () => ({})],
];

/** A server message in the current language, when we know it. */
export function translateServerMessage(message: string): string {
  for (const [pattern, key, values] of RULES) {
    const match = message.match(pattern);
    if (match) return i18n.t(key, values(match));
  }
  return message;
}
