import QRCode from 'qrcode';

/** What a ticket's QR code contains (kept small so it scans easily). */
export interface TicketQrPayload {
  ticketId: string;
  route: string; // e.g. "01 CMB-KDY"
  date: string;
  departure: string;
  seat: string;
  passenger: string;
}

const OPTIONS = { errorCorrectionLevel: 'M', margin: 2, width: 320 } as const;

/** Renders the payload as a PNG data URL for <img src="...">. */
export function qrDataUrl(payload: TicketQrPayload): Promise<string> {
  return QRCode.toDataURL(JSON.stringify(payload), OPTIONS);
}

/** Renders the payload as PNG bytes (for email attachments). */
export function qrPng(payload: TicketQrPayload): Promise<Buffer> {
  return QRCode.toBuffer(JSON.stringify(payload), { ...OPTIONS, type: 'png' });
}
