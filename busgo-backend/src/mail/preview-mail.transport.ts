import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import {
  type MailMessage,
  MailTransport,
  type MailTransportResult,
} from '@nestjs/mail';

/**
 * For local development: instead of sending, saves each email as
 *   <dir>/<time>-<id>.html   open in a browser (images included)
 *   <dir>/<time>-<id>.eml    open in an email app
 */
export class PreviewMailTransport extends MailTransport {
  private readonly logger = new Logger('Mail');

  constructor(private readonly directory: string) {
    super();
  }

  async send(message: MailMessage): Promise<MailTransportResult> {
    await mkdir(this.directory, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = message.messageId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    const base = join(this.directory, `${stamp}-${id}`);

    await writeFile(`${base}.eml`, message.toMime());
    await writeFile(`${base}.html`, this.preview(message));

    const to = message.to.map((a) => a.address).join(', ');
    this.logger.log(
      `"${message.subject}" to ${to} saved: ${resolve(`${base}.html`)}`,
    );
    return { accepted: message.to.map((a) => a.address) };
  }

  /** The HTML body with inline images (cid:...) turned into data URLs. */
  private preview(message: MailMessage): string {
    let body = message.html ?? `<pre>${message.text ?? ''}</pre>`;
    for (const part of message.attachments) {
      if (!part.cid) continue;
      const dataUrl = `data:${part.contentType};base64,${part.content.toString('base64')}`;
      body = body.replaceAll(`cid:${part.cid}`, dataUrl);
    }
    return body;
  }
}
