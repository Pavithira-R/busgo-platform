import { useTranslation } from 'react-i18next';
import type { SeatMap as SeatMapData } from '../lib/types';

const seatBase =
  'flex size-10 items-center justify-center rounded-t-lg rounded-b-md text-xs font-semibold transition-colors sm:size-11';
const seatStyles = {
  available:
    'bg-white text-slate-700 ring-1 ring-brand-500 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  selected: 'bg-brand-700 text-white ring-1 ring-brand-700',
  booked:
    'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600',
};

/**
 * The bus seen from above, front at the top. Seats are labelled row by row
 * (A1, A2… then B1…), with the aisle after `aisleAfter` seats.
 */
export function SeatMap({
  map,
  selected,
  onSelect,
}: {
  map: SeatMapData;
  selected: string | null;
  onSelect: (seat: string) => void;
}) {
  const { t } = useTranslation();
  const { rows, seatsPerRow, aisleAfter } = map.layout;
  const status = new Map(map.seats.map((s) => [s.number, s.status]));
  const rowLetters = Array.from({ length: rows }, (_, r) =>
    String.fromCharCode(65 + r),
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        <Legend style={seatStyles.available} label={t('booking.available')} />
        <Legend style={seatStyles.selected} label={t('booking.selected')} />
        <Legend style={seatStyles.booked} label={t('booking.booked')} />
      </div>

      <div
        role="group"
        aria-label={t('booking.seatMap')}
        className="rounded-3xl border-2 border-slate-300 p-3 sm:p-4 dark:border-slate-700"
      >
        <div className="mb-3 flex items-center justify-between border-b border-dashed border-slate-300 pb-2 text-xs text-slate-500 dark:border-slate-700">
          <span>{t('booking.front')}</span>
          {/* Sri Lankan buses are right-hand drive. */}
          <span
            aria-label={t('booking.driver')}
            title={t('booking.driver')}
            className="flex size-8 items-center justify-center rounded-full ring-2 ring-slate-400"
          >
            <span className="size-3 rounded-full bg-slate-400" />
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {rowLetters.map((row) => (
            <div key={row} className="flex gap-1.5 sm:gap-2">
              {Array.from({ length: seatsPerRow }, (_, i) => {
                const seat = `${row}${i + 1}`;
                const booked = status.get(seat) !== 'available';
                const isSelected = seat === selected;
                return (
                  <span key={seat} className="flex">
                    {i === aisleAfter && (
                      <span className="w-5 sm:w-7" aria-hidden="true" />
                    )}
                    <button
                      type="button"
                      disabled={booked}
                      aria-pressed={isSelected}
                      aria-label={t(
                        booked ? 'booking.seatBooked' : 'booking.seat',
                        { seat },
                      )}
                      onClick={() => onSelect(seat)}
                      className={`${seatBase} ${
                        booked
                          ? seatStyles.booked
                          : isSelected
                            ? seatStyles.selected
                            : seatStyles.available
                      }`}
                    >
                      {seat}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ style, label }: { style: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-4 rounded ${style}`} aria-hidden="true" />
      {label}
    </span>
  );
}
