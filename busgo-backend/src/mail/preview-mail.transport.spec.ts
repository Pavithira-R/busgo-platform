import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InMemoryMailTransport, Mailer, MailModule } from '@nestjs/mail';
import { Test } from '@nestjs/testing';
import { PreviewMailTransport } from './preview-mail.transport.js';

describe('PreviewMailTransport', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'busgo-mail-'));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('saves an .eml file and a browser preview with inline images', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MailModule.forRoot({
          from: 'BusGo <noreply@busgo.local>',
          transport: new PreviewMailTransport(dir),
        }),
      ],
    }).compile();
    const mailer = moduleRef.get(Mailer);

    await mailer.send({
      to: 'rider@example.lk',
      subject: 'Test ticket',
      html: '<p>Hello</p><img src="cid:qr" />',
      attachments: [
        {
          cid: 'qr',
          content: Buffer.from('fake-png'),
          contentType: 'image/png',
        },
      ],
    });

    const files = await readdir(dir);
    expect(files.filter((f) => f.endsWith('.eml'))).toHaveLength(1);
    const htmlFile = files.find((f) => f.endsWith('.html'))!;
    const preview = await readFile(join(dir, htmlFile), 'utf8');
    expect(preview).toContain('<p>Hello</p>');
    expect(preview).toContain(
      `src="data:image/png;base64,${Buffer.from('fake-png').toString('base64')}"`,
    );
    expect(preview).not.toContain('cid:qr');
    await moduleRef.close();
    // Booting a Nest module can be slow while all test files run at once.
  }, 30_000);

  it('is interchangeable with the in-memory transport used in tests', () => {
    expect(new PreviewMailTransport(dir)).toHaveProperty('send');
    expect(new InMemoryMailTransport()).toHaveProperty('send');
  });
});
