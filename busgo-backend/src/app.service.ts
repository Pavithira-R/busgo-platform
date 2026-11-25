import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { sql } from 'drizzle-orm';
import type { Database } from './db/relations.js';

@Injectable()
export class AppService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async health() {
    try {
      await this.db.execute(sql`select 1`);
      return { status: 'ok', database: 'up' };
    } catch {
      return { status: 'degraded', database: 'down' };
    }
  }
}
